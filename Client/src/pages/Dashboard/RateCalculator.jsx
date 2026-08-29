import { useState } from "react";
import api from "../../services/api";
function RateCalculator() {

  const [pickupPincode, setPickupPincode] =
    useState("");

  const [deliveryPincode, setDeliveryPincode] =
    useState("");

  const [weight, setWeight] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState("");


  // ========================================
  // CALCULATE RATES
  // ========================================

  const calculateRates = async (e) => {

    e.preventDefault();

    setError("");
    setResult(null);


    // ======================================
    // PINCODE VALIDATION
    // ======================================

    if (
      !/^\d{6}$/.test(
        pickupPincode.trim()
      )
    ) {

      setError(
        "Enter a valid 6-digit pickup pincode"
      );

      return;

    }


    if (
      !/^\d{6}$/.test(
        deliveryPincode.trim()
      )
    ) {

      setError(
        "Enter a valid 6-digit delivery pincode"
      );

      return;

    }


    // ======================================
    // WEIGHT VALIDATION
    // ======================================

    const numericWeight =
      Number(weight);


    if (
      !numericWeight ||
      numericWeight <= 0
    ) {

      setError(
        "Enter a valid package weight"
      );

      return;

    }


    try {

      setLoading(true);


      const response =
        await api.post(
          "/rate/calculate-options",
          {
            pickup_pincode:
              pickupPincode.trim(),

            delivery_pincode:
              deliveryPincode.trim(),

            weight:
              numericWeight,
          }
        );


      if (
        !response.data ||
        !response.data.success
      ) {

        throw new Error(
          response.data?.message ||
          "Unable to calculate rates"
        );

      }


      setResult(
        response.data
      );


    } catch (err) {

      console.error(
        "Rate calculator error:",
        err
      );


      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to calculate shipping rates"
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="min-h-screen bg-slate-50 p-6">

      <div className="mx-auto max-w-5xl">


        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="mb-6">

          <h1 className="text-2xl font-bold text-slate-900">
            Rate Calculator
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Calculate shipping charges instantly
          </p>

        </div>


        {/* ================================= */}
        {/* CALCULATOR CARD */}
        {/* ================================= */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <form
            onSubmit={calculateRates}
          >

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">


              {/* PICKUP PINCODE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Pickup Pincode
                </label>

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
                  placeholder="Enter pickup pincode"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                />

              </div>


              {/* DELIVERY PINCODE */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Delivery Pincode
                </label>

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
                  placeholder="Enter delivery pincode"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                />

              </div>


              {/* WEIGHT */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Package Weight
                </label>

                <div className="flex">

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={weight}
                    onChange={(e) =>
                      setWeight(
                        e.target.value
                      )
                    }
                    placeholder="Enter weight"
                    className="min-w-0 flex-1 rounded-l-xl border border-r-0 border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
                  />

                  <div className="flex items-center rounded-r-xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-600">
                    Kg
                  </div>

                </div>

                <p className="mt-1.5 text-xs text-slate-400">
                  Minimum chargeable weight is 0.5 Kg
                </p>

              </div>

            </div>


            {/* ERROR */}

            {error && (

              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>

            )}


            {/* BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-[#008dd2] px-5 py-3 font-medium text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading
                ? "Calculating Rates..."
                : "Calculate Rates"}

            </button>

          </form>

        </div>


        {/* ================================= */}
        {/* RESULTS */}
        {/* ================================= */}

        {result && (

          <div className="mt-6">

            <div className="mb-4">

              <h2 className="text-lg font-bold text-slate-900">
                Shipping Rates
              </h2>

              <p className="text-sm text-slate-500">
                Available shipping options for your shipment
              </p>

            </div>


            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">


              {/* ================================= */}
              {/* SHIPDROP ROAD */}
              {/* ================================= */}

              <RateCard
                title="ShipDrop Express"
                subtitle="By Road"
                service="ROAD"
                data={result.road}
              />


              {/* ================================= */}
              {/* SHADOWFAX ROAD */}
              {/* ================================= */}

              <RateCard
                title="Shadowfax"
                subtitle="By Road"
                service="SHADOWFAX_ROAD"
                data={result.road}
              />


              {/* ================================= */}
              {/* SHIPDROP AIR */}
              {/* ================================= */}

              <RateCard
                title="ShipDrop Express"
                subtitle="By Air"
                service="AIR"
                data={result.air}
              />

            </div>


            {/* ================================= */}
            {/* DETAILS */}
            {/* ================================= */}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

                <Detail
                  label="Pickup"
                  value={
                    pickupPincode
                  }
                />

                <Detail
                  label="Delivery"
                  value={
                    deliveryPincode
                  }
                />

                <Detail
                  label="Weight"
                  value={`${weight} Kg`}
                />

                <Detail
                  label="Zone"
                  value={
                    result.road?.zone ||
                    "-"
                  }
                />

              </div>

            </div>

          </div>

        )}

      </div>

    </div>

  );

}


// ==================================================
// RATE CARD
// ==================================================

function RateCard({
  title,
  subtitle,
  data,
}) {

  if (!data) {
    return null;
  }


  return (

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>

          <h3 className="font-semibold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>

        </div>

        <div className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          Zone {data.zone}
        </div>

      </div>


      <div className="mt-5">

        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Shipping Charge
        </p>

        <p className="mt-1 text-2xl font-bold text-[#008dd2]">
          ₹{Number(
            data.shipping_charge
          ).toFixed(2)}
        </p>

      </div>


      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">

        <span>
          Distance
        </span>

        <span className="font-medium text-slate-700">
          {data.distance_km === null ||
          data.distance_km === undefined
            ? "-"
            : `${data.distance_km} Km`}
        </span>

      </div>

    </div>

  );

}


// ==================================================
// DETAIL
// ==================================================

function Detail({
  label,
  value,
}) {

  return (

    <div className="rounded-xl bg-slate-50 p-3">

      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value}
      </p>

    </div>

  );

}


export default RateCalculator;