
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineDownload,
  HiOutlinePencil,
  HiOutlineSave,
  HiOutlineX,
  HiOutlineUsers,
} from "react-icons/hi";

import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const formatAmount = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "-";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatus = (status) =>
  String(status || "PENDING").trim().toUpperCase();

const getId = (item) => String(item.remittance_id);

const StatusBadge = ({ status }) => {
  const successful = getStatus(status) === "SUCCESSFUL";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${
        successful
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          successful ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {successful ? "Successful" : status || "Pending"}
    </span>
  );
};

const SummaryCard = ({ title, value, subtitle, icon, color }) => {
  const styles = {
    blue: "bg-sky-50 text-[#008dd2]",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-slate-500">
          {title}
        </p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            styles[color] || styles.blue
          }`}
        >
          {icon}
        </span>
      </div>

      <p className="mt-2 break-words text-lg font-bold tracking-tight text-slate-800">
        {value}
      </p>

      <p className="mt-0.5 text-[10px] text-slate-400">
        {subtitle}
      </p>
    </div>
  );
};

const CODRemittance = () => {
  const [remittances, setRemittances] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [customerFilter, setCustomerFilter] = useState("ALL");

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDescription, setBulkDescription] = useState("");
  const [descriptionDrafts, setDescriptionDrafts] = useState({});
  const [editingDescriptionId, setEditingDescriptionId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [savingDescriptionId, setSavingDescriptionId] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [error, setError] = useState("");

  const getHeaders = () => {
    const token = localStorage.getItem("adminToken");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchRemittances = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load COD remittances"
        );
      }

      const records = Array.isArray(data?.remittances)
        ? data.remittances
        : [];

      setRemittances(records);

      setDescriptionDrafts((previous) => {
        const next = { ...previous };

        records.forEach((item) => {
          const id = getId(item);
          if (!(id in next)) next[id] = item.description || "";
        });

        return next;
      });

      const pendingIds = new Set(
        records
          .filter((item) => getStatus(item.status) === "PENDING")
          .map(getId)
      );

      setSelectedIds((previous) =>
        previous.filter((id) => pendingIds.has(String(id)))
      );

      if (showToast) toast.success("Remittances refreshed");
    } catch (err) {
      setError(err.message || "Unable to load COD remittances");
      toast.error(err.message || "Unable to load COD remittances");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRemittances();
  }, [fetchRemittances]);

  const customers = useMemo(() => {
    const map = new Map();

    remittances.forEach((item) => {
      const id = String(item.user_id ?? "unknown");

      if (!map.has(id)) {
        map.set(id, {
          id,
          name: item.customer_name || `Customer ${id}`,
        });
      }
    });

    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [remittances]);

  const stats = useMemo(() => {
    const pending = remittances.filter(
      (item) => getStatus(item.status) === "PENDING"
    );

    const successful = remittances.filter(
      (item) => getStatus(item.status) === "SUCCESSFUL"
    );

    return {
      total: remittances.length,
      pending: pending.length,
      successful: successful.length,
      pendingAmount: pending.reduce(
        (sum, item) => sum + Number(item.cod_amount || 0),
        0
      ),
    };
  }, [remittances]);

  const filteredRemittances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return remittances.filter((item) => {
      const status = getStatus(item.status);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const matchesCustomer =
        customerFilter === "ALL" ||
        String(item.user_id ?? "unknown") === customerFilter;

      const matchesSearch =
        !query ||
        String(item.order_id || "").toLowerCase().includes(query) ||
        String(item.buyer || "").toLowerCase().includes(query) ||
        String(item.awb || "").toLowerCase().includes(query) ||
        String(item.customer_name || "").toLowerCase().includes(query) ||
        String(item.user_id ?? "").toLowerCase().includes(query);

      return matchesStatus && matchesCustomer && matchesSearch;
    });
  }, [remittances, search, statusFilter, customerFilter]);

  const selectedRemittances = useMemo(() => {
    const ids = new Set(selectedIds.map(String));

    return remittances.filter(
      (item) =>
        ids.has(getId(item)) &&
        getStatus(item.status) === "PENDING"
    );
  }, [remittances, selectedIds]);

  const selectedAmount = useMemo(
    () =>
      selectedRemittances.reduce(
        (sum, item) => sum + Number(item.cod_amount || 0),
        0
      ),
    [selectedRemittances]
  );

  const visiblePending = filteredRemittances.filter(
    (item) => getStatus(item.status) === "PENDING"
  );

  const visiblePendingIds = visiblePending.map(getId);

  const allVisibleSelected =
    visiblePendingIds.length > 0 &&
    visiblePendingIds.every((id) => selectedIds.includes(id));

  const toggleSelection = (id) => {
    const key = String(id);

    setSelectedIds((previous) =>
      previous.includes(key)
        ? previous.filter((value) => value !== key)
        : [...previous, key]
    );
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((previous) =>
        previous.filter(
          (id) => !visiblePendingIds.includes(String(id))
        )
      );
    } else {
      setSelectedIds((previous) => [
        ...new Set([...previous, ...visiblePendingIds]),
      ]);
    }
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkDescription("");
  };

  const updateDescriptionDraft = (id, value) => {
    setDescriptionDrafts((previous) => ({
      ...previous,
      [id]: value,
    }));
  };

  const saveDescription = async (item) => {
    const id = getId(item);
    const description = descriptionDrafts[id] ?? "";

    if (description.length > 1000) {
      toast.error("Description cannot exceed 1000 characters");
      return;
    }

    try {
      setSavingDescriptionId(id);

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances/${id}/description`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ description }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to save description"
        );
      }

      const cleanDescription = description.trim();

      setRemittances((previous) =>
        previous.map((record) =>
          getId(record) === id
            ? { ...record, description: cleanDescription }
            : record
        )
      );

      setDescriptionDrafts((previous) => ({
        ...previous,
        [id]: cleanDescription,
      }));

      setEditingDescriptionId(null);
      toast.success("Description saved successfully");
    } catch (err) {
      toast.error(err.message || "Unable to save description");
    } finally {
      setSavingDescriptionId(null);
    }
  };

  const markSuccessful = async (item) => {
    if (getStatus(item.status) !== "PENDING") return;

    if (
      !window.confirm(
        `Mark order ${item.order_id} as Successful?`
      )
    ) {
      return;
    }

    const id = getId(item);

    try {
      setProcessingId(id);

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances/${id}/successful`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to update remittance"
        );
      }

      toast.success("Remittance marked successful");
      await fetchRemittances();
    } catch (err) {
      toast.error(err.message || "Unable to update remittance");
    } finally {
      setProcessingId(null);
    }
  };

  const markSelectedSuccessful = async () => {
    if (!selectedRemittances.length) {
      toast.error("Select at least one Pending remittance");
      return;
    }

    if (bulkDescription.length > 1000) {
      toast.error("Description cannot exceed 1000 characters");
      return;
    }

    const confirmed = window.confirm(
      `Mark ${selectedRemittances.length} orders Successful?\n\nSelected COD Amount: ${formatAmount(
        selectedAmount
      )}\n\nThe same description will be applied to all selected records.`
    );

    if (!confirmed) return;

    try {
      setBulkProcessing(true);

      const ids = selectedRemittances.map((item) =>
        Number(item.remittance_id)
      );

      if (
        ids.some(
          (id) => !Number.isSafeInteger(id) || id <= 0
        )
      ) {
        throw new Error("One or more selected IDs are invalid");
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances/bulk-successful`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            ids,
            description: bulkDescription.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to update selected remittances"
        );
      }

      toast.success(
        data?.message ||
          `${ids.length} remittance(s) marked Successful`
      );

      clearSelection();
      await fetchRemittances();
    } catch (err) {
      toast.error(err.message || "Bulk update failed");
    } finally {
      setBulkProcessing(false);
    }
  };

  const exportCSV = () => {
    if (!filteredRemittances.length) {
      toast.error("No records available to export");
      return;
    }

    const headers = [
      "Order ID",
      "Buyer",
      "AWB",
      "COD Amount",
      "Created On",
      "Status",
      "Transferred On",
      "Description",
      "Customer",
      "Customer ID",
    ];

    const rows = filteredRemittances.map((item) => [
      item.order_id,
      item.buyer,
      item.awb,
      item.cod_amount,
      item.created_at,
      item.status,
      item.transferred_on,
      item.description,
      item.customer_name,
      item.user_id,
    ]);

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "cod-remittances.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success("CSV exported");
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCustomerFilter("ALL");
  };

  const tabs = [
    { label: "All", value: "ALL", count: stats.total },
    { label: "Pending", value: "PENDING", count: stats.pending },
    { label: "Successful", value: "SUCCESSFUL", count: stats.successful },
  ];

  return (
    <div className="mx-auto min-h-full max-w-[1500px] bg-[#f8fafc] p-3 pb-20 sm:p-4">

      {/* Header */}
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f5fc] text-[#008dd2]">
              <HiOutlineCurrencyRupee size={21} />
            </span>

            <div>
              <h1 className="text-lg font-bold text-slate-800">
                COD Remittance
              </h1>
              <p className="text-[11px] text-slate-500">
                Manage COD payouts and transfer status.
              </p>
            </div>

            <span className="rounded-md bg-sky-50 px-2 py-1 text-[10px] font-bold text-[#008dd2]">
              {stats.total}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchRemittances(true)}
            disabled={loading || bulkProcessing}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 hover:border-sky-200 hover:text-[#008dd2] disabled:opacity-50"
          >
            <HiOutlineRefresh
              size={14}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!filteredRemittances.length}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#008dd2] px-3 text-[11px] font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <HiOutlineDownload size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Compact summary */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <SummaryCard
          title="Total Remittances"
          value={stats.total}
          subtitle="All records"
          icon={<HiOutlineCurrencyRupee size={17} />}
          color="blue"
        />

        <SummaryCard
          title="Pending"
          value={stats.pending}
          subtitle="Awaiting payout"
          icon={<HiOutlineClock size={17} />}
          color="amber"
        />

        <SummaryCard
          title="Successful"
          value={stats.successful}
          subtitle="Completed"
          icon={<HiOutlineCheckCircle size={17} />}
          color="green"
        />

        <SummaryCard
          title="Pending Amount"
          value={formatAmount(stats.pendingAmount)}
          subtitle="Awaiting transfer"
          icon={<HiOutlineCurrencyRupee size={17} />}
          color="violet"
        />
      </div>

      {/* Compact bulk selection panel */}
      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-3">
          <div>
            <h2 className="text-xs font-bold text-slate-800">
              Bulk Remittance Update
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Select pending orders and update them together.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={!visiblePending.length || bulkProcessing}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[10px] font-bold text-[#008dd2] hover:bg-sky-100 disabled:opacity-40"
          >
            {allVisibleSelected
              ? "Deselect Visible"
              : "Select All Pending"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 p-3.5 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-medium text-slate-500">
              Selected Orders
            </p>
            <p className="mt-1 text-lg font-bold text-slate-800">
              {selectedRemittances.length}
            </p>
          </div>

          <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5">
            <p className="text-[10px] font-medium text-sky-700">
              Selected COD Amount
            </p>
            <p className="mt-1 break-words text-base font-bold text-[#008dd2]">
              {formatAmount(selectedAmount)}
            </p>
          </div>

          <div className="col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 sm:col-span-1">
            <p className="text-[10px] font-medium text-slate-500">
              Customer
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-slate-700">
              {customerFilter === "ALL"
                ? "All Customers"
                : customers.find((c) => c.id === customerFilter)?.name ||
                  `Customer ${customerFilter}`}
            </p>
          </div>
        </div>

        {selectedRemittances.length > 0 && (
          <div className="mx-3.5 mb-3 rounded-lg border border-sky-100 bg-sky-50/50 p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-600">
                Selected Orders
              </p>
              <button
                type="button"
                onClick={clearSelection}
                disabled={bulkProcessing}
                className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
              >
                Clear all
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selectedRemittances.map((item) => (
                <span
                  key={getId(item)}
                  className="inline-flex items-center gap-2 rounded-md border border-sky-100 bg-white px-2 py-1.5"
                >
                  <span className="text-[10px] font-semibold text-slate-700">
                    #{item.order_id}
                  </span>
                  <span className="text-[10px] font-bold text-[#008dd2]">
                    {formatAmount(item.cod_amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSelection(getId(item))}
                    disabled={bulkProcessing}
                    aria-label={`Remove order ${item.order_id}`}
                    className="text-slate-400 hover:text-rose-600 disabled:opacity-50"
                  >
                    <HiOutlineX size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 p-3.5">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label
              htmlFor="bulk-description"
              className="text-[11px] font-semibold text-slate-700"
            >
              Common Description
            </label>
            <span className="text-[10px] text-slate-400">
              {bulkDescription.length}/1000
            </span>
          </div>

          <textarea
            id="bulk-description"
            value={bulkDescription}
            onChange={(event) =>
              setBulkDescription(event.target.value)
            }
            maxLength={1000}
            rows={2}
            disabled={bulkProcessing}
            placeholder="Enter common description or UTR reference..."
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-1 focus:ring-sky-100 disabled:opacity-60"
          />

          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] leading-relaxed text-slate-400">
              The description will replace the existing description for each
              selected record.
            </p>

            <button
              type="button"
              onClick={markSelectedSuccessful}
              disabled={
                !selectedRemittances.length ||
                bulkProcessing ||
                loading
              }
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#008dd2] px-3.5 text-[11px] font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {bulkProcessing ? (
                <>
                  <HiOutlineRefresh className="animate-spin" size={14} />
                  Updating...
                </>
              ) : (
                <>
                  <HiOutlineCheckCircle size={15} />
                  Mark Selected Successful
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Records and filters */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-3.5 py-3 sm:px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-800">
                Remittance Records
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Search and manage individual remittances.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {tabs.map((tab) => {
                const active = statusFilter === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold ${
                      active
                        ? "bg-[#008dd2] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded px-1.5 py-0.5 ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search and customer filter */}
        <div className="border-b border-slate-100 bg-slate-50/60 p-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1fr)_240px_auto]">
            <div className="relative">
              <HiOutlineSearch
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order, buyer, AWB or customer..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[11px] outline-none focus:border-[#008dd2]"
              />
            </div>

            <select
              value={customerFilter}
              onChange={(event) =>
                setCustomerFilter(event.target.value)
              }
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] text-slate-700 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} (ID: {customer.id})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <HiOutlineX size={13} />
              Reset
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
            <span>
              Showing{" "}
              <strong className="text-slate-700">
                {filteredRemittances.length}
              </strong>{" "}
              of {remittances.length} records
            </span>
            <span>
              {visiblePending.length} visible pending record(s)
            </span>
          </div>
        </div>

        {error && !remittances.length ? (
          <div className="p-8 text-center">
            <p className="text-xs font-semibold text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => fetchRemittances()}
              className="mt-3 rounded-lg bg-[#008dd2] px-3 py-2 text-xs font-bold text-white"
            >
              Try Again
            </button>
          </div>
        ) : loading && !remittances.length ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : filteredRemittances.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <HiOutlineSearch
              size={23}
              className="mx-auto text-slate-300"
            />
            <p className="mt-2 text-xs font-bold text-slate-700">
              No matching records
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-2.5 p-3 sm:hidden">
              {filteredRemittances.map((item) => {
                const id = getId(item);
                const pending = getStatus(item.status) === "PENDING";
                const selected = selectedIds.includes(id);
                const editing = String(editingDescriptionId) === id;
                const saving = String(savingDescriptionId) === id;
                const draft = descriptionDrafts[id] ?? "";

                return (
                  <div
                    key={id}
                    className={`rounded-xl border p-3 ${
                      selected
                        ? "border-sky-300 bg-sky-50/40"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {pending && (
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelection(id)}
                          disabled={bulkProcessing}
                          className="mt-1 h-3.5 w-3.5 accent-[#008dd2]"
                          aria-label={`Select order ${item.order_id}`}
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800">
                              #{item.order_id || "-"}
                            </p>
                            <p className="mt-1 truncate text-[10px] text-slate-500">
                              {item.customer_name || "Customer"}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs font-bold text-slate-800">
                              {formatAmount(item.cod_amount)}
                            </p>
                            <div className="mt-1">
                              <StatusBadge status={item.status} />
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-[10px]">
                          <p className="truncate text-slate-500">
                            Buyer:{" "}
                            <span className="font-semibold text-slate-700">
                              {item.buyer || "-"}
                            </span>
                          </p>
                          <p className="truncate text-slate-500">
                            ID: {item.user_id ?? "-"}
                          </p>
                          <p className="break-all text-slate-500">
                            AWB: {item.awb || "-"}
                          </p>
                          <p className="text-slate-500">
                            {formatDate(item.created_at)}
                          </p>
                        </div>

                        <div className="mt-2 rounded-lg bg-slate-50 p-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-semibold text-slate-500">
                              Description
                            </span>
                            {!editing && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDescriptionDrafts((previous) => ({
                                    ...previous,
                                    [id]: item.description || "",
                                  }));
                                  setEditingDescriptionId(id);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#008dd2]"
                              >
                                <HiOutlinePencil size={11} />
                                Edit
                              </button>
                            )}
                          </div>

                          {editing ? (
                            <>
                              <textarea
                                value={draft}
                                onChange={(event) =>
                                  updateDescriptionDraft(
                                    id,
                                    event.target.value
                                  )
                                }
                                maxLength={1000}
                                rows={2}
                                className="w-full rounded-md border border-slate-200 bg-white p-2 text-[11px] outline-none focus:border-[#008dd2]"
                              />
                              <div className="mt-1.5 flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => {
                                    setDescriptionDrafts((previous) => ({
                                      ...previous,
                                      [id]: item.description || "",
                                    }));
                                    setEditingDescriptionId(null);
                                  }}
                                  className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[10px] text-slate-600"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => saveDescription(item)}
                                  className="inline-flex items-center gap-1 rounded-md bg-[#008dd2] px-2.5 py-1.5 text-[10px] font-semibold text-white disabled:opacity-50"
                                >
                                  <HiOutlineSave size={11} />
                                  {saving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-[10px] leading-relaxed text-slate-600">
                              {item.description || "No description added"}
                            </p>
                          )}
                        </div>

                        {pending ? (
                          <button
                            type="button"
                            onClick={() => markSuccessful(item)}
                            disabled={
                              processingId !== null ||
                              savingDescriptionId !== null ||
                              bulkProcessing
                            }
                            className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <HiOutlineCheckCircle size={13} />
                            {String(processingId) === id
                              ? "Updating..."
                              : "Mark Successful"}
                          </button>
                        ) : (
                          <p className="mt-2 text-[10px] font-semibold text-emerald-700">
                            <HiOutlineCheckCircle className="mr-1 inline" />
                            Transfer Completed
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[1150px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <th className="w-9 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        disabled={
                          !visiblePending.length || bulkProcessing
                        }
                        aria-label="Select all visible pending records"
                        className="h-3.5 w-3.5 accent-[#008dd2]"
                      />
                    </th>
                    <th className="px-3 py-2.5">Order / Customer</th>
                    <th className="px-3 py-2.5">Buyer</th>
                    <th className="px-3 py-2.5">AWB</th>
                    <th className="px-3 py-2.5">COD Amount</th>
                    <th className="px-3 py-2.5">Created On</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Transferred On</th>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {filteredRemittances.map((item) => {
                    const id = getId(item);
                    const pending = getStatus(item.status) === "PENDING";
                    const selected = selectedIds.includes(id);
                    const editing = String(editingDescriptionId) === id;
                    const saving = String(savingDescriptionId) === id;
                    const draft = descriptionDrafts[id] ?? "";

                    return (
                      <tr
                        key={id}
                        className={`align-top hover:bg-slate-50 ${
                          selected ? "bg-sky-50/50" : ""
                        }`}
                      >
                        <td className="px-3 py-3">
                          {pending && (
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelection(id)}
                              disabled={bulkProcessing}
                              aria-label={`Select order ${item.order_id}`}
                              className="h-3.5 w-3.5 accent-[#008dd2]"
                            />
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <p className="whitespace-nowrap font-bold text-slate-800">
                            #{item.order_id || "-"}
                          </p>
                          <p className="mt-1 max-w-[130px] truncate text-[10px] text-slate-500">
                            {item.customer_name || "Customer"}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            ID: {item.user_id ?? "-"}
                          </p>
                        </td>

                        <td className="px-3 py-3">
                          <p className="max-w-[140px] truncate font-medium text-slate-700">
                            {item.buyer || "-"}
                          </p>
                        </td>

                        <td className="px-3 py-3 font-mono text-[10px] text-slate-600">
                          {item.awb || "-"}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 font-bold text-slate-800">
                          {formatAmount(item.cod_amount)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-[10px] text-slate-500">
                          {formatDate(item.created_at)}
                        </td>

                        <td className="px-3 py-3">
                          <StatusBadge status={item.status} />
                        </td>

                        <td className="whitespace-nowrap px-3 py-3 text-[10px] text-slate-500">
                          {formatDate(item.transferred_on)}
                        </td>

                        <td className="w-[250px] px-3 py-3">
                          <div className="w-[220px]">
                            {editing ? (
                              <>
                                <textarea
                                  value={draft}
                                  onChange={(event) =>
                                    updateDescriptionDraft(
                                      id,
                                      event.target.value
                                    )
                                  }
                                  maxLength={1000}
                                  rows={2}
                                  className="w-full rounded-md border border-slate-200 p-2 text-[10px] outline-none focus:border-[#008dd2]"
                                />
                                <div className="mt-1 flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => {
                                      setDescriptionDrafts((previous) => ({
                                        ...previous,
                                        [id]: item.description || "",
                                      }));
                                      setEditingDescriptionId(null);
                                    }}
                                    className="rounded-md border border-slate-200 px-2 py-1 text-[10px] text-slate-600"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => saveDescription(item)}
                                    className="inline-flex items-center gap-1 rounded-md bg-[#008dd2] px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                                  >
                                    <HiOutlineSave size={10} />
                                    {saving ? "Saving..." : "Save"}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="whitespace-pre-wrap break-words text-[10px] leading-relaxed text-slate-600">
                                  {item.description || "No description"}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDescriptionDrafts((previous) => ({
                                      ...previous,
                                      [id]: item.description || "",
                                    }));
                                    setEditingDescriptionId(id);
                                  }}
                                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#008dd2] hover:text-sky-700"
                                >
                                  <HiOutlinePencil size={10} />
                                  Edit
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          {pending ? (
                            <button
                              type="button"
                              onClick={() => markSuccessful(item)}
                              disabled={
                                processingId !== null ||
                                savingDescriptionId !== null ||
                                bulkProcessing
                              }
                              className="inline-flex whitespace-nowrap items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-2 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <HiOutlineCheckCircle size={12} />
                              {String(processingId) === id
                                ? "Updating..."
                                : "Mark Successful"}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-emerald-700">
                              <HiOutlineCheckCircle size={12} />
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-3.5 py-2.5 text-[10px] text-slate-400">
          <span>ParcelDrop · COD Remittance</span>
          <span>{filteredRemittances.length} records</span>
        </div>
      </div>
    </div>
  );
};

export default CODRemittance;
