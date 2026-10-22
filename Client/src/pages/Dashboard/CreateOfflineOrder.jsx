import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { notifyOrderChange } from "../../services/orderEvents";

const PRIMARY = "#008dd2";

const CARRIER_OPTIONS = [
  "MARK EXPRESS",
  "TIRUPATI COURIER",
  "DTDC",
  "TRACKON COURIER",
  "SELF",
  "OTHER",
];

const PACKAGE_TYPES = [
  "Box",
  "Flyer",
  "Document",
  "Packet",
  "Carton",
  "Wooden Box",
  "Other",
];

const SHIPPING_MODES = ["Surface", "Air", "Fast Track"];

export default function CreateOfflineOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const [loading, setLoading] = useState(false);
  const [fetchingOrder, setFetchingOrder] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [partyIdentities, setPartyIdentities] = useState([]);
  const [partiesLoading, setPartiesLoading] = useState(false);
  const [customCarrier, setCustomCarrier] = useState("");

  const initialForm = {
    party_identity_id: "",
    carrier: "MARK EXPRESS",
    consignment_no: "",
    consignee_name: "",
    mobile: "",
    address: "",
    pincode: "",
    city: "",
    state: "",
    package_type: "Box",
    shipping_mode: "Surface",
    product_name: "",
    shipping_charge: "",
    length: "",
    width: "",
    height: "",
    weight: "",
    payment_mode: "Prepaid",
    remark: "",
  };

  const [formData, setFormData] = useState({ ...initialForm });

  // 1. Load Party Identities
  useEffect(() => {
    let isMounted = true;
    const loadParties = async () => {
      try {
        setPartiesLoading(true);
        const res = await api.get("/party-identities");
        if (isMounted && res?.data?.success) {
          setPartyIdentities(res.data.partyIdentities || []);
        }
      } catch (err) {
        console.error("Unable to load party identities:", err);
      } finally {
        if (isMounted) setPartiesLoading(false);
      }
    };
    loadParties();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load order if in edit mode
  useEffect(() => {
    if (!editId) {
      setFormData({ ...initialForm });
      setCustomCarrier("");
      return;
    }

    // If order was passed in navigation state
    if (location.state?.order && String(location.state.order.id) === String(editId)) {
      populateOrderData(location.state.order);
      return;
    }

    // Otherwise fetch by ID from backend
    const fetchOrder = async () => {
      try {
        setFetchingOrder(true);
        const res = await api.get(`/offline-orders/${editId}`);
        if (res?.data?.success && res.data.order) {
          populateOrderData(res.data.order);
        } else {
          toast.error("Offline order not found");
          navigate("/offline-orders");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load offline order");
        navigate("/offline-orders");
      } finally {
        setFetchingOrder(false);
      }
    };

    fetchOrder();
  }, [editId]);

  const populateOrderData = (order) => {
    const isKnownCarrier = CARRIER_OPTIONS.includes(order.carrier);
    setFormData({
      party_identity_id: order.party_identity_id ? String(order.party_identity_id) : "",
      carrier: isKnownCarrier ? order.carrier : "OTHER",
      consignment_no: order.consignment_no || "",
      consignee_name: order.consignee_name || "",
      mobile: order.mobile || "",
      address: order.address || "",
      pincode: order.pincode || "",
      city: order.city || "",
      state: order.state || "",
      package_type: order.package_type || "Box",
      shipping_mode: order.shipping_mode || "Surface",
      product_name: order.product_name || "",
      shipping_charge:
        order.shipping_charge !== null &&
        order.shipping_charge !== undefined &&
        order.shipping_charge !== ""
          ? String(order.shipping_charge)
          : order.amount !== null &&
            order.amount !== undefined &&
            order.amount !== ""
          ? String(order.amount)
          : "",
      length: order.length !== null && order.length !== undefined ? String(order.length) : "",
      width: order.width !== null && order.width !== undefined ? String(order.width) : "",
      height: order.height !== null && order.height !== undefined ? String(order.height) : "",
      weight: order.weight !== null && order.weight !== undefined ? String(order.weight) : "",
      payment_mode: order.payment_mode || "Prepaid",
      remark: order.remark || "",
    });

    if (!isKnownCarrier && order.carrier) {
      setCustomCarrier(order.carrier);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePincodeChange = async (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({
      ...prev,
      pincode: value,
      city: "",
      state: "",
    }));

    if (value.length !== 6) return;

    setPincodeLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
      if (!response.ok) throw new Error("Pincode lookup failed");

      const data = await response.json();
      if (!data?.[0]?.PostOffice?.length) throw new Error("Invalid pincode");

      const postOffice = data[0].PostOffice[0];
      setFormData((prev) => ({
        ...prev,
        pincode: value,
        city: postOffice.District || postOffice.Block || "",
        state: postOffice.State || "", 
      }));
    } catch {
      toast.error("Unable to auto-verify pincode, please enter city and state manually.");
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the form?")) {
      setFormData({ ...initialForm });
      setCustomCarrier("");
    }
  };

  const calculateVolumetricWeight = () => {
    const l = Number(formData.length) || 0;
    const w = Number(formData.width) || 0;
    const h = Number(formData.height) || 0;
    if (l > 0 && w > 0 && h > 0) {
      return ((l * w * h) / 5000).toFixed(2);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalCarrier = formData.carrier.trim();
    if (finalCarrier === "OTHER") {
      finalCarrier = customCarrier.trim();
      if (!finalCarrier) {
        return toast.error("Please enter the custom carrier name");
      }
    }

    if (!finalCarrier) {
      return toast.error("Please select or enter a carrier");
    }
    if (finalCarrier.toLowerCase() === "delivery") {
      return toast.error("Delivery carrier cannot be used for offline orders");
    }
    if (!formData.consignment_no.trim()) {
      return toast.error("Consignment / Tracking No is required");
    }
    if (!formData.consignee_name.trim()) {
      return toast.error("Customer / Consignee Name is required");
    }
    if (!/^\d{10}$/.test(formData.mobile.trim())) {
      return toast.error("Valid 10-digit mobile number is required");
    }
    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      return toast.error("Valid 6-digit pincode is required");
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      return toast.error("City and State are required");
    }

    const parsedCharge = Number(formData.shipping_charge);
    if (
      formData.shipping_charge === "" ||
      !Number.isFinite(parsedCharge) ||
      parsedCharge < 0
    ) {
      return toast.error("Valid non-negative Shipping Charge is required");
    }
    if (formData.weight === "" || Number(formData.weight) <= 0) {
      return toast.error("Weight (Kg) must be greater than 0");
    }

    setLoading(true);
    try {
      const payload = {
        party_identity_id: formData.party_identity_id
          ? Number(formData.party_identity_id)
          : null,
        carrier: finalCarrier,
        consignment_no: formData.consignment_no.trim(),
        consignee_name: formData.consignee_name.trim(),
        mobile: formData.mobile.trim(),
        address: formData.address.trim() || null,
        pincode: formData.pincode.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        package_type: formData.package_type,
        amount: parsedCharge,
        shipping_mode: formData.shipping_mode,
        product_name: formData.product_name.trim() || null,
        shipping_charge: parsedCharge,
        length: Number(formData.length) || 0,
        width: Number(formData.width) || 0,
        height: Number(formData.height) || 0,
        weight: Number(formData.weight),
        payment_mode: formData.payment_mode,
        remark: formData.remark.trim() || null,
      };

      if (isEditMode) {
        const response = await api.put(`/offline-orders/${editId}`, payload);
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Failed to update offline order");
        }
        toast.success("Offline Order updated successfully!");
        notifyOrderChange();
        window.dispatchEvent(new Event("offlineOrdersUpdated"));
        navigate("/offline-orders");
      } else {
        const response = await api.post("/offline-orders/create", payload);
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Failed to create offline order");
        }
        toast.success("Offline Order created successfully!");
        notifyOrderChange();
        window.dispatchEvent(new Event("offlineOrdersUpdated"));

        // Reset form & stay on page, smoothly scroll to top
        setFormData({ ...initialForm });
        setCustomCarrier("");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to save offline order"
      );
    } finally {
      setLoading(false);
    }
  };

  const volWeight = calculateVolumetricWeight();

  const inputClass =
    "h-10.5 sm:h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10";

  const labelClass =
    "block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5";

  if (fetchingOrder) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-slate-200 border-t-[#008dd2]" />
        <span className="mt-3 text-xs text-slate-400 font-medium">
          Loading order details...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 sm:p-5 lg:p-6 space-y-4">
      {/* ==================================================
          PAGE HEADER
      ================================================== */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-2xs"
              style={{
                background: "#edf8ff",
                color: PRIMARY,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  {isEditMode ? `Edit Offline Order #${editId}` : "Create Offline Order"}
                </h1>
                <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#008dd2] border border-sky-200/60 uppercase">
                  Offline Carrier
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Record Offline shipments (Mark Express, Tirupati, DTDC, Trackon, Self, etc.)
              </p>
            </div>
          </div>

          {/* TOP ACTIONS */}
          <div className="flex items-center gap-2">
            <Link
              to="/offline-orders"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 shadow-xs"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>View All Offline Orders</span>
            </Link>

            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 shadow-xs cursor-pointer"
            >
              Reset Form
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          MAIN FORM (CONSOLIDATED INTO 2 STREAMLINED SECTIONS)
      ================================================== */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* CARD 1: SHIPMENT & RECIPIENT DETAILS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 md:p-7 shadow-[0_1px_4px_rgba(15,23,42,0.03)] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
                1
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Shipment & Delivery Details
                </h2>
                <p className="text-[11px] text-slate-400">
                  Offline courier partner, consignment tracking number, and customer delivery address.
                </p>
              </div>
            </div>

            <Link
              to="/settings/party-identities"
              className="hidden sm:inline-block text-[11px] font-bold text-[#008dd2] hover:underline"
            >
              + Manage Parties
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* COURIER / CARRIER */}
            <div>
              <label className={labelClass}>
                Courier Partner <span className="text-rose-500">*</span>
              </label>
              <select
                name="carrier"
                value={formData.carrier}
                onChange={handleChange}
                className={inputClass}
                required
              >
                {CARRIER_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* CUSTOM CARRIER INPUT (IF OTHER) */}
            {formData.carrier === "OTHER" ? (
              <div>
                <label className={labelClass}>
                  Carrier Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={customCarrier}
                  onChange={(e) => setCustomCarrier(e.target.value)}
                  placeholder="e.g. Maruti, Speed Post"
                  className={inputClass}
                  required
                />
              </div>
            ) : null}

            {/* CONSIGNMENT NUMBER */}
            <div>
              <label className={labelClass}>
                AWB No <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="consignment_no"
                value={formData.consignment_no}
                onChange={handleChange}
                placeholder="AWB"
                className={`${inputClass} font-mono`}
                required
              />
            </div>

            {/* SHIPPING MODE */}
            <div>
              <label className={labelClass}>Shipping Mode</label>
              <div className="grid grid-cols-3 gap-1 h-10.5 sm:h-11 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60">
                {SHIPPING_MODES.map((mode) => {
                  const isSelected = formData.shipping_mode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, shipping_mode: mode }))
                      }
                      className={`rounded-lg text-[11px] font-bold transition flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "bg-white text-[#008dd2] shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PARTY IDENTITY */}
            <div>
              <label className={labelClass}>Client</label>
              <select
                name="party_identity_id"
                value={formData.party_identity_id}
                onChange={handleChange}
                disabled={partiesLoading}
                className={inputClass}
              >
                <option value="">No Party</option>
                {partyIdentities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.reference_name
                      ? `${p.reference_name} — ${p.name || p.company_name}`
                      : p.name || p.company_name}
                  </option>
                ))}
              </select>
            </div>

            {/* CUSTOMER NAME (25%) */}
            <div className="lg:col-span-1">
              <label className={labelClass}>
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="consignee_name"
                value={formData.consignee_name}
                onChange={handleChange}
                placeholder="Abhishek Singh"
                className={inputClass}
                required
              />
            </div>

            {/* MOBILE NUMBER (25%) */}
            <div className="lg:col-span-1">
              <label className={labelClass}>
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData((prev) => ({ ...prev, mobile: val }));
                }}
                placeholder="10-digit mobile"
                className={`${inputClass} font-mono`}
                maxLength={10}
                required
              />
            </div>

            {/* COMPLETE DELIVERY ADDRESS (50%) */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className={labelClass}>
                Complete Delivery Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House / Flat No, Street, Landmark"
                className={inputClass}
                required
              />
            </div>

            {/* ROW BELOW ADDRESS: PINCODE, CITY, STATE */}
            <div className="col-span-full sm:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
              {/* PINCODE */}
              <div>
                <label className={labelClass}>
                   Pincode <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handlePincodeChange}
                    placeholder="6-digit pincode"
                    className={`${inputClass} font-mono ${pincodeLoading ? "pr-9" : ""}`}
                    maxLength={6}
                    required
                  />
                  {pincodeLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#008dd2]" />
                    </div>
                  )}
                </div>
              </div>

              {/* CITY */}
              <div>
                <label className={labelClass}>
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className={inputClass}
                  required
                />
              </div>

              {/* STATE */}
              <div>
                <label className={labelClass}>
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: PACKAGE SPECS, DIMENSIONS & PAYMENT */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 md:p-7 shadow-[0_1px_4px_rgba(15,23,42,0.03)] space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#008dd2]/10 text-xs font-bold text-[#008dd2]">
              2
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Package Specs & Payment
              </h2>
              <p className="text-[11px] text-slate-400">
                Shipment weight, package type, dimensions, payment mode, and carrier fee.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* PACKAGE TYPE */}
            <div>
              <label className={labelClass}>Package Type</label>
              <select
                name="package_type"
                value={formData.package_type}
                onChange={handleChange}
                className={inputClass}
              >
                {PACKAGE_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>

            {/* PRODUCT NAME */}
            <div>
              <label className={labelClass}>Product Name</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                placeholder="prodcut name"
                className={inputClass}
              />
            </div>

            {/* DEAD WEIGHT */}
            <div>
              <label className={labelClass}>
                Weight (Kg) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="0.50"
                  className={`${inputClass} pr-10 font-mono`}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  kg
                </span>
              </div>
            </div>

            {/* PAYMENT MODE */}
            <div>
              <label className={labelClass}>Payment Mode</label>
              <div className="grid grid-cols-2 gap-1.5 h-10.5 sm:h-11 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60">
                {["Prepaid", "COD"].map((mode) => {
                  const isSelected = formData.payment_mode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, payment_mode: mode }))
                      }
                      className={`rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? mode === "COD"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-[#008dd2] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DIMENSIONS: LENGTH */}
            <div>
              <label className={labelClass}>Length (cm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="length"
                value={formData.length}
                onChange={handleChange}
                placeholder="L (cm)"
                className={`${inputClass} font-mono`}
              />
            </div>

            {/* DIMENSIONS: WIDTH */}
            <div>
              <label className={labelClass}>Width (cm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="width"
                value={formData.width}
                onChange={handleChange}
                placeholder="W (cm)"
                className={`${inputClass} font-mono`}
              />
            </div>

            {/* DIMENSIONS: HEIGHT */}
            <div>
              <label className={labelClass}>Height (cm)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="H (cm)"
                className={`${inputClass} font-mono`}
              />
            </div>

            {/* SHIPPING CHARGE */}
            <div>
              <label className={labelClass}>
                Shipping Charge (₹, Incl. GST) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="shipping_charge"
                  value={formData.shipping_charge}
                  onChange={handleChange}
                  placeholder="25.00"
                  className={`${inputClass} pl-8 font-mono`}
                  required
                />
              </div>
            </div>

            {/* REMARK / SPECIAL INSTRUCTIONS */}
            <div className="col-span-full">
              <label className={labelClass}>Remark / Notes (Optional)</label>
              <input
                type="text"
                name="remark"
                value={formData.remark}
                onChange={handleChange}
                placeholder="e.g. Handle with care, Urgent shipment, Call before delivery, etc."
                className={inputClass}
              />
            </div>
          </div>

          {/* VOLUMETRIC WEIGHT PREVIEW BANNER */}
          {volWeight && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#008dd2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                Calculated Volumetric Weight:{" "}
                <b className="font-bold text-slate-800">{volWeight} kg</b>{" "}
                (Dead Weight:{" "}
                <b className="font-bold text-slate-800">
                  {Number(formData.weight || 0).toFixed(2)} kg
                </b>
                )
              </span>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link
            to="/offline-orders"
            className="flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-6 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#007ab6] active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Saving Offline Order...</span>
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                <span>
                  {isEditMode ? "Save Changes" : "Create Offline Order"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
