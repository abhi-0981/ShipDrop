import { useEffect, useRef, useState } from "react";
import api from "../../services/api";

import delhiveryLogo from "../../assets/images/delhivery-logo.png";

const DEFAULT_SETTINGS = {
  orderValue: true,
  codAmount: true,
  buyerMobile: true,
  shipperMobiles: true,
  shipperAddress: true,
  productName: true,
  servicesTnc: true,
  orderId: true,
  orderWeight: true,
  labelSize: "4x6",
};

const toBool = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  String(value).toLowerCase() === "true";

const DISPLAY_OPTIONS = [
  {
    key: "orderValue",
    title: "Order value on labels",
    description: "Shows order value in COD & Prepaid orders.",
  },
  {
    key: "codAmount",
    title: "COD amount on label",
    description: "Displays COD amount on the label.",
  },
  {
    key: "buyerMobile",
    title: "Buyer mobile number",
    description: "Shows buyer phone number on the label.",
  },
  {
    key: "shipperMobiles",
    title: "Shipper mobile numbers",
    description: "Shows shipper mobile & alternate mobile numbers.",
  },
  {
    key: "shipperAddress",
    title: "Shipper address",
    description: "Displays shipper address on the label.",
  },
  {
    key: "productName",
    title: "Product name",
    description: "Shows product name on the label.",
  },
  {
    key: "servicesTnc",
    title: "Services T&C",
    description: "Shows services T&C on the label.",
  },
  {
    key: "orderId",
    title: "Order ID",
    description: "Displays order ID on the label.",
  },
  {
    key: "orderWeight",
    title: "Order weight",
    description: "Displays total order weight on the label.",
  },
];

const LABEL_SIZES = [
  {
    value: "4x6",
    label: '4" × 6"',
  },
  {
    value: "4x4",
    label: '4" × 4"',
  },
  {
    value: "A4",
    label: "A4",
  },
  {
    value: "always-ask",
    label: "Always Ask",
  },
];

const Icon = ({ name, size = 18 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "tag") {
    return (
      <svg {...common}>
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1 0-2.8l7.2-7.2A2 2 0 0 1 12 2.8h7.2a2 2 0 0 1 2 2V12a2 2 0 0 1-.6 1.4Z" />
        <circle cx="16.5" cy="7.5" r="1.2" />
      </svg>
    );
  }

  if (name === "upload") {
    return (
      <svg {...common}>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </svg>
    );
  }

  if (name === "file") {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </svg>
    );
  }

  if (name === "save") {
    return (
      <svg {...common}>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M17 21v-8H7v8" />
        <path d="M7 3v5h8" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...common}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    );
  }

  if (name === "alert") {
    return (
      <svg {...common}>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.8 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      </svg>
    );
  }

  return null;
};

const Toggle = ({ enabled, onChange }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={enabled}
      className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
        enabled ? "bg-emerald-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] transition-all duration-200 ${
          enabled ? "left-[23px]" : "left-[3px]"
        }`}
      />
    </button>
  );
};

function getCurrentUser() {
  const possibleKeys = [
    "user",
    "currentUser",
    "loggedInUser",
    "shipdrop_user",
  ];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      const parsed = JSON.parse(raw);

      if (parsed?.id) {
        return parsed;
      }

      if (parsed?.user?.id) {
        return parsed.user;
      }
    } catch (error) {
      // Ignore invalid localStorage values
    }
  }

  return null;
}

function LabelSettings() {
  const fileInputRef = useRef(null);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [customLogo, setCustomLogo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  /*
   * Load settings from database
   */
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const user = getCurrentUser();
      const userId = user?.id;

      if (!userId) {
        throw new Error("User ID not found. Please login again.");
      }

      const response = await api.get(
        "/label-settings",
        {
          params: {
            user_id: userId,
          },
        }
      );

      if (!response.data?.success || !response.data?.settings) {
        throw new Error(
          response.data?.message || "Unable to load label settings."
        );
      }

      const data = response.data.settings;

     const toBool = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  String(value).toLowerCase() === "true";

setSettings({
  orderValue: toBool(data.order_value),
  codAmount: toBool(data.cod_amount),
  buyerMobile: toBool(data.buyer_mobile),
  shipperMobiles: toBool(data.shipper_mobiles),
  shipperAddress: toBool(data.shipper_address),
  productName: toBool(data.product_name),
  servicesTnc: toBool(data.services_tnc),
  orderId: toBool(data.order_id),
  orderWeight: toBool(data.order_weight),
  labelSize: data.label_size || "4x6",
});

      if (data.custom_logo) {
        setCustomLogo({
          file: null,
          preview: data.custom_logo,
          dataUrl: data.custom_logo,
          name: "Saved custom logo",
          saved: true,
        });
      } else {
        setCustomLogo(null);
      }

      setSaved(false);
    } catch (err) {
      console.error("Load label settings error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load label settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  /*
   * Cleanup object URLs
   */
  useEffect(() => {
    return () => {
      if (
        customLogo?.preview &&
        customLogo?.preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(customLogo.preview);
      }
    };
  }, [customLogo]);

  /*
   * Update a setting
   */
  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    setSaved(false);
    setError("");
  };

  /*
   * Toggle
   */
  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    setSaved(false);
    setError("");
  };

  /*
   * Convert uploaded file to base64
   * so it can be stored in DB.
   */
  const fileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error("Unable to read logo file."));

      reader.readAsDataURL(file);
    });
  };

  /*
   * Upload custom logo
   */
  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PNG, JPG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo size must be less than 2 MB.");
      event.target.value = "";
      return;
    }

    try {
      if (
        customLogo?.preview &&
        customLogo.preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(customLogo.preview);
      }

      const preview = URL.createObjectURL(file);
      const dataUrl = await fileToDataUrl(file);

      setCustomLogo({
        file,
        preview,
        dataUrl,
        name: file.name,
        saved: false,
      });

      setSaved(false);
      setError("");
    } catch (err) {
      console.error("Logo upload error:", err);

      alert("Unable to load this logo.");
    }

    event.target.value = "";
  };

  /*
   * Remove custom logo
   */
  const handleRemoveLogo = () => {
    if (
      customLogo?.preview &&
      customLogo.preview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(customLogo.preview);
    }

    setCustomLogo(null);
    setSaved(false);
    setError("");
  };

  /*
   * Cancel changes
   * Reload original values from DB.
   */
  const handleCancel = () => {
    loadSettings();
  };

  /*
   * Save settings
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const user = getCurrentUser();
      const userId = user?.id;

      if (!userId) {
        throw new Error("User ID not found. Please login again.");
      }

      const payload = {
        user_id: userId,

        order_value: settings.orderValue,
        cod_amount: settings.codAmount,
        buyer_mobile: settings.buyerMobile,
        shipper_mobiles: settings.shipperMobiles,
        shipper_address: settings.shipperAddress,
        product_name: settings.productName,
        services_tnc: settings.servicesTnc,
        order_id: settings.orderId,
        order_weight: settings.orderWeight,

        label_size: settings.labelSize,

        custom_logo: customLogo?.dataUrl || null,
      };

      const response = await api.put(
        "/label-settings",
        payload
      );

      if (!response.data?.success || !response.data?.settings) {
        throw new Error(
          response.data?.message ||
            "Unable to save label settings."
        );
      }

      const data = response.data.settings;

      setSettings({
  orderValue: toBool(data.order_value),
  codAmount: toBool(data.cod_amount),
  buyerMobile: toBool(data.buyer_mobile),
  shipperMobiles: toBool(data.shipper_mobiles),
  shipperAddress: toBool(data.shipper_address),
  productName: toBool(data.product_name),
  servicesTnc: toBool(data.services_tnc),
  orderId: toBool(data.order_id),
  orderWeight: toBool(data.order_weight),
  labelSize: data.label_size || "4x6",
});

      if (data.custom_logo) {
        setCustomLogo({
          file: null,
          preview: data.custom_logo,
          dataUrl: data.custom_logo,
          name: "Saved custom logo",
          saved: true,
        });
      } else {
        setCustomLogo(null);
      }

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err) {
      console.error("Save label settings error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save label settings."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Current logo:
   * custom logo if uploaded,
   * otherwise default Delhivery logo.
   */
  const currentLogo = customLogo?.preview || delhiveryLogo;

  return (
    <div className="w-full pb-24">
      {/* ================= HEADER ================= */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Icon name="tag" size={19} />
          </div>

          <div>
            <h1 className="text-[21px] font-semibold tracking-tight text-slate-800">
              Label Settings
            </h1>

            <p className="mt-0.5 text-[12px] text-slate-400">
              Customize the information shown on your shipping labels.
            </p>
          </div>
        </div>
      </div>

      {/* ================= ERROR MESSAGE ================= */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3.5 py-3 text-[11px] text-rose-600">
          <span className="mt-0.5 shrink-0">
            <Icon name="alert" size={14} />
          </span>

          <span>{error}</span>
        </div>
      )}

      {/* ================= RIGHT SIDE LOGO ================= */}
      <section className="mb-4 rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h2 className="text-[14px] font-semibold text-slate-800">
            Right Side Logo
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Delhivery logo by default. Upload your logo to replace it.
          </p>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          {/* Logo Preview */}
          <div className="flex h-[90px] w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50/40 px-4 sm:w-[250px]">
            {loading ? (
              <div className="text-[11px] text-slate-400">
                Loading logo...
              </div>
            ) : (
              <img
                src={currentLogo}
                alt="Right side logo"
                className="max-h-[48px] max-w-[75%] object-contain"
              />
            )}
          </div>

          {/* Logo Controls */}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-slate-700">
              {customLogo
                ? "Custom logo"
                : "Delhivery by default"}
            </p>

            <p className="mt-0.5 truncate text-[10.5px] text-slate-400">
              {customLogo
                ? customLogo.name
                : "Default Delhivery logo will appear on the right side of your labels."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || saving}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-blue-200 bg-white px-3 text-[11px] font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="upload" size={14} />

                {customLogo ? "Change Logo" : "Upload Logo"}
              </button>

              {customLogo && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={saving}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 text-[11px] font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icon name="trash" size={13} />
                  Remove
                </button>
              )}
            </div>

            <p className="mt-2 text-[10px] text-slate-400">
              PNG, JPG or WEBP · Maximum 2 MB
            </p>
          </div>
        </div>
      </section>

      {/* ================= DISPLAY OPTIONS ================= */}
      <section className="mb-4 rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <h2 className="text-[14px] font-semibold text-slate-800">
            Display Options
          </h2>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Choose which information should appear on your labels.
          </p>
        </div>

        <div className="p-3 sm:p-4">
          <div className="space-y-2">
            {DISPLAY_OPTIONS.map((option) => {
              const enabled = Boolean(settings[option.key]);

              return (
                <div
                  key={option.key}
                  className="flex min-h-[62px] items-center justify-between gap-4 rounded-lg border border-slate-200 px-3.5 py-2.5 transition hover:border-slate-300 hover:bg-slate-50/30 sm:px-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-slate-700 sm:text-[13px]">
                      {option.title}
                    </p>

                    <p className="mt-0.5 text-[10.5px] leading-4 text-slate-400 sm:text-[11px]">
                      {option.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span
                      className={`hidden text-[10.5px] font-medium sm:block ${
                        enabled
                          ? "text-emerald-500"
                          : "text-slate-400"
                      }`}
                    >
                      {enabled ? "Active" : "Inactive"}
                    </span>

                    <Toggle
                      enabled={enabled}
                      onChange={() => handleToggle(option.key)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= DEFAULT LABEL SIZE ================= */}
      <section className="mb-5 rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon name="file" size={17} />
            </div>

            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold text-slate-800">
                Default Label Size
              </h2>

              <p className="mt-0.5 text-[10.5px] leading-4 text-slate-400">
                Choose the default size used while printing labels.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-[190px]">
            <select
              value={settings.labelSize}
              onChange={(event) =>
                updateSetting("labelSize", event.target.value)
              }
              disabled={loading || saving}
              className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-[12px] font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {LABEL_SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>

            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="chevron" size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* ================= DESKTOP ACTIONS ================= */}
      <div className="hidden items-center justify-end gap-2 sm:flex">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading || saving}
          className="h-9 rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Icon name="save" size={14} />

          {saving
            ? "Saving..."
            : saved
            ? "Saved"
            : "Save Changes"}
        </button>
      </div>

      {/* ================= MOBILE ACTIONS ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-3 py-3 shadow-[0_-3px_15px_rgba(15,23,42,0.06)] sm:hidden">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading || saving}
            className="h-10 flex-1 rounded-lg border border-slate-200 bg-white text-[11px] font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Icon name="save" size={14} />

            {saving
              ? "Saving..."
              : saved
              ? "Saved"
              : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ================= SAVED MESSAGE ================= */}
      {saved && (
        <div className="fixed right-5 top-24 z-[100] flex items-center gap-2 rounded-lg border border-emerald-100 bg-white px-3.5 py-2.5 text-[11px] font-medium text-slate-700 shadow-lg">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <Icon name="check" size={12} />
          </span>

          Label settings saved.
        </div>
      )}
    </div>
  );
}

export default LabelSettings;