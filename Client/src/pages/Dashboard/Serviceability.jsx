import { useState } from "react";
import api from "../../services/api";

// ======================================================
// ICON
// ======================================================

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

  if (name === "location") {
    return (
      <svg {...common}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...common}>
        <path d="M20 11a8 8 0 0 0-14.8-4L3 9" />
        <path d="M3 4v5h5" />
        <path d="M4 13a8 8 0 0 0 14.8 4L21 15" />
        <path d="M21 20v-5h-5" />
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

  if (name === "alert") {
    return (
      <svg {...common}>
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 9v5" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (name === "ban") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="m5.6 5.6 12.8 12.8" />
      </svg>
    );
  }

  return null;
};

// ======================================================
// SERVICEABILITY
// ======================================================

function Serviceability() {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // ====================================================
  // CHECK PINCODE
  // ====================================================

  const handleCheck = async (event) => {
    event.preventDefault();

    setError("");
    setResult(null);

    const normalizedPincode = String(pincode).trim();

    if (!/^\d{6}$/.test(normalizedPincode)) {
      setError("Enter a valid 6-digit pincode.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.get(
        `/serviceability/pincode/${normalizedPincode}`
      );

      const data = response?.data;

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Unable to check pincode serviceability."
        );
      }

      setResult(data);
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to check pincode serviceability."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // RESET
  // ====================================================

  const handleReset = () => {
    setPincode("");
    setError("");
    setResult(null);
  };

  // ====================================================
  // RESULT CONTENT
  // ====================================================

  const getResultConfig = () => {
    if (!result) return null;

    if (result.status === "SERVICEABLE") {
      return {
        icon: "check",
        title: "Serviceable",
        subtitle: "Delivery is available at this pincode.",
        wrapper:
          "border-emerald-100 bg-emerald-50/60",
        iconWrapper:
          "bg-emerald-100 text-emerald-600",
        titleColor:
          "text-emerald-700",
      };
    }

    if (result.status === "EMBARGO") {
      return {
        icon: "alert",
        title: "Temporarily Unavailable",
        subtitle:
          "This pincode is currently under embargo.",
        wrapper:
          "border-amber-100 bg-amber-50/60",
        iconWrapper:
          "bg-amber-100 text-amber-600",
        titleColor:
          "text-amber-700",
      };
    }

    return {
      icon: "ban",
      title: "Not Serviceable",
      subtitle:
        "Delivery is not available at this pincode.",
      wrapper:
        "border-rose-100 bg-rose-50/60",
      iconWrapper:
        "bg-rose-100 text-rose-600",
      titleColor:
        "text-rose-700",
    };
  };

  const resultConfig = getResultConfig();

  // ====================================================
  // MAIN
  // ====================================================

  return (
    <div className="min-h-full w-full bg-[#f6f8fb] p-5 md:p-6">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Icon
                name="location"
                size={18}
              />
            </div>

            <div>
              <h1 className="text-[21px] font-semibold tracking-tight text-slate-900">
                Pincode Serviceability
              </h1>

              <p className="mt-0.5 text-[12px] text-slate-400">
                Check delivery availability for any pincode
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-500 shadow-[0_1px_3px_rgba(15,23,42,0.03)] transition hover:border-slate-300 hover:bg-slate-50"
        >
          <Icon
            name="refresh"
            size={14}
          />
          Reset
        </button>
      </div>

      {/* ==================================================
          MAIN GRID
      ================================================== */}

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">

        {/* =================================================
            LEFT - CHECK FORM
        ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">

          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[13px] font-semibold text-slate-800">
              Pincode Details
            </p>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Enter a pincode to check Delhivery service availability.
            </p>
          </div>

          <form
            onSubmit={handleCheck}
            className="p-5"
          >
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Pincode
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Icon
                    name="location"
                    size={15}
                  />
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    );
                    setError("");
                    setResult(null);
                  }}
                  placeholder="302012"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-sky-300 focus:bg-white focus:ring-1 focus:ring-sky-100"
                />
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-[11px] font-medium text-rose-600">
                {error}
              </div>
            )}

            {/* BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Checking...
                </>
              ) : (
                <>
                  <Icon
                    name="search"
                    size={14}
                  />
                  Check Serviceability
                </>
              )}
            </button>
          </form>
        </div>

        {/* =================================================
            RIGHT - RESULT
        ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">

          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-slate-800">
                  Serviceability Result
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Delhivery delivery availability
                </p>
              </div>

              <span className="rounded-md bg-slate-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                DELHIVERY
              </span>
            </div>
          </div>

          <div className="p-5">

            {!result ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center text-center">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                  <Icon
                    name="location"
                    size={22}
                  />
                </div>

                <p className="mt-4 text-[12px] font-semibold text-slate-600">
                  No pincode checked yet
                </p>

                <p className="mt-1 max-w-[230px] text-[10px] leading-5 text-slate-400">
                  Enter a 6-digit pincode and check its delivery availability.
                </p>

              </div>
            ) : (
              <div className="space-y-3">

                {/* RESULT CARD */}

                <div
                  className={`rounded-xl border p-4 ${resultConfig.wrapper}`}
                >
                  <div className="flex items-start gap-3">

                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${resultConfig.iconWrapper}`}
                    >
                      <Icon
                        name={resultConfig.icon}
                        size={19}
                      />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-[14px] font-semibold ${resultConfig.titleColor}`}
                      >
                        {resultConfig.title}
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-slate-500">
                        {resultConfig.subtitle}
                      </p>
                    </div>

                  </div>
                </div>

                {/* PINCODE */}

                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Pincode
                    </span>

                    <span className="text-[12px] font-semibold text-slate-700">
                      {result.pincode}
                    </span>
                  </div>
                </div>

                {/* STATUS */}

                <div className="rounded-lg border border-slate-100 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Status
                    </span>

                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {result.status?.replace(
                        /_/g,
                        " "
                      )}
                    </span>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default Serviceability;