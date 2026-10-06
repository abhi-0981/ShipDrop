
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineDownload,
  HiOutlineChevronDown,
  HiOutlineUser,
  HiOutlineX,
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
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

// Searchable customer selector
const UserSelector = ({ users, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedUser = users.find((user) => user.id === value);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search)
    );
  }, [users, query]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectUser = (userId) => {
    onChange(userId);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full sm:w-[260px]">
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Customer
      </label>

      <button
        type="button"
        onClick={() => {
          setOpen((previous) => !previous);
          setQuery("");
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className={`flex h-11 w-full items-center gap-3 rounded-xl border bg-white px-3 text-left transition ${
          open
            ? "border-[#008dd2] ring-2 ring-sky-100"
            : "border-slate-200 hover:border-slate-300"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#008dd2]">
          <HiOutlineUser size={17} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-slate-700">
            {selectedUser ? selectedUser.name : "All Users"}
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-slate-400">
            {selectedUser
              ? `Customer ID: ${selectedUser.id}`
              : "View all customers"}
          </span>
        </span>

        {value !== "ALL" && (
          <span
            onClick={(event) => {
              event.stopPropagation();
              selectUser("ALL");
            }}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Clear customer filter"
          >
            <HiOutlineX size={15} />
          </span>
        )}

        <HiOutlineChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:min-w-[300px]">
          <div className="border-b border-slate-100 bg-slate-50/80 p-3">
            <div className="relative">
              <HiOutlineSearch
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                ref={inputRef}
                autoFocus
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && filteredUsers.length > 0) {
                    selectUser(filteredUsers[0].id);
                  }
                }}
                placeholder="Search name or customer ID..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-400">
              <span>Choose a customer</span>
              <span>{filteredUsers.length} found</span>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5" role="listbox">
            <button
              type="button"
              onClick={() => selectUser("ALL")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                value === "ALL"
                  ? "bg-sky-50 text-[#008dd2]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
              role="option"
              aria-selected={value === "ALL"}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
                <HiOutlineUser size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold">All Users</span>
                <span className="mt-0.5 block text-[10px] text-slate-400">
                  All customer remittances
                </span>
              </span>
              {value === "ALL" && (
                <HiOutlineCheckCircle size={17} />
              )}
            </button>

            {filteredUsers.map((user) => {
              const selected = value === user.id;

              return (
                <button
                  type="button"
                  key={user.id}
                  onClick={() => selectUser(user.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    selected
                      ? "bg-sky-50 text-[#008dd2]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  role="option"
                  aria-selected={selected}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      selected
                        ? "bg-[#008dd2] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">
                      {user.name}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      Customer ID: {user.id}
                    </span>
                  </span>

                  {selected && <HiOutlineCheckCircle size={17} />}
                </button>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="px-4 py-8 text-center">
                <HiOutlineSearch
                  size={23}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-2 text-xs font-semibold text-slate-600">
                  No customer found
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Try another name or customer ID.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CODRemittance = () => {
  const [remittances, setRemittances] = useState([]);
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState("");

  const fetchRemittances = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to load COD remittances"
        );
      }

      setRemittances(
        Array.isArray(data?.remittances) ? data.remittances : []
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

  // Unique customer list
  const users = useMemo(() => {
    const uniqueUsers = new Map();

    remittances.forEach((item) => {
      const id = String(item.user_id ?? "");
      if (!id) return;

      const name = String(item.customer_name || "").trim();
      const existing = uniqueUsers.get(id);

      uniqueUsers.set(id, {
        id,
        name: name || existing?.name || `User ${id}`,
      });
    });

    return Array.from(uniqueUsers.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [remittances]);

  // Combined filters
  const filteredRemittances = useMemo(() => {
    const query = search.trim().toLowerCase();

    return remittances.filter((item) => {
      const status = String(item.status || "PENDING").toUpperCase();

      const matchesUser =
        userFilter === "ALL" ||
        String(item.user_id ?? "") === userFilter;

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const matchesSearch =
        !query ||
        String(item.order_id || "").toLowerCase().includes(query) ||
        String(item.buyer || "").toLowerCase().includes(query) ||
        String(item.awb || "").toLowerCase().includes(query) ||
        String(item.customer_name || "").toLowerCase().includes(query) ||
        String(item.user_id ?? "").toLowerCase().includes(query);

      return matchesUser && matchesStatus && matchesSearch;
    });
  }, [remittances, search, userFilter, statusFilter]);

  // Summary cards follow the active filters
  const stats = useMemo(() => {
    const pending = filteredRemittances.filter(
      (item) =>
        String(item.status || "PENDING").toUpperCase() === "PENDING"
    );

    const successful = filteredRemittances.filter(
      (item) =>
        String(item.status || "").toUpperCase() === "SUCCESSFUL"
    );

    return {
      total: filteredRemittances.length,
      pending: pending.length,
      successful: successful.length,
      pendingAmount: pending.reduce(
        (sum, item) => sum + Number(item.cod_amount || 0),
        0
      ),
    };
  }, [filteredRemittances]);

  const selectedUser = users.find((user) => user.id === userFilter);

  // Mark a pending remittance successful
  const markSuccessful = async (item) => {
    if (String(item.status || "").toUpperCase() !== "PENDING") return;

    const confirmed = window.confirm(
      `Mark remittance for order ${item.order_id} as Successful?`
    );

    if (!confirmed) return;

    try {
      setProcessingId(item.remittance_id);

      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_BASE_URL}/admin/cod-remittances/${item.remittance_id}/successful`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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

  // Export currently filtered records
  const exportCSV = () => {
    if (!filteredRemittances.length) {
      toast.error("No records available to export");
      return;
    }

    const headers = [
      "Order ID",
      "Customer ID",
      "Customer Name",
      "Buyer",
      "AWB",
      "COD Amount",
      "Order Created On",
      "Remittance Status",
      "Transferred On",
      "Description",
    ];

    const rows = filteredRemittances.map((item) => [
      item.order_id,
      item.user_id,
      item.customer_name,
      item.buyer,
      item.awb,
      item.cod_amount,
      item.created_at,
      item.status,
      item.transferred_on,
      item.description,
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

    const safeName = (selectedUser?.name || "all-users")
      .replace(/[^a-z0-9_-]/gi, "_");

    link.href = url;
    link.download = `cod-remittances-${safeName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success("CSV exported");
  };

  const resetFilters = () => {
    setSearch("");
    setUserFilter("ALL");
    setStatusFilter("ALL");
  };

  const filtersApplied =
    Boolean(search.trim()) ||
    userFilter !== "ALL" ||
    statusFilter !== "ALL";

  return (
    <div className="min-h-full bg-[#f8fafc] p-3 pb-8 sm:p-5 lg:p-6">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-[#008dd2]">
              <HiOutlineCurrencyRupee size={23} />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                COD Remittance
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Customer COD settlements and payment records
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchRemittances(true)}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
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
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#008dd2] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HiOutlineDownload size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards */}
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
            Records matching current filters
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
            Awaiting processing
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

      {/* Filters */}
      <div className="relative z-20 mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-800">
            Find Remittances
          </h2>
          <p className="mt-1 text-[11px] text-slate-400">
            Filter by customer, order details or remittance status.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          {/* Searchable customer selector */}
          <UserSelector
            users={users}
            value={userFilter}
            onChange={setUserFilter}
          />

          {/* Search field */}
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Search Orders
            </label>
            <div className="relative">
              <HiOutlineSearch
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Order ID, buyer name or AWB..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          {/* Status selector */}
          <div className="w-full lg:w-[165px]">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-sky-100"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESSFUL">Successful</option>
            </select>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!filtersApplied}
            className="h-11 shrink-0 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset Filters
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <div className="text-slate-500">
            Showing{" "}
            <strong className="text-slate-800">
              {filteredRemittances.length}
            </strong>{" "}
            of {remittances.length} records
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedUser && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1.5 font-medium text-[#008dd2]">
                <HiOutlineUser size={13} />
                {selectedUser.name} · ID {selectedUser.id}
              </span>
            )}
            {statusFilter !== "ALL" && (
              <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-medium text-slate-600">
                {statusFilter}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Remittance table */}
      <div className="relative z-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Remittance Records
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              Order details, COD amounts and transfer status
            </p>
          </div>
          <span className="w-fit rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">
            {filteredRemittances.length} records
          </span>
        </div>

        {error && !remittances.length ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-red-600">
              Unable to load remittances
            </p>
            <p className="mt-1 text-xs text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => fetchRemittances()}
              className="mt-4 rounded-xl bg-[#008dd2] px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-700"
            >
              Try Again
            </button>
          </div>
        ) : loading && !remittances.length ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-12 animate-pulse rounded-xl bg-slate-100"
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
                ? "Try changing the customer, search term or status."
                : "Remittance records will appear here when available in the database."}
            </p>
            {filtersApplied && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  {[
                    "Order Details",
                    "Customer",
                    "Buyer",
                    "AWB No.",
                    "COD Amount",
                    "Created On",
                    "Status",
                    "Transferred On",
                    "Description",
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
                    String(item.status || "PENDING").toUpperCase() ===
                    "PENDING";

                  return (
                    <tr
                      key={item.remittance_id ?? `${item.user_id}-${item.order_id}`}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3">
                        <p className="whitespace-nowrap text-xs font-bold text-slate-800">
                          {item.order_id || "-"}
                        </p>
                        <p className="mt-1 whitespace-nowrap text-[10px] text-slate-400">
                          Remittance ID: {item.remittance_id ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="max-w-[180px] truncate text-xs font-semibold text-slate-700">
                          {item.customer_name || `User ${item.user_id ?? "-"}`}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          ID: {item.user_id ?? "-"}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <p className="max-w-[180px] truncate text-xs text-slate-700">
                          {item.buyer || "-"}
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

                      <td className="max-w-[190px] px-4 py-3 text-[11px] text-slate-500">
                        <span className="line-clamp-2">
                          {item.description || "-"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {pending ? (
                          <button
                            type="button"
                            onClick={() => markSuccessful(item)}
                            disabled={processingId === item.remittance_id}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <HiOutlineCheckCircle size={14} />
                            {processingId === item.remittance_id
                              ? "Updating..."
                              : "Mark Successful"}
                          </button>
                        ) : (
                          <span className="whitespace-nowrap text-[11px] font-semibold text-emerald-600">
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
          <span>ShipDrop · COD Remittance Management</span>
          <span>{filteredRemittances.length} records displayed</span>
        </div>
      </div>
    </div>
  );
};

export default CODRemittance;
