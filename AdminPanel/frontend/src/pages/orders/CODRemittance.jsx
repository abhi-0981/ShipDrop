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
  HiOutlineClipboardList,
  HiOutlineArrowRight,
} from "react-icons/hi";

import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

/* =========================
   HELPERS
========================= */

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
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold ${
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

/* =========================
   MAIN COMPONENT
========================= */

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

  /* =========================
     FETCH RECORDS
  ========================= */

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

          if (!(id in next)) {
            next[id] = item.description || "";
          }
        });

        return next;
      });

      // Keep only IDs that still exist and are Pending.
      const pendingIds = new Set(
        records
          .filter((item) => getStatus(item.status) === "PENDING")
          .map(getId)
      );

      setSelectedIds((previous) =>
        previous.filter((id) => pendingIds.has(String(id)))
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

  /* =========================
     CUSTOMERS
  ========================= */

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

  /* =========================
     STATISTICS
  ========================= */

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

  /* =========================
     FILTERS
  ========================= */

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

  /* =========================
     SELECTED ORDERS + AMOUNT
  ========================= */

  const selectedRemittances = useMemo(() => {
    const selectedSet = new Set(selectedIds.map(String));

    return remittances.filter(
      (item) =>
        selectedSet.has(getId(item)) &&
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

  const visiblePending = useMemo(
    () =>
      filteredRemittances.filter(
        (item) => getStatus(item.status) === "PENDING"
      ),
    [filteredRemittances]
  );

  const visiblePendingIds = visiblePending.map(getId);

  const allVisibleSelected =
    visiblePendingIds.length > 0 &&
    visiblePendingIds.every((id) =>
      selectedIds.includes(id)
    );

  const toggleSelection = (id) => {
    const key = String(id);

    setSelectedIds((previous) =>
      previous.includes(key)
        ? previous.filter((selectedId) => selectedId !== key)
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

  /* =========================
     SAVE INDIVIDUAL DESCRIPTION
  ========================= */

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

  /* =========================
     MARK SINGLE SUCCESSFUL
  ========================= */

  const markSuccessful = async (item) => {
    if (getStatus(item.status) !== "PENDING") return;

    const confirmed = window.confirm(
      `Mark order ${item.order_id} as Successful?`
    );

    if (!confirmed) return;

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

  /* =========================
     BULK SUCCESSFUL
  ========================= */

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
      `Confirm bulk update?\n\nOrders: ${selectedRemittances.length}\nSelected COD Amount: ${formatAmount(
        selectedAmount
      )}\n\nAll selected records will be marked Successful and receive the same description.`
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
        throw new Error("One or more selected remittance IDs are invalid");
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
      toast.error(
        err.message || "Unable to update selected remittances"
      );
    } finally {
      setBulkProcessing(false);
    }
  };

  /* =========================
     CSV EXPORT
  ========================= */

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
    { label: "All Remittances", value: "ALL", count: stats.total },
    { label: "Pending", value: "PENDING", count: stats.pending },
    { label: "Successful", value: "SUCCESSFUL", count: stats.successful },
  ];

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="mx-auto min-h-full max-w-[1600px] bg-[#f5f8fc] p-3 pb-24 sm:p-5 lg:p-6">

      {/* PAGE HEADER */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-[#008dd2]">
              <HiOutlineCurrencyRupee size={23} />
            </span>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                COD Remittance
              </h1>

              <p className="mt-0.5 text-xs text-slate-500">
                Manage customer COD payouts and transfer records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchRemittances(true)}
            disabled={loading || bulkProcessing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <HiOutlineRefresh
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!filteredRemittances.length}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 disabled:opacity-50"
          >
            <HiOutlineDownload size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SummaryCard
          title="Total Remittances"
          value={stats.total}
          subtitle="All records"
          icon={<HiOutlineClipboardList size={20} />}
          color="blue"
        />

        <SummaryCard
          title="Pending Remittances"
          value={stats.pending}
          subtitle="Awaiting transfer"
          icon={<HiOutlineClock size={20} />}
          color="amber"
        />

        <SummaryCard
          title="Successful"
          value={stats.successful}
          subtitle="Completed payouts"
          icon={<HiOutlineCheckCircle size={20} />}
          color="green"
        />

        <SummaryCard
          title="Pending Amount"
          value={formatAmount(stats.pendingAmount)}
          subtitle="Total pending COD"
          icon={<HiOutlineCurrencyRupee size={20} />}
          color="violet"
        />
      </div>

      {/* BULK SELECTION SUMMARY */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#008dd2] text-white">
                <HiOutlineCheckCircle size={19} />
              </span>

              <div>
                <h2 className="text-sm font-extrabold text-slate-900">
                  Bulk Remittance Processing
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Select pending orders and process them together.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleSelectAll}
            disabled={!visiblePending.length || bulkProcessing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-xs font-bold text-[#008dd2] transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allVisibleSelected
              ? "Deselect Visible Orders"
              : "Select All Visible Pending"}
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {/* SELECTED METRICS */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2 text-slate-500">
                <HiOutlineClipboardList size={16} />

                <span className="text-[11px] font-semibold">
                  Selected Orders
                </span>
              </div>

              <p className="mt-2 text-2xl font-extrabold text-slate-900">
                {selectedRemittances.length}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Pending records selected
              </p>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5">
              <div className="flex items-center gap-2 text-sky-700">
                <HiOutlineCurrencyRupee size={17} />

                <span className="text-[11px] font-bold">
                  Selected COD Amount
                </span>
              </div>

              <p className="mt-2 break-words text-xl font-extrabold text-slate-900 sm:text-2xl">
                {formatAmount(selectedAmount)}
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Combined amount of selected orders
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
              <div className="flex items-center gap-2 text-emerald-700">
                <HiOutlineUsers size={17} />

                <span className="text-[11px] font-bold">
                  Customer Selection
                </span>
              </div>

              <p className="mt-2 text-sm font-extrabold text-slate-900">
                {customerFilter === "ALL"
                  ? "All Customers"
                  : customers.find((c) => c.id === customerFilter)?.name ||
                    `Customer ${customerFilter}`}
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                Current customer filter
              </p>
            </div>
          </div>

          {/* SELECTED ORDER CHIPS */}
          {selectedRemittances.length > 0 && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-slate-700">
                  Selected Orders
                </p>

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={bulkProcessing}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                >
                  Clear selection
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedRemittances.map((item) => (
                  <div
                    key={getId(item)}
                    className="inline-flex max-w-full items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-bold text-slate-800">
                        Order #{item.order_id || "-"}
                      </p>

                      <p className="text-[10px] font-semibold text-[#008dd2]">
                        {formatAmount(item.cod_amount)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSelection(getId(item))}
                      disabled={bulkProcessing}
                      aria-label={`Remove order ${item.order_id} from selection`}
                      className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-rose-600 disabled:opacity-50"
                    >
                      <HiOutlineX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMMON DESCRIPTION */}
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="bulk-description"
                className="text-xs font-bold text-slate-800"
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
              placeholder="Example: COD payment transferred | UTR: 123456789 | Transfer date: 09 Oct 2026"
              disabled={bulkProcessing}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:opacity-60"
            />

            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
              This description will replace the existing description on every
              selected record when the bulk update succeeds.
            </p>
          </div>

          {/* BULK ACTION FOOTER */}
          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-900 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div>
              <p className="text-xs font-bold text-white">
                {selectedRemittances.length
                  ? `${selectedRemittances.length} order(s) ready to process`
                  : "No orders selected"}
              </p>

              <p className="mt-1 text-[10px] text-slate-300">
                Total selected: {formatAmount(selectedAmount)}
              </p>
            </div>

            <button
              type="button"
              onClick={markSelectedSuccessful}
              disabled={
                !selectedRemittances.length ||
                bulkProcessing ||
                loading
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {bulkProcessing ? (
                <>
                  <HiOutlineRefresh className="animate-spin" size={16} />
                  Processing...
                </>
              ) : (
                <>
                  <HiOutlineCheckCircle size={17} />
                  Mark Selected Successful
                  <HiOutlineArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RECORDS SECTION */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* SECTION HEADER */}
        <div className="border-b border-slate-100 p-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Remittance Records
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                Search, filter, select and manage individual remittances.
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
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold transition ${
                      active
                        ? "bg-[#008dd2] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}

                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] ${
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

        {/* FILTER BAR */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_260px_auto]">
            <div className="relative">
              <HiOutlineSearch
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search order, buyer, AWB or customer..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <select
              value={customerFilter}
              onChange={(event) =>
                setCustomerFilter(event.target.value)
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-sky-100"
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
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <HiOutlineX size={14} />
              Reset Filters
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
            <span>
              Showing{" "}
              <strong className="text-slate-800">
                {filteredRemittances.length}
              </strong>{" "}
              of {remittances.length} records
            </span>

            <span>
              {visiblePending.length} visible pending order(s) available
              for selection
            </span>
          </div>
        </div>

        {/* ERROR */}
        {error && !remittances.length && (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-rose-600">
              Unable to load remittances
            </p>

            <p className="mt-1 text-xs text-slate-500">{error}</p>

            <button
              type="button"
              onClick={() => fetchRemittances()}
              className="mt-3 rounded-xl bg-[#008dd2] px-4 py-2 text-xs font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading && !remittances.length && (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading &&
          !error &&
          filteredRemittances.length === 0 && (
            <div className="px-4 py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <HiOutlineSearch size={22} />
              </span>

              <h3 className="mt-3 text-sm font-bold text-slate-800">
                {remittances.length
                  ? "No matching records"
                  : "No COD remittances found"}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Try changing the search, customer or status filter.
              </p>
            </div>
          )}

        {/* MOBILE CARDS */}
        {filteredRemittances.length > 0 && (
          <div className="space-y-3 p-3 sm:hidden">
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
                  className={`rounded-2xl border p-3.5 ${
                    selected
                      ? "border-sky-300 bg-sky-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {pending && (
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelection(id)}
                        disabled={bulkProcessing}
                        className="mt-1 h-4 w-4 accent-[#008dd2]"
                        aria-label={`Select order ${item.order_id}`}
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-900">
                            Order #{item.order_id || "-"}
                          </p>

                          <p className="mt-1 truncate text-[11px] text-slate-500">
                            {item.customer_name || "Customer"}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Customer ID: {item.user_id ?? "-"}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-extrabold text-slate-900">
                            {formatAmount(item.cod_amount)}
                          </p>

                          <div className="mt-1">
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Buyer
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-slate-700">
                        {item.buyer || "-"}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        AWB Number
                      </p>

                      <p className="mt-1 break-all font-mono text-[11px] text-slate-700">
                        {item.awb || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Created On
                      </p>

                      <p className="mt-1 text-[10px] text-slate-700">
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Transferred On
                      </p>

                      <p className="mt-1 text-[10px] text-slate-700">
                        {formatDate(item.transferred_on)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                        Admin Description
                      </p>

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
                            updateDescriptionDraft(
                              id,
                              event.target.value
                            )
                          }
                          maxLength={1000}
                          rows={3}
                          className="w-full rounded-lg border border-slate-200 p-2.5 text-xs outline-none focus:border-[#008dd2]"
                        />

                        <div className="mt-2 flex justify-end gap-2">
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
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 disabled:opacity-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveDescription(item)}
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

                  {pending ? (
                    <button
                      type="button"
                      onClick={() => markSuccessful(item)}
                      disabled={
                        processingId !== null ||
                        savingDescriptionId !== null ||
                        bulkProcessing
                      }
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <HiOutlineCheckCircle size={16} />
                      {String(processingId) === id
                        ? "Updating..."
                        : "Mark Successful"}
                    </button>
                  ) : (
                    <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-bold text-emerald-700">
                      <HiOutlineCheckCircle className="mr-1 inline" />
                      Transfer Completed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* DESKTOP TABLE */}
        {filteredRemittances.length > 0 && (
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[1250px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      disabled={
                        !visiblePending.length ||
                        bulkProcessing
                      }
                      aria-label="Select all visible pending orders"
                      className="h-4 w-4 accent-[#008dd2]"
                    />
                  </th>

                  <th className="px-4 py-3">Order / Customer</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">AWB</th>
                  <th className="px-4 py-3">COD Amount</th>
                  <th className="px-4 py-3">Created On</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Transferred On</th>
                  <th className="px-4 py-3">Admin Description</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">
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
                      className={`align-top transition hover:bg-slate-50 ${
                        selected ? "bg-sky-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        {pending && (
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelection(id)}
                            disabled={bulkProcessing}
                            aria-label={`Select order ${item.order_id}`}
                            className="h-4 w-4 accent-[#008dd2]"
                          />
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap font-extrabold text-slate-900">
                          #{item.order_id || "-"}
                        </p>

                        <p className="mt-1 whitespace-nowrap text-[10px] text-slate-500">
                          {item.customer_name || "Customer"}
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          ID: {item.user_id ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[160px] truncate font-semibold text-slate-700">
                          {item.buyer || "-"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-mono text-[11px] text-slate-600">
                          {item.awb || "-"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-extrabold text-slate-900">
                          {formatAmount(item.cod_amount)}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[10px] text-slate-500">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-[10px] text-slate-500">
                        {formatDate(item.transferred_on)}
                      </td>

                      <td className="w-[280px] px-4 py-4">
                        <div className="w-[250px]">
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
                                rows={3}
                                placeholder="Enter admin description..."
                                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-[#008dd2]"
                              />

                              <div className="mt-1.5 flex items-center justify-between gap-2">
                                <span className="text-[10px] text-slate-400">
                                  {draft.length}/1000
                                </span>

                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => {
                                      setDescriptionDrafts(
                                        (previous) => ({
                                          ...previous,
                                          [id]: item.description || "",
                                        })
                                      );

                                      setEditingDescriptionId(null);
                                    }}
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-slate-600 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => saveDescription(item)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#008dd2] px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
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
                                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition hover:border-[#008dd2] hover:text-[#008dd2]"
                              >
                                <HiOutlinePencil size={11} />
                                Edit Description
                              </button>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {pending ? (
                          <button
                            type="button"
                            onClick={() => markSuccessful(item)}
                            disabled={
                              processingId !== null ||
                              savingDescriptionId !== null ||
                              bulkProcessing
                            }
                            className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <HiOutlineCheckCircle size={14} />
                            {String(processingId) === id
                              ? "Updating..."
                              : "Mark Successful"}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-bold text-emerald-700">
                            <HiOutlineCheckCircle size={14} />
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
        )}

        {/* TABLE FOOTER */}
        <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>ParcelDrop · COD Remittance Ledger</span>

          <span>
            {filteredRemittances.length} record(s) displayed
          </span>
        </div>
      </div>
    </div>
  );
};

/* =========================
   SUMMARY CARD
========================= */

const SummaryCard = ({ title, value, subtitle, icon, color }) => {
  const styles = {
    blue: {
      icon: "bg-sky-100 text-[#008dd2]",
      border: "border-sky-100",
      value: "text-slate-900",
    },
    amber: {
      icon: "bg-amber-100 text-amber-700",
      border: "border-amber-100",
      value: "text-amber-700",
    },
    green: {
      icon: "bg-emerald-100 text-emerald-700",
      border: "border-emerald-100",
      value: "text-emerald-700",
    },
    violet: {
      icon: "bg-violet-100 text-violet-700",
      border: "border-violet-100",
      value: "text-slate-900",
    },
  };

  const style = styles[color] || styles.blue;

  return (
    <div
      className={`rounded-2xl border ${style.border} bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">
            {title}
          </p>

          <p
            className={`mt-3 break-words text-xl font-extrabold tracking-tight sm:text-2xl ${style.value}`}
          >
            {value}
          </p>

          <p className="mt-1.5 text-[10px] text-slate-400 sm:text-[11px]">
            {subtitle}
          </p>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
};

export default CODRemittance;