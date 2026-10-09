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
  HiOutlineX,
  HiOutlineUsers,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

const statusOf = (value) =>
  String(value || "PENDING").trim().toUpperCase();

const rowId = (row) => String(row.remittance_id);

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateText = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function StatusBadge({ status }) {
  const successful = statusOf(status) === "SUCCESSFUL";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        successful
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          successful ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {successful ? "Successful" : status || "Pending"}
    </span>
  );
}

function SummaryCard({ title, value, note, icon, tone }) {
  const tones = {
    blue: "bg-sky-50 text-[#008dd2]",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-800">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {note}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            tones[tone] || tones.blue
          }`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

export default function CODRemittance() {
  const [remittances, setRemittances] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [customerFilter, setCustomerFilter] = useState("ALL");

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDescription, setBulkDescription] = useState("");
  const [drafts, setDrafts] = useState({});
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [error, setError] = useState("");

  const headers = () => {
    const token = localStorage.getItem("adminToken");

    return {
      "Content-Type": "application/json",
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    };
  };

  // Fetch all remittances
  const fetchRemittances = useCallback(async (notify = false) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances`,
        {
          headers: headers(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load COD remittances"
        );
      }

      const rows = Array.isArray(data?.remittances)
        ? data.remittances
        : [];

      setRemittances(rows);

      setDrafts((previous) => {
        const next = { ...previous };

        rows.forEach((row) => {
          const id = rowId(row);

          if (!(id in next)) {
            next[id] = row.description || "";
          }
        });

        return next;
      });

      const pendingIds = new Set(
        rows
          .filter(
            (row) => statusOf(row.status) === "PENDING"
          )
          .map(rowId)
      );

      setSelectedIds((previous) =>
        previous.filter((id) => pendingIds.has(String(id)))
      );

      if (notify) {
        toast.success("Remittances refreshed");
      }
    } catch (err) {
      setError(
        err.message || "Unable to load COD remittances"
      );

      toast.error(
        err.message || "Unable to load COD remittances"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRemittances();
  }, [fetchRemittances]);

  // Customer dropdown
  const customers = useMemo(() => {
    const map = new Map();

    remittances.forEach((row) => {
      const id = String(row.user_id ?? "unknown");

      if (!map.has(id)) {
        map.set(id, {
          id,
          name: row.customer_name || `Customer ${id}`,
        });
      }
    });

    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [remittances]);

  // Summary data
  const stats = useMemo(() => {
    const pending = remittances.filter(
      (row) => statusOf(row.status) === "PENDING"
    );

    const successful = remittances.filter(
      (row) => statusOf(row.status) === "SUCCESSFUL"
    );

    return {
      total: remittances.length,
      pending: pending.length,
      successful: successful.length,
      pendingAmount: pending.reduce(
        (sum, row) => sum + Number(row.cod_amount || 0),
        0
      ),
    };
  }, [remittances]);

  // Search and filters
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return remittances.filter((row) => {
      const status = statusOf(row.status);

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      const matchesCustomer =
        customerFilter === "ALL" ||
        String(row.user_id ?? "unknown") === customerFilter;

      const searchableValues = [
        row.order_id,
        row.buyer,
        row.awb,
        row.customer_name,
        row.user_id,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        );

      return (
        matchesStatus &&
        matchesCustomer &&
        matchesSearch
      );
    });
  }, [
    remittances,
    search,
    statusFilter,
    customerFilter,
  ]);

  // Bulk selection
  const visiblePending = filtered.filter(
    (row) => statusOf(row.status) === "PENDING"
  );

  const visibleIds = visiblePending.map(rowId);

  const allSelected =
    visibleIds.length > 0 &&
    visibleIds.every((id) => selectedIds.includes(id));

  const selectedRows = useMemo(() => {
    const ids = new Set(selectedIds.map(String));

    return remittances.filter(
      (row) =>
        ids.has(rowId(row)) &&
        statusOf(row.status) === "PENDING"
    );
  }, [remittances, selectedIds]);

  const selectedAmount = selectedRows.reduce(
    (sum, row) => sum + Number(row.cod_amount || 0),
    0
  );

  const toggleOne = (id) => {
    const key = String(id);

    setSelectedIds((previous) =>
      previous.includes(key)
        ? previous.filter((value) => value !== key)
        : [...previous, key]
    );
  };

  const toggleAll = () => {
    setSelectedIds((previous) =>
      allSelected
        ? previous.filter(
            (id) => !visibleIds.includes(String(id))
          )
        : [...new Set([...previous, ...visibleIds])]
    );
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setBulkDescription("");
  };

  // Save an individual description
  const saveDescription = async (item) => {
    const id = rowId(item);
    const description = drafts[id] ?? "";

    if (description.length > 1000) {
      toast.error("Description cannot exceed 1000 characters");
      return;
    }

    try {
      setSavingId(id);

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances/${id}/description`,
        {
          method: "PATCH",
          headers: headers(),
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
        previous.map((row) =>
          rowId(row) === id
            ? { ...row, description: cleanDescription }
            : row
        )
      );

      setDrafts((previous) => ({
        ...previous,
        [id]: cleanDescription,
      }));

      setEditingId(null);
      toast.success("Description saved successfully");
    } catch (err) {
      toast.error(
        err.message || "Unable to save description"
      );
    } finally {
      setSavingId(null);
    }
  };

  // Mark one remittance successful
  const markSuccessful = async (item) => {
    if (statusOf(item.status) !== "PENDING") return;

    const confirmed = window.confirm(
      `Mark remittance for order ${item.order_id} as Successful?`
    );

    if (!confirmed) return;

    const id = rowId(item);

    try {
      setProcessingId(id);

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances/${id}/successful`,
        {
          method: "PATCH",
          headers: headers(),
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
      toast.error(
        err.message || "Unable to update remittance"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk successful update
  const bulkSuccessful = async () => {
    if (!selectedRows.length) {
      toast.error("Select at least one Pending remittance");
      return;
    }

    if (bulkDescription.length > 1000) {
      toast.error("Description cannot exceed 1000 characters");
      return;
    }

    const confirmed = window.confirm(
      `Mark ${selectedRows.length} orders Successful?\n\n` +
        `Selected COD Amount: ${money(selectedAmount)}\n\n` +
        "The same description will be applied to all selected records."
    );

    if (!confirmed) return;

    try {
      setBulkProcessing(true);

      const ids = selectedRows.map((row) =>
        Number(row.remittance_id)
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
          headers: headers(),
          body: JSON.stringify({
            ids,
            description: bulkDescription.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to update selected remittances"
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

  // Export CSV
  const exportCSV = () => {
    if (!filtered.length) {
      toast.error("No records available to export");
      return;
    }

    const columns = [
      ["Order ID", "order_id"],
      ["Buyer", "buyer"],
      ["AWB", "awb"],
      ["COD Amount", "cod_amount"],
      ["Created On", "created_at"],
      ["Status", "status"],
      ["Transferred On", "transferred_on"],
      ["Description", "description"],
      ["Customer", "customer_name"],
      ["Customer ID", "user_id"],
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      columns.map(([label]) => escapeCSV(label)).join(","),
      ...filtered.map((row) =>
        columns
          .map(([, key]) => escapeCSV(row[key]))
          .join(",")
      ),
    ].join("\r\n");

    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "cod-remittances.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  // Description editor
  const Description = ({ item }) => {
    const id = rowId(item);
    const editing = String(editingId) === id;
    const saving = String(savingId) === id;

    if (editing) {
      return (
        <div className="min-w-[220px]">
          <textarea
            value={drafts[id] ?? ""}
            onChange={(event) =>
              setDrafts((previous) => ({
                ...previous,
                [id]: event.target.value,
              }))
            }
            maxLength={1000}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-sky-100"
          />

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDrafts((previous) => ({
                  ...previous,
                  [id]: item.description || "",
                }));
                setEditingId(null);
              }}
              className="rounded-lg border px-3 py-1.5 text-xs text-slate-600"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => saveDescription(item)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#008dd2] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              <HiOutlineSave size={14} />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-w-[220px]">
        <p className="whitespace-pre-wrap break-words text-sm leading-5 text-slate-600">
          {item.description || (
            <span className="italic text-slate-400">
              No description
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={() => {
            setDrafts((previous) => ({
              ...previous,
              [id]: item.description || "",
            }));
            setEditingId(id);
          }}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#008dd2] hover:text-sky-700"
        >
          <HiOutlinePencil size={13} />
          Edit description
        </button>
      </div>
    );
  };

  const tabs = [
    { label: "All Records", value: "ALL", count: stats.total },
    { label: "Pending", value: "PENDING", count: stats.pending },
    {
      label: "Successful",
      value: "SUCCESSFUL",
      count: stats.successful,
    },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-[1600px]">

        {/* Header */}
        <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-[#008dd2]">
              <HiOutlineCurrencyRupee size={26} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                  COD Remittance
                </h1>

                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-[#008dd2]">
                  {stats.total} records
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Track COD payouts, manage descriptions and confirm transfers.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fetchRemittances(true)}
              disabled={loading || bulkProcessing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-sky-200 hover:text-[#008dd2] disabled:opacity-50"
            >
              <HiOutlineRefresh
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={exportCSV}
              disabled={!filtered.length}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#008dd2] px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
            >
              <HiOutlineDownload size={17} />
              Export CSV
            </button>
          </div>
        </header>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total Remittances"
            value={stats.total}
            note="All COD records"
            icon={<HiOutlineCurrencyRupee size={22} />}
            tone="blue"
          />

          <SummaryCard
            title="Pending Remittances"
            value={stats.pending}
            note="Awaiting payout"
            icon={<HiOutlineClock size={22} />}
            tone="amber"
          />

          <SummaryCard
            title="Successful Remittances"
            value={stats.successful}
            note="Transfers completed"
            icon={<HiOutlineCheckCircle size={22} />}
            tone="green"
          />

          <SummaryCard
            title="Pending COD Amount"
            value={money(stats.pendingAmount)}
            note="Amount awaiting transfer"
            icon={<HiOutlineCurrencyRupee size={22} />}
            tone="violet"
          />
        </div>

        {/* Bulk update panel */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Bulk Remittance Update
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select pending records and mark them successful in one step.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleAll}
              disabled={!visiblePending.length || bulkProcessing}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-sky-200 bg-white px-4 text-sm font-semibold text-[#008dd2] hover:bg-sky-50 disabled:opacity-40"
            >
              {allSelected
                ? "Deselect Visible"
                : "Select All Visible Pending"}
            </button>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Selected Orders
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-800">
                {selectedRows.length}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Pending records selected
              </p>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-medium text-sky-700">
                Selected COD Amount
              </p>

              <p className="mt-2 break-words text-2xl font-bold text-[#008dd2]">
                {money(selectedAmount)}
              </p>

              <p className="mt-1 text-xs text-sky-700/70">
                Combined selected order amount
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <HiOutlineUsers size={17} />
                Customer filter
              </p>

              <p className="mt-2 truncate text-base font-bold text-slate-800">
                {customerFilter === "ALL"
                  ? "All Customers"
                  : customers.find(
                      (customer) => customer.id === customerFilter
                    )?.name || `Customer ${customerFilter}`}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Applied to record list
              </p>
            </div>
          </div>

          {selectedRows.length > 0 && (
            <div className="mx-5 mb-4 rounded-xl border border-sky-100 bg-sky-50/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Selected orders
                </p>

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={bulkProcessing}
                  className="text-sm font-semibold text-rose-600"
                >
                  Clear selection
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedRows.map((row) => (
                  <span
                    key={rowId(row)}
                    className="inline-flex items-center gap-2 rounded-lg border border-sky-100 bg-white px-3 py-2"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      #{row.order_id}
                    </span>

                    <span className="text-sm font-bold text-[#008dd2]">
                      {money(row.cod_amount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleOne(rowId(row))}
                      aria-label={`Remove order ${row.order_id}`}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <HiOutlineX size={15} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 p-5">
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="bulk-description"
                className="text-sm font-semibold text-slate-700"
              >
                Common description / UTR reference
              </label>

              <span className="text-xs text-slate-400">
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
              rows={3}
              disabled={bulkProcessing}
              placeholder="Enter the description to apply to all selected remittances..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-sky-100 disabled:opacity-60"
            />

            <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="max-w-2xl text-xs leading-5 text-slate-500">
                This description replaces the existing description on every
                selected record. Confirm the selected orders and amount before
                submitting.
              </p>

              <button
                type="button"
                onClick={bulkSuccessful}
                disabled={
                  !selectedRows.length ||
                  bulkProcessing ||
                  loading
                }
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-5 text-sm font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {bulkProcessing ? (
                  <HiOutlineRefresh
                    className="animate-spin"
                    size={17}
                  />
                ) : (
                  <HiOutlineCheckCircle size={18} />
                )}

                {bulkProcessing
                  ? "Updating Remittances..."
                  : "Mark Selected Successful"}
              </button>
            </div>
          </div>
        </section>

        {/* Records section */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Remittance Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search, filter and manage individual COD remittances.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const active = statusFilter === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusFilter(tab.value)}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${
                      active
                        ? "bg-[#008dd2] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
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

          {/* Filters */}
          <div className="border-b border-slate-100 bg-slate-50/70 p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_280px_auto]">
              <div className="relative">
                <HiOutlineSearch
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search order ID, buyer, AWB or customer..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <select
                value={customerFilter}
                onChange={(event) =>
                  setCustomerFilter(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#008dd2]"
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
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setCustomerFilter("ALL");
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                <HiOutlineX size={16} />
                Reset Filters
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
              <span>
                Showing{" "}
                <strong className="text-slate-800">
                  {filtered.length}
                </strong>{" "}
                of {remittances.length} records
              </span>

              <span>
                {visiblePending.length} pending records in current view
              </span>
            </div>
          </div>

          {/* Loading / errors / empty state */}
          {error && !remittances.length ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-rose-600">
                {error}
              </p>

              <button
                type="button"
                onClick={() => fetchRemittances()}
                className="mt-4 rounded-xl bg-[#008dd2] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Try Again
              </button>
            </div>
          ) : loading && !remittances.length ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4].map((number) => (
                <div
                  key={number}
                  className="h-14 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : !filtered.length ? (
            <div className="px-5 py-16 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <HiOutlineSearch size={24} />
              </span>

              <p className="mt-3 text-base font-semibold text-slate-700">
                No matching records
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-4 p-4 sm:hidden">
                {filtered.map((row) => {
                  const id = rowId(row);
                  const pending =
                    statusOf(row.status) === "PENDING";
                  const selected = selectedIds.includes(id);

                  return (
                    <article
                      key={id}
                      className={`rounded-2xl border p-4 ${
                        selected
                          ? "border-sky-300 bg-sky-50/40"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {pending && (
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleOne(id)}
                            className="mt-1 h-4 w-4 accent-[#008dd2]"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-bold text-slate-800">
                                Order #{row.order_id || "—"}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {row.customer_name || "Customer"} · ID{" "}
                                {row.user_id ?? "—"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-base font-bold text-slate-800">
                                {money(row.cod_amount)}
                              </p>

                              <div className="mt-2">
                                <StatusBadge status={row.status} />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
                            <div>
                              <p className="text-xs text-slate-400">
                                Buyer
                              </p>
                              <p className="mt-1 break-words font-medium text-slate-700">
                                {row.buyer || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                AWB
                              </p>
                              <p className="mt-1 break-all font-medium text-slate-700">
                                {row.awb || "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Created On
                              </p>
                              <p className="mt-1 text-slate-700">
                                {dateText(row.created_at)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-slate-400">
                                Transferred On
                              </p>
                              <p className="mt-1 text-slate-700">
                                {dateText(row.transferred_on)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-xl bg-slate-50 p-3">
                            <Description item={row} />
                          </div>

                          {pending ? (
                            <button
                              type="button"
                              onClick={() => markSuccessful(row)}
                              disabled={
                                processingId !== null ||
                                savingId !== null ||
                                bulkProcessing
                              }
                              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <HiOutlineCheckCircle size={17} />
                              {String(processingId) === id
                                ? "Updating..."
                                : "Mark Successful"}
                            </button>
                          ) : (
                            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                              <HiOutlineCheckCircle size={17} />
                              Transfer completed
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[1300px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="w-12 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          disabled={
                            !visiblePending.length || bulkProcessing
                          }
                          className="h-4 w-4 accent-[#008dd2]"
                        />
                      </th>

                      <th className="px-4 py-4">Order / Customer</th>
                      <th className="px-4 py-4">Buyer</th>
                      <th className="px-4 py-4">AWB</th>
                      <th className="px-4 py-4">COD Amount</th>
                      <th className="px-4 py-4">Created On</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Transferred On</th>
                      <th className="px-4 py-4">Description</th>
                      <th className="px-4 py-4">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filtered.map((row) => {
                      const id = rowId(row);
                      const pending =
                        statusOf(row.status) === "PENDING";
                      const selected = selectedIds.includes(id);

                      return (
                        <tr
                          key={id}
                          className={`align-top transition hover:bg-slate-50 ${
                            selected ? "bg-sky-50/50" : "bg-white"
                          }`}
                        >
                          <td className="px-4 py-4">
                            {pending && (
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleOne(id)}
                                disabled={bulkProcessing}
                                className="h-4 w-4 accent-[#008dd2]"
                              />
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <p className="whitespace-nowrap font-bold text-slate-800">
                              #{row.order_id || "—"}
                            </p>

                            <p className="mt-1 max-w-[160px] truncate text-xs text-slate-500">
                              {row.customer_name || "Customer"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              ID: {row.user_id ?? "—"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <p className="max-w-[160px] break-words font-medium text-slate-700">
                              {row.buyer || "—"}
                            </p>
                          </td>

                          <td className="px-4 py-4 font-mono text-xs text-slate-600">
                            {row.awb || "—"}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-800">
                            {money(row.cod_amount)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                            {dateText(row.created_at)}
                          </td>

                          <td className="px-4 py-4">
                            <StatusBadge status={row.status} />
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500">
                            {dateText(row.transferred_on)}
                          </td>

                          <td className="px-4 py-4">
                            <Description item={row} />
                          </td>

                          <td className="px-4 py-4">
                            {pending ? (
                              <button
                                type="button"
                                onClick={() => markSuccessful(row)}
                                disabled={
                                  processingId !== null ||
                                  savingId !== null ||
                                  bulkProcessing
                                }
                                className="inline-flex whitespace-nowrap items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <HiOutlineCheckCircle size={15} />
                                {String(processingId) === id
                                  ? "Updating..."
                                  : "Mark Successful"}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-emerald-700">
                                <HiOutlineCheckCircle size={16} />
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

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
            <span>ParcelDrop · COD Remittance</span>
            <span>{filtered.length} records shown</span>
          </div>
        </section>
      </div>
    </div>
  );
}