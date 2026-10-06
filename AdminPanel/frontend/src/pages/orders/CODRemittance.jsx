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
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        successful
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {successful ? (
        <HiOutlineCheckCircle size={14} />
      ) : (
        <HiOutlineClock size={14} />
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

          // Preserve unsaved edits while refreshing.
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
    { label: "All Remittances", value: "ALL", count: stats.total },
    { label: "Pending", value: "PENDING", count: stats.pending },
    {
      label: "Successful",
      value: "SUCCESSFUL",
      count: stats.successful,
    },
  ];

  return (
    <div className="min-h-full bg-[#f8fafc] p-3 pb-8 sm:p-5">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-800">
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchRemittances(true)}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#008dd2] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiOutlineDownload size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Total Remittances
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">
              <HiOutlineCurrencyRupee size={20} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            All remittance records
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Pending Remittances
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <HiOutlineClock size={20} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-600">
            {stats.pending}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Awaiting admin processing
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Successful Remittances
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <HiOutlineCheckCircle size={20} />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-600">
            {stats.successful}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Marked as transferred
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Pending COD Amount
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <HiOutlineCurrencyRupee size={20} />
            </span>
          </div>
          <p className="mt-3 break-words text-2xl font-bold text-slate-800">
            {formatAmount(stats.pendingAmount)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Amount awaiting remittance
          </p>
        </div>
      </div>

      {/* Separate Status Tabs */}
      <div className="mb-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const active = statusFilter === tab.value;

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "bg-[#008dd2] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
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

      {/* Search */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <HiOutlineSearch
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Order ID, buyer, AWB or customer..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          <span>
            Showing{" "}
            <strong className="text-slate-700">
              {filteredRemittances.length}
            </strong>{" "}
            of {remittances.length} records
          </span>

          <span className="text-[#008dd2]">
            {statusFilter === "ALL"
              ? "All statuses"
              : statusFilter === "PENDING"
                ? "Pending only"
                : "Successful only"}
          </span>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              {statusFilter === "ALL"
                ? "All Remittance Records"
                : statusFilter === "PENDING"
                  ? "Pending Remittances"
                  : "Successful Remittances"}
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Edit descriptions and manage transfer status.
            </p>
          </div>
        </div>

        {error && !remittances.length ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-red-600">
              Unable to load remittances
            </p>

            <p className="mt-1 text-xs text-slate-500">{error}</p>

            <button
              type="button"
              onClick={() => fetchRemittances()}
              className="mt-3 rounded-lg bg-[#008dd2] px-4 py-2 text-xs font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : loading && !remittances.length ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : filteredRemittances.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <HiOutlineCurrencyRupee size={24} />
            </div>

            <h3 className="mt-3 text-sm font-bold text-slate-700">
              {remittances.length
                ? "No matching records"
                : "No COD remittances found"}
            </h3>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
              {remittances.length
                ? "Try changing your search or selecting another status tab."
                : "Remittance records will appear here when available in the database."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
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
                      className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
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
                      <td className="px-4 py-3">
                        <p className="whitespace-nowrap text-xs font-bold text-slate-800">
                          {item.order_id || "-"}
                        </p>

                        <p className="mt-1 whitespace-nowrap text-[10px] text-slate-400">
                          Customer ID: {item.user_id ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="max-w-[180px] truncate text-xs font-semibold text-slate-700">
                          {item.buyer || "-"}
                        </p>

                        <p className="mt-1 max-w-[180px] truncate text-[10px] text-slate-400">
                          {item.customer_name || "Customer"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span className="whitespace-nowrap font-mono text-xs text-slate-600">
                          {item.awb || "-"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-800">
                        {formatAmount(item.cod_amount)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">
                        {formatDate(item.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-[11px] text-slate-500">
                        {formatDate(item.transferred_on)}
                      </td>

                      {/* Editable Admin Description */}
                      <td className="w-[290px] px-4 py-3">
                        {editing ? (
                          <div className="w-[260px]">
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
                              className="w-full resize-y rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-sky-100"
                            />

                            <div className="mt-1 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">
                                {draft.length}/1000
                              </span>

                              <div className="flex gap-2">
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
                                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  onClick={() => saveDescription(item)}
                                  disabled={saving}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#008dd2] px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                                >
                                  <HiOutlineSave size={13} />
                                  {saving ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-[260px]">
                            <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">
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
                              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-[#008dd2] hover:text-[#008dd2]"
                            >
                              <HiOutlinePencil size={13} />
                              Edit Description
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {pending ? (
                          <button
                            type="button"
                            onClick={() => markSuccessful(item)}
                            disabled={
                              processingId === id ||
                              savingDescriptionId === id
                            }
                            className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <HiOutlineCheckCircle size={14} />
                            {processingId === id
                              ? "Updating..."
                              : "Mark Successful"}
                          </button>
                        ) : (
                          <span className="whitespace-nowrap text-[11px] font-medium text-emerald-600">
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
        )}

        <div className="flex flex-col gap-1 border-t border-slate-200 bg-slate-50/70 px-4 py-3 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>COD Remittance Management</span>
          <span>Showing {filteredRemittances.length} records</span>
        </div>
      </div>
    </div>
  );
};

export default CODRemittance;
