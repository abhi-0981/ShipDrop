import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../../services/api";


// ======================================================
// INITIAL FORM
// ======================================================

const initialForm = {
  name: "",
  phone: "",
  email: "",
  address_line1: "",
  address_line2: "",
  landmark: "",
  pincode: "",
  city: "",
  state: "",
  country: "India",
  is_default: false,
};


// ======================================================
// COMPONENT
// ======================================================

function ReturnAddresses() {

  // ====================================================
  // STATE
  // ====================================================

  const [addresses, setAddresses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [editingAddress, setEditingAddress] = useState(null);

  const [form, setForm] = useState({
    ...initialForm,
  });


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

    return (
      user?.id ||
      user?.user_id ||
      user?.userId ||
      null
    );

  };


  // ====================================================
  // LOAD RETURN ADDRESSES
  // ====================================================

  const loadAddresses = async () => {

    const userId = getUserId();

    if (!userId) {

      toast.error(
        "User session not found. Please login again."
      );

      setLoading(false);

      return;

    }


    try {

      setLoading(true);

      const response = await api.get(
        "/return-addresses",
        {
          params: {
            user_id: userId,
          },
        }
      );


      const list =
        Array.isArray(
          response.data?.return_addresses
        )
          ? response.data.return_addresses
          : Array.isArray(
              response.data?.addresses
            )
            ? response.data.addresses
            : [];


      setAddresses(list);

    } catch (error) {

      console.log(
        "Load return addresses error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
        "Unable to load return addresses"
      );

    } finally {

      setLoading(false);

    }

  };


  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {

    loadAddresses();

  }, []);


  // ====================================================
  // OPEN ADD
  // ====================================================

  const openAdd = () => {

    setEditingAddress(null);

    setForm({
      ...initialForm,
      is_default: addresses.length === 0,
    });

    setShowModal(true);

  };


  // ====================================================
  // OPEN EDIT
  // ====================================================

  const openEdit = (address) => {

    setEditingAddress(address);

    setForm({

      name:
        address.name ||
        "",

      phone:
        address.phone ||
        "",

      email:
        address.email ||
        "",

      address_line1:
        address.address_line1 ||
        "",

      address_line2:
        address.address_line2 ||
        "",

      landmark:
        address.landmark ||
        "",

      pincode:
        address.pincode ||
        "",

      city:
        address.city ||
        "",

      state:
        address.state ||
        "",

      country:
        address.country ||
        "India",

      is_default:
        Boolean(address.is_default),

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

    setEditingAddress(null);

    setForm({
      ...initialForm,
    });

  };


  // ====================================================
  // INPUT CHANGE
  // ====================================================

  const handleChange = (e) => {

    const {
      name,
      value,
      type,
      checked,
    } = e.target;


    // PHONE

    if (name === "phone") {

      setForm((previous) => ({

        ...previous,

        phone:
          value
            .replace(/\D/g, "")
            .slice(0, 10),

      }));

      return;

    }


    // PINCODE

    if (name === "pincode") {

      setForm((previous) => ({

        ...previous,

        pincode:
          value
            .replace(/\D/g, "")
            .slice(0, 6),

      }));

      return;

    }


    // CHECKBOX

    if (type === "checkbox") {

      setForm((previous) => ({

        ...previous,

        [name]: checked,

      }));

      return;

    }


    setForm((previous) => ({

      ...previous,

      [name]: value,

    }));

  };


  // ====================================================
  // PINCODE LOOKUP
  // ====================================================

  const handlePincodeBlur = async () => {

    if (form.pincode.length !== 6) {

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

        toast.error(
          "Invalid pincode"
        );

        return;

      }


      setForm((previous) => ({

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

      }));

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

    if (!form.name.trim()) {

      toast.error(
        "Name is required"
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


    if (!form.address_line1.trim()) {

      toast.error(
        "Return address is required"
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


    if (!form.city.trim()) {

      toast.error(
        "City is required"
      );

      return false;

    }


    if (!form.state.trim()) {

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

  const handleSave = async (e) => {

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

        name:
          form.name.trim(),

        phone:
          form.phone,

        email:
          form.email.trim() ||
          null,

        address_line1:
          form.address_line1.trim(),

        address_line2:
          form.address_line2.trim() ||
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

        is_default:
          form.is_default
            ? 1
            : 0,

      };


      // ==================================================
      // UPDATE
      // ==================================================

      if (editingAddress) {

        const response =
          await api.patch(
            `/return-addresses/${editingAddress.id}`,
            payload
          );


        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            "Unable to update return address"
          );

        }


        toast.success(
          "Return address updated successfully"
        );

      }


      // ==================================================
      // CREATE
      // ==================================================

      else {

        const response =
          await api.post(
            "/return-addresses",
            payload
          );


        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            "Unable to create return address"
          );

        }


        toast.success(
          "Return address added successfully"
        );

      }


      closeModal();

      await loadAddresses();

    } catch (error) {

      console.log(
        "Save return address error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Unable to save return address"
      );

    } finally {

      setSaving(false);

    }

  };


  // ====================================================
  // SET DEFAULT
  // ====================================================

  const setAsDefault = async (addressId) => {

    const userId =
      getUserId();


    if (!userId) {

      toast.error(
        "Please login again"
      );

      return;

    }


    try {

      await api.patch(
        `/return-addresses/${addressId}/default`,
        {
          user_id: userId,
        }
      );


      toast.success(
        "Default return address updated"
      );


      await loadAddresses();

    } catch (error) {

      console.log(
        "Set default return address error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
        "Unable to update default address"
      );

    }

  };


  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = async (address) => {

    const userId =
      getUserId();


    if (!userId) {

      toast.error(
        "Please login again"
      );

      return;

    }


    const confirmed =
      window.confirm(
        `Delete return address for "${address.name}"?`
      );


    if (!confirmed) {

      return;

    }


    try {

      await api.delete(
        `/return-addresses/${address.id}`,
        {
          data: {
            user_id: userId,
          },
        }
      );


      toast.success(
        "Return address deleted"
      );


      await loadAddresses();

    } catch (error) {

      console.log(
        "Delete return address error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
        "Unable to delete return address"
      );

    }

  };


  // ====================================================
  // FORMAT ADDRESS
  // ====================================================

  const getAddress = (address) => {

    return [

      address.address_line1,

      address.address_line2,

      address.landmark,

      address.city,

      address.state,

      address.pincode,

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
              Return Addresses
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Manage addresses used for returned shipments
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

            Add Return Address

          </button>

        </div>


        {/* ================================================= */}
        {/* ADDRESS LIST */}
        {/* ================================================= */}

        <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">


          {/* LOADING */}

          {loading ? (

            <div className="flex min-h-[220px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

                <p className="mt-3 text-xs text-slate-500">
                  Loading return addresses...
                </p>

              </div>

            </div>

          )


          /* EMPTY */

          : addresses.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-[#008dd2]">

                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >

                  <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z" />

                  <path d="M3 7.5 12 12l9-4.5" />

                  <path d="M12 12v9" />

                </svg>

              </div>


              <h2 className="mt-4 text-base font-semibold text-slate-800">
                No return addresses
              </h2>


              <p className="mt-1 text-xs text-slate-500">
                Add a return address to use for returned shipments.
              </p>


              <button
                type="button"
                onClick={openAdd}
                className="mt-4 rounded-lg bg-[#008dd2] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#007fbe]"
              >
                Add Return Address
              </button>

            </div>

          )


          /* LIST */

          : (

            <div>

              {/* TABLE HEADER */}

              <div className="hidden grid-cols-[18%_17%_35%_12%_18%] border-b border-slate-200 bg-slate-50/70 px-4 py-3 md:grid">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Name
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Contact
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Address
                </span>

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Default
                </span>

                <span className="text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </span>

              </div>


              {/* ADDRESS ROWS */}

              <div>

                {addresses.map((address) => {

                  const isDefault =
                    Boolean(
                      address.is_default
                    );


                  return (

                    <div
                      key={address.id}
                      className="border-b border-slate-100 px-4 py-4 transition last:border-b-0 hover:bg-slate-50/50 md:grid md:grid-cols-[18%_17%_35%_12%_18%] md:items-center"
                    >


                      {/* NAME */}

                      <div className="min-w-0">

                        <div className="flex items-center gap-2">

                          <p className="truncate text-sm font-semibold text-slate-800">
                            {address.name}
                          </p>

                          {isDefault && (

                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
                              Default
                            </span>

                          )}

                        </div>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Return Address #{address.id}
                        </p>

                      </div>


                      {/* CONTACT */}

                      <div className="mt-3 md:mt-0">

                        <p className="text-xs font-medium text-slate-700">
                          {address.phone || "—"}
                        </p>

                        {address.email && (

                          <p className="mt-0.5 truncate text-[11px] text-slate-400">
                            {address.email}
                          </p>

                        )}

                      </div>


                      {/* ADDRESS */}

                      <div className="mt-3 min-w-0 md:mt-0">

                        <p
                          title={getAddress(address)}
                          className="line-clamp-2 text-xs leading-5 text-slate-600"
                        >
                          {getAddress(address)}
                        </p>

                      </div>


                      {/* DEFAULT */}

                      <div className="mt-3 md:mt-0">

                        {isDefault ? (

                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-600">
                            Default
                          </span>

                        ) : (

                          <button
                            type="button"
                            onClick={() =>
                              setAsDefault(
                                address.id
                              )
                            }
                            className="whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-1.5 text-[9px] font-semibold text-slate-600 transition hover:border-[#008dd2] hover:text-[#008dd2]"
                          >
                            Set Default
                          </button>

                        )}

                      </div>


                      {/* ACTIONS */}

                      <div className="mt-3 flex items-center justify-between gap-2 md:mt-0 md:justify-end">

                        <div className="flex items-center gap-1.5">

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                address
                              )
                            }
                            title="Edit"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-[#008dd2]/40 hover:bg-[#008dd2]/5 hover:text-[#008dd2]"
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


                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                address
                              )
                            }
                            title="Delete"
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
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

                              <path d="M4 7h16" />

                              <path d="M10 11v6" />

                              <path d="M14 11v6" />

                              <path d="M6 7l1 13h10l1-13" />

                              <path d="M9 7V4h6v3" />

                            </svg>

                          </button>

                        </div>

                      </div>

                    </div>

                  );

                })}

              </div>


              {/* FOOTER */}

              <div className="border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-400">

                {addresses.length} return address
                {addresses.length !== 1 ? "es" : ""}

              </div>

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

                  {editingAddress
                    ? "Edit Return Address"
                    : "Add Return Address"}

                </h2>

                <p className="mt-1 text-xs text-slate-500">

                  {editingAddress
                    ? "Update your return address details"
                    : "Add an address where returned shipments should be delivered"}

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
                  strokeLinecap="round"
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


                {/* NAME */}

                <div>

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Return address name"
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
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile"
                    inputMode="numeric"
                    maxLength={10}
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* EMAIL */}

                <div className="sm:col-span-2">

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/15"
                  />

                </div>


                {/* ADDRESS LINE 1 */}

                <div className="sm:col-span-2">

                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Return Address *
                  </label>

                  <input
                    name="address_line1"
                    value={form.address_line1}
                    onChange={handleChange}
                    placeholder="Complete return address"
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
                    value={form.address_line2}
                    onChange={handleChange}
                    placeholder="Area / locality / market"
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
                    value={form.landmark}
                    onChange={handleChange}
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
                    value={form.pincode}
                    onChange={handleChange}
                    onBlur={handlePincodeBlur}
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
                    value={form.city}
                    onChange={handleChange}
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
                    value={form.state}
                    onChange={handleChange}
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


                {/* DEFAULT */}

                <div className="flex items-end">

                  <label className="flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">

                    <input
                      type="checkbox"
                      name="is_default"
                      checked={form.is_default}
                      onChange={handleChange}
                      className="h-4 w-4 accent-[#008dd2]"
                    />

                    <span>

                      <span className="block text-xs font-semibold text-slate-700">
                        Set as default
                      </span>

                      <span className="block text-[10px] text-slate-400">
                        Use this address automatically for returns
                      </span>

                    </span>

                  </label>

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
                    : editingAddress
                      ? "Update Address"
                      : "Save Return Address"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


export default ReturnAddresses;