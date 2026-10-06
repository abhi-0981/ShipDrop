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
  const successful =
    String(status || "").toUpperCase() === "SUCCESSFUL";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold ${
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
  const [descriptionDrafts, setDescriptionDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [savingDescriptionId, setSavingDescriptionId] = useState(null);
  const [editingDescriptionId, setEditingDescriptionId] = useState(null);
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
          const id = item.remittance_id;

          if (!(id in next)) {
            next[id] = item.description || "";
          }
        });

        return next;
      });

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

  const stats = useMemo(() => {
    const pending = remittances.filter(
      (item) =>
        String(item.status || "").toUpperCase() === "PENDING"
    );

    const successful = remittances.filter(
      (item) =>
        String(item.status || "").toUpperCase() === "SUCCESSFUL"
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
      const status = String(
        item.status || "PENDING"
      ).toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const matchesSearch =
        !query ||
        String(item.order_id || "").toLowerCase().includes(query) ||
        String(item.buyer || "").toLowerCase().includes(query) ||
        String(item.awb || "").toLowerCase().includes(query) ||
        String(item.customer_name || "")
          .toLowerCase()
          .includes(query) ||
        String(item.user_id || "").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [remittances, search, statusFilter]);

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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to save description"
        );
      }

      setRemittances((previous) =>
        previous.map((record) =>
          record.remittance_id === id
            ? { ...record, description: description.trim() }
            : record
        )
      );

      setDescriptionDrafts((previous) => ({
        ...previous,
        [id]: description.trim(),
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
    if (
      String(item.status || "").toUpperCase() !== "PENDING"
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Mark remittance for order ${item.order_id} as Successful?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(item.remittance_id);

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances/${item.remittance_id}/successful`,
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
    link.click();

    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
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
    <div className="min-h-full bg-[#f8fafc] p-3.5 pb-24 sm:p-5 sm:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
              COD Remittance
            </h1>

            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
              {stats.total}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-slate-500">
            Manage COD remittances, descriptions and transfer status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchRemittances(true)}
            disabled={loading}
            className="flex-1 sm:flex-initial inline-flex h-9.5 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
          >
            <HiOutlineRefresh
              size={15}
              className={loading ? "animate-spin text-[#008dd2]" : ""}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!filteredRemittances.length}
            className="flex-1 sm:flex-initial inline-flex h-9.5 items-center justify-center gap-1.5 rounded-xl bg-[#008dd2] px-3.5 text-xs font-bold text-white shadow-2xs transition hover:bg-sky-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiOutlineDownload size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-4 sm:mb-5 grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] sm:text-xs font-medium text-slate-500">
              Total Remittances
            </p>
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">
              <HiOutlineCurrencyRupee size={18} />
            </span>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-800">
            {stats.total}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
            All records
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/20 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] sm:text-xs font-medium text-slate-500">
              Pending
            </p>
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <HiOutlineClock size={18} />
            </span>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-amber-600">
            {stats.pending}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
            Awaiting payout
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/20 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] sm:text-xs font-medium text-slate-500">
              Successful
            </p>
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <HiOutlineCheckCircle size={18} />
            </span>
          </div>
          <p className="mt-2 text-xl sm:text-2xl font-bold text-emerald-600">
            {stats.successful}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
            Completed
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] sm:text-xs font-medium text-slate-500">
              Pending Amount
            </p>
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <HiOutlineCurrencyRupee size={18} />
            </span>
          </div>
          <p className="mt-2 break-words text-xl sm:text-2xl font-black text-slate-800">
            {formatAmount(stats.pendingAmount)}
          </p>
          <p className="mt-0.5 text-[10px] sm:text-[11px] text-slate-400">
            Awaiting transfer
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-3.5 sm:mb-4 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs [scrollbar-width:none]">
        <div className="flex min-w-max gap-1.5">
          {tabs.map((tab) => {
            const active = statusFilter === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 ${
                  active
                    ? "bg-[#008dd2] text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>

                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
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

      {/* Search & Filter Controls */}
      <div className="mb-3.5 sm:mb-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
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
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {search && (
            <button
              type="button"
              onClick={resetFilters}
              className="h-10 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
          <span>
            Showing <strong className="text-slate-700">{filteredRemittances.length}</strong> of {remittances.length} records
          </span>

          <span className="text-[#008dd2] font-semibold">
            {statusFilter === "ALL"
              ? "All statuses"
              : statusFilter === "PENDING"
              ? "Pending only"
              : "Successful only"}
          </span>
        </div>
      </div>

      {/* Records Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/40">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {statusFilter === "ALL"
              ? "All Remittance Records"
              : statusFilter === "PENDING"
              ? "Pending Remittances"
              : "Successful Remittances"}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Manage payouts, add reference remarks, and track bank transfers.
          </p>
        </div>

        {error && !remittances.length ? (
          <div className="p-8 text-center">
            <p className="text-xs font-bold text-rose-600">
              Unable to load remittances
            </p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => fetchRemittances()}
              className="mt-3 rounded-xl bg-[#008dd2] px-4 py-2 text-xs font-bold text-white shadow-2xs"
            >
              Try Again
            </button>
          </div>
        ) : loading && !remittances.length ? (
          <div className="space-y-2.5 p-4 sm:p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-14 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : filteredRemittances.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-400">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <HiOutlineCurrencyRupee size={24} />
            </div>
            <h3 className="mt-3 text-xs font-bold text-slate-700">
              {remittances.length
                ? "No matching records"
                : "No COD remittances found"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-400">
              {remittances.length
                ? "Try changing your search or selecting another status tab."
                : "Remittance records will appear here when available in the database."}
            </p>
          </div>
        ) : (
          <>
            {/* 1. MOBILE CARD VIEW (App Feel on Phones) */}
            <div className="space-y-2.5 p-3 sm:hidden">
              {filteredRemittances.map((item) => {
                const pending =
                  String(item.status || "").toUpperCase() === "PENDING";
                const id = item.remittance_id;
                const editing = editingDescriptionId === id;
                const saving = savingDescriptionId === id;
                const draft = descriptionDrafts[id] ?? "";

                return (
                  <div
                    key={id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-3.5 space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-bold text-xs text-slate-900">
                          #{item.order_id || "-"}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Customer ID: {item.user_id ?? "-"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block">
                          {formatAmount(item.cod_amount)}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Buyer:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[170px]">
                          {item.buyer || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Customer:</span>
                        <span className="text-slate-700 truncate max-w-[170px]">
                          {item.customer_name || "Customer"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                        <span>AWB: {item.awb || "-"}</span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Admin Description Area on Mobile */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          Admin Remarks
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
                            className="text-[10px] font-bold text-[#008dd2] flex items-center gap-1"
                          >
                            <HiOutlinePencil size={11} />
                            Edit
                          </button>
                        )}
                      </div>

                      {editing ? (
                        <div className="space-y-1.5">
                          <textarea
                            value={draft}
                            onChange={(event) =>
                              updateDescriptionDraft(id, event.target.value)
                            }
                            maxLength={1000}
                            rows={2}
                            placeholder="Add remittance note or UTR..."
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-none focus:border-[#008dd2]"
                          />
                          <div className="flex justify-end gap-1.5">
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
                              className="px-2.5 py-1 text-[10px] font-bold text-slate-500 rounded-lg border border-slate-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveDescription(item)}
                              disabled={saving}
                              className="px-3 py-1 text-[10px] font-bold text-white rounded-lg bg-[#008dd2]"
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          {item.description || "No notes added."}
                        </p>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
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
                            processingId === id ||
                            savingDescriptionId === id
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 disabled:opacity-60"
                        >
                          <HiOutlineCheckCircle size={14} />
                          {processingId === id ? "Updating..." : "Mark Successful"}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <HiOutlineCheckCircle size={14} />
                          Transferred
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. TABLET & DESKTOP: STRUCTURED DATA TABLE */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[1250px] border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {[
                      "Order Details",
                      "Buyer",
                      "AWB No.",
                      "COD Amount",
                      "Created On",
                      "Remit. Status",
                      "Transferred On",
                      "Admin Description",
                      "Action",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="whitespace-nowrap px-4 py-3"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRemittances.map((item) => {
                    const pending =
                      String(item.status || "").toUpperCase() ===
                      "PENDING";
                    const id = item.remittance_id;
                    const editing = editingDescriptionId === id;
                    const saving = savingDescriptionId === id;
                    const draft = descriptionDrafts[id] ?? "";

                    return (
                      <tr
                        key={id}
                        className="align-top transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3.5">
                          <p className="whitespace-nowrap font-bold text-slate-800">
                            #{item.order_id || "-"}
                          </p>
                          <p className="mt-0.5 whitespace-nowrap text-[10px] text-slate-400">
                            Customer ID: {item.user_id ?? "-"}
                          </p>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="max-w-[180px] truncate font-semibold text-slate-700">
                            {item.buyer || "-"}
                          </p>
                          <p className="mt-0.5 max-w-[180px] truncate text-[10px] text-slate-400">
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

                        {/* Editable Admin Description */}
                        <td className="w-[280px] px-4 py-3.5">
                          {editing ? (
                            <div className="w-[250px]">
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
                                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-sky-100"
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
                                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => saveDescription(item)}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1 rounded-lg bg-[#008dd2] px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                                  >
                                    <HiOutlineSave size={12} />
                                    {saving ? "Saving..." : "Save"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-[250px]">
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
                                className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-[#008dd2] hover:text-[#008dd2]"
                              >
                                <HiOutlinePencil size={11} />
                                Edit
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          {pending ? (
                            <button
                              type="button"
                              onClick={() => markSuccessful(item)}
                              disabled={
                                processingId === id ||
                                savingDescriptionId === id
                              }
                              className="inline-flex whitespace-nowrap items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <HiOutlineCheckCircle size={14} />
                              {processingId === id
                                ? "Updating..."
                                : "Mark Successful"}
                            </button>
                          ) : (
                            <span className="whitespace-nowrap text-xs font-semibold text-emerald-600">
                              <HiOutlineCheckCircle className="mr-1 inline text-sm" />
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

export default CODRemittance;