
import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import delhiveryLogo from "../../assets/images/delhivery-logo.png";


const DEFAULT_SETTINGS = {
  rightLogoMode: "delhivery",
  customLogo: null,

  fromName: true,
  fromAddress: true,
  fromMobile: true,
  buyerMobile: true,

  orderId: true,
  orderWeight: true,
  productDetails: true,
  returnAddress: true,
  contactLine: true,

  labelSize: "4x6",
};

const LABEL_SIZES = [
  { value: "4x6", label: '4" × 6"', description: "Standard shipping label" },
  { value: "A4", label: "A4 Size", description: "Full-page printing" },
  { value: "4x2", label: '4" × 2"', description: "Compact label" },
  { value: "4x2.5", label: '4" × 2.5"', description: "Medium label" },
  { value: "3x2", label: '3" × 2"', description: "Small label" },
];

function getCurrentUser() {
  const keys = ["user", "currentUser", "loggedInUser", "shipdrop_user"];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (parsed?.id) return parsed;
      if (parsed?.user?.id) return parsed.user;
    } catch {
      // Ignore invalid localStorage values.
    }
  }

  return null;
}

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-blue-600" : "bg-slate-300"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({ title, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`hidden text-xs sm:block ${
            checked ? "text-blue-600" : "text-slate-400"
          }`}
        >
          {checked ? "Visible" : "Hidden"}
        </span>

        <Toggle
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>
        )}
      </div>

      <div className="px-5 py-1">{children}</div>
    </section>
  );
}

function LabelSettings() {
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoData, setLogoData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSaved(false);
    setNotice("");
    setError("");
  };

  const getUserId = () => {
    const user = getCurrentUser();

    if (!user?.id) {
      throw new Error("User ID not found. Please log in again.");
    }

    return user.id;
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setNotice("");

      const userId = getUserId();

    const response = await api.get("/label-settings", {
  params: { user_id: userId },
});

      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Unable to load label settings."
        );
      }

      const data = response.data?.settings;

      if (!data) {
        throw new Error("The server did not return label settings.");
      }

      // Supports the new setting names and the old API field names.
      setSettings({
        ...DEFAULT_SETTINGS,
        rightLogoMode:
          data.rightLogoMode ||
          (data.custom_logo || data.customLogo ? "custom" : "delhivery"),

        fromName: data.fromName ?? data.from_name ?? true,
        fromAddress:
          data.fromAddress ?? data.from_address ?? data.shipper_address ?? true,
        fromMobile:
          data.fromMobile ?? data.from_mobile ?? data.shipper_mobiles ?? true,
        buyerMobile:
          data.buyerMobile ?? data.buyer_mobile ?? true,

        orderId: data.orderId ?? data.order_id ?? true,
        orderWeight: data.orderWeight ?? data.order_weight ?? true,
        productDetails: data.productDetails ?? data.product_details ?? true,
        returnAddress: data.returnAddress ?? data.return_address ?? true,
        contactLine: data.contactLine ?? data.contact_line ?? true,

        labelSize: data.labelSize ?? data.label_size ?? "4x6",
      });

      const storedLogo = data.customLogo ?? data.custom_logo ?? null;

      setLogoData(storedLogo);
      setLogoPreview(storedLogo);
    } catch (err) {
      console.error("Load label settings error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load label settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a PNG, JPG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo size must not exceed 2 MB.");
      event.target.value = "";
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const preview = URL.createObjectURL(file);
    objectUrlRef.current = preview;

    const reader = new FileReader();

    reader.onload = () => {
      setLogoData(reader.result);
      setLogoPreview(preview);
      updateSetting("rightLogoMode", "custom");
      setError("");
    };

    reader.onerror = () => {
      setError("Unable to read the selected logo.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeCustomLogo = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setLogoPreview(null);
    setLogoData(null);
    updateSetting("rightLogoMode", "delhivery");
  };

  const handleCancel = () => {
    loadSettings();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      setError("");
      setNotice("");

      const userId = getUserId();

      const payload = {
        user_id: userId,

        rightLogoMode: settings.rightLogoMode,
        customLogo: settings.rightLogoMode === "custom" ? logoData : null,

        fromName: settings.fromName,
        fromAddress: settings.fromAddress,
        fromMobile: settings.fromMobile,
        buyerMobile: settings.buyerMobile,

        orderId: settings.orderId,
        orderWeight: settings.orderWeight,
        productDetails: settings.productDetails,
        returnAddress: settings.returnAddress,
        contactLine: settings.contactLine,

        labelSize: settings.labelSize,
      };

    const response = await api.put("/label-settings", payload);
    
      if (response.data?.success === false) {
        throw new Error(
          response.data.message || "Unable to save label settings."
        );
      }

      setSaved(true);
      setNotice("Settings saved successfully.");
    } catch (err) {
      console.error("Save label settings error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save settings. The backend may need updating for the new fields."
      );
    } finally {
      setSaving(false);
    }
  };

  const isBusy = loading || saving;

  return (
    <div className="min-h-full w-full bg-slate-50/60 px-3 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Page heading */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M3 7h18M5 7V4h14v3M5 7v13h14V7M9 11h6M9 15h6" />
                </svg>
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Label Settings
                </h1>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Customize your shipping label layout and information.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isBusy}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Reset Changes
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && !error && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {notice}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading label settings...
          </div>
        ) : (
          <div className="space-y-5">
            {/* Logo settings */}
            <Section
              title="Branding & Logos"
              description="ParcelDrop branding stays fixed on the left. Customize the logo on the right."
            >
              <div className="grid gap-4 py-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Left Side · Fixed Logo
                  </p>

                  <div className="flex h-24 items-center justify-center rounded-lg border border-slate-200 bg-white">
                    <span className="text-2xl font-extrabold tracking-tight text-[#008dd2]">
                      ParcelDrop
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    ParcelDrop branding is fixed and cannot be changed here.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Right Side · Customizable Logo
                  </p>

                  <div className="flex h-24 items-center justify-center rounded-lg border border-slate-200 bg-white p-3">
                    <img
                      src={
                        settings.rightLogoMode === "custom" && logoPreview
                          ? logoPreview
                          : delhiveryLogo
                      }
                      alt="Selected right-side logo"
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Upload Custom Logo
                    </button>

                    <button
                      type="button"
                      onClick={removeCustomLogo}
                      disabled={settings.rightLogoMode !== "custom"}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Use Delhivery Default
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    PNG, JPG or WEBP · Maximum 2 MB
                  </p>
                </div>
              </div>
            </Section>

            {/* From / To */}
            <Section
              title="From & To Details"
              description="Control sender details and buyer mobile visibility."
            >
              <div className="grid gap-6 py-3 md:grid-cols-2">
                <div>
                  <div className="mb-1 border-b border-slate-100 pb-3 pt-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      From · Sender
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Each sender field can be hidden separately.
                    </p>
                  </div>

                  <SettingRow
                    title="Sender Name"
                    checked={settings.fromName}
                    onChange={(value) => updateSetting("fromName", value)}
                  />

                  <SettingRow
                    title="Sender Address"
                    checked={settings.fromAddress}
                    onChange={(value) => updateSetting("fromAddress", value)}
                  />

                  <SettingRow
                    title="Sender Mobile Number"
                    checked={settings.fromMobile}
                    onChange={(value) => updateSetting("fromMobile", value)}
                  />
                </div>

                <div>
                  <div className="mb-1 border-b border-slate-100 pb-3 pt-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      To · Buyer
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Buyer name and address are always visible.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Buyer Name
                      </p>
                      <p className="mt-1 text-xs text-emerald-600">
                        Always visible · Fixed
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Required
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Buyer Address
                      </p>
                      <p className="mt-1 text-xs text-emerald-600">
                        Always visible · Fixed
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Required
                    </span>
                  </div>

                  <SettingRow
                    title="Buyer Mobile Number"
                    checked={settings.buyerMobile}
                    onChange={(value) => updateSetting("buyerMobile", value)}
                  />
                </div>
              </div>
            </Section>

            {/* AWB / order information */}
            <Section
              title="Shipment & Order Information"
              description="AWB and barcode remain part of the label. PCS number is not included."
            >
              <div className="grid gap-4 py-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    AWB Number
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Always shown with the shipment barcode.
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Always visible
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    COD / Prepaid
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Payment type is always shown on the label.
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    Always visible
                  </span>
                </div>
              </div>

              <SettingRow
                title="Order ID"
                description="Show or hide the seller's order reference."
                checked={settings.orderId}
                onChange={(value) => updateSetting("orderId", value)}
              />

              <SettingRow
                title="Billed Weight"
                description="Show or hide the shipment weight."
                checked={settings.orderWeight}
                onChange={(value) => updateSetting("orderWeight", value)}
              />

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Seller Details
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Seller information and GSTIN stay visible.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Always visible
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Invoice Number
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Keep the invoice number value blank for now.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  Blank
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Date
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    The label should display the appropriate date automatically.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Automatic
                </span>
              </div>
            </Section>

            {/* Product details */}
            <Section
              title="Product Details"
              description="Show or hide the entire product information section on the shipping label."
            >
              <SettingRow
                title="Show Product Details"
                description="Includes product name, rate, quantity and total."
                checked={settings.productDetails}
                onChange={(value) =>
                  updateSetting("productDetails", value)
                }
              />
            </Section>

            {/* Return details */}
            <Section
              title="Return Address & Contact"
              description="These two bottom sections can be controlled independently."
            >
              <SettingRow
                title="Return Address"
                description="Show or hide the return address at the bottom of the label."
                checked={settings.returnAddress}
                onChange={(value) => updateSetting("returnAddress", value)}
              />

              <SettingRow
                title="Complaints & Queries Contact"
                description="Show or hide: For complaints & queries please contact 8384930617"
                checked={settings.contactLine}
                onChange={(value) => updateSetting("contactLine", value)}
              />
            </Section>

            {/* Label size */}
            <Section
              title="Label Size"
              description="Choose the default paper size for label printing."
            >
              <div className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-3">
                {LABEL_SIZES.map((size) => {
                  const selected = settings.labelSize === size.value;

                  return (
                    <button
                      type="button"
                      key={size.value}
                      onClick={() => updateSetting("labelSize", size.value)}
                      aria-pressed={selected}
                      className={`rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-base font-semibold text-slate-800">
                          {size.label}
                        </span>

                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            selected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 text-transparent"
                          }`}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {size.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>
        )}

        {/* Mobile actions */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-3 shadow-lg sm:hidden">
          <div className="mx-auto flex max-w-5xl gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isBusy}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-600 disabled:opacity-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="flex-1 rounded-lg bg-blue-600 px-3 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LabelSettings;
