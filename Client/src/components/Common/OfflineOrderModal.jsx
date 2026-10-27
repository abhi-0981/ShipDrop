import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { notifyOrderChange } from "../../services/orderEvents";

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

export default function OfflineOrderModal({
  isOpen,
  onClose,
  onSuccess,
  orderToEdit = null,
}) {
  const isEdit = Boolean(orderToEdit?.id);

  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [partyIdentities, setPartyIdentities] = useState([]);
  const [partiesLoading, setPartiesLoading] = useState(false);

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

  useEffect(() => {
    if (!isOpen) return;

    if (orderToEdit) {
      setFormData({
        party_identity_id: orderToEdit.party_identity_id
          ? String(orderToEdit.party_identity_id)
          : "",
        carrier: orderToEdit.carrier || "MARK EXPRESS",
        consignment_no: orderToEdit.consignment_no || "",
        consignee_name: orderToEdit.consignee_name || "",
        mobile: orderToEdit.mobile || "",
        address: orderToEdit.address || "",
        pincode: orderToEdit.pincode || "",
        city: orderToEdit.city || "",
        state: orderToEdit.state || "",
        package_type: orderToEdit.package_type || "Box",
        shipping_mode: orderToEdit.shipping_mode || "Surface",
        product_name: orderToEdit.product_name || "",
        shipping_charge:
          orderToEdit.shipping_charge !== null &&
          orderToEdit.shipping_charge !== undefined &&
          orderToEdit.shipping_charge !== ""
            ? String(orderToEdit.shipping_charge)
            : orderToEdit.amount !== null &&
              orderToEdit.amount !== undefined &&
              orderToEdit.amount !== ""
            ? String(orderToEdit.amount)
            : "",
        length:
          orderToEdit.length !== null && orderToEdit.length !== undefined
            ? String(orderToEdit.length)
            : "",
        width:
          orderToEdit.width !== null && orderToEdit.width !== undefined
            ? String(orderToEdit.width)
            : "",
        height:
          orderToEdit.height !== null && orderToEdit.height !== undefined
            ? String(orderToEdit.height)
            : "",
        weight:
          orderToEdit.weight !== null && orderToEdit.weight !== undefined
            ? String(orderToEdit.weight)
            : "",
        payment_mode: orderToEdit.payment_mode || "Prepaid",
        remark: orderToEdit.remark || "",
      });
    } else {
      setFormData({ ...initialForm });
    }
  }, [isOpen, orderToEdit]);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  if (!isOpen) return null;

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
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${value}`,
      );
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
      toast.error("Unable to verify pincode");
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.carrier.trim()) {
      return toast.error("Please select a carrier");
    }
    if (formData.carrier.toLowerCase() === "delivery") {
      return toast.error("Delivery carrier cannot be used for offline orders");
    }
    if (!formData.consignment_no.trim()) {
      return toast.error("Consignment No is required");
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
      return toast.error("Please verify pincode for auto city and state");
    }

    const parsedCharge = Number(formData.shipping_charge);
    if (formData.shipping_charge === "" || !Number.isFinite(parsedCharge) || parsedCharge < 0) {
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
        carrier: formData.carrier.trim(),
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
      };

      if (isEdit) {
        const response = await api.put(
          `/offline-orders/${orderToEdit.id}`,
          payload,
        );
        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Failed to update offline order",
          );
        }
        toast.success("Offline Order updated successfully!");
        notifyOrderChange();
        window.dispatchEvent(new Event("offlineOrdersUpdated"));
        if (onSuccess) onSuccess(response.data.order, true);
        onClose();
      } else {
        const response = await api.post("/offline-orders/create", payload);
        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Failed to create offline order",
          );
        }

        toast.success("Offline Order created successfully!");
        notifyOrderChange();
        window.dispatchEvent(new Event("offlineOrdersUpdated"));
        setFormData({ ...initialForm });
        if (onSuccess) onSuccess(response.data.order, false);
        onClose();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to save offline order",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10";
  const readonlyClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500 outline-none cursor-not-allowed select-none";
  const labelClass = "block text-[11px] font-bold text-slate-600 mb-1";

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#121620] border border-slate-200 dark:border-[#1f2535] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1f2535] px-5 py-3.5 bg-gradient-to-r from-sky-50/50 to-white dark:from-[#171b26] dark:to-[#121620]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#008dd2] text-white text-xs font-bold shadow-xs">
              ✦
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                {isEdit
                  ? `Edit Offline Order #${orderToEdit.id}`
                  : "Create Offline Order"}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isEdit
                  ? "Update consignment, carrier or customer specs"
                  : "Manual carrier entry (Mark Express, Tirupati, DTDC, etc.)"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* MODAL BODY */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {/* SECTION 1: PARTY & CARRIER */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <span className="h-2 w-2 rounded-full bg-[#008dd2]" />
              Party & Carrier Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1st: PARTY IDENTITY */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Party Identity</label>
                  <Link
                    to="/settings/party-identities"
                    className="text-[10px] font-semibold text-[#008dd2] hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    + Manage
                  </Link>
                </div>
                <div className="relative">
                  <select
                    name="party_identity_id"
                    value={formData.party_identity_id}
                    onChange={handleChange}
                    disabled={partiesLoading}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer truncate`}
                  >
                    <option value="">-- No Party Selected --</option>
                    {partyIdentities.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.reference_name || party.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 2nd: CARRIER DROPDOWN (NO DELIVERY OPTION) */}
              <div>
                <label className={labelClass}>Carrier *</label>
                <div className="relative">
                  <select
                    name="carrier"
                    value={formData.carrier}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer font-medium`}
                    required
                  >
                    {CARRIER_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CONSIGNEE & ADDRESS */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Recipient / Delivery Address
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Customer / Consignee Name *
                </label>
                <input
                  type="text"
                  name="consignee_name"
                  value={formData.consignee_name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Mobile No *</label>
                <input
                  type="tel"
                  name="mobile"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                  placeholder="10-digit mobile number"
                  className={inputClass}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Flat/House, Road, Area, Landmark"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Pincode *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="pincode"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={handlePincodeChange}
                    placeholder="6-digit PIN"
                    className={inputClass}
                    required
                  />
                  {pincodeLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#008dd2]">
                      Checking...
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    readOnly
                    placeholder="Auto-detected"
                    className={readonlyClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    readOnly
                    placeholder="Auto-detected"
                    className={readonlyClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: SHIPMENT & CHARGES */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              Shipment & Rate Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Consignment No *</label>
                <input
                  type="text"
                  name="consignment_no"
                  value={formData.consignment_no}
                  onChange={handleChange}
                  placeholder="e.g. ME987654321"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Package Type *</label>
                <div className="relative">
                  <select
                    name="package_type"
                    value={formData.package_type}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                    required
                  >
                    {PACKAGE_TYPES.map((pt) => (
                      <option key={pt} value={pt}>
                        {pt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Shipping Mode *</label>
                <div className="relative">
                  <select
                    name="shipping_mode"
                    value={formData.shipping_mode}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none pr-8 cursor-pointer font-medium`}
                    required
                  >
                    {SHIPPING_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Product Name</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder="e.g. Saree, Jeans"
                  className={inputClass}
                />
              </div>

              {/* SINGLE UNIFIED CHARGE FIELD (AMOUNT INCLUDING GST) */}
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  Shipping Charge (Including GST) *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="shipping_charge"
                    value={formData.shipping_charge}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={`${inputClass} pl-7`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* PAYMENT MODE TOGGLE */}
            <div className="pt-2 flex items-center gap-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600">
                Payment Mode:
              </span>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, payment_mode: "Prepaid" }))
                  }
                  className={`rounded-lg px-3.5 py-1 text-xs font-bold transition cursor-pointer ${
                    formData.payment_mode === "Prepaid"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Prepaid
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({ ...p, payment_mode: "COD" }))
                  }
                  className={`rounded-lg px-3.5 py-1 text-xs font-bold transition cursor-pointer ${
                    formData.payment_mode === "COD"
                      ? "bg-white text-amber-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  COD
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4: DIMENSIONS & WEIGHT */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Dimensions & Weight
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className={labelClass}>Length (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  placeholder="10"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Width (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  placeholder="10"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="10"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Weight (Kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="0.5"
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: REMARK / NOTES */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Remark / Notes (Optional)
            </div>
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              rows={2}
              placeholder="e.g. Handle with care, urgent delivery, customer note, etc."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 resize-none"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#008dd2] px-6 py-2 text-xs font-bold text-white shadow-sm shadow-[#008dd2]/20 hover:bg-[#007ab6] active:scale-95 disabled:opacity-60 transition cursor-pointer"
            >
              {loading
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : isEdit
                ? "Update Offline Order"
                : "Save Offline Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
