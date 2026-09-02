import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";


// ======================================================
// INITIAL FORM
// ======================================================

const initialForm = {
  warehouse_name: "",
  contact_name: "",
  phone: "",
  email: "",
  gstin: "",

  address_line1: "",
  address_line2: "",
  floor_no: "",
  landmark: "",

  pincode: "",
  city: "",
  state: "",
  country: "India",
};


// ======================================================
// COMPONENT
// ======================================================

function PickupAddress() {

  // ====================================================
  // STATE
  // ====================================================

  const [warehouses, setWarehouses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [editingWarehouse, setEditingWarehouse] =
    useState(null);

  const [form, setForm] =
    useState({
      ...initialForm,
    });

  const [defaultWarehouseId, setDefaultWarehouseId] =
    useState("");


  // ====================================================
  // GET USER
  // ====================================================

  const getUser = () => {

    try {

      return JSON.parse(
        localStorage.getItem("user")
      );

    } catch {

      return null;

    }

  };


  // ====================================================
  // GET USER ID
  // ====================================================

  const getUserId = () => {

    const user = getUser();

    return user?.id || null;

  };


  // ====================================================
  // DEFAULT STORAGE KEY
  // ====================================================

  const getDefaultStorageKey = () => {

    const userId =
      getUserId();

    if (userId) {

      return `shipdrop_default_warehouse_${userId}`;

    }

    return "shipdrop_default_warehouse";

  };


  // ====================================================
  // LOAD WAREHOUSES
  // ====================================================

  const loadWarehouses = async () => {

    const userId =
      getUserId();


    if (!userId) {

      toast.error(
        "User session not found. Please login again."
      );

      setLoading(false);

      return;

    }


    try {

      setLoading(true);


      const response =
        await api.get(
          "/warehouses",
          {
            params: {
              user_id: userId,
            },
          }
        );


      const list =
        Array.isArray(
          response.data?.warehouses
        )
          ? response.data.warehouses
          : [];


      setWarehouses(list);


      // ================================================
      // LOAD SAVED DEFAULT
      // ================================================

      const savedDefault =
        localStorage.getItem(
          getDefaultStorageKey()
        );


      if (
        savedDefault &&
        list.some(
          (warehouse) =>
            String(warehouse.id) ===
            String(savedDefault)
        )
      ) {

        setDefaultWarehouseId(
          String(savedDefault)
        );

      } else if (
        list.length > 0
      ) {

        // First warehouse becomes default
        // only when no valid default exists.

        const firstId =
          String(list[0].id);


        setDefaultWarehouseId(
          firstId
        );


        localStorage.setItem(
          getDefaultStorageKey(),
          firstId
        );

      } else {

        setDefaultWarehouseId("");

      }

    } catch (error) {

      console.log(
        "Load warehouses error:",
        error
      );


      toast.error(
        error.response?.data?.message ||
        "Unable to load pickup addresses"
      );

    } finally {

      setLoading(false);

    }

  };


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {

    loadWarehouses();

  }, []);


  // ====================================================
  // SET DEFAULT
  // ====================================================

  const setAsDefault = (
    warehouseId
  ) => {

    const id =
      String(warehouseId);


    setDefaultWarehouseId(id);


    localStorage.setItem(
      getDefaultStorageKey(),
      id
    );


    toast.success(
      "Default pickup address updated"
    );

  };


  // ====================================================
  // OPEN ADD
  // ====================================================

  const openAdd = () => {

    setEditingWarehouse(null);

    setForm({
      ...initialForm,
    });

    setShowModal(true);

  };


  // ====================================================
  // OPEN EDIT
  // ====================================================

  const openEdit = (
    warehouse
  ) => {

    setEditingWarehouse(
      warehouse
    );


    setForm({

      warehouse_name:
        warehouse.warehouse_name ||
        "",

      contact_name:
        warehouse.contact_name ||
        "",

      phone:
        warehouse.phone ||
        "",

      email:
        warehouse.email ||
        "",

      gstin:
        warehouse.gstin ||
        "",

      address_line1:
        warehouse.address_line1 ||
        "",

      address_line2:
        warehouse.address_line2 ||
        "",

      floor_no:
        warehouse.floor_no ||
        "",

      landmark:
        warehouse.landmark ||
        "",

      pincode:
        warehouse.pincode ||
        "",

      city:
        warehouse.city ||
        "",

      state:
        warehouse.state ||
        "",

      country:
        warehouse.country ||
        "India",

    });


    setShowModal(true);

  };


  // ====================================================
  // CLOSE MODAL
  // ====================================================

  const closeModal = () => {

    if (saving) {

      return;

    }


    setShowModal(false);

    setEditingWarehouse(null);

    setForm({
      ...initialForm,
    });

  };


  // ====================================================
  // INPUT CHANGE
  // ====================================================

  const handleChange = (
    e
  ) => {

    const {
      name,
      value,
    } = e.target;


    // PHONE

    if (
      name === "phone"
    ) {

      setForm(
        (previous) => ({

          ...previous,

          phone:
            value
              .replace(/\D/g, "")
              .slice(0, 10),

        })
      );

      return;

    }


    // PINCODE

    if (
      name === "pincode"
    ) {

      setForm(
        (previous) => ({

          ...previous,

          pincode:
            value
              .replace(/\D/g, "")
              .slice(0, 6),

        })
      );

      return;

    }


    setForm(
      (previous) => ({

        ...previous,

        [name]:
          value,

      })
    );

  };


  // ====================================================
  // PINCODE LOOKUP
  // ====================================================

  const handlePincodeBlur = async () => {

    if (
      form.pincode.length !== 6
    ) {

      return;

    }


    try {

      const response =
        await fetch(
          `https://api.postalpincode.in/pincode/${form.pincode}`
        );


      const data =
        await response.json();


      const postOffice =
        data?.[0]?.PostOffice?.[0];


      if (!postOffice) {

        return;

      }


      setForm(
        (previous) => ({

          ...previous,

          city:
            postOffice.District ||
            postOffice.Block ||
            previous.city,

          state:
            postOffice.State ||
            previous.state,

          country:
            "India",

        })
      );

    } catch (error) {

      console.log(
        "Pincode lookup error:",
        error
      );

    }

  };


  // ====================================================
  // VALIDATE FORM
  // ====================================================

  const validateForm = () => {

    if (
      !form.warehouse_name.trim()
    ) {

      toast.error(
        "Warehouse name is required"
      );

      return false;

    }


    if (
      !form.contact_name.trim()
    ) {

      toast.error(
        "Contact name is required"
      );

      return false;

    }


    if (
      !/^\d{10}$/.test(
        form.phone
      )
    ) {

      toast.error(
        "Enter valid 10-digit phone number"
      );

      return false;

    }


    if (
      !form.address_line1.trim()
    ) {

      toast.error(
        "Pickup address is required"
      );

      return false;

    }


    if (
      !/^\d{6}$/.test(
        form.pincode
      )
    ) {

      toast.error(
        "Enter valid 6-digit pincode"
      );

      return false;

    }


    if (
      !form.city.trim()
    ) {

      toast.error(
        "City is required"
      );

      return false;

    }


    if (
      !form.state.trim()
    ) {

      toast.error(
        "State is required"
      );

      return false;

    }


    return true;

  };


  // ====================================================
  // SAVE
  // ====================================================

  const handleSave = async (
    e
  ) => {

    e.preventDefault();


    if (!validateForm()) {

      return;

    }


    const userId =
      getUserId();


    if (!userId) {

      toast.error(
        "Please login again"
      );

      return;

    }


    setSaving(true);


    try {

      const payload = {

        user_id:
          userId,

        warehouse_name:
          form.warehouse_name.trim(),

        contact_name:
          form.contact_name.trim(),

        phone:
          form.phone,

        email:
          form.email.trim() ||
          null,

        gstin:
          form.gstin.trim() ||
          null,

        address_line1:
          form.address_line1.trim(),

        address_line2:
          form.address_line2.trim() ||
          null,

        floor_no:
          form.floor_no.trim() ||
          null,

        landmark:
          form.landmark.trim() ||
          null,

        pincode:
          form.pincode,

        city:
          form.city.trim(),

        state:
          form.state.trim(),

        country:
          "India",

        /*
         * Existing backend currently expects
         * return address during CREATE.
         *
         * We keep it synced with pickup address.
         */

        return_address:
          form.address_line1.trim(),

        return_city:
          form.city.trim(),

        return_pincode:
          form.pincode,

        return_state:
          form.state.trim(),

        return_country:
          "India",

        status:
          editingWarehouse?.status ||
          "ACTIVE",

        delhivery_registered:
          editingWarehouse
            ?.delhivery_registered
            ? 1
            : 0,

      };


      // ==================================================
      // UPDATE
      // ==================================================

      if (
        editingWarehouse
      ) {

        const response =
          await api.put(
            `/warehouses/${editingWarehouse.id}`,
            payload
          );


        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            "Unable to update warehouse"
          );

        }


        toast.success(
          "Pickup address updated successfully"
        );

      }


      // ==================================================
      // CREATE
      // ==================================================

      else {

        const response =
          await api.post(
            "/warehouses/create",
            payload
          );


        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            "Unable to create warehouse"
          );

        }


        const newWarehouseId =
          response.data?.warehouse_id;


        // If this is first warehouse,
        // automatically make it default.

        if (
          !defaultWarehouseId &&
          newWarehouseId
        ) {

          setAsDefault(
            newWarehouseId
          );

        }


        toast.success(
          "Pickup address added successfully"
        );

      }


      closeModal();


      // IMPORTANT:
      // Fetch fresh DB data after save.

      await loadWarehouses();

    } catch (error) {

      console.log(
        "Save warehouse error:",
        error
      );


      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to save pickup address"
      );

    } finally {

      setSaving(false);

    }

  };

  // ====================================================
  // FORMAT ADDRESS
  // ====================================================

  const getAddress = (
    warehouse
  ) => {

    return [

      warehouse.address_line1,

      warehouse.address_line2,

      warehouse.landmark,

      warehouse.city,

      warehouse.state,

      warehouse.pincode,

    ]
      .filter(Boolean)
      .join(", ");

  };


  // ====================================================
  // JSX
  // ====================================================

  return (

    <div className="min-h-screen bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:px-7">

      <div className="mx-auto w-full max-w-[1450px]">


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-5 flex items-center justify-between gap-4">

          <div className="min-w-0">

            <h1 className="text-[23px] font-bold tracking-tight text-slate-900">
              Pickup Address
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Manage your pickup warehouses and addresses
            </p>

          </div>


          <button
            type="button"
            onClick={openAdd}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#008dd2] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#007fbe]"
          >

            <span className="text-base leading-none">
              +
            </span>

            Add Pickup Address

          </button>

        </div>


        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {loading ? (

            <div className="flex min-h-[220px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

                <p className="mt-3 text-xs text-slate-500">
                  Loading pickup addresses...
                </p>

              </div>

            </div>

          ) : warehouses.length === 0 ? (

            <div className="px-6 py-14 text-center">

              <h2 className="text-base font-semibold text-slate-800">
                No pickup addresses
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Add your first warehouse to start shipping.
              </p>

              <button
                type="button"
                onClick={openAdd}
                className="mt-4 rounded-lg bg-[#008dd2] px-4 py-2 text-xs font-semibold text-white"
              >
                Add Pickup Address
              </button>

            </div>

          ) : (

            <div className="w-full">

              <table className="w-full table-fixed border-collapse text-[13px]">

                {/* ======================================== */}
                {/* HEADER */}
                {/* ======================================== */}

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50/70">

                    <th className="w-[15%] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Warehouse
                    </th>

                    <th className="w-[13%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Contact
                    </th>

                    <th className="w-[25%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Address
                    </th>

                    <th className="w-[9%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Pincode
                    </th>

                    <th className="w-[9%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="w-[11%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Delhivery
                    </th>

                    <th className="w-[9%] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Default
                    </th>

                    <th className="w-[7%] px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>

                  </tr>

                </thead>


                {/* ======================================== */}
                {/* BODY */}
                {/* ======================================== */}

                <tbody>

                  {warehouses.map(
                    (warehouse) => {

                      const isDefault =
                        String(
                          defaultWarehouseId
                        ) ===
                        String(
                          warehouse.id
                        );


                      return (

                        <tr
                          key={
                            warehouse.id
                          }
                          className="border-b border-slate-100 transition hover:bg-slate-50/60"
                        >

                          {/* WAREHOUSE */}

                          <td className="px-4 py-3">

                            <p className="truncate text-sm font-semibold text-slate-800">
                              {
                                warehouse.warehouse_name
                              }
                            </p>

                          </td>


                          {/* CONTACT */}

                          <td className="px-3 py-3">

                            <p className="truncate text-xs font-medium text-slate-700">
                              {
                                warehouse.contact_name ||
                                "—"
                              }
                            </p>

                            <p className="mt-0.5 truncate text-[11px] text-slate-500">
                              {
                                warehouse.phone ||
                                "—"
                              }
                            </p>

                          </td>


                          {/* ADDRESS */}

                          <td className="px-3 py-3">

                            <p
                              title={
                                getAddress(
                                  warehouse
                                )
                              }
                              className="line-clamp-2 text-xs leading-5 text-slate-600"
                            >
                              {
                                getAddress(
                                  warehouse
                                )
                              }
                            </p>

                          </td>


                          {/* PINCODE */}

                          <td className="px-3 py-3">

                            <span className="text-xs font-medium text-slate-700">
                              {
                                warehouse.pincode
                              }
                            </span>

                          </td>


                          {/* STATUS */}

                          <td className="px-3 py-3">

                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
                              {
                                warehouse.status ||
                                "ACTIVE"
                              }
                            </span>

                          </td>


                          {/* DELHIVERY */}

                          <td className="px-3 py-3">

                            <div className="flex items-center gap-1.5">

                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  warehouse.delhivery_registered
                                    ? "bg-emerald-500"
                                    : "bg-amber-400"
                                }`}
                              />

                              <span className="truncate text-[11px] text-slate-600">

                                {
                                  warehouse.delhivery_registered
                                    ? "Registered"
                                    : "Not Registered"
                                }

                              </span>

                            </div>

                          </td>


                          {/* DEFAULT */}

                          <td className="px-3 py-3">

                            {isDefault ? (

                              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-600">
                                Default
                              </span>

                            ) : (

                              <button
                                type="button"
                                onClick={() =>
                                  setAsDefault(
                                    warehouse.id
                                  )
                                }
                                className="whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-1.5 text-[9px] font-semibold text-slate-600 transition hover:border-[#008dd2] hover:text-[#008dd2]"
                              >
                                Set Default
                              </button>

                            )}

                          </td>


                          {/* ACTIONS */}

                          <td className="px-4 py-3">

                            <div className="flex justify-end">

                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    warehouse
                                  )
                                }
                                title="Edit"
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-[#008dd2]/40 hover:bg-[#008dd2]/5 hover:text-[#008dd2]"
                              >

                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >

                                  <path d="M12 20h9" />

                                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />

                                </svg>

                              </button>

                            </div>

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>


                {/* ======================================== */}
                {/* FOOTER */}
                {/* ======================================== */}

                <tfoot>

                  <tr>

                    <td
                      colSpan="8"
                      className="px-4 py-2.5 text-[10px] text-slate-400"
                    >

                      {warehouses.length} pickup address
                      {warehouses.length !== 1
                        ? "es"
                        : ""}

                    </td>

                  </tr>

                </tfoot>

              </table>

            </div>

          )}

        </div>

      </div>


      {/* ================================================= */}
      {/* ADD / EDIT MODAL */}
      {/* ================================================= */}

      {showModal && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">

          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">

              <div>

                <h2 className="text-lg font-bold text-slate-900">

                  {editingWarehouse
                    ? "Edit Pickup Address"
                    : "Add Pickup Address"}

                </h2>

                <p className="mt-1 text-xs text-slate-500">

                  {editingWarehouse
                    ? "Update your pickup warehouse details"
                    : "Register a new pickup warehouse"}

                </p>

              </div>


              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >

                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >

                  <path d="M6 6l12 12M18 6 6 18" />

                </svg>

              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={handleSave}
              className="max-h-[75vh] overflow-y-auto"
            >

              <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">


                {/* WAREHOUSE NAME */}

                <div className="sm:col-span-2">

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Warehouse Name *
                  </label>

                  <input
                    name="warehouse_name"
                    value={
                      form.warehouse_name
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      Boolean(
                        editingWarehouse
                      )
                    }
                    placeholder="e.g. Jaipur Main Warehouse"
                    className={`h-11 w-full rounded-lg border px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15 ${
                      editingWarehouse
                        ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                        : "border-slate-300 bg-white"
                    }`}
                  />

                  {editingWarehouse && (

                    <p className="mt-1 text-[10px] text-slate-400">
                      Warehouse name cannot be changed after Delhivery registration.
                    </p>

                  )}

                </div>


                {/* CONTACT NAME */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Contact Name *
                  </label>

                  <input
                    name="contact_name"
                    value={
                      form.contact_name
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Contact person"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* PHONE */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Phone *
                  </label>

                  <input
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                    maxLength={10}
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* EMAIL */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Email address"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* GSTIN */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    GSTIN
                  </label>

                  <input
                    name="gstin"
                    value={
                      form.gstin
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Optional"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* ADDRESS */}

                <div className="sm:col-span-2">

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Pickup Address *
                  </label>

                  <input
                    name="address_line1"
                    value={
                      form.address_line1
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Complete pickup address"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* ADDRESS LINE 2 */}

                <div className="sm:col-span-2">

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Address Line 2
                  </label>

                  <input
                    name="address_line2"
                    value={
                      form.address_line2
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Area / locality / market"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* FLOOR */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Floor No.
                  </label>

                  <input
                    name="floor_no"
                    value={
                      form.floor_no
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Ground Floor"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* LANDMARK */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Landmark
                  </label>

                  <input
                    name="landmark"
                    value={
                      form.landmark
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Nearby landmark"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* PINCODE */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Pincode *
                  </label>

                  <input
                    name="pincode"
                    value={
                      form.pincode
                    }
                    onChange={
                      handleChange
                    }
                    onBlur={
                      handlePincodeBlur
                    }
                    placeholder="6-digit pincode"
                    inputMode="numeric"
                    maxLength={6}
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* CITY */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    City *
                  </label>

                  <input
                    name="city"
                    value={
                      form.city
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="City"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* STATE */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    State *
                  </label>

                  <input
                    name="state"
                    value={
                      form.state
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="State"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* COUNTRY */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Country
                  </label>

                  <input
                    value="India"
                    readOnly
                    className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                  />

                </div>

              </div>


              {/* ================================================= */}
              {/* FOOTER */}
              {/* ================================================= */}

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-10 rounded-lg border border-slate-300 px-5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#008dd2] px-6 text-xs font-semibold text-white transition hover:bg-[#007fbe] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving && (

                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  )}

                  {saving
                    ? "Saving..."
                    : editingWarehouse
                      ? "Update Address"
                      : "Save Pickup Address"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default PickupAddress;