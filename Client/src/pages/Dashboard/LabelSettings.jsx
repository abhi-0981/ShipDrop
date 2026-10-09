import { useEffect, useRef, useState } from "react";
import api from "../../services/api";
import delhiveryLogo from "../../assets/images/delhivery-logo.png";

const PRIMARY = "#008dd2";

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
  { value: "4x6", label: '4" × 6"' },
  { value: "A4", label: "A4" },
  { value: "4x2", label: '4" × 2"' },
  { value: "4x2.5", label: '4" × 2.5"' },
  { value: "3x2", label: '3" × 2"' },
];

function getCurrentUser() {
  const keys = [
    "user",
    "currentUser",
    "loggedInUser",
    "shipdrop_user",
  ];

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
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? "bg-green-600" : "bg-slate-300"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({ title, checked, onChange, disabled }) {
  return (
    <div className="flex w-full items-center justify-between border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-sm text-slate-700">
        {title}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className={checked ? "text-xs text-green-700" : "text-xs text-slate-400"}>
          {checked ? "On" : "Off"}
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

function LabelSettings() {
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoData, setLogoData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setError("");
    setNotice("");
  };

  const getUserId = () => {
    const user = getCurrentUser();

    if (!user?.id) {
      throw new Error(
        "User ID not found. Please log in again."
      );
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
          response.data.message ||
            "Unable to load label settings."
        );
      }

      const data = response.data?.settings;

      if (!data) {
        throw new Error(
          "The server did not return label settings."
        );
      }

      setSettings({
        ...DEFAULT_SETTINGS,

        rightLogoMode:
          data.rightLogoMode ||
          (data.custom_logo || data.customLogo
            ? "custom"
            : "delhivery"),

        fromName:
          data.fromName ?? data.from_name ?? true,

        fromAddress:
          data.fromAddress ??
          data.from_address ??
          data.shipper_address ??
          true,

        fromMobile:
          data.fromMobile ??
          data.from_mobile ??
          data.shipper_mobiles ??
          true,

        buyerMobile:
          data.buyerMobile ??
          data.buyer_mobile ??
          true,

        orderId:
          data.orderId ?? data.order_id ?? true,

        orderWeight:
          data.orderWeight ??
          data.order_weight ??
          true,

        productDetails:
          data.productDetails ??
          data.product_details ??
          true,

        returnAddress:
          data.returnAddress ??
          data.return_address ??
          true,

        contactLine:
          data.contactLine ??
          data.contact_line ??
          true,

        labelSize:
          data.labelSize ?? data.label_size ?? "4x6",
      });

      const storedLogo =
        data.customLogo ?? data.custom_logo ?? null;

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please upload a PNG, JPG or WEBP image."
      );
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setNotice("");

      const userId = getUserId();

      const payload = {
        user_id: userId,

        rightLogoMode: settings.rightLogoMode,

        customLogo:
          settings.rightLogoMode === "custom"
            ? logoData
            : null,

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

      const response = await api.put(
        "/label-settings",
        payload
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message ||
            "Unable to save settings."
        );
      }

      setNotice("Changes saved successfully.");
    } catch (err) {
      console.error("Save label settings error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const isBusy = loading || saving;

  return (
    <div className="min-h-full w-full bg-white px-3 pb-20 pt-4 sm:px-6 sm:pt-5">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Label Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Customize your shipping label.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSettings}
            disabled={isBusy}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading settings...
          </div>
        ) : (
          <div className="space-y-4">

            {/* Branding */}
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-800">
                  Branding
                </h2>
              </div>

              <div className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-sm text-slate-700">
                    Label Logo
                  </label>

                  <p className="mb-2 text-xs text-slate-500">
                    PNG, JPG or WEBP · Maximum 2 MB
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    className="block w-full cursor-pointer rounded-md border border-slate-200 text-sm text-slate-600 file:mr-3 file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2"
                  />

                  {settings.rightLogoMode === "custom" && (
                    <button
                      type="button"
                      onClick={removeCustomLogo}
                      className="mt-2 text-xs hover:underline"
                      style={{ color: PRIMARY }}
                    >
                      Use Delhivery default
                    </button>
                  )}
                </div>

                <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg border border-slate-200 p-2">
                  <img
                    src={
                      settings.rightLogoMode === "custom" &&
                      logoPreview
                        ? logoPreview
                        : delhiveryLogo
                    }
                    alt="Label logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            </section>

            {/* Editable settings only */}
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-800">
                  Label Information
                </h2>
              </div>

              <div className="px-4">
                <SettingRow
                  title="Sender Name"
                  checked={settings.fromName}
                  onChange={(v) => updateSetting("fromName", v)}
                  disabled={isBusy}
                />

                <SettingRow
                  title="Sender Address"
                  checked={settings.fromAddress}
                  onChange={(v) => updateSetting("fromAddress", v)}
                  disabled={isBusy}
                />

                <SettingRow
                  title="Sender Mobile Number"
                  checked={settings.fromMobile}
                  onChange={(v) => updateSetting("fromMobile", v)}
                  disabled={isBusy}
                />

                <SettingRow
                  title="Buyer Mobile Number"
                  checked={settings.buyerMobile}
                  onChange={(v) => updateSetting("buyerMobile", v)}
                  disabled={isBusy}
                />

                <SettingRow
                  title="Order ID"
                  checked={settings.orderId}
                  onChange={(v) => updateSetting("orderId", v)}
                  disabled={isBusy}
                />

                <SettingRow
                  title="Billed Weight"
                  checked={settings.orderWeight}
                  onChange={(v) => updateSetting("orderWeight", v)}
                  disabled={isBusy}
                />

                <SettingRow
                  title="Product Details"
                  checked={settings.productDetails}
                  onChange={(v) => updateSetting("productDetails", v)}
                  disabled={isBusy}
                />

                <SettingRow
                  title="Return Address"
                  checked={settings.returnAddress}
                  onChange={(v) => updateSetting("returnAddress", v)}
                  disabled={isBusy}
                />

                <SettingRow
                  title="Complaints & Queries Contact"
                  checked={settings.contactLine}
                  onChange={(v) => updateSetting("contactLine", v)}
                  disabled={isBusy}
                />
              </div>
            </section>

            {/* Label Size */}
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-800">
                  Label Size
                </h2>
              </div>

              <div className="flex flex-wrap gap-2 p-4">
                {LABEL_SIZES.map((size) => {
                  const selected =
                    settings.labelSize === size.value;

                  return (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() =>
                        updateSetting("labelSize", size.value)
                      }
                      aria-pressed={selected}
                      className="rounded-md border px-3 py-2 text-sm transition"
                      style={
                        selected
                          ? {
                              borderColor: PRIMARY,
                              backgroundColor: "#eaf7fd",
                              color: PRIMARY,
                            }
                          : {
                              borderColor: "#e2e8f0",
                              color: "#475569",
                            }
                      }
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Save button */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-3 sm:static sm:mt-4 sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isBusy}
            className="w-full rounded-md px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            style={{ backgroundColor: PRIMARY }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Success toast */}
      {notice && !error && (
        <div
          role="status"
          className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-lg border border-green-200 bg-white px-4 py-3 text-sm text-green-700 shadow-lg sm:bottom-5"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold">
            ✓
          </span>

          {notice}

          <button
            type="button"
            onClick={() => setNotice("")}
            className="ml-2 text-green-700 hover:text-green-900"
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default LabelSettings;
