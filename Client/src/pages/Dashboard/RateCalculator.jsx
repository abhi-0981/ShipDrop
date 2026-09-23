import { useEffect, useState } from "react";
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

  if (name === "calculator") {
    return (
      <svg {...common}>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 11h.01M12 11h.01M16 11h.01" />
        <path d="M8 15h.01M12 15h.01M16 15h.01" />
        <path d="M8 18h.01M12 18h4" />
      </svg>
    );
  }

  if (name === "location") {
    return (
      <svg {...common}>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "truck") {
    return (
      <svg {...common}>
        <path d="M3 6h11v10H3z" />
        <path d="M14 9h4l3 3v4h-7V9Z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
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

  if (name === "arrow-right") {
    return (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    );
  }

  return null;
};

// ======================================================
// HELPERS
// ======================================================

const formatAmount = (amount) => {
  const value = Number(amount || 0);

  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getRateValue = (result) => {
  if (!result) {
    return null;
  }

  const candidates = [
    result.shipping_charge,
    result.total_charge,
    result.total,
    result.final_charge,
    result.amount,
    result.price,
  ];

  for (const value of candidates) {
    const numeric = Number(value);

    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
};

const getResultZone = (result) =>
  result?.zone ||
  result?.final_zone ||
  "—";

const getResultDistance = (result) => {
  const distance = Number(result?.distance_km);

  if (
    Number.isFinite(distance) &&
    distance > 0
  ) {
    return `${distance.toFixed(1)} km`;
  }

  return "—";
};

// ======================================================
// RATE CARD
// ======================================================

const RateCard = ({
  title,
  subtitle,
  icon,
  rate,
  accent = "slate",
}) => {
  const value = getRateValue(rate);

  const iconClass =
    accent === "sky"
      ? "bg-sky-50 text-sky-600"
      : "bg-slate-100 text-slate-500";

  return (
    <div
      className={`rounded-xl border p-1.5 transition ${rate
        ? "border-slate-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
        : "border-slate-100 bg-slate-50"
        }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
          >
            <Icon
              name={icon}
              size={17}
            />
          </div>

          <div>
            <p className="text-[13px] font-semibold text-slate-700">
              {title}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              {subtitle}
            </p>
          </div>
        </div>

        {value !== null ? (
          <p className="text-[20px] font-semibold tracking-tight text-slate-800">
            {formatAmount(value)}
          </p>
        ) : (
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-400">
            Not available
          </span>
        )}
      </div>

      {rate && (
        <div className="mt-2.5 flex items-center gap-5 border-t border-slate-100 pt-2.5">
          <div>
            <span className="text-[10px] text-slate-400">
              Zone
            </span>

            <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
              {getResultZone(rate)}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-slate-400">
              Distance
            </span>

            <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
              {getResultDistance(rate)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ======================================================
// RATE CALCULATOR
// ======================================================

function RateCalculator() {
  const [user, setUser] = useState(null);

  const [pickupPincode, setPickupPincode] =
    useState("");

  const [deliveryPincode, setDeliveryPincode] =
    useState("");

  const [weight, setWeight] =
    useState("");

  const [productPrice, setProductPrice] =
    useState("");

  const [paymentType, setPaymentType] =
    useState("PREPAID");

  const [rateLoading, setRateLoading] =
    useState(false);

  const [rateError, setRateError] =
    useState("");

  const [shippingOptions, setShippingOptions] =
    useState(null);

  // ====================================================
  // USER
  // ====================================================

  useEffect(() => {
    try {
      const savedUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      if (savedUser?.id) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error(
        "Rate calculator user error:",
        error
      );
    }
  }, []);

  // ====================================================
  // CALCULATE RATE
  // ====================================================

  const handleCalculateRate = async (event) => {
    event.preventDefault();

    setRateError("");
    setShippingOptions(null);

    let currentUser = user;

    try {
      if (!currentUser?.id) {
        currentUser = JSON.parse(
          localStorage.getItem("user") || "null"
        );
      }
    } catch {
      currentUser = null;
    }

    if (!currentUser?.id) {
      setRateError(
        "User session not found. Please login again."
      );
      return;
    }

    const pickup =
      String(pickupPincode).trim();

    const delivery =
      String(deliveryPincode).trim();

    const numericWeight =
      Number(weight);

    const numericProductPrice =
      Number(productPrice || 0);

    // -------------------------------
    // VALIDATION
    // -------------------------------

    if (!/^\d{6}$/.test(pickup)) {
      setRateError(
        "Enter a valid 6-digit pickup pincode."
      );
      return;
    }

    if (!/^\d{6}$/.test(delivery)) {
      setRateError(
        "Enter a valid 6-digit delivery pincode."
      );
      return;
    }

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0
    ) {
      setRateError(
        "Enter a valid weight."
      );
      return;
    }

    if (
      !Number.isFinite(
        numericProductPrice
      ) ||
      numericProductPrice < 0
    ) {
      setRateError(
        "Enter a valid product price."
      );
      return;
    }

    setRateLoading(true);

    try {
      const response =
        await api.post(
          "/rate/calculate-options",
          {
            user_id: currentUser.id,

            pickup_pincode:
              pickup,

            delivery_pincode:
              delivery,

            weight:
              numericWeight,

            payment_type:
              paymentType === "COD"
                ? "COD"
                : "Pre-paid",

            product_value:
              numericProductPrice,
          }
        );

      const data =
        response?.data;

      if (!data?.success) {
        throw new Error(
          data?.message ||
          "Unable to calculate shipping rate"
        );
      }

      setShippingOptions(data);
    } catch (error) {
      console.error(
        "Rate calculation error:",
        error
      );

      setRateError(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to calculate shipping rate"
      );
    } finally {
      setRateLoading(false);
    }
  };

  // ====================================================
  // RESET
  // ====================================================

  const handleReset = () => {
    setPickupPincode("");
    setDeliveryPincode("");
    setWeight("");
    setProductPrice("");
    setPaymentType("PREPAID");
    setRateError("");
    setShippingOptions(null);
  };

  const roadRate =
    shippingOptions?.road || null;

  const airRate =
    shippingOptions?.air || null;

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
                name="calculator"
                size={18}
              />
            </div>

            <div>
              <h1 className="text-[21px] font-semibold tracking-tight text-slate-900">
                Rate Calculator
              </h1>

              <p className="mt-0.5 text-[12px] text-slate-400">
                Calculate your shipping rate instantly
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
            LEFT - CALCULATOR FORM
        ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">

          {/* HEADER */}

          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-[13px] font-semibold text-slate-800">
              Shipment Details
            </p>

            <p className="mt-0.5 text-[11px] text-slate-400">
              Enter your shipment information to calculate available rates.
            </p>
          </div>

          {/* FORM */}

          <form
            onSubmit={handleCalculateRate}
            className="p-5"
          >

            {/* PINCODES */}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                  Pickup Pincode
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
                    value={pickupPincode}
                    onChange={(e) =>
                      setPickupPincode(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="302001"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-sky-300 focus:bg-white focus:ring-1 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                  Delivery Pincode
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
                    value={deliveryPincode}
                    onChange={(e) =>
                      setDeliveryPincode(
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="110001"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-sky-300 focus:bg-white focus:ring-1 focus:ring-sky-100"
                  />
                </div>
              </div>
            </div>

            {/* WEIGHT + PRICE */}

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                  Weight
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={weight}
                    onChange={(e) =>
                      setWeight(
                        e.target.value
                      )
                    }
                    placeholder="1.00"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-10 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-sky-300 focus:bg-white focus:ring-1 focus:ring-sky-100"
                  />

                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                  Product Price
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) =>
                      setProductPrice(
                        e.target.value
                      )
                    }
                    placeholder="500"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-3 text-[12px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-sky-300 focus:bg-white focus:ring-1 focus:ring-sky-100"
                  />
                </div>
              </div>
            </div>

            {/* PAYMENT MODE */}

            <div className="mt-4">
              <label className="mb-1.5 block text-[11px] font-semibold text-slate-500">
                Payment Mode
              </label>

              <div className="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">

                <button
                  type="button"
                  onClick={() =>
                    setPaymentType(
                      "PREPAID"
                    )
                  }
                  className={`h-9 rounded-md text-[11px] font-semibold transition ${paymentType === "PREPAID"
                    ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(15,23,42,0.10)]"
                    : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  Prepaid
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentType(
                      "COD"
                    )
                  }
                  className={`h-9 rounded-md text-[11px] font-semibold transition ${paymentType === "COD"
                    ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(15,23,42,0.10)]"
                    : "text-slate-400 hover:text-slate-600"
                    }`}
                >
                  COD
                </button>

              </div>
            </div>

            {/* ERROR */}

            {rateError && (
              <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-[11px] font-medium text-rose-600">
                {rateError}
              </div>
            )}

            {/* BUTTON */}

            <button
              type="submit"
              disabled={rateLoading}
              className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 text-[12px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {rateLoading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Calculating...
                </>
              ) : (
                <>
                  <Icon
                    name="calculator"
                    size={14}
                  />
                  Calculate Shipping Rate
                </>
              )}
            </button>

          </form>
        </div>

        {/* =================================================
            RIGHT - RESULTS
        ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">

          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-[13px] font-semibold text-slate-800">
                  Available Rates
                </p>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Your assigned shipping rates
                </p>
              </div>

              <span className="rounded-md bg-slate-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                {paymentType === "COD"
                  ? "COD"
                  : "Prepaid"}
              </span>

            </div>
          </div>

          <div className="p-5">

            {!shippingOptions ? (
              <div className="flex min-h-[310px] flex-col items-center justify-center text-center">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                  <Icon
                    name="calculator"
                    size={22}
                  />
                </div>

                <p className="mt-4 text-[12px] font-semibold text-slate-600">
                  No rate calculated yet
                </p>

                <p className="mt-1 max-w-[230px] text-[10px] leading-5 text-slate-400">
                  Enter your shipment details and calculate the rate to see available Road and Air options.
                </p>

              </div>
            ) : (
              <div className="space-y-2.5">

                <RateCard
                  title="By Road"
                  subtitle="Surface"
                  icon="truck"
                  rate={roadRate}
                />

                <RateCard
                  title="By Air"
                  subtitle="Express"
                  icon="truck"
                  rate={airRate}
                  accent="sky"
                />



              </div>
            )}

          </div>
        </div>
      </div>

      {/* ==================================================
          INFO
      ================================================== */}


    </div>
  );
}

export default RateCalculator;