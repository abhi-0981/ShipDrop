import React, { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import OfflineOrderModal from "../../components/Common/OfflineOrderModal";

const CARRIER_LIST = [
  "MARK EXPRESS",
  "TIRUPATI COURIER",
  "DTDC",
  "TRACKON COURIER",
  "SELF",
  "OTHER",
];

export default function OfflineOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [partyFilter, setPartyFilter] = useState("ALL");

  const [partyIdentities, setPartyIdentities] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load parties
  useEffect(() => {
    const loadParties = async () => {
      try {
        const res = await api.get("/party-identities");
        if (res?.data?.success) {
          setPartyIdentities(res.data.partyIdentities || []);
        }
      } catch (err) {
        console.error("Unable to load party identities:", err);
      }
    };
    loadParties();
  }, []);

  // Fetch offline orders
  const fetchOrders = async () => {
    try {
      setIsFetching(true);
      const res = await api.get("/offline-orders", {
        params: {
          page: currentPage,
          limit: 50,
          search: debouncedSearch,
          carrier: carrierFilter,
          payment_mode: paymentFilter,
          party_identity_id: partyFilter !== "ALL" ? partyFilter : undefined,
        },
      });

      if (res?.data?.success) {
        setOrders(res.data.orders || []);
        setTotalOrders(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to load offline orders");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, carrierFilter, paymentFilter, partyFilter]);

  const handleSelectAll = () => {
    if (selectedIds.length === orders.length && orders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offline order?")) {
      return;
    }

    try {
      const res = await api.delete(`/offline-orders/${id}`);
      if (res?.data?.success) {
        toast.success("Offline order deleted successfully");
        setOrders((prev) => prev.filter((o) => o.id !== id));
        setTotalOrders((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete order");
    }
  };

  const handleExport = () => {
    if (orders.length === 0) return toast.error("No orders to export");

    const headers = [
      "ID",
      "Consignment No",
      "Carrier",
      "Party",
      "Customer Name",
      "Mobile",
      "Address",
      "City",
      "State",
      "Pincode",
      "Package Type",
      "Product Name",
      "Shipping Mode",
      "Amount",
      "Shipping Charge",
      "Payment Mode",
      "Weight (Kg)",
      "Status",
      "Created At",
    ];

    const rows = orders.map((o) => [
      o.id,
      `"${o.consignment_no || ""}"`,
      `"${o.carrier || ""}"`,
      `"${o.party_reference_name || o.party_name || ""}"`,
      `"${o.consignee_name || ""}"`,
      `"${o.mobile || ""}"`,
      `"${(o.address || "").replace(/"/g, '""')}"`,
      `"${o.city || ""}"`,
      `"${o.state || ""}"`,
      `"${o.pincode || ""}"`,
      `"${o.package_type || ""}"`,
      `"${o.product_name || ""}"`,
      `"${o.shipping_mode || ""}"`,
      Number(o.amount || 0).toFixed(2),
      Number(o.shipping_charge || 0).toFixed(2),
      `"${o.payment_mode || ""}"`,
      Number(o.weight || 0).toFixed(2),
      `"${o.status || "Booked"}"`,
      `"${new Date(o.created_at).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `offline-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#008dd2]/10 text-[#008dd2] font-bold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 16h6" />
                  <path d="M19 13v6" />
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="m9 8 3 3-3 3" />
                </svg>
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">
                Offline Orders
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-[13px] text-slate-400">
              Manage manual courier shipments ({totalOrders} total recorded)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={orders.length === 0}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Export
            </button>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#008dd2] px-4 text-xs font-bold text-white shadow-sm shadow-[#008dd2]/20 hover:bg-[#007ab6] transition active:scale-95"
            >
              <span className="text-sm font-bold">+</span>
              Create Offline Order
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          FILTER DOCK
      ================================================== */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-3.5 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* SEARCH */}
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Consignment No, Customer, Mobile, Product..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-20 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
            />
            {isFetching && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                Updating...
              </span>
            )}
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-center gap-1.5 sm:gap-2">
            {/* PARTY FILTER */}
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="h-10 w-full md:min-w-[130px] max-w-[170px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2] truncate cursor-pointer"
            >
              <option value="ALL">All Parties</option>
              {partyIdentities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference_name || p.name}
                </option>
              ))}
            </select>

            {/* CARRIER FILTER */}
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="h-10 w-full md:min-w-[125px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2] cursor-pointer"
            >
              <option value="ALL">All Carriers</option>
              {CARRIER_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* PAYMENT FILTER */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="h-10 w-full md:min-w-[105px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2] cursor-pointer"
            >
              <option value="ALL">All Payment</option>
              <option value="Prepaid">Prepaid</option>
              <option value="COD">COD</option>
            </select>

            <button
              type="button"
              onClick={fetchOrders}
              title="Refresh"
              className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:scale-95 transition"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          TABLE / LIST VIEW
      ================================================== */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
            <p className="text-xs text-slate-400">Loading offline orders...</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#008dd2] mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="m9 8 3 3-3 3" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-700">No offline orders found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            {debouncedSearch || carrierFilter !== "ALL" || paymentFilter !== "ALL" || partyFilter !== "ALL"
              ? "Try adjusting your search or filters."
              : "Record manual carrier shipments (Mark Express, Tirupati, DTDC, etc.) to keep track of them here."}
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-4 rounded-xl bg-[#008dd2] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#007ab6] transition"
          >
            + Create First Offline Order
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
              <table className="w-full table-fixed border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-xs border-b border-slate-200">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="w-[3%] px-2.5 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === orders.length && orders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-[#008dd2] focus:ring-[#008dd2]"
                      />
                    </th>
                    <th className="w-[8%] px-2 py-3 text-left">Party</th>
                    <th className="w-[14%] px-2.5 py-3 text-left">Customer</th>
                    <th className="w-[18%] px-2.5 py-3 text-left">Shipment</th>
                    <th className="w-[13%] px-2 py-3 text-left">Route</th>
                    <th className="w-[11%] px-2 py-3 text-left">Payment</th>
                    <th className="w-[12%] px-2 py-3 text-left">Specs & Weight</th>
                    <th className="w-[9%] px-2 py-3 text-left">Charge</th>
                    <th className="w-[7%] px-2 py-3 text-center">Status</th>
                    <th className="w-[5%] px-2 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {orders.map((o) => {
                    const isSelected = selectedIds.includes(o.id);
                    return (
                      <tr
                        key={o.id}
                        className={`transition hover:bg-slate-50/70 ${
                          isSelected ? "bg-sky-50/30" : "bg-white"
                        }`}
                      >
                        <td className="px-2.5 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelect(o.id)}
                            className="rounded border-slate-300 text-[#008dd2] focus:ring-[#008dd2]"
                          />
                        </td>

                        <td className="px-2 py-3">
                          {o.party_reference_name || o.party_name ? (
                            <span
                              className="inline-block max-w-full truncate rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-[#008dd2] border border-sky-100"
                              title={`${o.party_reference_name || ""} - ${o.party_name || ""}`}
                            >
                              {o.party_reference_name || o.party_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        <td className="px-2.5 py-3">
                          <div className="font-semibold text-slate-800 truncate" title={o.consignee_name}>
                            {o.consignee_name}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400 font-mono">
                            {o.mobile}
                          </div>
                        </td>

                        <td className="px-2.5 py-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-slate-800 font-mono truncate" title={o.consignment_no}>
                              {o.consignment_no}
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(String(o.consignment_no));
                                  toast.success("Consignment No copied");
                                } catch {
                                  toast.error("Unable to copy");
                                }
                              }}
                              className="text-slate-400 hover:text-slate-700 shrink-0 p-0.5"
                              title="Copy Consignment No"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 font-semibold truncate">
                            {o.carrier}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {o.product_name ? `${o.product_name} • ` : ""}
                            <span className="font-medium text-slate-600">{o.shipping_mode}</span>
                          </div>
                        </td>

                        <td className="px-2 py-3">
                          <div className="font-medium text-slate-700 truncate" title={o.city}>
                            {o.city}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            PIN: {o.pincode}
                          </div>
                        </td>

                        <td className="px-2 py-3">
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              o.payment_mode === "COD"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-sky-50 text-[#008dd2] border border-sky-100"
                            }`}
                          >
                            {o.payment_mode}
                          </span>
                          <div className="mt-1 font-bold text-emerald-600">
                            ₹{Number(o.amount || 0).toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            (Incl. GST)
                          </div>
                        </td>

                        <td className="px-2 py-3">
                          <div className="font-semibold text-slate-700 truncate">
                            {o.package_type || "Box"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Wt: <b className="text-slate-800">{Number(o.weight || 0).toFixed(2)} kg</b>
                          </div>
                          {(Number(o.length) > 0 || Number(o.width) > 0 || Number(o.height) > 0) && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {o.length || 0}×{o.width || 0}×{o.height || 0} cm
                            </div>
                          )}
                        </td>

                        <td className="px-2 py-3">
                          <div className="font-bold text-slate-700">
                            ₹{Number(o.shipping_charge || 0).toFixed(2)}
                          </div>
                        </td>

                        <td className="px-2 py-3 text-center">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            Booked
                          </span>
                        </td>

                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(o.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Order"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE VIEW (CARD TILES) */}
          <div className="space-y-3 md:hidden">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs space-y-2.5"
              >
                {/* TOP HEADER */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    {o.party_reference_name && (
                      <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#008dd2] border border-sky-100">
                        {o.party_reference_name}
                      </span>
                    )}
                    <span className="font-semibold text-xs text-slate-800">{o.carrier}</span>
                  </div>

                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Booked
                  </span>
                </div>

                {/* CONSIGNMENT BAR */}
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
                  <span className="font-bold truncate">No: {o.consignment_no}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(String(o.consignment_no));
                        toast.success("Consignment No copied");
                      } catch {
                        toast.error("Unable to copy");
                      }
                    }}
                    className="text-slate-400 p-0.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                  </button>
                </div>

                {/* RECIPIENT & ROUTE */}
                <div className="text-xs space-y-0.5">
                  <div className="font-bold text-slate-800">{o.consignee_name} ({o.mobile})</div>
                  <div className="text-slate-500 text-[11px]">
                    {o.city}, {o.state} - PIN: {o.pincode}
                  </div>
                  {o.product_name && (
                    <div className="text-slate-600 text-[11px]">
                      Product: <b>{o.product_name}</b>
                    </div>
                  )}
                </div>

                {/* SPECS & PAYMENT */}
                <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-2">
                  <div>
                    <span className="text-slate-400">Pkg: </span>
                    <span className="font-medium text-slate-700">
                      {o.package_type} • {o.shipping_mode} • {Number(o.weight || 0).toFixed(2)} kg
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600">₹{Number(o.amount || 0).toFixed(2)}</span>
                    <span className="ml-1 text-[10px] text-slate-400 font-semibold">({o.payment_mode})</span>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                  <span>Charge: ₹{Number(o.shipping_charge || 0).toFixed(2)}</span>
                  <span>{formatDate(o.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(o.id)}
                    className="text-rose-500 hover:text-rose-700 font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE OFFLINE ORDER MODAL */}
      <OfflineOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchOrders();
        }}
      />
    </div>
  );
}
