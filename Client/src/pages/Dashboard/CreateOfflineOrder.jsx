import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { notifyOrderChange } from "../../services/orderEvents";

const PRIMARY = "#008dd2";

const CARRIER_OPTIONS = [
  "MARK EXPRESS",
  "TIRUPATI COURIER",
  "DTDC",
  "TRACKON COURIER",
  "DELHIVERY (OFFLINE)",
  "BLUE DART",
  "PROFESSIONAL COURIERS",
  "SELF",
  "OTHER",
];

const PACKAGE_TYPES = ["Box", "Flyer", "Carton", "Wooden Box", "Other"];

export default function CreateOfflineOrder() {
  const navigate = useNavigate();

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

  // Load user party identities on mount
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Auto pincode city/state lookup
  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: pin }));

    if (pin.length === 6) {
      try {
        setPincodeLoading(true);
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setFormData((prev) => ({
            ...prev,
            city: po.District || po.Block || prev.city,
            state: po.State || prev.state,
          }));
          toast.success(`Pincode verified: ${po.District}, ${po.State}`);
        }
      } catch (err) {
        console.warn("Pincode lookup notice:", err);
      } finally {
        setPincodeLoading(false);
      }
    }
  };

  // Live volumetric weight calculation
  const volWeight =
    formData.length && formData.width && formData.height
      ? (
          (Number(formData.length) *
            Number(formData.width) *
            Number(formData.height)) /
          5000
        ).toFixed(2)
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.carrier.trim()) {
      return toast.error("Please select a courier carrier");
    }
    if (!formData.consignment_no.trim()) {
      return toast.error("Consignment / Tracking Number is required");
    }
    if (!formData.consignee_name.trim()) {
      return toast.error("Customer / Consignee Name is required");
    }
    if (!/^\d{10}$/.test(formData.mobile.trim())) {
      return toast.error("Valid 10-digit mobile number is required");
    }
    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      return toast.error("Valid 6-digit destination pincode is required");
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      return toast.error("City and State are required");
    }
    const weightNum = Number(formData.weight);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      return toast.error("Weight must be greater than 0 kg");
    }
    const chargeNum = Number(formData.shipping_charge);
    if (!Number.isFinite(chargeNum) || chargeNum < 0) {
      return toast.error("Valid Shipping Charge is required");
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        party_identity_id: formData.party_identity_id || null,
        shipping_charge: chargeNum,
        amount: chargeNum,
        weight: weightNum,
        length: Number(formData.length) || 0,
        width: Number(formData.width) || 0,
        height: Number(formData.height) || 0,
      };

      const res = await api.post("/offline-orders", payload);

      if (res?.data?.success) {
        toast.success("Offline order created successfully!");
        notifyOrderChange();
        window.dispatchEvent(new Event("offlineOrdersUpdated"));
        navigate("/offline-orders");
      } else {
        toast.error(res?.data?.message || "Failed to create offline order");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to create offline order",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the form?")) {
      setFormData({ ...initialForm });
    }
  };

  const inputClass =
    "h-10.5 sm:h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 sm:p-5 lg:p-6 space-y-4">
      {/* PAGE HEADER */}
      <div className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-6 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs"
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
                <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" />
                <path d="M3 8.5 12 13l9-4.5" />
                <path d="M12 13v7" />
              </svg>
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-[-0.2px] text-slate-900">
                Create Offline Order
              </h1>
              <p className="mt-0.5 text-xs text-slate-400">
                Record manual shipments (Mark Express, Tirupati, DTDC, etc.) with custom rates and remarks
              </p>
            </div>
          </div>

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
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              <span>View Offline Orders</span>
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

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: CARRIER & PARTY IDENTITY */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-[#008dd2]">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="16" height="16" x="4" y="4" rx="2" />
                <path d="M9 9h6" />
                <path d="M9 13h6" />
                <path d="M9 17h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                1. Courier Partner & Party
              </h2>
              <p className="text-[11px] text-slate-400">
                Specify manual courier carrier and optional party identity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* PARTY IDENTITY */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Party Identity
                </label>
                <Link
                  to="/settings/party-identities"
                  className="text-[11px] font-bold text-[#008dd2] hover:underline"
                >
                  + Add Party
                </Link>
              </div>
              <select
                name="party_identity_id"
                value={formData.party_identity_id}
                onChange={handleChange}
                className={inputClass}
                disabled={partiesLoading}
              >
                <option value="">None (Direct Order)</option>
                {partyIdentities.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.reference_name || party.name}{" "}
                    {party.name ? `— ${party.name}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* CARRIER */}
            <div>
              <label className={labelClass}>Manual Courier Carrier *</label>
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

            {/* CONSIGNMENT NUMBER */}
            <div>
              <label className={labelClass}>
                Consignment / Tracking Number *
              </label>
              <input
                type="text"
                name="consignment_no"
                value={formData.consignment_no}
                onChange={handleChange}
                placeholder="e.g. 9999999999 or ME123456"
                className={`${inputClass} font-mono font-medium`}
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CUSTOMER / DESTINATION DETAILS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                2. Customer & Destination Details
              </h2>
              <p className="text-[11px] text-slate-400">
                Recipient contact information and delivery address
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* CUSTOMER NAME */}
            <div>
              <label className={labelClass}>Customer / Consignee Name *</label>
              <input
                type="text"
                name="consignee_name"
                value={formData.consignee_name}
                onChange={handleChange}
                placeholder="Full Name"
                className={inputClass}
                required
              />
            </div>

            {/* MOBILE */}
            <div>
              <label className={labelClass}>Mobile Number (10 digits) *</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-semibold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                  placeholder="9876543210"
                  className={`${inputClass} pl-11 font-mono`}
                  required
                />
              </div>
            </div>

            {/* PINCODE */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Destination Pincode *
                </label>
                {pincodeLoading && (
                  <span className="text-[10px] font-bold text-[#008dd2] animate-pulse">
                    Verifying...
                  </span>
                )}
              </div>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handlePincodeChange}
                placeholder="6-digit PIN"
                className={`${inputClass} font-mono`}
                maxLength={6}
                required
              />
            </div>

            {/* CITY */}
            <div>
              <label className={labelClass}>City *</label>
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
              <label className={labelClass}>State *</label>
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

            {/* ADDRESS */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className={labelClass}>Complete Delivery Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House / Flat No, Street, Landmark"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: PACKAGE SPECS, DIMENSIONS & RATE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PACKAGE & ITEMS */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  3. Package Specs & Dimensions
                </h2>
                <p className="text-[11px] text-slate-400">
                  Packaging type, weight and physical dimensions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className={labelClass}>Package Type</label>
                <select
                  name="package_type"
                  value={formData.package_type}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {PACKAGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Shipping Mode</label>
                <select
                  name="shipping_mode"
                  value={formData.shipping_mode}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="Surface">Surface</option>
                  <option value="Air">Air</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Product / Item Name</label>
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleChange}
                  placeholder="e.g. Sarees, Electronics"
                  className={inputClass}
                />
              </div>
            </div>

            {/* WEIGHT & DIMENSIONS */}
            <div className="pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    className={`${inputClass} font-mono`}
                    required
                  />
                </div>

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
                    className={`${inputClass} font-mono`}
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
                    className={`${inputClass} font-mono`}
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
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              {volWeight && (
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 border border-slate-200/60">
                  <span>Volumetric Weight (L×W×H / 5000):</span>
                  <span className="font-mono font-bold text-slate-800">
                    {volWeight} kg
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT & RATE + REMARK */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    4. Payment, Rate & Remark
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Payment type, shipping charge and custom remarks
                  </p>
                </div>
              </div>

              {/* PAYMENT MODE & CHARGE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className={labelClass}>Payment Mode</label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          payment_mode: "Prepaid",
                        }))
                      }
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                        formData.payment_mode === "Prepaid"
                          ? "bg-white text-[#008dd2] shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Prepaid
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, payment_mode: "COD" }))
                      }
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                        formData.payment_mode === "COD"
                          ? "bg-white text-amber-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Cash on Delivery
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Shipping Charge (Incl. GST) *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-bold text-slate-400">
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
                      className={`${inputClass} pl-8 font-mono font-bold text-emerald-600`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* REMARK / SPECIAL NOTES (USER REQUIREMENT) */}
              <div>
                <label className={labelClass}>
                  Remark / Special Notes (Optional)
                </label>
                <textarea
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter remarks or special instructions (e.g. Urgent parcel, Fragile item, Hand over to security, Customer note, etc.)"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SUBMISSION BAR */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 font-bold text-[#008dd2]">
              Carrier: {formData.carrier}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
              Mode: {formData.payment_mode}
            </span>
            {formData.shipping_charge && (
              <span className="font-bold text-emerald-600">
                ₹{Number(formData.shipping_charge || 0).toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/offline-orders")}
              className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-none rounded-xl bg-[#008dd2] px-7 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#008dd2]/20 hover:bg-[#007ab6] active:scale-95 disabled:opacity-60 transition cursor-pointer"
            >
              {loading ? "Recording Order..." : "Create Offline Order →"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
