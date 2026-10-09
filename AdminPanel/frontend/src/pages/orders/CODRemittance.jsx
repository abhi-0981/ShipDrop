import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineDownload,
  HiOutlinePencil,
  HiOutlineSave,
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

const StatusBadge = ({ status }) => {
  const successful = String(status || "").toUpperCase() === "SUCCESSFUL";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        successful
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {successful ? (
        <HiOutlineCheckCircle size={13} />
      ) : (
        <HiOutlineClock size={13} />
      )}
      {successful ? "Successful" : status || "Pending"}
    </span>
  );
};

const CODRemittance = () => {
  const [remittances, setRemittances] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [customerFilter, setCustomerFilter] = useState("ALL");

  const [descriptionDrafts, setDescriptionDrafts] = useState({});
  const [editingDescriptionId, setEditingDescriptionId] = useState(null);

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDescription, setBulkDescription] = useState("");

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

      const response = await fetch(`${API_BASE_URL}/admin/cod-remittances`, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to load COD remittances");
      }

      const records = Array.isArray(data?.remittances) ? data.remittances : [];

      setRemittances(records);

      setDescriptionDrafts((previous) => {
        const next = { ...previous };

        records.forEach((item) => {
          const id = item.remittance_id;

          if (!(id in next)) {
            next[id] = item.description || "";
          }
        });

        return next;
      });

      // Remove IDs that are no longer pending or no longer exist.
      const pendingIds = new Set(
        records
          .filter(
            (item) => String(item.status || "").toUpperCase() === "PENDING",
          )
          .map((item) => String(item.remittance_id)),
      );

      setSelectedIds((previous) =>
        previous.filter((id) => pendingIds.has(String(id))),
      );

      if (showToast) {
        toast.success("Remittances refreshed");
      }
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

  // Unique customers for the customer filter.
  const customers = useMemo(() => {
    const unique = new Map();

    remittances.forEach((item) => {
      const id = String(item.user_id ?? "unknown");

      if (!unique.has(id)) {
        unique.set(id, {
          id,
          name: item.customer_name || `Customer ${id}`,
        });
      }
    });

    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [remittances]);

  const stats = useMemo(() => {
    const pending = remittances.filter(
      (item) => String(item.status || "").toUpperCase() === "PENDING",
    );

    const successful = remittances.filter(
      (item) => String(item.status || "").toUpperCase() === "SUCCESSFUL",
    );

    return {
      total: remittances.length,
      pending: pending.length,
      successful: successful.length,
      pendingAmount: pending.reduce(
        (sum, item) => sum + Number(item.cod_amount || 0),
        0,
      ),
    };
  }, [remittances]);

  const filteredRemittances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return remittances.filter((item) => {
      const status = String(item.status || "PENDING").toUpperCase();

      const matchesStatus = statusFilter === "ALL" || status === statusFilter;

      const matchesCustomer =
        customerFilter === "ALL" ||
        String(item.user_id ?? "unknown") === customerFilter;

      const matchesSearch =
        !query ||
        String(item.order_id || "")
          .toLowerCase()
          .includes(query) ||
        String(item.buyer || "")
          .toLowerCase()
          .includes(query) ||
        String(item.awb || "")
          .toLowerCase()
          .includes(query) ||
        String(item.customer_name || "")
          .toLowerCase()
          .includes(query) ||
        String(item.user_id ?? "")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesCustomer && matchesSearch;
    });
  }, [remittances, search, statusFilter, customerFilter]);

  // Only pending rows can be selected for bulk processing.
  const visiblePending = useMemo(
    () =>
      filteredRemittances.filter(
        (item) => String(item.status || "").toUpperCase() === "PENDING",
      ),
    [filteredRemittances],
  );

  const visiblePendingIds = visiblePending.map((item) =>
    String(item.remittance_id),
  );

  const allVisibleSelected =
    visiblePendingIds.length > 0 &&
    visiblePendingIds.every((id) => selectedIds.includes(id));

  const toggleSelection = (id) => {
    const key = String(id);

    setSelectedIds((previous) =>
      previous.includes(key)
        ? previous.filter((selectedId) => selectedId !== key)
        : [...previous, key],
    );
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((previous) =>
        previous.filter((id) => !visiblePendingIds.includes(id)),
      );
    } else {
      setSelectedIds((previous) => [
        ...new Set([...previous, ...visiblePendingIds]),
      ]);
    }
  };

  const updateDescriptionDraft = (id, value) => {
    setDescriptionDrafts((previous) => ({
      ...previous,
      [id]: value,
    }));
  };

  const saveDescription = async (item) => {
    const id = item.remittance_id;
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
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to save description");
      }

      const cleanDescription = description.trim();

      setRemittances((previous) =>
        previous.map((record) =>
          String(record.remittance_id) === String(id)
            ? { ...record, description: cleanDescription }
            : record,
        ),
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
    if (String(item.status || "").toUpperCase() !== "PENDING") {
      return;
    }

    const confirmed = window.confirm(
      `Mark remittance for order ${item.order_id} as Successful?`,
    );

    if (!confirmed) return;

    try {
      setProcessingId(item.remittance_id);

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances/${item.remittance_id}/successful`,
        {
          method: "PATCH",
          headers: getHeaders(),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Unable to update remittance");
      }

      toast.success("Remittance marked successful");
      await fetchRemittances();
    } catch (err) {
      toast.error(err.message || "Unable to update remittance");
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk action: status + same description for every selected record.
  const markSelectedSuccessful = async () => {
    if (!selectedIds.length) {
      toast.error("Please select at least one pending remittance");
      return;
    }

    if (bulkDescription.length > 1000) {
      toast.error("Description cannot exceed 1000 characters");
      return;
    }

    const confirmed = window.confirm(
      `Mark ${selectedIds.length} selected remittance(s) as Successful and apply the same description to all?`,
    );

    if (!confirmed) return;

    try {
      setBulkProcessing(true);

      const numericIds = selectedIds.map(Number);

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances/bulk-successful`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({
            ids: numericIds,
            description: bulkDescription.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to update selected remittances",
        );
      }

      toast.success(
        data?.message ||
          `${selectedIds.length} remittance(s) marked successful`,
      );

      setSelectedIds([]);
      setBulkDescription("");

      await fetchRemittances();
    } catch (err) {
      toast.error(err.message || "Unable to update selected remittances");
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

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

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
    link.click();

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
    {
      label: "Successful",
      value: "SUCCESSFUL",
      count: stats.successful,
    },
  ];

  return (
    <div className="mx-auto min-h-full max-w-7xl bg-[#f8fafc] p-3.5 pb-24 sm:p-5 sm:pb-8">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
              COD Remittance
            </h1>

            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-700">
              {stats.total}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Manage COD remittances, descriptions and transfer status.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchRemittances(true)}
            disabled={loading || bulkProcessing}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <HiOutlineRefresh
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!filteredRemittances.length}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#008dd2] px-3 text-xs font-bold text-white hover:bg-sky-600 disabled:opacity-50"
          >
            <HiOutlineDownload size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          title="Total Remittances"
          value={stats.total}
          subtitle="All records"
          icon={<HiOutlineCurrencyRupee size={19} />}
          color="sky"
        />

        <SummaryCard
          title="Pending"
          value={stats.pending}
          subtitle="Awaiting payout"
          icon={<HiOutlineClock size={19} />}
          color="amber"
        />

        <SummaryCard
          title="Successful"
          value={stats.successful}
          subtitle="Completed"
          icon={<HiOutlineCheckCircle size={19} />}
          color="emerald"
        />

        <SummaryCard
          title="Pending Amount"
          value={formatAmount(stats.pendingAmount)}
          subtitle="Awaiting transfer"
          icon={<HiOutlineCurrencyRupee size={19} />}
          color="violet"
        />
      </div>

      {/* Status tabs */}
      <div className="mb-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
        <div className="flex min-w-max gap-1.5">
          {tabs.map((tab) => {
            const active = statusFilter === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-[#008dd2] text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}

                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and customer filter */}
      <div className="mb-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <HiOutlineSearch
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Order ID, buyer, AWB or customer..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#008dd2] focus:bg-white"
            />
          </div>

          <select
            value={customerFilter}
            onChange={(event) => setCustomerFilter(event.target.value)}
            className="h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#008dd2] sm:w-64"
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
            className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
          <span>
            Showing{" "}
            <strong className="text-slate-800">
              {filteredRemittances.length}
            </strong>{" "}
            of {remittances.length} records
          </span>

          <span>
            {customerFilter === "ALL"
              ? "All customers"
              : `Customer ID: ${customerFilter}`}
          </span>
        </div>
      </div>

      {/* Bulk action panel */}
      <div className="mb-4 rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Bulk Remittance Update
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Select pending records and apply one description to all selected
              remittances.
            </p>

            <p className="mt-2 text-xs font-semibold text-[#008dd2]">
              {selectedIds.length} record(s) selected
            </p>
          </div>

          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={!visiblePending.length || bulkProcessing}
            className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-bold text-[#008dd2] hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allVisibleSelected
              ? "Deselect Visible Pending"
              : "Select All Visible Pending"}
          </button>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
          <div>
            <textarea
              value={bulkDescription}
              onChange={(event) => setBulkDescription(event.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Enter the same description for all selected records (e.g. UTR number, bank transfer reference)..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 outline-none focus:border-[#008dd2] focus:bg-white"
            />

            <p className="mt-1 text-right text-[10px] text-slate-400">
              {bulkDescription.length}/1000 characters
            </p>
          </div>

          <button
            type="button"
            onClick={markSelectedSuccessful}
            disabled={!selectedIds.length || bulkProcessing || loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiOutlineCheckCircle size={16} />

            {bulkProcessing
              ? "Updating..."
              : `Mark ${selectedIds.length || ""} Successful`}
          </button>
        </div>

        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
          Only Pending records can be selected. The bulk action sends the
          selected IDs and description to the backend in one request.
        </p>
      </div>

      {/* Remittance records */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {statusFilter === "ALL"
              ? "All Remittance Records"
              : statusFilter === "PENDING"
                ? "Pending Remittances"
                : "Successful Remittances"}
          </h2>
        </div>

        {error && !remittances.length ? (
          <div className="p-8 text-center">
            <p className="text-xs font-semibold text-rose-600">{error}</p>

            <button
              type="button"
              onClick={() => fetchRemittances()}
              className="mt-3 rounded-xl bg-[#008dd2] px-4 py-2 text-xs font-bold text-white"
            >
              Try Again
            </button>
          </div>
        ) : loading && !remittances.length ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : filteredRemittances.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <HiOutlineCurrencyRupee
              size={28}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-3 text-sm font-bold text-slate-700">
              {remittances.length
                ? "No matching records"
                : "No COD remittances found"}
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              Try changing the search, customer or status filter.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 p-3 sm:hidden">
              {filteredRemittances.map((item) => {
                const id = String(item.remittance_id);
                const pending =
                  String(item.status || "").toUpperCase() === "PENDING";
                const editing = String(editingDescriptionId) === id;
                const saving = String(savingDescriptionId) === id;
                const selected = selectedIds.includes(id);
                const draft = descriptionDrafts[id] ?? "";

                return (
                  <div
                    key={id}
                    className={`space-y-3 rounded-2xl border p-3 ${
                      selected
                        ? "border-sky-300 bg-sky-50/30"
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
                          aria-label={`Select remittance ${item.order_id}`}
                          className="mt-1 h-4 w-4 accent-[#008dd2]"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              #{item.order_id || "-"}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              Customer ID: {item.user_id ?? "-"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">
                              {formatAmount(item.cod_amount)}
                            </p>

                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs">
                      <p>
                        <span className="font-medium text-slate-500">
                          Buyer:{" "}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {item.buyer || "-"}
                        </span>
                      </p>

                      <p>
                        <span className="font-medium text-slate-500">
                          Customer:{" "}
                        </span>
                        <span className="text-slate-700">
                          {item.customer_name || "Customer"}
                        </span>
                      </p>

                      <p className="break-all font-mono text-[11px] text-slate-600">
                        AWB: {item.awb || "-"}
                      </p>

                      <p className="text-[10px] text-slate-400">
                        Created: {formatDate(item.created_at)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          Admin Description
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
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#008dd2]"
                          >
                            <HiOutlinePencil size={12} />
                            Edit
                          </button>
                        )}
                      </div>

                      {editing ? (
                        <>
                          <textarea
                            value={draft}
                            onChange={(event) =>
                              updateDescriptionDraft(id, event.target.value)
                            }
                            maxLength={1000}
                            rows={2}
                            className="w-full resize-y rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-[#008dd2]"
                          />

                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDescriptionDrafts((previous) => ({
                                  ...previous,
                                  [id]: item.description || "",
                                }));

                                setEditingDescriptionId(null);
                              }}
                              disabled={saving}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-600"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              onClick={() => saveDescription(item)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#008dd2] px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
                            >
                              <HiOutlineSave size={12} />
                              {saving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-slate-600">
                          {item.description || "No description added"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                      <span className="text-[10px] text-slate-400">
                        {item.transferred_on
                          ? `Transferred: ${formatDate(item.transferred_on)}`
                          : "Not transferred"}
                      </span>

                      {pending ? (
                        <button
                          type="button"
                          onClick={() => markSuccessful(item)}
                          disabled={
                            processingId !== null ||
                            savingDescriptionId !== null ||
                            bulkProcessing
                          }
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50"
                        >
                          <HiOutlineCheckCircle size={13} />
                          {String(processingId) === id
                            ? "Updating..."
                            : "Mark Successful"}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600">
                          <HiOutlineCheckCircle className="mr-1 inline" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[1200px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        disabled={!visiblePending.length || bulkProcessing}
                        aria-label="Select all visible pending remittances"
                        className="h-4 w-4 accent-[#008dd2]"
                      />
                    </th>

                    {[
                      "Order Details",
                      "Buyer / Customer",
                      "AWB No.",
                      "COD Amount",
                      "Created On",
                      "Status",
                      "Transferred On",
                      "Admin Description",
                      "Action",
                    ].map((heading) => (
                      <th key={heading} className="whitespace-nowrap px-4 py-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRemittances.map((item) => {
                    const id = String(item.remittance_id);
                    const pending =
                      String(item.status || "").toUpperCase() === "PENDING";
                    const editing = String(editingDescriptionId) === id;
                    const saving = String(savingDescriptionId) === id;
                    const selected = selectedIds.includes(id);
                    const draft = descriptionDrafts[id] ?? "";

                    return (
                      <tr
                        key={id}
                        className={`align-top transition hover:bg-slate-50/70 ${
                          selected ? "bg-sky-50/50" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          {pending && (
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelection(id)}
                              disabled={bulkProcessing}
                              aria-label={`Select remittance ${item.order_id}`}
                              className="h-4 w-4 accent-[#008dd2]"
                            />
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="whitespace-nowrap font-bold text-slate-800">
                            #{item.order_id || "-"}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-400">
                            Customer ID: {item.user_id ?? "-"}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="max-w-[180px] truncate font-semibold text-slate-700">
                            {item.buyer || "-"}
                          </p>

                          <p className="mt-1 max-w-[180px] truncate text-[10px] text-slate-400">
                            {item.customer_name || "Customer"}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="whitespace-nowrap font-mono text-[11px] text-slate-600">
                            {item.awb || "-"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 font-black text-slate-800">
                          {formatAmount(item.cod_amount)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-slate-500">
                          {formatDate(item.created_at)}
                        </td>

                        <td className="px-4 py-3.5">
                          <StatusBadge status={item.status} />
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 text-[11px] text-slate-500">
                          {formatDate(item.transferred_on)}
                        </td>

                        <td className="w-[280px] px-4 py-3.5">
                          <div className="w-[250px]">
                            {editing ? (
                              <>
                                <textarea
                                  value={draft}
                                  onChange={(event) =>
                                    updateDescriptionDraft(
                                      id,
                                      event.target.value,
                                    )
                                  }
                                  maxLength={1000}
                                  rows={3}
                                  placeholder="Enter admin description..."
                                  className="w-full resize-y rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-[#008dd2]"
                                />

                                <div className="mt-1 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400">
                                    {draft.length}/1000
                                  </span>

                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDescriptionDrafts((previous) => ({
                                          ...previous,
                                          [id]: item.description || "",
                                        }));

                                        setEditingDescriptionId(null);
                                      }}
                                      disabled={saving}
                                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => saveDescription(item)}
                                      disabled={saving}
                                      className="inline-flex items-center gap-1 rounded-lg bg-[#008dd2] px-2.5 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                                    >
                                      <HiOutlineSave size={12} />
                                      {saving ? "Saving..." : "Save"}
                                    </button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-600">
                                  {item.description || "No description added"}
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
                                  className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:border-[#008dd2] hover:text-[#008dd2]"
                                >
                                  <HiOutlinePencil size={11} />
                                  Edit
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {pending ? (
                            <button
                              type="button"
                              onClick={() => markSuccessful(item)}
                              disabled={
                                processingId !== null ||
                                savingDescriptionId !== null ||
                                bulkProcessing
                              }
                              className="inline-flex whitespace-nowrap items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <HiOutlineCheckCircle size={14} />
                              {String(processingId) === id
                                ? "Updating..."
                                : "Mark Successful"}
                            </button>
                          ) : (
                            <span className="whitespace-nowrap text-xs font-semibold text-emerald-600">
                              <HiOutlineCheckCircle className="mr-1 inline" />
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

        <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>COD Remittance Ledger</span>
          <span>Showing {filteredRemittances.length} records</span>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    sky: "bg-sky-50 text-[#008dd2]",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };

  const valueClasses = {
    sky: "text-slate-800",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    violet: "text-slate-800",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-slate-500 sm:text-xs">
          {title}
        </p>

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            colorClasses[color]
          }`}
        >
          {icon}
        </span>
      </div>

      <p
        className={`mt-2 break-words text-xl font-bold sm:text-2xl ${
          valueClasses[color]
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400 sm:text-[11px]">
        {subtitle}
      </p>
    </div>
  );
};

export default CODRemittance;
