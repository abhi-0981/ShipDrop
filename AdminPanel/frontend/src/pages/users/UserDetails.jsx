import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  HiOutlineArrowLeft,
  HiOutlineUserCircle,
  HiOutlineSave,
} from "react-icons/hi";


const API_BASE_URL =
  "http://localhost:5001/api";


function UserDetails() {

  const navigate = useNavigate();
  const { id } = useParams();


  // =====================================================
  // STATES
  // =====================================================

  const [user, setUser] =
    useState(null);

  const [rateCards, setRateCards] =
    useState([]);

  const [selectedRateCard, setSelectedRateCard] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // =====================================================
  // LOAD USER + RATE CARDS
  // =====================================================

  const loadData = async () => {

    try {

      setLoading(true);
      setError("");
      setSuccess("");


      // -------------------------------------------------
      // USER
      // -------------------------------------------------

      const userResponse =
        await fetch(
          `${API_BASE_URL}/admin/users/${id}`
        );


      const userData =
        await userResponse.json();


      if (!userResponse.ok) {

        throw new Error(
          userData.message ||
          "Failed to load user"
        );
      }


      setUser(
        userData.user
      );


      setSelectedRateCard(
        userData.user.rate_card_id
          ? String(
              userData.user.rate_card_id
            )
          : ""
      );


      // -------------------------------------------------
      // RATE CARDS
      // -------------------------------------------------

      const rateCardResponse =
        await fetch(
          `${API_BASE_URL}/rate-cards`
        );


      const rateCardData =
        await rateCardResponse.json();


      if (!rateCardResponse.ok) {

        throw new Error(
          rateCardData.message ||
          "Failed to load rate cards"
        );
      }


      const activeRateCards =
        (
          rateCardData.rateCards ||
          []
        ).filter(
          (rateCard) =>
            Number(
              rateCard.is_active
            ) === 1
        );


      setRateCards(
        activeRateCards
      );

    } catch (err) {

      console.error(
        "Load user details error:",
        err
      );


      setError(
        err.message ||
        "Unable to load user details"
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadData();

  }, [id]);


  // =====================================================
  // SAVE RATE CARD
  // =====================================================

  const saveRateCard = async () => {

    try {

      setSaving(true);
      setError("");
      setSuccess("");


      const response =
        await fetch(
          `${API_BASE_URL}/admin/users/${id}/rate-card`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              rate_card_id:
                selectedRateCard
                  ? Number(
                      selectedRateCard
                    )
                  : null,

            }),

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to save rate card"
        );
      }


      setUser(
        data.user
      );


      setSelectedRateCard(
        data.user.rate_card_id
          ? String(
              data.user.rate_card_id
            )
          : ""
      );


      setSuccess(
        "Rate card saved successfully"
      );

    } catch (err) {

      console.error(
        "Save rate card error:",
        err
      );


      setError(
        err.message ||
        "Unable to save rate card"
      );

    } finally {

      setSaving(false);

    }
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="p-7">

        <div className="flex h-64 items-center justify-center">

          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />

        </div>

      </div>

    );
  }


  // =====================================================
  // ERROR / USER NOT FOUND
  // =====================================================

  if (!user) {

    return (

      <div className="p-7">

        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">

          {error ||
            "User not found"}

        </div>


        <button
          type="button"
          onClick={() =>
            navigate("/users")
          }
          className="mt-4 flex items-center gap-2 text-sm font-medium text-[#008dd2]"
        >

          <HiOutlineArrowLeft
            size={17}
          />

          Back to All Users

        </button>

      </div>

    );
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="p-7">


      {/* ================================================= */}
      {/* BACK */}
      {/* ================================================= */}

      <button
        type="button"
        onClick={() =>
          navigate("/users")
        }
        className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-[#008dd2]"
      >

        <HiOutlineArrowLeft
          size={17}
        />

        Back to All Users

      </button>


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-7">

        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#008dd2]">

          User Account

        </p>


        <h1 className="text-2xl font-semibold text-slate-900">

          {user.full_name}

        </h1>


        <p className="mt-1 text-sm text-slate-500">

          Manage user information and Rate Card assignment.

        </p>

      </div>


      {/* ================================================= */}
      {/* ALERTS */}
      {/* ================================================= */}

      {error && (

        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">

          {error}

        </div>

      )}


      {success && (

        <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">

          {success}

        </div>

      )}


      {/* ================================================= */}
      {/* CONTENT GRID */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[330px_1fr]">


        {/* ================================================= */}
        {/* USER PROFILE CARD */}
        {/* ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white p-5">


          {/* AVATAR */}

          <div className="mb-5 flex items-center gap-4">

            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-[#008dd2]/10 text-[#008dd2]">

              {user.profile_image ? (

                <img
                  src={
                    user.profile_image
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />

              ) : (

                <HiOutlineUserCircle
                  size={38}
                />

              )}

            </div>


            <div className="min-w-0">

              <h2 className="truncate text-lg font-semibold text-slate-900">

                {user.full_name}

              </h2>


              <p className="mt-1 text-xs text-slate-400">

                User #{user.id}

              </p>

            </div>

          </div>


          {/* DETAILS */}

          <div className="border-t border-slate-100 pt-4">


            <div className="py-3">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                Email

              </p>

              <p className="mt-1 break-all text-sm text-slate-700">

                {user.email ||
                  "—"}

              </p>

            </div>


            <div className="border-t border-slate-100 py-3">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                Phone

              </p>

              <p className="mt-1 text-sm text-slate-700">

                {user.phone_no ||
                  "—"}

              </p>

            </div>


            <div className="border-t border-slate-100 py-3">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                Company

              </p>

              <p className="mt-1 text-sm text-slate-700">

                {user.company_name ||
                  "—"}

              </p>

            </div>


            <div className="border-t border-slate-100 py-3">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                GST Number

              </p>

              <p className="mt-1 text-sm text-slate-700">

                {user.gst_no ||
                  "—"}

              </p>

            </div>


            <div className="border-t border-slate-100 py-3">

              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">

                Role

              </p>

              <span className="mt-1 inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600">

                {user.role ||
                  "user"}

              </span>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* SETTINGS CARD */}
        {/* ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white">


          {/* HEADER */}

          <div className="border-b border-slate-100 px-6 py-5">

            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#008dd2]">

              Account Settings

            </p>


            <h2 className="mt-1 text-lg font-semibold text-slate-900">

              Rate Card

            </h2>


            <p className="mt-1 text-sm text-slate-500">

              Assign a Rate Card to this user.

            </p>

          </div>


          {/* SETTINGS */}

          <div className="p-6">


            <div className="max-w-[520px]">


              <label className="mb-2 block text-xs font-medium text-slate-700">

                Rate Card

              </label>


              <select
                value={
                  selectedRateCard
                }
                onChange={(e) =>
                  setSelectedRateCard(
                    e.target.value
                  )
                }
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
              >

                <option value="">
                  Not Assigned
                </option>


                {rateCards.map(
                  (rateCard) => (

                    <option
                      key={
                        rateCard.id
                      }
                      value={
                        rateCard.id
                      }
                    >

                      {
                        rateCard.name
                      }

                    </option>

                  )
                )}

              </select>


              <p className="mt-2 text-xs text-slate-400">

                Only active Rate Cards are available for assignment.

              </p>

            </div>


            {/* DIVIDER */}

            <div className="my-7 border-t border-slate-100" />


            {/* SAVE */}

            <div className="flex justify-end">

              <button
                type="button"
                onClick={
                  saveRateCard
                }
                disabled={
                  saving
                }
                className="flex h-10 items-center gap-2 rounded-lg bg-[#008dd2] px-5 text-xs font-semibold text-white transition hover:bg-[#007fbd] disabled:cursor-not-allowed disabled:opacity-60"
              >

                <HiOutlineSave
                  size={17}
                />

                {saving
                  ? "Saving..."
                  : "Save"}

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );
}


export default UserDetails;