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
    <div className="flex w-full items-center justify-between border-b border-slate-100 dark:border-white/5 py-3 last:border-b-0">
      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
        {title}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className={checked ? "text-[11px] font-semibold text-green-600 dark:text-green-400" : "text-[11px] text-slate-400 dark:text-slate-500"}>
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
    <div className="min-h-full w-full bg-[#f6f8fb] dark:bg-[#090b10] px-3.5 py-4 sm:px-6 sm:py-6 pb-28 sm:pb-8">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <div className="mb-5 flex items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-[#008dd2] font-semibold">Settings</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Label Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Customize what information appears on your shipping labels
            </p>
          </div>

          <button
            type="button"
            onClick={loadSettings}
            disabled={isBusy}
            className="rounded-xl border border-slate-200 dark:border-white/10 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 transition active:scale-95 shrink-0"
          >
            Reset
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#008dd2] border-t-transparent" />
              <span>Loading label settings...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Branding */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-[#111318]">
              <div className="border-b border-slate-100 dark:border-white/10 px-4 py-3.5 sm:px-5">
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Branding & Logo
                </h2>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                    Label Brand Logo
                  </label>

                  <p className="mb-2.5 text-xs text-slate-400 dark:text-slate-500">
                    PNG, JPG or WEBP · Maximum 2 MB
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUpload}
                    className="block w-full cursor-pointer rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-600 file:mr-3 file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-3 file:py-2 dark:border-white/10 dark:text-slate-300 dark:file:border-white/10 dark:file:bg-white/5 dark:file:text-slate-200"
                  />

                  {settings.rightLogoMode === "custom" && (
                    <button
                      type="button"
                      onClick={removeCustomLogo}
                      className="mt-2 text-xs font-medium hover:underline text-[#008dd2]"
                    >
                      Use Delhivery default logo instead
                    </button>
                  )}
                </div>

                <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-2 self-start sm:self-center">
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
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-[#111318]">
              <div className="border-b border-slate-100 dark:border-white/10 px-4 py-3.5 sm:px-5">
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Label Fields Visibility
                </h2>
              </div>

              <div className="px-4 sm:px-5 divide-y divide-slate-100 dark:divide-white/5">
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
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-[#111318]">
              <div className="border-b border-slate-100 dark:border-white/10 px-4 py-3.5 sm:px-5">
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Label Size Format
                </h2>
              </div>

              <div className="flex flex-wrap gap-2.5 p-4 sm:p-5">
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
                      className={`rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition active:scale-95 ${
                        selected
                          ? "border-[#008dd2] bg-sky-50 text-[#008dd2] dark:bg-sky-950/40 dark:border-sky-500 shadow-xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-300"
                      }`}
                    >
                      {size.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Save Action Button (in-flow, never hidden behind bottom nav) */}
            <div className="pt-2 flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={isBusy}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#008dd2] px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[#008dd2]/30 transition hover:bg-[#007ab6] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success toast */}
      {notice && !error && (
        <div
          role="status"
          className="fixed top-16 right-4 sm:top-5 sm:right-5 z-50 flex items-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-3 text-xs sm:text-sm text-green-700 shadow-xl dark:border-green-800 dark:bg-slate-900 dark:text-green-300 max-w-[90vw]"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
            ✓
          </span>

          <span className="flex-1">{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
            className="ml-2 text-green-700 hover:text-green-900 dark:text-green-300"
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
