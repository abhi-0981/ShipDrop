import { useEffect, useState } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  HiChevronDown,
  HiChevronUp,
  HiOutlineArrowLeft,
  HiOutlineUpload,
  HiOutlineDownload,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi";

import toast from "react-hot-toast";

import * as XLSX from "xlsx";


const API_BASE_URL =
  "http://localhost:5001/api";


// =====================================================
// NUMBER INPUT
// Kept outside SetRate so focus does not jump.
// =====================================================

const NumberInput = ({
  value,
  onChange,
  width = "90px",
  step = "0.01",
  min = "0",
}) => {

  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
      style={{
        width,
      }}
    />
  );
};


// =====================================================
// CHARGE INPUT
// =====================================================

const ChargeInput = ({
  value,
  suffix,
  onChange,
}) => {

  return (
    <div className="relative">

      <input
        type="number"
        min="0"
        step="0.01"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
      />

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
        {suffix}
      </span>

    </div>
  );
};


// =====================================================
// SET RATE
// =====================================================

function SetRate() {

  const {
    id,
  } = useParams();

  const navigate =
    useNavigate();


  // =====================================================
  // STATE
  // =====================================================

  const [
    rateCard,
    setRateCard,
  ] = useState(null);


  const [
    services,
    setServices,
  ] = useState([]);


  const [
    openService,
    setOpenService,
  ] = useState(null);


  const [
    rates,
    setRates,
  ] = useState({});


  const [
    additions,
    setAdditions,
  ] = useState({});


  const [
    loadingServices,
    setLoadingServices,
  ] = useState(true);


  const [
    loadingRates,
    setLoadingRates,
  ] = useState({});


  const [
    loadingAdditions,
    setLoadingAdditions,
  ] = useState({});


  const [
    savingRows,
    setSavingRows,
  ] = useState({});


  const [
    deletingRows,
    setDeletingRows,
  ] = useState({});


  const [
    savingSettings,
    setSavingSettings,
  ] = useState({});


  const [
    savingAllRates,
    setSavingAllRates,
  ] = useState({});


  const [
    savingAdditions,
    setSavingAdditions,
  ] = useState({});


  const [
    deletingAdditions,
    setDeletingAdditions,
  ] = useState({});


  // =====================================================
  // LOAD SERVICES
  // =====================================================

  const fetchServices =
    async () => {

      try {

        setLoadingServices(
          true
        );


        const response =
          await fetch(
            `${API_BASE_URL}/rate-cards/${id}/services`
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to load services"
          );

        }


        setRateCard(
          data.rateCard
        );


        setServices(
          data.services || []
        );

      } catch (error) {

        console.error(error);

        toast.error(
          error.message ||
          "Failed to load services"
        );

      } finally {

        setLoadingServices(
          false
        );

      }

    };


  useEffect(() => {

    fetchServices();

  }, [id]);


  // =====================================================
  // LOAD RATES
  // =====================================================

  const fetchRates =
    async (
      serviceId
    ) => {

      try {

        setLoadingRates(
          (prev) => ({
            ...prev,
            [serviceId]:
              true,
          })
        );


        const response =
          await fetch(
            `${API_BASE_URL}/rate-cards/${id}/services/${serviceId}/rates`
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to load rates"
          );

        }


        setRates(
          (prev) => ({
            ...prev,

            [serviceId]:
              data.rates || [],
          })
        );


        if (
          data.service
        ) {

          setServices(
            (prev) =>
              prev.map(
                (service) =>
                  service.id ===
                  serviceId
                    ? {
                        ...service,
                        ...data.service,
                      }
                    : service
              )
          );

        }

      } catch (error) {

        console.error(error);

        toast.error(
          error.message ||
          "Failed to load rates"
        );

      } finally {

        setLoadingRates(
          (prev) => ({
            ...prev,
            [serviceId]:
              false,
          })
        );

      }

    };


  // =====================================================
  // LOAD ADDITIONS
  // =====================================================

  const fetchAdditions =
    async (
      serviceId
    ) => {

      try {

        setLoadingAdditions(
          (prev) => ({
            ...prev,
            [serviceId]:
              true,
          })
        );


        const response =
          await fetch(
            `${API_BASE_URL}/rate-cards/${id}/services/${serviceId}/additions`
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to load additions"
          );

        }


        setAdditions(
          (prev) => ({
            ...prev,

            [serviceId]:
              (data.additions || [])
                .map(
                  (row) => ({
                    ...row,
                    isNew: false,
                  })
                ),
          })
        );

      } catch (error) {

        console.error(error);

        toast.error(
          error.message ||
          "Failed to load additions"
        );

      } finally {

        setLoadingAdditions(
          (prev) => ({
            ...prev,
            [serviceId]:
              false,
          })
        );

      }

    };


  // =====================================================
  // OPEN / CLOSE SERVICE
  // =====================================================

  const toggleService =
    async (
      serviceId
    ) => {

      if (
        openService ===
        serviceId
      ) {

        setOpenService(
          null
        );

        return;

      }


      setOpenService(
        serviceId
      );


      if (
        rates[serviceId] ===
        undefined
      ) {

        await fetchRates(
          serviceId
        );

      }


      if (
        additions[serviceId] ===
        undefined
      ) {

        await fetchAdditions(
          serviceId
        );

      }

    };


  // =====================================================
  // UPDATE SERVICE FIELD
  // =====================================================

  const updateServiceField =
    (
      serviceId,
      field,
      value
    ) => {

      setServices(
        (prev) =>
          prev.map(
            (service) =>
              service.id ===
              serviceId
                ? {
                    ...service,
                    [field]:
                      value,
                  }
                : service
          )
      );

    };


  // =====================================================
  // SAVE SERVICE SETTINGS
  // =====================================================

  const saveServiceSettings =
    async (
      serviceId,
      service
    ) => {

      const useApi =
        Number(
          service.use_shipping_charge_api
        ) === 1 ||
        service.use_shipping_charge_api ===
          true;


      const commission =
        Number(
          service.commission_percent ?? 0
        );


      const fsc =
        Number(
          service.fsc_percentage ?? 0
        );


      const minimumCod =
        Number(
          service.minimum_cod_charge ?? 0
        );


      const codPercentage =
        Number(
          service.cod_charge_percentage ?? 0
        );


      const toPay =
        Number(
          service.to_pay_charge ?? 0
        );


      const additionalCharge =
        Number(
          service.additional_charge ?? 0
        );


      if (
        !Number.isFinite(
          commission
        ) ||
        commission < 0 ||
        commission > 100
      ) {

        toast.error(
          "Commission must be between 0 and 100."
        );

        return false;

      }


      if (
        !Number.isFinite(
          fsc
        ) ||
        fsc < 0 ||
        fsc > 100
      ) {

        toast.error(
          "FSC Percentage must be between 0 and 100."
        );

        return false;

      }


      if (
        !Number.isFinite(
          minimumCod
        ) ||
        minimumCod < 0
      ) {

        toast.error(
          "Minimum COD Charge cannot be negative."
        );

        return false;

      }


      if (
        !Number.isFinite(
          codPercentage
        ) ||
        codPercentage < 0 ||
        codPercentage > 100
      ) {

        toast.error(
          "COD Charge Percentage must be between 0 and 100."
        );

        return false;

      }


      if (
        !Number.isFinite(
          toPay
        ) ||
        toPay < 0
      ) {

        toast.error(
          "To Pay Charge cannot be negative."
        );

        return false;

      }


      if (
        !Number.isFinite(
          additionalCharge
        ) ||
        additionalCharge < 0
      ) {

        toast.error(
          "Additional Charge cannot be negative."
        );

        return false;

      }


      try {

        setSavingSettings(
          (prev) => ({
            ...prev,
            [serviceId]:
              true,
          })
        );


        const response =
          await fetch(
            `${API_BASE_URL}/rate-cards/${id}/services/${serviceId}/settings`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({

                  use_shipping_charge_api:
                    useApi,

                  commission_percent:
                    commission,

                  fsc_percentage:
                    fsc,

                  minimum_cod_charge:
                    minimumCod,

                  cod_charge_percentage:
                    codPercentage,

                  to_pay_charge:
                    toPay,

                  additional_charge:
                    additionalCharge,

                }),

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to save settings"
          );

        }


        setServices(
          (prev) =>
            prev.map(
              (item) =>
                item.id ===
                serviceId
                  ? {
                      ...item,
                      ...service,

                      ...(data.service ||
                        {}),
                    }
                  : item
            )
        );


        toast.success(
          "Settings saved successfully."
        );


        return true;

      } catch (error) {

        console.error(error);

        toast.error(
          error.message ||
          "Failed to save settings"
        );

        return false;

      } finally {

        setSavingSettings(
          (prev) => ({
            ...prev,
            [serviceId]:
              false,
          })
        );

      }

    };


  // =====================================================
  // TOGGLE SHIPPING API
  // =====================================================

  const toggleApi =
    async (
      service
    ) => {

      const current =
        Number(
          service.use_shipping_charge_api
        ) === 1;


      await saveServiceSettings(
        service.id,
        {
          ...service,

          use_shipping_charge_api:
            !current,
        }
      );

    };


  // =====================================================
  // ADD WEIGHT SLAB
  // =====================================================

  const addWeightSlab =
    (
      serviceId
    ) => {

      const rows =
        rates[serviceId] || [];


      if (
        rows.some(
          (row) =>
            row.isNew === true
        )
      ) {

        toast.error(
          "Please save the current weight slab first."
        );

        return;

      }


      let weightFrom =
        "";


      if (
        rows.length > 0
      ) {

        weightFrom =
          rows[
            rows.length - 1
          ].weight_to ?? "";

      }


      const newRow = {

        id:
          `new-${Date.now()}-${Math.random()}`,

        service_id:
          serviceId,

        weight_from:
          weightFrom,

        weight_to:
          "",

        zone_a_rate:
          "",

        zone_b_rate:
          "",

        zone_c_rate:
          "",

        zone_d_rate:
          "",

        zone_e_rate:
          "",

        zone_f_rate:
          "",

        isNew:
          true,

      };


      setRates(
        (prev) => ({
          ...prev,

          [serviceId]: [
            ...(prev[serviceId] || []),
            newRow,
          ],

        })
      );

    };


  // =====================================================
  // UPDATE RATE
  // =====================================================

  const updateRateField =
    (
      serviceId,
      rowId,
      field,
      value
    ) => {

      setRates(
        (prev) => ({
          ...prev,

          [serviceId]:
            (
              prev[serviceId] || []
            ).map(
              (row) =>
                row.id ===
                rowId
                  ? {
                      ...row,
                      [field]:
                        value,
                    }
                  : row
            ),

        })
      );

    };


  // =====================================================
  // SAVE ONE RATE
  // =====================================================

  const saveRate =
    async (
      serviceId,
      row
    ) => {

      const weightFrom =
        Number(
          row.weight_from
        );


      const weightTo =
        Number(
          row.weight_to
        );


      if (
        !Number.isFinite(
          weightFrom
        ) ||
        !Number.isFinite(
          weightTo
        )
      ) {

        throw new Error(
          "Invalid weight values."
        );

      }


      if (
        weightFrom < 0
      ) {

        throw new Error(
          "Weight From cannot be negative."
        );

      }


      if (
        weightTo <=
        weightFrom
      ) {

        throw new Error(
          "Weight To must be greater than Weight From."
        );

      }


      const response =
        await fetch(
          `${API_BASE_URL}/rate-cards/${id}/services/${serviceId}/rates`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({

                weight_from:
                  weightFrom,

                weight_to:
                  weightTo,

                zone_a_rate:
                  Number(
                    row.zone_a_rate
                  ) || 0,

                zone_b_rate:
                  Number(
                    row.zone_b_rate
                  ) || 0,

                zone_c_rate:
                  Number(
                    row.zone_c_rate
                  ) || 0,

                zone_d_rate:
                  Number(
                    row.zone_d_rate
                  ) || 0,

                zone_e_rate:
                  Number(
                    row.zone_e_rate
                  ) || 0,

                zone_f_rate:
                  Number(
                    row.zone_f_rate
                  ) || 0,

              }),

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to save rate slab"
        );

      }


      return data.rate;

    };


  // =====================================================
  // SAVE ALL RATES
  // =====================================================

  const saveAllRates =
    async (
      serviceId
    ) => {

      const rows =
        rates[serviceId] || [];


      if (
        rows.length === 0
      ) {

        toast.error(
          "There are no weight slabs to save."
        );

        return;

      }


      try {

        setSavingAllRates(
          (prev) => ({
            ...prev,
            [serviceId]:
              true,
          })
        );


        const savedRows =
          [];


        for (
          const row
          of rows
        ) {

          const saved =
            await saveRate(
              serviceId,
              row
            );


          savedRows.push(
            saved
          );

        }


        setRates(
          (prev) => ({
            ...prev,

            [serviceId]:
              savedRows,

          })
        );


        await fetchRates(
          serviceId
        );


        toast.success(
          "All rate slabs saved successfully."
        );

      } catch (error) {

        console.error(error);

        toast.error(
          error.message ||
          "Failed to save rate slabs"
        );

      } finally {

        setSavingAllRates(
          (prev) => ({
            ...prev,
            [serviceId]:
              false,
          })
        );

      }

    };


  // =====================================================
  // DELETE RATE
  // =====================================================

  const deleteRate =
    async (
      serviceId,
      row
    ) => {

      if (
        row.isNew
      ) {

        setRates(
          (prev) => ({
            ...prev,

            [serviceId]:
              (
                prev[serviceId] || []
              ).filter(
                (item) =>
                  item.id !==
                  row.id
              ),

          })
        );

        return;

      }


      const confirmed =
        window.confirm(
          `Delete ${row.weight_from} - ${row.weight_to} kg rate slab?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setDeletingRows(
          (prev) => ({
            ...prev,
            [row.id]:
              true,
          })
        );


        const response =
          await fetch(
            `${API_BASE_URL}/rate-cards/${id}/services/${serviceId}/rates/${row.id}`,
            {
              method:
                "DELETE",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to delete rate slab"
          );

        }


        setRates(
          (prev) => ({
            ...prev,

            [serviceId]:
              (
                prev[serviceId] || []
              ).filter(
                (item) =>
                  item.id !==
                  row.id
              ),

          })
        );


        toast.success(
          data.message ||
          "Rate slab deleted successfully."
        );

      } catch (error) {

        console.error(error);

        toast.error(
          error.message ||
          "Failed to delete rate slab"
        );

      } finally {

        setDeletingRows(
          (prev) => ({
            ...prev,
            [row.id]:
              false,
          })
        );

      }

    };


  // =====================================================
  // ADDITION - ADD ROW
  // =====================================================

  const addAddition =
    (
      serviceId
    ) => {

      const rows =
        additions[serviceId] || [];


      if (
        rows.some(
          (row) =>
            row.isNew === true
        )
      ) {

        toast.error(
          "Please save the current addition first."
        );

        return;

      }


      const newRow = {

        id:
          `new-addition-${Date.now()}-${Math.random()}`,

        service_id:
          serviceId,

        from_kg:
          "",

        step_kg:
          "",

        zone_a_rate:
          "",

        zone_b_rate:
          "",

        zone_c_rate:
          "",

        zone_d_rate:
          "",

        zone_e_rate:
          "",

        zone_f_rate:
          "",

        isNew:
          true,

      };


      setAdditions(
        (prev) => ({
          ...prev,

          [serviceId]: [
            ...(prev[serviceId] || []),
            newRow,
          ],

        })
      );

    };


  // =====================================================
  // UPDATE ADDITION
  // =====================================================

  const updateAdditionField =
    (
      serviceId,
      rowId,
      field,
      value
    ) => {

      setAdditions(
        (prev) => ({
          ...prev,

          [serviceId]:
            (
              prev[serviceId] || []
            ).map(
              (row) =>
                row.id ===
                rowId
                  ? {
                      ...row,
                      [field]:
                        value,
                    }
                  : row
            ),

        })
      );

    };


  // =====================================================
  // SAVE ONE ADDITION
  // =====================================================

  const saveAddition =
    async (
      serviceId,
      row
    ) => {

      const from =
        Number(
          row.from_kg
        );


      const step =
        Number(
          row.step_kg
        );


      if (
        !Number.isFinite(
          from
        ) ||
        from < 0
      ) {

        throw new Error(
          "From (kg) must be a valid non-negative number."
        );

      }


      if (
        !Number.isFinite(
          step
        ) ||
        step <= 0
      ) {

        throw new Error(
          "Step (kg) must be greater than 0."
        );

      }


      const zones = [

        Number(
          row.zone_a_rate
        ) || 0,

        Number(
          row.zone_b_rate
        ) || 0,

        Number(
          row.zone_c_rate
        ) || 0,

        Number(
          row.zone_d_rate
        ) || 0,

        Number(
          row.zone_e_rate
        ) || 0,

        Number(
          row.zone_f_rate
        ) || 0,

      ];


      if (
        zones.some(
          (value) =>
            !Number.isFinite(
              value
            ) ||
            value < 0
        )
      ) {

        throw new Error(
          "Zone addition rates must be valid non-negative numbers."
        );

      }


      const body = {

        from_kg:
          from,

        step_kg:
          step,

        zone_a_rate:
          zones[0],

        zone_b_rate:
          zones[1],

        zone_c_rate:
          zones[2],

        zone_d_rate:
          zones[3],

        zone_e_rate:
          zones[4],

        zone_f_rate:
          zones[5],

      };


      if (
        !row.isNew
      ) {

        body.id =
          row.id;

      }


      const response =
        await fetch(
          `${API_BASE_URL}/rate-cards/${id}/services/${serviceId}/additions`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to save addition rule"
        );

      }


      return {

        ...(data.addition || {}),

        isNew:
          false,

      };

    };


  // =====================================================
  // SAVE ALL ADDITIONS
  // =====================================================

  const saveAllAdditions =
    async (
      serviceId
    ) => {

      const rows =
        additions[serviceId] || [];


      if (
        rows.length === 0
      ) {

        toast.error(
          "There are no addition rules to save."
        );

        return;

      }


      try {

        setSavingAdditions(
          (prev) => ({
            ...prev,
            [serviceId]:
              true,
          })
        );


        const savedRows =
          [];


        for (
          const row
          of rows
        ) {

          const saved =
            await saveAddition(
              serviceId,
              row
            );


          savedRows.push(
            saved
          );

        }


        setAdditions(
          (prev) => ({
            ...prev,

            [serviceId]:
              savedRows,

          })
        );


        toast.success(
          "Additions saved successfully."
        );

      } catch (error) {

        console.error(error);

        toast.error(
          error.message ||
          "Failed to save additions"
        );

      } finally {

        setSavingAdditions(
          (prev) => ({
            ...prev,
            [serviceId]:
              false,
          })
        );

      }

    };


  // =====================================================
  // DELETE ADDITION
  // =====================================================

  const deleteAddition =
    async (
      serviceId,
      row
    ) => {

      if (
        row.isNew
      ) {

        setAdditions(
          (prev) => ({
            ...prev,

            [serviceId]:
              (
                prev[serviceId] || []
              ).filter(
                (item) =>
                  item.id !==
                  row.id
              ),

          })
        );

        return;

      }


      const confirmed =
        window.confirm(
          `Delete addition rule from ${row.from_kg} kg?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setDeletingAdditions(
          (prev) => ({
            ...prev,

            [row.id]:
              true,

          })
        );


        const response =
          await fetch(
            `${API_BASE_URL}/rate-cards/${id}/services/${serviceId}/additions/${row.id}`,
            {
              method:
                "DELETE",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to delete addition rule"
          );

        }


        setAdditions(
          (prev) => ({
            ...prev,

            [serviceId]:
              (
                prev[serviceId] || []
              ).filter(
                (item) =>
                  item.id !==
                  row.id
              ),

          })
        );


        toast.success(
          data.message ||
          "Addition rule deleted successfully."
        );

      } catch (error) {

        console.error(error);

        toast.error(
          error.message ||
          "Failed to delete addition rule"
        );

      } finally {

        setDeletingAdditions(
          (prev) => ({
            ...prev,

            [row.id]:
              false,

          })
        );

      }

    };


  // =====================================================
  // IMPORT EXCEL
  // =====================================================

  const importExcel =
    (
      serviceId,
      event
    ) => {

      const file =
        event.target.files?.[0];


      if (!file) {
        return;
      }


      const reader =
        new FileReader();


      reader.onload =
        (e) => {

          try {

            const data =
              new Uint8Array(
                e.target.result
              );


            const workbook =
              XLSX.read(
                data,
                {
                  type:
                    "array",
                }
              );


            const sheet =
              workbook.Sheets[
                workbook.SheetNames[0]
              ];


            const rows =
              XLSX.utils.sheet_to_json(
                sheet,
                {
                  defval:
                    "",
                }
              );


            if (
              rows.length === 0
            ) {

              toast.error(
                "Excel file is empty."
              );

              return;

            }


            const getValue =
              (
                row,
                names
              ) => {

                const keys =
                  Object.keys(
                    row
                  );


                const matched =
                  keys.find(
                    (key) =>
                      names.includes(
                        key
                          .toString()
                          .trim()
                          .toLowerCase()
                      )
                  );


                return matched ===
                  undefined
                  ? ""
                  : row[
                      matched
                    ];

              };


            const imported =
              rows
                .map(
                  (row) => ({

                    id:
                      `import-${Date.now()}-${Math.random()}`,

                    service_id:
                      serviceId,

                    weight_from:
                      getValue(
                        row,
                        [
                          "min weight",
                          "min_weight",
                          "weight from",
                          "weight_from",
                          "from",
                        ]
                      ),

                    weight_to:
                      getValue(
                        row,
                        [
                          "max weight",
                          "max_weight",
                          "weight to",
                          "weight_to",
                          "to",
                        ]
                      ),

                    zone_a_rate:
                      getValue(
                        row,
                        [
                          "zone a",
                          "zone_a",
                          "zone a rate",
                          "zone_a_rate",
                          "a",
                        ]
                      ),

                    zone_b_rate:
                      getValue(
                        row,
                        [
                          "zone b",
                          "zone_b",
                          "zone b rate",
                          "zone_b_rate",
                          "b",
                        ]
                      ),

                    zone_c_rate:
                      getValue(
                        row,
                        [
                          "zone c",
                          "zone_c",
                          "zone c rate",
                          "zone_c_rate",
                          "c",
                        ]
                      ),

                    zone_d_rate:
                      getValue(
                        row,
                        [
                          "zone d",
                          "zone_d",
                          "zone d rate",
                          "zone_d_rate",
                          "d",
                        ]
                      ),

                    zone_e_rate:
                      getValue(
                        row,
                        [
                          "zone e",
                          "zone_e",
                          "zone e rate",
                          "zone_e_rate",
                          "e",
                        ]
                      ),

                    zone_f_rate:
                      getValue(
                        row,
                        [
                          "zone f",
                          "zone_f",
                          "zone f rate",
                          "zone_f_rate",
                          "f",
                        ]
                      ),

                    isNew:
                      true,

                  })
                )
                .filter(
                  (row) =>
                    row.weight_from !==
                      "" ||
                    row.weight_to !==
                      ""
                );


            if (
              imported.length ===
              0
            ) {

              toast.error(
                "No valid rate rows found in Excel."
              );

              return;

            }


            setRates(
              (prev) => ({
                ...prev,

                [serviceId]:
                  imported,

              })
            );


            toast.success(
              `${imported.length} slabs imported. Click Save Changes.`
            );

          } catch (error) {

            console.error(error);

            toast.error(
              "Failed to read Excel file."
            );

          }

        };


      reader.readAsArrayBuffer(
        file
      );


      event.target.value =
        "";

    };


  // =====================================================
  // EXPORT EXCEL
  // =====================================================

  const exportExcel =
    (
      service
    ) => {

      const rows =
        rates[service.id] ||
        [];


      if (
        rows.length === 0
      ) {

        toast.error(
          "There are no rates to export."
        );

        return;

      }


      const exportRows =
        rows.map(
          (row) => ({

            "Min Weight":
              Number(
                row.weight_from
              ) || 0,

            "Max Weight":
              Number(
                row.weight_to
              ) || 0,

            "Zone A":
              Number(
                row.zone_a_rate
              ) || 0,

            "Zone B":
              Number(
                row.zone_b_rate
              ) || 0,

            "Zone C":
              Number(
                row.zone_c_rate
              ) || 0,

            "Zone D":
              Number(
                row.zone_d_rate
              ) || 0,

            "Zone E":
              Number(
                row.zone_e_rate
              ) || 0,

            "Zone F":
              Number(
                row.zone_f_rate
              ) || 0,

          })
        );


      const worksheet =
        XLSX.utils.json_to_sheet(
          exportRows
        );


      const workbook =
        XLSX.utils.book_new();


      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Rates"
      );


      const safeName =
        (
          rateCard?.name ||
          "Rate-Card"
        ).replace(
          /[\\/:*?"<>|]/g,
          "-"
        );


      XLSX.writeFile(
        workbook,
        `${safeName}-${service.service_type}-Rates.xlsx`
      );


      toast.success(
        "Rates exported successfully."
      );

    };


  // =====================================================
  // SERVICE NAME
  // =====================================================

  const getServiceName =
    (
      serviceType
    ) => {

      if (
        serviceType ===
        "ROAD"
      ) {

        return "Delhivery By Road";

      }


      if (
        serviceType ===
        "AIR"
      ) {

        return "Delhivery By Air";

      }


      return serviceType;

    };


  // =====================================================
  // SERVICE DESCRIPTION
  // =====================================================

  const getServiceDescription =
    (
      serviceType
    ) => {

      if (
        serviceType ===
        "ROAD"
      ) {

        return "Surface shipping rates • md=S";

      }


      if (
        serviceType ===
        "AIR"
      ) {

        return "Express shipping rates • md=E";

      }


      return "Shipping rates";

    };


  // =====================================================
  // LOADING
  // =====================================================

  if (
    loadingServices
  ) {

    return (

      <div className="p-7">

        <div className="flex h-64 items-center justify-center">

          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

        </div>

      </div>

    );

  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="p-7">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-7 flex items-start gap-4">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/rate-card"
            )
          }
          className="mt-1 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-[#008dd2]/30 hover:text-[#008dd2]"
          title="Back"
        >

          <HiOutlineArrowLeft
            size={18}
          />

        </button>


        <div>

          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#008dd2]">
            Rate Management
          </p>


          <h1 className="text-2xl font-semibold text-slate-900">
            Set Rate
          </h1>


          <p className="mt-1 text-sm text-slate-500">
            {rateCard?.name ||
              "Rate Card"}
          </p>

        </div>

      </div>


      {/* ================================================= */}
      {/* SERVICES */}
      {/* ================================================= */}

      <div className="space-y-4">

        {services.map(
          (service) => {

            const isOpen =
              openService ===
              service.id;


            const serviceRates =
              rates[
                service.id
              ] || [];


            const serviceAdditions =
              additions[
                service.id
              ] || [];


            const isLoading =
              loadingRates[
                service.id
              ];


            const additionsLoading =
              loadingAdditions[
                service.id
              ];


            const apiEnabled =
              Number(
                service.use_shipping_charge_api
              ) === 1;


            const settingsSaving =
              savingSettings[
                service.id
              ];


            const ratesSaving =
              savingAllRates[
                service.id
              ];


            const additionsSaving =
              savingAdditions[
                service.id
              ];


            return (

              <div
                key={
                  service.id
                }
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >


                {/* ===================================== */}
                {/* SERVICE HEADER */}
                {/* ===================================== */}

                <button
                  type="button"
                  onClick={() =>
                    toggleService(
                      service.id
                    )
                  }
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50/70"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#008dd2]/10 text-[#008dd2]">

                      <span className="text-sm font-bold">
                        {
                          service.service_type ===
                          "ROAD"
                            ? "S"
                            : "E"
                        }
                      </span>

                    </div>


                    <div>

                      <h2 className="text-sm font-semibold text-slate-800">
                        {getServiceName(
                          service.service_type
                        )}
                      </h2>


                      <p className="mt-0.5 text-xs text-slate-400">
                        {getServiceDescription(
                          service.service_type
                        )}
                      </p>

                    </div>

                  </div>


                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400">

                    {isOpen ? (
                      <HiChevronUp
                        size={19}
                      />
                    ) : (
                      <HiChevronDown
                        size={19}
                      />
                    )}

                  </div>

                </button>


                {/* ===================================== */}
                {/* SERVICE CONTENT */}
                {/* ===================================== */}

                {isOpen && (

                  <div className="border-t border-slate-100">


                    {/* ================================= */}
                    {/* API SETTINGS */}
                    {/* ================================= */}

                    <div className="px-5 pt-4">

                      <div className="flex min-h-[60px] items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">


                        <div className="flex items-center gap-3">

                          <span className="text-sm font-medium text-slate-700">
                            Use Shipping Charge API
                          </span>


                          <button
                            type="button"
                            disabled={
                              settingsSaving
                            }
                            onClick={() =>
                              toggleApi(
                                service
                              )
                            }
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                              apiEnabled
                                ? "bg-[#7257ff]"
                                : "bg-slate-300"
                            } ${
                              settingsSaving
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer"
                            }`}
                          >

                            <span
                              className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition ${
                                apiEnabled
                                  ? "translate-x-[22px]"
                                  : "translate-x-[2px]"
                              }`}
                            />

                          </button>


                          <span className="text-sm text-slate-600">
                            {apiEnabled
                              ? "Enable"
                              : "Disable"}
                          </span>

                        </div>


                        {apiEnabled && (

                          <div className="flex items-center gap-3">

                            <label className="text-sm font-medium text-slate-700">
                              Commission %
                            </label>


                            <ChargeInput
                              value={
                                service.commission_percent ??
                                0
                              }
                              suffix="%"
                              onChange={(value) =>
                                updateServiceField(
                                  service.id,
                                  "commission_percent",
                                  value
                                )
                              }
                            />


                            <button
                              type="button"
                              disabled={
                                settingsSaving
                              }
                              onClick={() =>
                                saveServiceSettings(
                                  service.id,
                                  service
                                )
                              }
                              className="h-9 rounded-lg bg-[#008dd2] px-4 text-xs font-medium text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
                            >

                              {settingsSaving
                                ? "Saving..."
                                : "Save"}

                            </button>

                          </div>

                        )}

                      </div>

                    </div>


                    {/* ================================= */}
                    {/* MANAGE RATES */}
                    {/* ================================= */}

                    <div className="flex items-center justify-between px-5 py-4">

                      <div>

                        <h3 className="text-sm font-semibold text-slate-800">
                          Manage Rates
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          Weight slabs and zone-wise rates
                        </p>

                      </div>


                      <div className="flex items-center gap-2">


                        <input
                          id={`excel-import-${service.id}`}
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          onChange={(e) =>
                            importExcel(
                              service.id,
                              e
                            )
                          }
                        />


                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById(
                                `excel-import-${service.id}`
                              )
                              ?.click()
                          }
                          className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-600 transition hover:border-[#008dd2]/30 hover:text-[#008dd2]"
                        >

                          <HiOutlineUpload
                            size={15}
                          />

                          Import Excel

                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            exportExcel(
                              service
                            )
                          }
                          className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-600 transition hover:border-[#008dd2]/30 hover:text-[#008dd2]"
                        >

                          <HiOutlineDownload
                            size={15}
                          />

                          Export Excel

                        </button>


                        <button
                          type="button"
                          onClick={() =>
                            addWeightSlab(
                              service.id
                            )
                          }
                          className="flex h-9 items-center gap-2 rounded-lg bg-[#008dd2] px-3.5 text-xs font-medium text-white transition hover:bg-[#007fbd]"
                        >

                          <HiOutlinePlus
                            size={16}
                          />

                          Add Weight Slab

                        </button>

                      </div>

                    </div>


                    {/* ================================= */}
                    {/* RATE DATA */}
                    {/* ================================= */}

                    {isLoading ? (

                      <div className="flex h-40 items-center justify-center">

                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

                      </div>

                    ) : serviceRates.length === 0 ? (

                      <div className="mx-5 mb-5 rounded-lg border border-dashed border-slate-200 py-12 text-center">

                        <p className="text-sm font-medium text-slate-600">
                          No weight slabs
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Add your first weight slab.
                        </p>

                      </div>

                    ) : (

                      <>

                        <div className="overflow-x-auto px-5 pb-5">

                          <table className="w-full min-w-[1150px] border-separate border-spacing-0">

                            <thead>

                              <tr>

                                {[
                                  "Min Weight",
                                  "Max Weight",
                                  "Zone A",
                                  "Zone B",
                                  "Zone C",
                                  "Zone D",
                                  "Zone E",
                                  "Zone F",
                                ].map(
                                  (
                                    heading
                                  ) => (

                                    <th
                                      key={
                                        heading
                                      }
                                      className="border-y border-slate-100 bg-slate-50 px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                                    >
                                      {heading}
                                    </th>

                                  )
                                )}


                                <th className="border-y border-slate-100 bg-slate-50 px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Action
                                </th>

                              </tr>

                            </thead>


                            <tbody>

                              {serviceRates.map(
                                (
                                  row
                                ) => {

                                  const deleting =
                                    deletingRows[
                                      row.id
                                    ];


                                  return (

                                    <tr
                                      key={
                                        row.id
                                      }
                                    >

                                      {[
                                        [
                                          "weight_from",
                                          "105px",
                                        ],
                                        [
                                          "weight_to",
                                          "105px",
                                        ],
                                        [
                                          "zone_a_rate",
                                          "90px",
                                        ],
                                        [
                                          "zone_b_rate",
                                          "90px",
                                        ],
                                        [
                                          "zone_c_rate",
                                          "90px",
                                        ],
                                        [
                                          "zone_d_rate",
                                          "90px",
                                        ],
                                        [
                                          "zone_e_rate",
                                          "90px",
                                        ],
                                        [
                                          "zone_f_rate",
                                          "90px",
                                        ],
                                      ].map(
                                        ([
                                          field,
                                          width,
                                        ]) => (

                                          <td
                                            key={
                                              field
                                            }
                                            className="border-b border-slate-100 px-3 py-3"
                                          >

                                            <NumberInput
                                              value={
                                                row[
                                                  field
                                                ]
                                              }
                                              width={
                                                width
                                              }
                                              onChange={(
                                                value
                                              ) =>
                                                updateRateField(
                                                  service.id,
                                                  row.id,
                                                  field,
                                                  value
                                                )
                                              }
                                            />

                                          </td>

                                        )
                                      )}


                                      <td className="border-b border-slate-100 px-3 py-3">

                                        <div className="flex items-center justify-end">

                                          <button
                                            type="button"
                                            disabled={
                                              deleting ||
                                              ratesSaving
                                            }
                                            onClick={() =>
                                              deleteRate(
                                                service.id,
                                                row
                                              )
                                            }
                                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            title="Delete"
                                          >

                                            {deleting ? (

                                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-red-500" />

                                            ) : (

                                              <HiOutlineTrash
                                                size={
                                                  17
                                                }
                                              />

                                            )}

                                          </button>

                                        </div>

                                      </td>

                                    </tr>

                                  );

                                }
                              )}

                            </tbody>

                          </table>

                        </div>


                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">

                          <p className="text-xs text-slate-400">

                            {serviceRates.length}
                            {" "}
                            weight slab
                            {serviceRates.length ===
                            1
                              ? ""
                              : "s"} loaded

                          </p>


                          <button
                            type="button"
                            disabled={
                              ratesSaving
                            }
                            onClick={() =>
                              saveAllRates(
                                service.id
                              )
                            }
                            className="h-10 rounded-lg bg-[#008dd2] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
                          >

                            {ratesSaving
                              ? "Saving All..."
                              : "Save Changes"}

                          </button>

                        </div>

                      </>

                    )}


                    {/* ================================= */}
                    {/* ADDITIONS */}
                    {/* ================================= */}

                    <div className="border-t border-slate-100 px-5 pb-5 pt-5">


                      <div className="mb-4 flex items-start justify-between gap-4">

                        <div>

                          <h3 className="text-sm font-semibold text-slate-800">
                            Additions (Additional Step / Per KG After)
                          </h3>


                          <p className="mt-1 text-xs text-slate-400">
                            Add a zone-wise amount for every additional weight step after the selected weight.
                          </p>

                        </div>


                        <button
                          type="button"
                          disabled={
                            additionsSaving ||
                            additionsLoading
                          }
                          onClick={() =>
                            addAddition(
                              service.id
                            )
                          }
                          className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#008dd2] px-3.5 text-xs font-medium text-[#008dd2] transition hover:bg-[#008dd2] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          <HiOutlinePlus
                            size={15}
                          />

                          Add Addition

                        </button>

                      </div>


                      {additionsLoading ? (

                        <div className="flex h-24 items-center justify-center rounded-lg border border-slate-100 bg-slate-50/30">

                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

                        </div>

                      ) : (

                        <div className="overflow-x-auto rounded-lg border border-slate-100">

                          <table className="w-full min-w-[1120px] border-separate border-spacing-0">

                            <thead>

                              <tr>

                                {[
                                  "From (kg)",
                                  "Step (kg)",
                                  "Zone A",
                                  "Zone B",
                                  "Zone C",
                                  "Zone D",
                                  "Zone E",
                                  "Zone F",
                                ].map(
                                  (
                                    heading
                                  ) => (

                                    <th
                                      key={
                                        heading
                                      }
                                      className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                                    >
                                      {heading}
                                    </th>

                                  )
                                )}


                                <th className="border-b border-slate-100 bg-slate-50 px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Action
                                </th>

                              </tr>

                            </thead>


                            <tbody>

                              {serviceAdditions.length ===
                              0 ? (

                                <tr>

                                  <td
                                    colSpan={
                                      9
                                    }
                                    className="px-4 py-8 text-center text-xs text-slate-400"
                                  >
                                    No addition rules. Click Add Addition to create one.
                                  </td>

                                </tr>

                              ) : (

                                serviceAdditions.map(
                                  (
                                    row
                                  ) => {

                                    const deleting =
                                      deletingAdditions[
                                        row.id
                                      ];


                                    return (

                                      <tr
                                        key={
                                          row.id
                                        }
                                      >

                                        {[
                                          [
                                            "from_kg",
                                            "95px",
                                          ],
                                          [
                                            "step_kg",
                                            "95px",
                                          ],
                                          [
                                            "zone_a_rate",
                                            "90px",
                                          ],
                                          [
                                            "zone_b_rate",
                                            "90px",
                                          ],
                                          [
                                            "zone_c_rate",
                                            "90px",
                                          ],
                                          [
                                            "zone_d_rate",
                                            "90px",
                                          ],
                                          [
                                            "zone_e_rate",
                                            "90px",
                                          ],
                                          [
                                            "zone_f_rate",
                                            "90px",
                                          ],
                                        ].map(
                                          ([
                                            field,
                                            width,
                                          ]) => (

                                            <td
                                              key={
                                                field
                                              }
                                              className="border-b border-slate-100 px-3 py-2.5"
                                            >

                                              <NumberInput
                                                value={
                                                  row[
                                                    field
                                                  ]
                                                }
                                                width={
                                                  width
                                                }
                                                onChange={(
                                                  value
                                                ) =>
                                                  updateAdditionField(
                                                    service.id,
                                                    row.id,
                                                    field,
                                                    value
                                                  )
                                                }
                                              />

                                            </td>

                                          )
                                        )}


                                        <td className="border-b border-slate-100 px-3 py-2.5">

                                          <div className="flex items-center justify-end">

                                            <button
                                              type="button"
                                              disabled={
                                                deleting ||
                                                additionsSaving
                                              }
                                              onClick={() =>
                                                deleteAddition(
                                                  service.id,
                                                  row
                                                )
                                              }
                                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                              title="Delete"
                                            >

                                              {deleting ? (

                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-red-500" />

                                              ) : (

                                                <HiOutlineTrash
                                                  size={
                                                    17
                                                  }
                                                />

                                              )}

                                            </button>

                                          </div>

                                        </td>

                                      </tr>

                                    );

                                  }
                                )

                              )}

                            </tbody>

                          </table>

                        </div>

                      )}


                      <div className="mt-4 flex items-center justify-between">

                        <p className="text-xs text-slate-400">

                          {serviceAdditions.length}
                          {" "}
                          addition rule
                          {serviceAdditions.length ===
                          1
                            ? ""
                            : "s"} loaded

                        </p>


                        <button
                          type="button"
                          disabled={
                            additionsSaving ||
                            additionsLoading ||
                            serviceAdditions.length ===
                              0
                          }
                          onClick={() =>
                            saveAllAdditions(
                              service.id
                            )
                          }
                          className="h-10 rounded-lg bg-[#008dd2] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
                        >

                          {additionsSaving
                            ? "Saving..."
                            : "Save Additions"}

                        </button>

                      </div>

                    </div>


                    {/* ================================= */}
                    {/* ADDITIONAL CHARGES */}
                    {/* ================================= */}

                    <div className="border-t border-slate-100 px-5 pb-5 pt-5">


                      <div className="mb-4">

                        <h3 className="text-sm font-semibold text-slate-800">
                          Additional Charges
                        </h3>


                        <p className="mt-1 text-xs text-slate-400">
                          Enter charges without GST. GST will be added when customer rates are shown.
                        </p>

                      </div>


                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">


                        {/* FSC */}

                        <div>

                          <label className="mb-1.5 block text-xs font-medium text-slate-600">
                            FSC Percentage
                          </label>


                          <ChargeInput
                            value={
                              service.fsc_percentage ??
                              0
                            }
                            suffix="%"
                            onChange={(value) =>
                              updateServiceField(
                                service.id,
                                "fsc_percentage",
                                value
                              )
                            }
                          />

                        </div>


                        {/* MIN COD */}

                        <div>

                          <label className="mb-1.5 block text-xs font-medium text-slate-600">
                            Minimum COD Charge
                          </label>


                          <ChargeInput
                            value={
                              service.minimum_cod_charge ??
                              0
                            }
                            suffix="₹"
                            onChange={(value) =>
                              updateServiceField(
                                service.id,
                                "minimum_cod_charge",
                                value
                              )
                            }
                          />

                        </div>


                        {/* COD % */}

                        <div>

                          <label className="mb-1.5 block text-xs font-medium text-slate-600">
                            COD Charge Percentage
                          </label>


                          <ChargeInput
                            value={
                              service.cod_charge_percentage ??
                              0
                            }
                            suffix="%"
                            onChange={(value) =>
                              updateServiceField(
                                service.id,
                                "cod_charge_percentage",
                                value
                              )
                            }
                          />

                        </div>


                        {/* TO PAY */}

                        <div>

                          <label className="mb-1.5 block text-xs font-medium text-slate-600">
                            To Pay Charge
                          </label>


                          <ChargeInput
                            value={
                              service.to_pay_charge ??
                              0
                            }
                            suffix="₹"
                            onChange={(value) =>
                              updateServiceField(
                                service.id,
                                "to_pay_charge",
                                value
                              )
                            }
                          />

                        </div>


                        {/* ADDITIONAL */}

                        <div>

                          <label className="mb-1.5 block text-xs font-medium text-slate-600">
                            Additional Charge
                          </label>


                          <ChargeInput
                            value={
                              service.additional_charge ??
                              0
                            }
                            suffix="₹"
                            onChange={(value) =>
                              updateServiceField(
                                service.id,
                                "additional_charge",
                                value
                              )
                            }
                          />

                        </div>

                      </div>


                      <div className="mt-4 flex justify-end">

                        <button
                          type="button"
                          disabled={
                            settingsSaving
                          }
                          onClick={() =>
                            saveServiceSettings(
                              service.id,
                              service
                            )
                          }
                          className="h-9 rounded-lg bg-[#008dd2] px-4 text-xs font-medium text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
                        >

                          {settingsSaving
                            ? "Saving..."
                            : "Save Charges"}

                        </button>

                      </div>

                    </div>


                  </div>

                )}

              </div>

            );

          }
        )}

      </div>

    </div>

  );

}


export default SetRate;