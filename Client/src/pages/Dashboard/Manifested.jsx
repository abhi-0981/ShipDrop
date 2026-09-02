import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";

const PRIMARY = "#0788ca";
const PRIMARY_DARK = "#0579b1";

const Icon = ({ name, size = 15 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "check") return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
  if (name === "printer") return <svg {...common}><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /><path d="M18 12h.01" /></svg>;
  if (name === "download") return <svg {...common}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>;
  if (name === "upload") return <svg {...common}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></svg>;
  if (name === "x") return <svg {...common}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
  if (name === "eye") return <svg {...common}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>;
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
  if (name === "refresh") return <svg {...common}><path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" /><path d="M3 5v5h5" /><path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" /><path d="M21 19v-5h-5" /></svg>;
  if (name === "box") return <svg {...common}><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v9l9 5 9-5V8" /><path d="M12 13v9" /></svg>;
  if (name === "location") return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (name === "file") return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h6" /></svg>;
  return null;
};

const getUserId = () => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    const user = JSON.parse(raw);
    return user?.id || user?.user_id || user?.userId || null;
  } catch {
    return null;
  }
};

const text = (value, fallback = "—") => {
  if (value === null || value === undefined || String(value).trim() === "") return fallback;
  return String(value);
};

const getAWB = (order) => text(order.awb || order.waybill, "AWB unavailable");
const getOrderId = (order) => text(order.order_id || order.orderId || order.order_number, text(order.id));
const getCustomerName = (order) => text(order.consignee_name || order.customer_name || order.name);
const getMobile = (order) => text(order.mobile || order.phone || order.customer_mobile, "");
const getShipmentName = (order) => text(order.product_name || order.products?.[0]?.product_name || order.shipment, "Shipment");
const getPickupId = (order) => text(order.pickup_id || order.pickup_request_id, "—");
const getPickupCity = (order) => text(order.pickup_city || order.pickupCity || order.origin_city, "Pickup");
const getPickupPincode = (order) => text(order.pickup_pincode || order.pickupPincode || order.origin_pincode, "");
const getDeliveryCity = (order) => text(order.city || order.delivery_city || order.destination_city, "Delivery");
const getDeliveryPincode = (order) => text(order.pincode || order.delivery_pincode || order.destination_pincode, "");
const getServiceType = (order) => String(order.service_type || order.serviceType || "ROAD").toUpperCase();
const getPaymentType = (order) => String(order.payment_type || order.paymentType || "PREPAID").toUpperCase();
const getWeight = (order) => Number(order.total_weight ?? order.weight ?? order.package_weight ?? order.packages?.reduce((t, p) => t + (Number(p.weight) || 0) * (Number(p.package_count) || 1), 0) ?? 0) || 0;
const getDistance = (order) => Number(order.distance_km ?? order.distance ?? 0) || 0;
const getCreatedAt = (order) => order.manifest_created_at || order.created_at || order.manifestCreatedAt || order.createdAt || null;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const getSelectedKey = (order) => order.manifest_id || order.id;

function Manifested() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [viewingOrder, setViewingOrder] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchManifestedOrders = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error("User session not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("/manifests", { params: { user_id: userId } });
      const data = response.data;
      if (!data?.success) throw new Error(data?.message || "Unable to fetch manifested orders");
      setOrders(Array.isArray(data.manifests) ? data.manifests : []);
      setSelectedIds([]);
    } catch (error) {
      console.error("Manifest fetch error:", error);
      toast.error(error.response?.data?.message || error.message || "Unable to load manifested orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifestedOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const searchable = [
        getCustomerName(order),
        getMobile(order),
        getAWB(order),
        getOrderId(order),
        getShipmentName(order),
        getPickupCity(order),
        getDeliveryCity(order),
      ].join(" ").toLowerCase();

      const status = String(order.order_status || order.status || "MANIFESTED").toUpperCase();
      const payment = getPaymentType(order);
      const service = getServiceType(order);

      return (
        (!q || searchable.includes(q)) &&
        (statusFilter === "ALL" || status === statusFilter) &&
        (paymentFilter === "ALL" || payment === paymentFilter) &&
        (serviceFilter === "ALL" || service === serviceFilter)
      );
    });
  }, [orders, search, statusFilter, paymentFilter, serviceFilter]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.includes(getSelectedKey(order))),
    [orders, selectedIds]
  );

  const allVisibleSelected = filteredOrders.length > 0 && filteredOrders.every((order) => selectedIds.includes(getSelectedKey(order)));

  const toggleAll = () => {
    if (allVisibleSelected) {
      const visibleKeys = new Set(filteredOrders.map(getSelectedKey));
      setSelectedIds((prev) => prev.filter((id) => !visibleKeys.has(id)));
      return;
    }

    setSelectedIds((prev) => [
      ...new Set([...prev, ...filteredOrders.map(getSelectedKey)]),
    ]);
  };

  const toggleOne = (order) => {
    const id = getSelectedKey(order);
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const buildLabel = (order) => `
    <div style="width:420px;margin:0 auto 24px;padding:24px;border:1px solid #dbe3ef;border-radius:12px;font-family:Arial,sans-serif;color:#172033;page-break-after:always">
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid #e8edf4;padding-bottom:14px;margin-bottom:16px">
        <div><div style="font-size:18px;font-weight:700;color:${PRIMARY}">ShipDrop</div><div style="font-size:11px;color:#718096;margin-top:4px">Shipping Label</div></div>
        <div style="font-size:12px;font-weight:700">AWB ${getAWB(order)}</div>
      </div>
      <div style="font-size:10px;color:#718096;margin-bottom:5px">CONSIGNEE</div>
      <div style="font-size:15px;font-weight:700">${getCustomerName(order)}</div>
      <div style="font-size:12px;margin-top:5px;margin-bottom:16px">${getMobile(order)}</div>
      <div style="background:#f7f9fc;border-radius:8px;padding:12px">
        <div style="font-size:10px;color:#718096;margin-bottom:5px">DELIVERY ADDRESS</div>
        <div style="font-size:12px;line-height:1.5">${order.address_line1 || ""}${order.address_line2 ? ", " + order.address_line2 : ""}<br/>${getDeliveryCity(order)}, ${order.state || ""} - ${getDeliveryPincode(order)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px">
        <div style="border:1px solid #e4eaf2;border-radius:8px;padding:10px"><div style="font-size:10px;color:#718096">SERVICE</div><div style="font-size:12px;font-weight:700;margin-top:4px">${getServiceType(order) === "AIR" ? "By Air" : "By Road"}</div></div>
        <div style="border:1px solid #e4eaf2;border-radius:8px;padding:10px"><div style="font-size:10px;color:#718096">WEIGHT</div><div style="font-size:12px;font-weight:700;margin-top:4px">${getWeight(order).toFixed(2)} Kg</div></div>
      </div>
    </div>`;

  const printOrders = (list, title = "Shipping Labels", builder = buildLabel) => {
    if (!list.length) {
      toast.error("Please select at least one shipment");
      return;
    }
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      toast.error("Please allow pop-ups to print");
      return;
    }
    win.document.write(`<!doctype html><html><head><title>${title}</title></head><body style="margin:30px;background:white">${list.map(builder).join("")}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const handlePrintLabels = () => printOrders(selectedOrders, "Shipping Labels");

  const handlePrintSingle = (order) => printOrders([order], "Shipping Label");

  const handlePrintManifests = () => {
    if (!selectedOrders.length) {
      toast.error("Please select at least one shipment");
      return;
    }

    const builder = (order) => `
      <div style="font-family:Arial,sans-serif;width:760px;margin:0 auto 24px;padding:28px;border:1px solid #dbe3ef;border-radius:10px;page-break-after:always;color:#172033">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${PRIMARY};padding-bottom:14px;margin-bottom:18px">
          <div><div style="font-size:20px;font-weight:700;color:${PRIMARY}">ShipDrop</div><div style="font-size:12px;color:#718096;margin-top:4px">Shipment Manifest</div></div>
          <div style="font-size:12px;font-weight:700">AWB ${getAWB(order)}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr><td style="padding:8px;border-bottom:1px solid #edf1f6;color:#718096">Order ID</td><td style="padding:8px;border-bottom:1px solid #edf1f6;font-weight:700">#${getOrderId(order)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #edf1f6;color:#718096">Customer</td><td style="padding:8px;border-bottom:1px solid #edf1f6;font-weight:700">${getCustomerName(order)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #edf1f6;color:#718096">Route</td><td style="padding:8px;border-bottom:1px solid #edf1f6">${getPickupCity(order)} (${getPickupPincode(order)}) → ${getDeliveryCity(order)} (${getDeliveryPincode(order)})</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #edf1f6;color:#718096">Payment</td><td style="padding:8px;border-bottom:1px solid #edf1f6">${getPaymentType(order)}</td></tr>
          <tr><td style="padding:8px;color:#718096">Weight</td><td style="padding:8px;font-weight:700">${getWeight(order).toFixed(2)} Kg</td></tr>
        </table>
      </div>`;

    printOrders(selectedOrders, "Shipment Manifests", builder);
  };

  // ====================================================
  // CANCEL CONFIRMATION
  // ====================================================

  const openCancelConfirmation = () => {
    if (!selectedOrders.length) {
      toast.error("Please select at least one shipment");
      return;
    }

    setShowCancelConfirm(true);
  };


  // ====================================================
  // CANCEL SHIPMENTS
  // ====================================================

  const handleCancel = async () => {
    setShowCancelConfirm(false);

    const userId = getUserId();

    if (!userId) {
      toast.error("User session not found");
      return;
    }

    try {
      setActionLoading(true);

      const orderIds = selectedOrders
        .map((order) =>
          Number(order.order_id || order.id)
        )
        .filter(Boolean);

      const response = await api.post(
        "/manifests/cancel",
        {
          user_id: userId,
          order_ids: orderIds,
        }
      );

      const data = response.data;

      if (!data?.success) {
        throw new Error(
          data?.message ||
          "Unable to cancel shipments"
        );
      }


      // ====================================================
      // UPDATE TOP NAVBAR WALLET WITHOUT PAGE REFRESH
      // ====================================================

      const walletBalance = Number(
        data.wallet_balance ??
        data.balance ??
        data.new_balance
      );

      if (Number.isFinite(walletBalance)) {
        window.dispatchEvent(
          new CustomEvent("walletUpdated", {
            detail: {
              balance: walletBalance,
            },
          })
        );
      } else {
        // Fallback: still tell navbar to reload wallet
        window.dispatchEvent(
          new Event("walletUpdated")
        );
      }


      // ====================================================
      // REFUND MESSAGE
      // ====================================================

      const refundAmount = Number(
        data.refund_amount ??
        data.refunded_amount ??
        data.refund ??
        0
      );

      if (refundAmount > 0) {
        toast.success(
          `${orderIds.length === 1 ? "Shipment" : "Shipments"} cancelled successfully. ₹${refundAmount.toFixed(
            2
          )} has been refunded to your wallet.`,
          {
            duration: 4500,
          }
        );
      } else {
        toast.success(
          data.message ||
          `${orderIds.length === 1 ? "Shipment" : "Shipments"} cancelled successfully`,
          {
            duration: 4000,
          }
        );
      }

      await fetchManifestedOrders();

    } catch (error) {
      console.error(
        "Cancel manifest error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to cancel shipments"
      );

    } finally {
      setActionLoading(false);
    }
  };


  const handleExport = () => {
    if (!orders.length) {
      toast.error("No manifested orders to export");
      return;
    }

    const exportOrders = selectedOrders.length ? selectedOrders : orders;
    const headers = ["AWB", "Order ID", "Customer", "Mobile", "Pickup ID", "Shipment", "Service Type", "From", "To", "Payment", "Weight (Kg)", "Shipping Charge", "Created", "Status"];
    const rows = exportOrders.map((order) => [
      getAWB(order), getOrderId(order), getCustomerName(order), getMobile(order), getPickupId(order), getShipmentName(order), getServiceType(order), getPickupCity(order), getDeliveryCity(order), getPaymentType(order), getWeight(order).toFixed(2), Number(order.shipping_charge || 0).toFixed(2), getCreatedAt(order) || "", order.order_status || order.status || "MANIFESTED",
    ]);

    const escapeCsv = (value) => {
      const s = String(value ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shipdrop-manifest-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`${exportOrders.length} ${exportOrders.length === 1 ? "shipment" : "shipments"} exported`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] px-4 py-4">
        <div className="mx-auto max-w-[1450px]">
          <div className="mb-3 h-[74px] animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="mb-3 h-[54px] animate-pulse rounded-xl border border-slate-200 bg-white" />
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="h-14 animate-pulse bg-slate-50" />
            {[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-[102px] animate-pulse border-t border-slate-100" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] px-4 py-4">
      <div className="mx-auto max-w-[1450px]">
        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf8ff]" style={{ color: PRIMARY }}>
                <Icon name="box" size={20} />
              </div>
              <div>
                <h1 className="text-[17px] font-semibold tracking-[-0.2px] text-slate-900">Manifested Shipments</h1>
                <p className="mt-0.5 text-[12px] text-slate-400">{orders.length} {orders.length === 1 ? "shipment" : "shipments"} ready for pickup</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handlePrintLabels} disabled={actionLoading || !selectedOrders.length} className="inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-[12px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-45" style={{ background: PRIMARY }}>
                <Icon name="printer" /> Print Shipping Label
              </button>
              <button type="button" onClick={handlePrintManifests} disabled={actionLoading || !selectedOrders.length} className="inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-[12px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-45" style={{ background: PRIMARY }}>
                <Icon name="file" /> Manifests
              </button>
              <button type="button" onClick={openCancelConfirmation} disabled={actionLoading || !selectedOrders.length} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#ef4444] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:opacity-45">
                <Icon name="x" /> Cancel
              </button>
              <button type="button" onClick={handleExport} disabled={!orders.length} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#10b981] px-3.5 text-[12px] font-medium text-white transition hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-45">
                <Icon name="upload" /> Export
              </button>
            </div>
          </div>
        </div>

        <div className="mb-3 rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[280px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" size={15} /></span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, AWB, Order ID or mobile..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] text-slate-700 outline-none transition focus:border-[#0788ca] focus:bg-white" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none">
              <option value="ALL">All Status</option><option value="MANIFESTED">Manifested</option><option value="IN TRANSIT">In Transit</option><option value="PENDING">Pending</option>
            </select>
            <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none">
              <option value="ALL">All Services</option><option value="ROAD">Road</option><option value="AIR">Air</option>
            </select>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] text-slate-600 outline-none">
              <option value="ALL">All Payment</option><option value="PREPAID">Prepaid</option><option value="COD">COD</option>
            </select>
            <button type="button" onClick={fetchManifestedOrders} disabled={loading} title="Refresh" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><Icon name="refresh" size={15} /></button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-white">
                  <th className="w-[52px] px-4 py-3.5 text-left">
                    <button type="button" onClick={toggleAll} className="flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border" style={allVisibleSelected ? { borderColor: PRIMARY, background: PRIMARY, color: "white" } : { borderColor: "#cbd5e1", background: "white", color: "transparent" }}><Icon name="check" size={11} /></button>
                  </th>
                  <th className="w-[190px] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">Customer</th>
                  <th className="w-[175px] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">Shipment</th>
                  <th className="w-[165px] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">Route</th>
                  <th className="w-[150px] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">Payment</th>
                  <th className="w-[135px] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">Weight</th>
                  <th className="w-[155px] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">Created</th>
                  <th className="w-[105px] px-3 py-3.5 text-left text-[13px] font-medium text-slate-700">Actions</th>
                </tr>
              </thead>

              <tbody>
                {!filteredOrders.length ? (
                  <tr><td colSpan="8" className="px-6 py-16 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Icon name="box" size={21} /></div>
                      <h3 className="text-[14px] font-semibold text-slate-800">{orders.length ? "No matching shipments" : "No manifested shipments"}</h3>
                      <p className="mt-1 text-[12px] text-slate-400">{orders.length ? "Try changing the search or filters." : "Orders will appear here after successful shipment confirmation."}</p>
                    </div>
                  </td></tr>
                ) : filteredOrders.map((order) => {
                  const key = getSelectedKey(order);
                  const selected = selectedIds.includes(key);
                  const service = getServiceType(order);
                  const payment = getPaymentType(order);
                  const created = getCreatedAt(order);

                  return (
                    <tr key={key} className={`border-b border-slate-100 last:border-b-0 ${selected ? "bg-[#f7fcff]" : "bg-white hover:bg-[#fcfdff]"}`}>
                      <td className="px-4 py-4 align-middle">
                        <button type="button" onClick={() => toggleOne(order)} className="flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border" style={selected ? { borderColor: PRIMARY, background: PRIMARY, color: "white" } : { borderColor: "#cbd5e1", background: "white", color: "transparent" }}><Icon name="check" size={11} /></button>
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <div className="min-w-[160px]">
                          <div className="text-[13px] font-medium leading-5 text-slate-800">{getCustomerName(order)}</div>
                          {getMobile(order) && <div className="text-[11px] leading-4 text-slate-400">{getMobile(order)}</div>}
                          <span className="mt-1.5 inline-flex rounded-full bg-[#edf8ff] px-2.5 py-1 text-[10px] font-medium leading-none" style={{ color: PRIMARY }}>{String(order.order_status || order.status || "MANIFESTED")}</span>
                        </div>
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <div className="min-w-[145px]">
                          <div className="text-[13px] font-semibold leading-5 text-slate-800">{getAWB(order)}</div>
                          <div className="text-[11px] leading-4 text-slate-500">Pickup ID: {getPickupId(order)}</div>
                          <div className="text-[11px] leading-4 text-slate-500">{getShipmentName(order)} · {service === "AIR" ? "Air" : "Road"}</div>
                        </div>
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <div className="min-w-[145px]">
                          <div className="flex items-center gap-2"><span className="mt-[1px]" style={{ color: PRIMARY }}><Icon name="location" size={12} /></span><div className="text-[12px] font-medium leading-4 text-slate-700">{getPickupCity(order)} <span className="font-normal text-slate-400">({getPickupPincode(order)})</span></div></div>
                          <div className="ml-[5px] h-2 border-l border-dashed border-slate-300" />
                          <div className="flex items-center gap-2"><span className="mt-[1px] text-slate-400"><Icon name="location" size={12} /></span><div className="text-[12px] font-medium leading-4 text-slate-700">{getDeliveryCity(order)} <span className="font-normal text-slate-400">({getDeliveryPincode(order)})</span></div></div>
                        </div>
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <div className="text-[12px] font-semibold" style={{ color: payment === "COD" ? "#dc2626" : PRIMARY }}>{payment}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400">{payment === "COD" ? "Cash on Delivery" : "Prepaid"}</div>
                        <div className="text-[10px] text-slate-500">Total: ₹{Number(order.shipping_charge || 0).toFixed(2)}</div>
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <div className="text-[12px] font-medium text-slate-700">Box: {Number(order.packages?.reduce((t, p) => t + (Number(p.package_count) || 1), 0) || 1)}</div>
                        <div className="text-[10px] text-slate-500">Wt: {getWeight(order).toFixed(2)} kg</div>
                        <div className="text-[10px] text-slate-400">Dist: {getDistance(order).toFixed(0)} km</div>
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <div className="text-[11px] font-medium text-slate-700">#{getOrderId(order)}</div>
                        <div className="text-[10px] leading-4 text-slate-400">Manifested: {formatDate(created)}</div>
                        <div className="text-[10px] leading-4 text-slate-400">{formatTime(created)}</div>
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => handlePrintSingle(order)} title="Print Shipping Label" className="flex h-8 w-8 items-center justify-center rounded-md text-white transition hover:opacity-90" style={{ background: PRIMARY }}><Icon name="download" size={14} /></button>
                          <button type="button" onClick={() => setViewingOrder(order)} title="View Shipment" className="flex h-8 w-8 items-center justify-center rounded-md border bg-white transition hover:bg-[#f3faff]" style={{ borderColor: PRIMARY, color: PRIMARY }}><Icon name="eye" size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex min-h-[45px] items-center justify-between border-t border-slate-100 bg-[#fcfdff] px-5">
            <div className="text-[11px] text-slate-400">Showing <span className="font-medium text-slate-600">{filteredOrders.length}</span> of <span className="font-medium text-slate-600">{orders.length}</span> manifested shipments</div>
            {selectedIds.length > 0 && <div className="text-[11px] text-slate-400"><span className="font-semibold" style={{ color: PRIMARY }}>{selectedIds.length}</span> selected</div>}
          </div>
        </div>
      </div>

      {/* ====================================================
          PREMIUM CANCEL CONFIRMATION MODAL
          ==================================================== */}

      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !actionLoading) {
              setShowCancelConfirm(false);
            }
          }}
        >
          <div className="w-full max-w-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="px-6 pb-5 pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <Icon name="x" size={20} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-[16px] font-semibold tracking-[-0.2px] text-slate-900">
                    Cancel Shipment{selectedOrders.length === 1 ? "" : "s"}
                  </h2>

                  <p className="mt-1.5 text-[12px] leading-5 text-slate-500">
                    Are you sure you want to cancel{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedOrders.length}{" "}
                      {selectedOrders.length === 1
                        ? "selected shipment"
                        : "selected shipments"}
                    </span>
                    ?
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-red-500">
                    <Icon name="box" size={15} />
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-red-700">
                      Cancellation & Refund
                    </p>

                    <p className="mt-0.5 text-[11px] leading-4 text-red-600/80">
                      The selected shipment{selectedOrders.length === 1 ? "" : "s"} will be cancelled.
                      Any applicable shipping charge will be refunded to your wallet.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={actionLoading}
                className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep Shipment
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-500 px-4 text-[12px] font-medium text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="x" size={14} />
                {actionLoading ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setViewingOrder(null); }}>
          <div className="w-full max-w-[650px] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div><h2 className="text-[16px] font-semibold text-slate-900">Shipment Details</h2><p className="mt-0.5 text-[11px] text-slate-400">AWB: <span className="font-semibold" style={{ color: PRIMARY }}>{getAWB(viewingOrder)}</span></p></div>
              <button type="button" onClick={() => setViewingOrder(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><Icon name="x" size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
              {[["Order ID", `#${getOrderId(viewingOrder)}`], ["Customer", getCustomerName(viewingOrder)], ["Mobile", getMobile(viewingOrder)], ["Pickup ID", getPickupId(viewingOrder)], ["Payment", getPaymentType(viewingOrder)], ["Service", getServiceType(viewingOrder) === "AIR" ? "By Air" : "By Road"], ["Weight", `${getWeight(viewingOrder).toFixed(2)} Kg`], ["Distance", `${getDistance(viewingOrder).toFixed(0)} Km`]].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div><div className="mt-1 text-[12px] font-semibold text-slate-800">{text(value)}</div></div>
              ))}
              <div className="col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Delivery Address</div><div className="mt-1 text-[12px] leading-5 text-slate-700">{[viewingOrder.address_line1, viewingOrder.address_line2, viewingOrder.city, viewingOrder.state, viewingOrder.pincode].filter(Boolean).join(", ") || "—"}</div></div>
            </div>
            <div className="flex justify-end border-t border-slate-200 px-5 py-4"><button type="button" onClick={() => setViewingOrder(null)} className="h-9 rounded-lg border border-slate-200 px-4 text-[12px] font-medium text-slate-600 hover:bg-slate-50">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Manifested;
