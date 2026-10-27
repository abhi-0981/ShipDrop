import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import OfflineOrderModal from "../../components/Common/OfflineOrderModal";
import { TableSkeleton, CardSkeleton } from "../../components/Common/TableSkeleton";
import OrderStatusNavTabs from "../../components/Common/OrderStatusNavTabs";
import { notifyOrderChange } from "../../services/orderEvents";

const PRIMARY = "#008dd2";

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
  const [editingOrder, setEditingOrder] = useState(null);
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

  // Load default warehouse for route visualization (matching All Orders)
  const [defaultWarehouse, setDefaultWarehouse] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadDefaultWarehouse = async () => {
      try {
        const res = await api.get("/warehouses");
        if (isMounted && res?.data?.success && Array.isArray(res.data.warehouses)) {
          const list = res.data.warehouses;
          const def =
            list.find((w) => w.is_default || w.is_primary) || list[0] || null;
          setDefaultWarehouse(def);
        }
      } catch (err) {
        console.error("Unable to load warehouse in OfflineOrders:", err);
      }
    };
    loadDefaultWarehouse();
    return () => {
      isMounted = false;
    };
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
        window.dispatchEvent(new Event("offlineOrdersUpdated"));
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to load offline orders",
      );
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch, carrierFilter, paymentFilter, partyFilter]);

  useEffect(() => {
    // Notify sidebar count immediately on page load
    window.dispatchEvent(new Event("offlineOrdersUpdated"));
  }, []);

  const allVisibleSelected =
    orders.length > 0 && selectedIds.length === orders.length;

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const handleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setShowCreateModal(true);
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
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        notifyOrderChange();
        window.dispatchEvent(new Event("offlineOrdersUpdated"));
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
      "Shipping Charge (Incl. GST)",
      "Payment Mode",
      "Weight (Kg)",
      "Remark",
      "Status",
      "Created At",
    ];

    const rows = orders.map((o) => {
      const charge =
        o.shipping_charge !== null &&
        o.shipping_charge !== undefined &&
        o.shipping_charge !== ""
          ? o.shipping_charge
          : o.amount || 0;

      return [
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
        Number(charge).toFixed(2),
        `"${o.payment_mode || ""}"`,
        Number(o.weight || 0).toFixed(2),
        `"${(o.remark || "").replace(/"/g, '""')}"`,
        `"${o.status || "Booked"}"`,
        `"${new Date(o.created_at).toLocaleString()}"`,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n",
    );
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
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPickupCity = (order) => {
    return (
      order?.pickup_city ||
      order?.warehouse_city ||
      order?.from_city ||
      defaultWarehouse?.city ||
      "Jaipur"
    );
  };

  const getPickupPincode = (order) => {
    return (
      order?.pickup_pincode ||
      order?.warehouse_pincode ||
      order?.from_pincode ||
      defaultWarehouse?.pincode ||
      "302012"
    );
  };

  const getChargeValue = (order) => {
    if (
      order?.shipping_charge !== null &&
      order?.shipping_charge !== undefined &&
      order?.shipping_charge !== ""
    ) {
      return Number(order.shipping_charge || 0);
    }
    return Number(order?.amount || 0);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] dark:bg-[#090b10] p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
      {/* ==================================================
          PAGE HEADER (MATCHES ALL ORDERS & MANIFESTED)
      ================================================== */}
      <div className="mb-3 rounded-2xl border border-slate-200 dark:border-[#1f2535] bg-white dark:bg-[#121620] px-4 sm:px-5 py-3.5 sm:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "#edf8ff",
                color: PRIMARY,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" />
                <path d="M3 8.5 12 13l9-4.5" />
                <path d="M12 13v7" />
              </svg>
            </div>

            <div>
              <h1 className="text-base sm:text-[17px] font-semibold tracking-[-0.2px] text-slate-900 dark:text-white">
                Offline Orders
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                {totalOrders} {totalOrders === 1 ? "shipment" : "shipments"}{" "}
                recorded with manual carriers
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/create-offline-order"
              className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#008dd2] px-3.5 text-xs font-semibold text-white transition hover:bg-[#007dbb] active:scale-95 shadow-xs"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span>Create Offline Order</span>
            </Link>

            <button
              type="button"
              onClick={handleExport}
              disabled={orders.length === 0}
              className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl bg-[#10b981] px-3.5 text-xs font-semibold text-white transition hover:bg-[#059669] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-xs"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          FILTER BAR (RESPONSIVE DOCK)
      ================================================== */}
      <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)] space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* SEARCH */}
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Consignment No, Customer, Mobile, Product..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-24 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
            />
            {isFetching && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                Updating…
              </span>
            )}
          </div>

          {/* FILTER DROPDOWNS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 sm:flex sm:items-center gap-1.5 sm:gap-2">
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="h-10 w-full sm:min-w-[130px] max-w-[180px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2] truncate"
              title="Filter by Party Reference Name"
            >
              <option value="ALL">All Party</option>
              {partyIdentities.map((party) => (
                <option key={party.id} value={party.id}>
                  {party.reference_name || party.name}
                </option>
              ))}
            </select>

            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="h-10 w-full sm:min-w-[125px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Carriers</option>
              {CARRIER_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="h-10 w-full sm:min-w-[105px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-[#008dd2]"
            >
              <option value="ALL">All Pay</option>
              <option value="Prepaid">Prepaid</option>
              <option value="COD">COD</option>
            </select>

            <button
              type="button"
              onClick={fetchOrders}
              title="Refresh"
              className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 11a8 8 0 0 0-14.9-4" />
                <path d="M4 4v4h4" />
                <path d="M4 13a8 8 0 0 0 14.9 4" />
                <path d="M20 20v-4h-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE SELECT ALL BAR */}
        {orders.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-2 sm:hidden">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <button
                type="button"
                onClick={handleSelectAll}
                className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                  allVisibleSelected
                    ? "border-[#008dd2] bg-[#008dd2] text-white"
                    : "border-slate-300 bg-white text-transparent"
                }`}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </button>
              <span>Select All ({orders.length})</span>
            </label>

            <button
              type="button"
              onClick={fetchOrders}
              className="flex items-center gap-1 text-xs font-bold text-[#008dd2]"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 11a8 8 0 0 0-14.9-4" />
                <path d="M4 4v4h4" />
                <path d="M4 13a8 8 0 0 0 14.9 4" />
                <path d="M20 20v-4h-4" />
              </svg>
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* ORDER STATUS TABS */}
      <OrderStatusNavTabs />

      {/* ==================================================
          TABLE / LIST VIEW
      ================================================== */}
      {loading ? (
        <>
          <CardSkeleton count={3} />
          <div className="hidden sm:block">
            <TableSkeleton rows={6} />
          </div>
        </>
      ) : orders.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#008dd2] mb-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="m9 8 3 3-3 3" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-700">
            No offline orders found
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            {debouncedSearch ||
            carrierFilter !== "ALL" ||
            paymentFilter !== "ALL" ||
            partyFilter !== "ALL"
              ? "Try adjusting your search or filters."
              : "Record manual courier shipments (Mark Express, Tirupati, DTDC, etc.) to keep track of them here."}
          </p>
          <Link
            to="/create-offline-order"
            className="mt-4 inline-flex items-center rounded-xl bg-[#008dd2] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#007ab6] transition"
          >
            + Create First Offline Order
          </Link>
        </div>
      ) : (
        <>
          {/* ==================================================
              1. DESKTOP / TABLET STRUCTURED TABLE (MATCHING ALL ORDERS)
          ================================================== */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div
              className="orders-scrollbar max-h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e1 transparent",
              }}
            >
              <table className="w-full table-fixed border-collapse">
                <thead className="sticky top-0 z-20 bg-white">
                  <tr className="border-b border-slate-200 bg-white">
                    <th className="sticky top-0 z-20 w-[3%] bg-white px-2 py-3 text-left">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                          allVisibleSelected
                            ? "border-[#008dd2] bg-[#008dd2] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                      </button>
                    </th>

                    <th className="sticky top-0 z-20 w-[7%] bg-white px-1.5 py-3 text-left text-[12px] font-medium text-slate-700">
                      Party
                    </th>

                    <th className="sticky top-0 z-20 w-[16%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                      Customer
                    </th>

                    <th className="sticky top-0 z-20 w-[15%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                      Shipment
                    </th>

                    <th className="sticky top-0 z-20 w-[15%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                      Center
                    </th>

                    <th className="sticky top-0 z-20 w-[9%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                      Payment
                    </th>

                    <th className="sticky top-0 z-20 w-[8%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                      Weight
                    </th>

                    <th className="sticky top-0 z-20 w-[10%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                      Remark
                    </th>

                    <th className="sticky top-0 z-20 w-[9%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                      Created
                    </th>

                    <th className="sticky top-0 z-20 w-[8%] bg-white px-2 py-3 text-left text-[12px] font-medium text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((o) => {
                    const isSelected = selectedIds.includes(o.id);
                    const charge = getChargeValue(o);
                    const payment = String(o.payment_mode || "PREPAID").toUpperCase();
                    const status = String(o.status || "BOOKED").toUpperCase();
                    const volWeight =
                      o.length && o.width && o.height
                        ? (Number(o.length) * Number(o.width) * Number(o.height)) / 5000
                        : Number(o.weight || 0);

                    return (
                      <tr
                        key={o.id}
                        className={`border-b border-slate-100 transition last:border-b-0 ${
                          isSelected ? "bg-[#f8fcff]" : "bg-white"
                        } hover:bg-slate-50`}
                      >
                        {/* CHECKBOX */}
                        <td className="px-2 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleSelect(o.id)}
                            className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border transition ${
                              isSelected
                                ? "border-[#008dd2] bg-[#008dd2] text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="m5 12 4 4L19 6" />
                            </svg>
                          </button>
                        </td>

                        {/* PARTY */}
                        <td className="px-1.5 py-2.5 break-words">
                          <div className="min-w-0">
                            {o.party_reference_name || o.party_name ? (
                              <span
                                className="inline-block max-w-full truncate rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700"
                                title={
                                  o.party_reference_name && o.party_name
                                    ? `${o.party_reference_name} — ${o.party_name}`
                                    : o.party_reference_name || o.party_name
                                }
                              >
                                {o.party_reference_name || o.party_name}
                              </span>
                            ) : (
                              <span className="text-[12px] text-slate-400 font-normal">
                                —
                              </span>
                            )}
                          </div>
                        </td>

                        {/* CUSTOMER & STATUS BADGE */}
                        <td className="px-2 py-2.5 break-words">
                          <div className="min-w-0">
                            <p
                              className="truncate text-[13px] font-semibold text-slate-800"
                              title={o.consignee_name}
                            >
                              {o.consignee_name}
                            </p>

                            {o.mobile && (
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                {o.mobile}
                              </p>
                            )}

                            <div className="mt-0.5 -ml-0.5">
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                                {status}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* SHIPMENT (CONSIGNMENT NO + CARRIER + PRODUCT/MODE) */}
                        <td className="px-2 py-2.5 break-words">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p
                                className="truncate text-[13px] font-semibold text-slate-800"
                                title={o.consignment_no}
                              >
                                {o.consignment_no}
                              </p>

                              {o.consignment_no && (
                                <button
                                  type="button"
                                  onClick={async (event) => {
                                    event.stopPropagation();
                                    try {
                                      await navigator.clipboard.writeText(
                                        String(o.consignment_no),
                                      );
                                      toast.success("Consignment No copied");
                                    } catch {
                                      toast.error("Unable to copy");
                                    }
                                  }}
                                  title="Copy Consignment No"
                                  className="shrink-0 p-0.5 text-slate-400 hover:text-slate-700 transition"
                                >
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect
                                      x="9"
                                      y="9"
                                      width="13"
                                      height="13"
                                      rx="2"
                                      ry="2"
                                    />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            <p className="mt-0.5 text-[11px] text-slate-500 font-medium truncate">
                              {o.carrier}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                              {o.product_name ? `${o.product_name} - ` : ""}
                              {o.shipping_mode || "Surface"}
                            </p>
                          </div>
                        </td>

                        {/* ROUTE (CONNECTED 2-STOP TIMELINE MATCHING ALL ORDERS) */}
                        <td className="px-2 py-2.5">
                          <div className="flex flex-col gap-0">
                            {/* Pickup */}
                            <div className="flex min-w-0 items-center gap-1.5">
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#008dd2"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="shrink-0"
                              >
                                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                                <circle cx="12" cy="10" r="2.5" />
                              </svg>

                              <p className="truncate text-[12px] font-medium text-slate-700">
                                {getPickupCity(o)}
                                {getPickupPincode(o) && (
                                  <span className="ml-1 text-[10px] text-slate-400">
                                    ({getPickupPincode(o)})
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* Route connector */}
                            <div className="ml-[5px] flex h-2.5 flex-col justify-between">
                              <span className="h-1 border-l border-dashed border-slate-300" />
                              <span className="h-1 border-l border-dashed border-slate-300" />
                            </div>

                            {/* Delivery */}
                            <div className="flex min-w-0 items-center gap-1.5">
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#94a3b8"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="shrink-0"
                              >
                                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                                <circle cx="12" cy="10" r="2.5" />
                              </svg>

                              <p className="truncate text-[12px] font-medium text-slate-700">
                                {o.city || "—"}
                                {o.pincode && (
                                  <span className="ml-1 text-[10px] text-slate-400">
                                    ({o.pincode})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* PAYMENT */}
                        <td className="px-2 py-2.5 break-words">
                          <div>
                            <p
                              className={`text-[12px] font-semibold ${
                                payment === "COD"
                                  ? "text-amber-600"
                                  : "text-[#008dd2]"
                              }`}
                            >
                              {payment}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {payment === "COD"
                                ? "Cash on Delivery"
                                : "Prepaid"}
                            </p>

                            <p className="text-[10px] text-slate-400">
                              Charge: ₹{charge.toFixed(2)}
                            </p>
                          </div>
                        </td>

                        {/* WEIGHT */}
                        <td className="px-2 py-2.5 break-words">
                          <div>
                            <p className="text-[12px] font-semibold text-slate-700">
                              {o.package_type || "Box"}: 1
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              Wt: {Number(o.weight || 0).toFixed(2)} kg
                            </p>

                            <p className="text-[10px] text-slate-400">
                              Vol: {volWeight.toFixed(2)} kg
                            </p>
                          </div>
                        </td>

                        {/* REMARK (DEDICATED COLUMN) */}
                        <td className="px-2 py-2.5 break-words">
                          {o.remark ? (
                            <p
                              className="text-[12px] font-normal text-slate-800 break-words whitespace-normal leading-snug"
                              title={o.remark}
                            >
                              {o.remark}
                            </p>
                          ) : (
                            <span className="text-[12px] text-slate-300 font-normal">
                              —
                            </span>
                          )}
                        </td>

                        {/* CREATED */}
                        <td className="px-2 py-2.5 break-words">
                          <p className="text-[12px] font-medium text-slate-700">
                            #{o.id}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            Created: {formatDate(o.created_at)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatTime(o.created_at)}
                          </p>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-2 py-2.5">
                          <div className="flex items-center justify-start gap-1">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleEdit(o)}
                              title="Edit Offline Order"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#008dd2] bg-[#008dd2] text-white transition hover:bg-[#007dbb] active:scale-95 cursor-pointer shadow-2xs"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDelete(o.id)}
                              title="Delete Offline Order"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 active:scale-95 cursor-pointer shadow-2xs"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==================================================
              2. MOBILE VIEW: APP-STYLE CARD TILES (MATCHING ALL ORDERS)
          ================================================== */}
          <div className="space-y-3 sm:hidden">
            {orders.map((o) => {
              const isSelected = selectedIds.includes(o.id);
              const charge = getChargeValue(o);
              const payment = String(o.payment_mode || "PREPAID").toUpperCase();
              const status = String(o.status || "BOOKED").toUpperCase();

              return (
                <div
                  key={o.id}
                  className={`rounded-2xl border bg-white p-3.5 shadow-xs space-y-2.5 transition ${
                    isSelected
                      ? "border-[#008dd2] ring-2 ring-[#008dd2]/10"
                      : "border-slate-200/80"
                  }`}
                >
                  {/* CARD HEADER */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelect(o.id)}
                        className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                          isSelected
                            ? "border-[#008dd2] bg-[#008dd2] text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                      </button>

                      <span className="font-mono text-xs font-bold text-slate-800">
                        #{o.id}
                      </span>

                      <span className="rounded bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-bold text-[#008dd2]">
                        {o.carrier}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          payment === "COD"
                            ? "border-amber-100 bg-amber-50 text-amber-600"
                            : "border-sky-100 bg-sky-50 text-[#008dd2]"
                        }`}
                      >
                        {payment}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                        {status}
                      </span>
                    </div>
                  </div>

                  {/* CUSTOMER & PHONE */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 truncate">
                        {o.consignee_name}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {o.mobile}
                      </span>
                    </div>

                    {(o.party_reference_name || o.party_name) && (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Party:</span>
                        <span className="rounded bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-100">
                          {o.party_reference_name || o.party_name}
                        </span>
                      </div>
                    )}

                    {/* CONSIGNMENT BAR */}
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 bg-slate-50/70 px-2 py-1.5 rounded-lg border border-slate-100">
                      <span className="truncate font-semibold select-none">
                        Consignment: {o.consignment_no}
                      </span>

                      {o.consignment_no && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                String(o.consignment_no),
                              );
                              toast.success("Consignment No copied");
                            } catch {
                              toast.error("Unable to copy");
                            }
                          }}
                          className="text-slate-400 hover:text-slate-700 flex items-center p-0.5"
                          title="Copy Consignment No"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="9"
                              y="9"
                              width="10"
                              height="10"
                              rx="2"
                            />
                            <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* ROUTE */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span className="truncate max-w-[130px]">
                        {getPickupCity(o)} ({getPickupPincode(o)})
                      </span>
                      <span className="text-slate-400 font-bold px-1">→</span>
                      <span className="truncate max-w-[130px] text-right">
                        {o.city || "—"} ({o.pincode || "—"})
                      </span>
                    </div>

                    {/* SPECS & CHARGE */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 pt-1.5">
                      <span>
                        {o.package_type || "Box"} • {o.shipping_mode || "Surface"} • {Number(o.weight || 0).toFixed(2)} Kg
                      </span>
                      <span className="font-semibold text-slate-600">
                        Charge: ₹{charge.toFixed(2)}
                      </span>
                    </div>

                    {/* REMARK IN MOBILE CARD */}
                    {o.remark && (
                      <div className="flex items-start gap-1.5 rounded-lg bg-slate-50 border border-slate-200/80 p-2 text-[11px] text-slate-800">
                        <span className="font-semibold text-slate-600 shrink-0">
                          Remark:
                        </span>
                        <span className="break-words whitespace-normal text-slate-800">{o.remark}</span>
                      </div>
                    )}
                  </div>

                  {/* CARD ACTIONS */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                    <span className="text-[10px] text-slate-400">
                      {formatDate(o.created_at)} {formatTime(o.created_at)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEdit(o)}
                        className="flex h-8 items-center gap-1 rounded-lg bg-[#008dd2] px-3 text-xs font-bold text-white shadow-xs active:scale-95"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(o.id)}
                        className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ==================================================
              PAGINATION
          ================================================== */}
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT OFFLINE ORDER MODAL */}
      <OfflineOrderModal
        isOpen={showCreateModal}
        orderToEdit={editingOrder}
        onClose={() => {
          setShowCreateModal(false);
          setEditingOrder(null);
        }}
        onSuccess={() => {
          fetchOrders();
          setEditingOrder(null);
        }}
      />
    </div>
  );
}
