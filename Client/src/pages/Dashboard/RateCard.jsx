import React, { useEffect, useMemo, useState } from "react";

import api from "../../services/api";

// ======================================================
// CONSTANTS
// ======================================================

const ZONE_FIELDS = [
  "zone_a_rate",
  "zone_b_rate",
  "zone_c_rate",
  "zone_d_rate",
  "zone_e_rate",
  "zone_f_rate",
];

// ======================================================
// SHIPPING SERVICES
// Single source of truth
// ======================================================

const SHIPPING_SERVICES = [
  {
    type: "ROAD",
    company: "Delivery",
    mode: "By Road",
    badge: "ROAD",
    color: "#008dd2",
  },
  {
    type: "AIR",
    company: "Delivery",
    mode: "By Air",
    badge: "AIR",
    color: "#7451ff",
  },
  {
    type: "SHADOWFAX_ROAD",
    company: "Shadowfax",
    mode: "By Road",
    badge: "SHADOWFAX ROAD",
    color: "#0f766e",
  },
];

const SERVICE_MAP = Object.fromEntries(
  SHIPPING_SERVICES.map((service) => [service.type, service]),
);

const getServiceConfig = (serviceType) => {
  const normalized = String(serviceType || "ROAD")
    .trim()
    .toUpperCase();

  return SERVICE_MAP[normalized] || SERVICE_MAP.ROAD;
};

// ======================================================
// CREATE EMPTY ROW
// ======================================================

const createEmptyRow = (serviceType) => ({
  id: `new-${serviceType}-${Date.now()}`,

  service_type: serviceType,

  weight_from: "",
  weight_to: "",

  zone_a_rate: "",
  zone_b_rate: "",
  zone_c_rate: "",
  zone_d_rate: "",
  zone_e_rate: "",
  zone_f_rate: "",

  isNew: true,
});

// ======================================================
// NUMBER INPUT
// Outside RateCard so focus does not reset
// ======================================================

const NumberInput = ({ value, onChange, className = "", ...props }) => {
  return (
    <input
      {...props}
      type="number"
      min="0"
      step="0.01"
      inputMode="decimal"
      value={value === null || value === undefined ? "" : value}
      onChange={(event) => onChange(event.target.value)}
      onWheel={(event) => {
        event.currentTarget.blur();
      }}
      className={`
        h-9
        rounded-md
        border
        border-slate-200
        bg-white
        px-2.5
        text-sm
        font-medium
        text-slate-700
        outline-none
        transition
        focus:border-[#008dd2]
        focus:ring-2
        focus:ring-[#008dd2]/10
        ${className}
      `}
    />
  );
};

// ======================================================
// RATE INPUT
// ======================================================

const RateInput = ({ value, onChange, ...props }) => {
  return (
    <NumberInput
      {...props}
      value={value}
      onChange={onChange}
      className="w-full"
    />
  );
};

// ======================================================
// WEIGHT INPUT
// ======================================================

const WeightInput = ({ value, onChange, ...props }) => {
  return (
    <NumberInput
      {...props}
      value={value}
      onChange={onChange}
      className="w-[82px]"
    />
  );
};

// ======================================================
// TOAST
// ======================================================

const Toast = ({ toast, onClose }) => {
  if (!toast) {
    return null;
  }

  const isError = toast.type === "error";

  return (
    <div
      className="
        fixed
        right-5
        top-5
        z-[9999]
      "
    >
      <div
        className={`
          flex
          min-w-[300px]
          max-w-[380px]
          items-start
          gap-3
          rounded-xl
          border
          bg-white
          px-4
          py-3
          shadow-[0_18px_50px_rgba(15,23,42,0.18)]
          ${isError ? "border-red-200" : "border-emerald-200"}
        `}
      >
        <div
          className={`
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-full
            ${
              isError
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-600"
            }
          `}
        >
          {isError ? (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="9" />

              <path d="M12 8v5" />

              <path d="M12 16.5h.01" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />

              <path d="M8 12l2.5 2.5L16 9" />
            </svg>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`
              text-xs
              font-extrabold
              ${isError ? "text-red-700" : "text-emerald-700"}
            `}
          >
            {isError ? "Something went wrong" : "Success"}
          </p>

          <p
            className="
              mt-0.5
              text-[11px]
              font-medium
              leading-5
              text-slate-500
            "
          >
            {toast.message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="
            text-lg
            leading-none
            text-slate-400
            transition
            hover:text-slate-700
          "
        >
          ×
        </button>
      </div>
    </div>
  );
};

// ======================================================
// RATE TABLE
// ======================================================

const RateTable = ({
  serviceType,
  rates,
  addingType,
  onChange,
  onSave,
  onCancel,
  savingId,
}) => {
  const service = getServiceConfig(serviceType);

  const getRowKey = (row) => {
    if (row.isNew) {
      return `${serviceType}-new`;
    }

    return String(row.id);
  };

  // ====================================================
  // KEYBOARD NAVIGATION
  // ====================================================

  const focusNext = (row, field) => {
    const fields = ["weight_from", "weight_to", ...ZONE_FIELDS];

    const currentIndex = fields.indexOf(field);

    if (currentIndex === -1) {
      return;
    }

    const nextIndex = currentIndex + 1;

    // -----------------------------------------------
    // NEXT FIELD
    // -----------------------------------------------

    if (nextIndex < fields.length) {
      const nextField = fields[nextIndex];

      const selector = `[data-row-key="${getRowKey(
        row,
      )}"][data-field="${nextField}"]`;

      const element = document.querySelector(selector);

      if (element) {
        requestAnimationFrame(() => {
          element.focus();

          element.select?.();
        });
      }

      return;
    }

    // -----------------------------------------------
    // NEXT ROW
    // -----------------------------------------------

    const currentRowIndex = rates.findIndex(
      (item) => getRowKey(item) === getRowKey(row),
    );

    if (currentRowIndex === -1) {
      return;
    }

    const nextRow = rates[currentRowIndex + 1];

    if (!nextRow) {
      return;
    }

    const selector = `[data-row-key="${getRowKey(
      nextRow,
    )}"][data-field="weight_from"]`;

    const element = document.querySelector(selector);

    if (element) {
      requestAnimationFrame(() => {
        element.focus();

        element.select?.();
      });
    }
  };

  const handleKeyDown = (event, row, field) => {
    if (event.key !== "Enter" && event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    focusNext(row, field);
  };

  return (
    <div
      className="
        overflow-x-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
      "
    >
      <table
        className="
          w-full
          border-collapse
        "
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <thead>
          <tr
            className="
              border-b
              border-slate-200
              bg-slate-50
            "
          >
            <th
              className="
                px-4
                py-3
                text-left
                text-[11px]
                font-extrabold
                uppercase
                tracking-wide
                text-slate-500
              "
            >
              Weight From
            </th>

            <th
              className="
                px-4
                py-3
                text-left
                text-[11px]
                font-extrabold
                uppercase
                tracking-wide
                text-slate-500
              "
            >
              Weight To
            </th>

            {ZONE_FIELDS.map((field) => (
              <th
                key={field}
                className="
                    px-4
                    py-3
                    text-left
                    text-[11px]
                    font-extrabold
                    uppercase
                    tracking-wide
                    text-slate-500
                  "
              >
                {field.replace("zone_", "").replace("_rate", "").toUpperCase()}
              </th>
            ))}

            <th
              className="
                px-4
                py-3
                text-left
                text-[11px]
                font-extrabold
                uppercase
                tracking-wide
                text-slate-500
              "
            >
              Action
            </th>
          </tr>
        </thead>

        {/* ==================================================
            BODY
        ================================================== */}

        <tbody>
          {rates.length === 0 ? (
            <tr>
              <td
                colSpan={3 + ZONE_FIELDS.length}
                className="
                  px-6
                  py-12
                  text-center
                "
              >
                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-500
                  "
                >
                  No rates added yet.
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-400
                  "
                >
                  Add a weight slab to get started.
                </p>
              </td>
            </tr>
          ) : (
            rates.map((row) => {
              const rowKey = getRowKey(row);

              const saving =
                savingId === (row.isNew ? `${serviceType}-new` : row.id);

              return (
                <tr
                  key={rowKey}
                  className={`
                      border-b
                      border-slate-100
                      last:border-b-0
                      ${row.isNew ? "bg-[#fbfcff]" : "bg-white"}
                    `}
                >
                  {/* WEIGHT FROM */}

                  <td
                    className="
                        px-4
                        py-3
                      "
                  >
                    <WeightInput
                      value={row.weight_from}
                      data-row-key={rowKey}
                      data-field="weight_from"
                      onKeyDown={(event) =>
                        handleKeyDown(event, row, "weight_from")
                      }
                      onChange={(value) => onChange(row, "weight_from", value)}
                    />
                  </td>

                  {/* WEIGHT TO */}

                  <td
                    className="
                        px-4
                        py-3
                      "
                  >
                    <WeightInput
                      value={row.weight_to}
                      data-row-key={rowKey}
                      data-field="weight_to"
                      onKeyDown={(event) =>
                        handleKeyDown(event, row, "weight_to")
                      }
                      onChange={(value) => onChange(row, "weight_to", value)}
                    />
                  </td>

                  {/* ZONES */}

                  {ZONE_FIELDS.map((field) => (
                    <td
                      key={field}
                      className="
                            px-4
                            py-3
                          "
                    >
                      <RateInput
                        value={row[field]}
                        data-row-key={rowKey}
                        data-field={field}
                        onKeyDown={(event) => handleKeyDown(event, row, field)}
                        onChange={(value) => onChange(row, field, value)}
                      />
                    </td>
                  ))}

                  {/* ACTION */}

                  <td
                    className="
                        px-4
                        py-3
                      "
                  >
                    {row.isNew ? (
                      <div
                        className="
                            flex
                            items-center
                            gap-2
                          "
                      >
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => onSave(row)}
                          className="
                              rounded-md
                              bg-[#008dd2]
                              px-3
                              py-2
                              text-xs
                              font-bold
                              text-white
                              transition
                              hover:bg-[#007bb9]
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>

                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => onCancel(serviceType)}
                          className="
                              rounded-md
                              border
                              border-slate-200
                              bg-white
                              px-3
                              py-2
                              text-xs
                              font-bold
                              text-slate-600
                              transition
                              hover:bg-slate-50
                              disabled:opacity-50
                            "
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => onSave(row)}
                        className="
                            rounded-md
                            border
                            border-[#008dd2]
                            bg-white
                            px-3
                            py-2
                            text-xs
                            font-bold
                            text-[#008dd2]
                            transition
                            hover:bg-[#f0f9ff]
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

// ======================================================
// RATE SECTION
// ======================================================

const RateSection = ({
  serviceType,
  rates,
  addingType,
  onAdd,
  onChange,
  onSave,
  onCancel,
  savingId,
}) => {
  const service = getServiceConfig(serviceType);

  const isAdding = addingType === serviceType;

  return (
    <section
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* ==================================================
          SECTION HEADER
      ================================================== */}

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-4
          border-b
          border-slate-200
          px-5
          py-4
        "
      >
        <div
          className="
            flex
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              bg-slate-50
            "
            style={{
              color: service.color,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 7h13v10H3z" />

              <path d="M16 10h3l2 3v4h-5z" />

              <circle cx="7" cy="18" r="1.5" />

              <circle cx="18" cy="18" r="1.5" />
            </svg>
          </div>

          <div>
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <h2
                className="
                  text-base
                  font-extrabold
                  text-slate-900
                "
              >
                {service.company}
              </h2>

              <span
                className="
                  rounded-full
                  bg-slate-100
                  px-2
                  py-1
                  text-[9px]
                  font-extrabold
                  uppercase
                  tracking-wide
                  text-slate-500
                "
              >
                {service.mode}
              </span>
            </div>

            <p
              className="
                mt-0.5
                text-xs
                text-slate-400
              "
            >
              Shipping rates for {service.company} {service.mode.toLowerCase()}.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isAdding}
          onClick={() => onAdd(serviceType)}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-[#008dd2]
            px-4
            py-2.5
            text-xs
            font-extrabold
            text-white
            transition
            hover:bg-[#007bb9]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <span
            className="
              text-base
              leading-none
            "
          >
            +
          </span>
          Add Weight Slab
        </button>
      </div>

      {/* ==================================================
          TABLE
      ================================================== */}

      <RateTable
        serviceType={serviceType}
        rates={rates}
        addingType={addingType}
        onChange={onChange}
        onSave={onSave}
        onCancel={onCancel}
        savingId={savingId}
      />
    </section>
  );
};

// ======================================================
// MAIN COMPONENT
// ======================================================

function RateCard() {
  const [rateCards, setRateCards] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [toast, setToast] = useState(null);

  const [addingType, setAddingType] = useState(null);

  const [savingId, setSavingId] = useState(null);

  // ====================================================
  // TOAST
  // ====================================================

  const showToast = (message, type = "success") => {
    setToast({
      message,
      type,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // ====================================================
  // FETCH RATE CARDS
  // ====================================================

  const fetchRateCards = async () => {
    try {
      setLoading(true);

      setError("");

      const response = await api.get("/rate-card");

      const data = response.data;

      if (data?.success === false) {
        throw new Error(data?.message || "Unable to fetch rate cards");
      }

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.rates)
          ? data.rates
          : Array.isArray(data?.rateCards)
            ? data.rateCards
            : [];

      // ---------------------------------------------
      // NORMALIZE SERVICE TYPE
      // ---------------------------------------------

      const normalized = rows.map((row) => ({
        ...row,

        service_type: String(row.service_type || "ROAD")
          .trim()
          .toUpperCase(),

        weight_from: row.weight_from ?? "",

        weight_to: row.weight_to ?? "",
      }));

      // ---------------------------------------------
      // SORT
      // ---------------------------------------------

      normalized.sort((a, b) => {
        const serviceA = SHIPPING_SERVICES.findIndex(
          (service) => service.type === a.service_type,
        );

        const serviceB = SHIPPING_SERVICES.findIndex(
          (service) => service.type === b.service_type,
        );

        if (serviceA !== serviceB) {
          return serviceA - serviceB;
        }

        return Number(a.weight_from) - Number(b.weight_from);
      });

      setRateCards(normalized);
    } catch (err) {
      console.log("Fetch rate cards error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load rate cards",
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    fetchRateCards();
  }, []);

  // ====================================================
  // GROUP BY SERVICE
  // Single memoized pass
  // ====================================================

  const ratesByService = useMemo(() => {
    const grouped = Object.fromEntries(
      SHIPPING_SERVICES.map((service) => [service.type, []]),
    );

    for (const row of rateCards) {
      if (grouped[row.service_type]) {
        grouped[row.service_type].push(row);
      }
    }

    return grouped;
  }, [rateCards]);

  // ====================================================
  // ROW CHANGE
  // ====================================================

  const handleRowChange = (row, field, value) => {
    setRateCards((previous) =>
      previous.map((item) => {
        const sameRow = row.isNew
          ? item.isNew && item.service_type === row.service_type
          : String(item.id) === String(row.id);

        if (!sameRow) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      }),
    );
  };

  // ====================================================
  // ADD NEW SLAB
  // ====================================================

  const addNewSlab = (serviceType) => {
    const alreadyAdding = rateCards.some(
      (item) => item.isNew && item.service_type === serviceType,
    );

    if (alreadyAdding) {
      return;
    }

    setRateCards((previous) => {
      const newRow = createEmptyRow(serviceType);

      return [...previous, newRow];
    });

    setAddingType(serviceType);

    // ---------------------------------------------
    // Focus first field after row is rendered
    // ---------------------------------------------

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const element = document.querySelector(
          `[data-row-key="${serviceType}-new"][data-field="weight_from"]`,
        );

        if (element) {
          element.focus();
        }
      });
    });
  };

  // ====================================================
  // CANCEL NEW ROW
  // ====================================================

  const cancelNewSlab = (serviceType) => {
    setRateCards((previous) =>
      previous.filter(
        (item) => !(item.isNew && item.service_type === serviceType),
      ),
    );

    setAddingType(null);
  };

  // ====================================================
  // VALIDATE
  // ====================================================

  const validateRow = (row) => {
    const from = Number(row.weight_from);

    const to = Number(row.weight_to);

    if (
      row.weight_from === "" ||
      row.weight_to === "" ||
      Number.isNaN(from) ||
      Number.isNaN(to) ||
      from < 0 ||
      to <= from
    ) {
      showToast("Please enter a valid weight slab.", "error");

      return false;
    }

    for (const field of ZONE_FIELDS) {
      const value = Number(row[field]);

      if (row[field] === "" || Number.isNaN(value) || value < 0) {
        showToast("Please enter valid rates for all zones.", "error");

        return false;
      }
    }

    return true;
  };

  // ====================================================
  // SAVE RATE
  // ====================================================

  const saveRate = async (row) => {
    if (!validateRow(row)) {
      return;
    }

    const serviceType = String(row.service_type).trim().toUpperCase();

    const saveKey = row.isNew ? `${serviceType}-new` : row.id;

    const payload = {
      service_type: serviceType,

      weight_from: Number(row.weight_from),

      weight_to: Number(row.weight_to),

      zone_a_rate: Number(row.zone_a_rate),

      zone_b_rate: Number(row.zone_b_rate),

      zone_c_rate: Number(row.zone_c_rate),

      zone_d_rate: Number(row.zone_d_rate),

      zone_e_rate: Number(row.zone_e_rate),

      zone_f_rate: Number(row.zone_f_rate),
    };

    try {
      setSavingId(saveKey);

      // ---------------------------------------------
      // CREATE
      // ---------------------------------------------

      if (row.isNew) {
        const response = await api.post("/rate-card", payload);

        if (response.data?.success === false) {
          throw new Error(response.data?.message || "Unable to add rate card");
        }

        showToast(`${serviceType} rate card added successfully`, "success");
      }

      // ---------------------------------------------
      // UPDATE
      // ---------------------------------------------
      else {
        const response = await api.put(`/rate-card/${row.id}`, payload);

        if (response.data?.success === false) {
          throw new Error(
            response.data?.message || "Unable to update rate card",
          );
        }

        showToast(`${serviceType} rate updated successfully`, "success");
      }

      // ---------------------------------------------
      // REFRESH
      // Keeps sorting correct
      // ---------------------------------------------

      await fetchRateCards();

      setAddingType(null);
    } catch (err) {
      console.log("Save rate error:", err);

      showToast(
        err.response?.data?.message ||
          err.message ||
          "Unable to save rate card",
        "error",
      );
    } finally {
      setSavingId(null);
    }
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div
        className="
          min-h-screen
          bg-[#F5F8FC]
          p-6
        "
      >
        <div
          className="
            mx-auto
            max-w-7xl
          "
        >
          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-10
              text-center
              shadow-sm
            "
          >
            <div
              className="
                mx-auto
                h-8
                w-8
                animate-spin
                rounded-full
                border-4
                border-slate-200
                border-t-[#008dd2]
              "
            />

            <p
              className="
                mt-3
                text-sm
                font-semibold
                text-slate-500
              "
            >
              Loading shipping rates...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // MAIN
  // ====================================================

  return (
    <div
      className="
        min-h-screen
        bg-[#F5F8FC]
        p-4
        md:p-6
      "
    >
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div
        className="
          mx-auto
          max-w-7xl
          space-y-5
        "
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h1
              className="
                text-2xl
                font-bold
                text-slate-900
              "
            >
              Rate Card
            </h1>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Manage shipping rates by service, weight and zone.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchRateCards}
            className="
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4
              py-2
              text-xs
              font-bold
              text-slate-700
              transition
              hover:bg-slate-50
            "
          >
            ↻ Refresh
          </button>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            className="
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              font-semibold
              text-red-700
            "
          >
            {error}
          </div>
        )}

        {/* ==================================================
            ALL SHIPPING SERVICES
        ================================================== */}

        {SHIPPING_SERVICES.map((service) => (
          <RateSection
            key={service.type}
            serviceType={service.type}
            rates={ratesByService[service.type] || []}
            addingType={addingType}
            onAdd={addNewSlab}
            onChange={handleRowChange}
            onSave={saveRate}
            onCancel={cancelNewSlab}
            savingId={savingId}
          />
        ))}
      </div>
    </div>
  );
}

export default RateCard;
