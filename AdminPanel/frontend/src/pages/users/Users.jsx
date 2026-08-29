import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  HiOutlineRefresh,
  HiOutlineUserCircle,
  HiOutlineSearch,
} from "react-icons/hi";


const API_BASE_URL =
  "http://localhost:5001/api";


function Users() {

  const navigate =
    useNavigate();


  // =====================================================
  // STATES
  // =====================================================

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");


  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = async () => {

    try {

      setLoading(true);
      setError("");


      const response =
        await fetch(
          `${API_BASE_URL}/admin/users`
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to load users"
        );
      }


      setUsers(
        data.users || []
      );

    } catch (err) {

      console.error(
        "Fetch users error:",
        err
      );

      setError(
        err.message ||
        "Unable to load users"
      );

    } finally {

      setLoading(false);
    }
  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    fetchUsers();

  }, []);


  // =====================================================
  // SEARCH
  // =====================================================

  const filteredUsers =
    users.filter((user) => {

      const searchText =
        search
          .toLowerCase()
          .trim();


      if (!searchText) {
        return true;
      }


      return (

        String(
          user.full_name || ""
        )
          .toLowerCase()
          .includes(searchText)

        ||

        String(
          user.company_name || ""
        )
          .toLowerCase()
          .includes(searchText)

        ||

        String(
          user.email || ""
        )
          .toLowerCase()
          .includes(searchText)

        ||

        String(
          user.phone_no || ""
        )
          .toLowerCase()
          .includes(searchText)

      );

    });


  // =====================================================
  // OPEN USER
  // =====================================================

  const openUser = (
    userId
  ) => {

    navigate(
      `/users/${userId}`
    );
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
  // PAGE
  // =====================================================

  return (

    <div className="p-7">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-7 flex items-start justify-between">

        <div>

          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#008dd2]">

            Users

          </p>


          <h1 className="text-2xl font-semibold text-slate-900">

            All Users

          </h1>


          <p className="mt-1 text-sm text-slate-500">

            View and manage all registered users.

          </p>

        </div>


        {/* REFRESH */}

        <button
          type="button"
          onClick={
            fetchUsers
          }
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-[#008dd2]/30 hover:text-[#008dd2]"
          title="Refresh"
        >

          <HiOutlineRefresh
            size={19}
          />

        </button>

      </div>


      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (

        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">

          {error}

        </div>

      )}


      {/* ================================================= */}
      {/* MAIN CARD */}
      {/* ================================================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">


        {/* ================================================= */}
        {/* CARD HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">


          <div>

            <h2 className="text-sm font-semibold text-slate-800">

              Users

            </h2>


            <p className="mt-1 text-xs text-slate-400">

              {filteredUsers.length}

              {" "}

              {filteredUsers.length === 1
                ? "user"
                : "users"}

            </p>

          </div>


          {/* SEARCH */}

          <div className="relative w-[260px]">

            <HiOutlineSearch
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />


            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search users..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10"
            />

          </div>

        </div>


        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px]">


            {/* TABLE HEAD */}

            <thead>

              <tr className="border-b border-slate-100 bg-slate-50/70">

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                  User

                </th>


                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                  Company

                </th>


                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                  Contact

                </th>


                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                  Role

                </th>


                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                  Rate Card

                </th>


                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-500">

                  Action

                </th>

              </tr>

            </thead>


            {/* TABLE BODY */}

            <tbody>

              {filteredUsers.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="px-5 py-16 text-center"
                  >

                    <p className="text-sm font-medium text-slate-600">

                      No users found

                    </p>


                    <p className="mt-1 text-xs text-slate-400">

                      Try changing your search.

                    </p>

                  </td>

                </tr>

              ) : (

                filteredUsers.map(
                  (user) => (

                    <tr
                      key={
                        user.id
                      }
                      className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/40"
                    >


                      {/* USER */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">


                          {/* AVATAR */}

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#008dd2]/10 text-[#008dd2]">

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
                                size={22}
                              />

                            )}

                          </div>


                          {/* NAME */}

                          <div className="min-w-0">

                            <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">

                              {user.full_name ||
                                "—"}

                            </p>


                            <p className="text-xs text-slate-400">

                              #{user.id}

                            </p>

                          </div>

                        </div>

                      </td>


                      {/* COMPANY */}

                      <td className="px-5 py-4">

                        <p className="max-w-[190px] truncate text-sm text-slate-600">

                          {user.company_name ||
                            "—"}

                        </p>

                      </td>


                      {/* CONTACT */}

                      <td className="px-5 py-4">

                        <p className="text-xs text-slate-600">

                          {user.email ||
                            "—"}

                        </p>


                        <p className="mt-1 text-xs text-slate-400">

                          {user.phone_no ||
                            "—"}

                        </p>

                      </td>


                      {/* ROLE */}

                      <td className="px-5 py-4">

                        <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-600">

                          {user.role ||
                            "user"}

                        </span>

                      </td>


                      {/* RATE CARD */}

                      <td className="px-5 py-4">

                        {user.rate_card_name ? (

                          <span className="inline-flex max-w-[170px] truncate rounded-md bg-[#008dd2]/8 px-2.5 py-1 text-[11px] font-medium text-[#008dd2]">

                            {
                              user.rate_card_name
                            }

                          </span>

                        ) : (

                          <span className="text-xs text-slate-400">

                            Not Assigned

                          </span>

                        )}

                      </td>


                      {/* ACTION */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end">

                          <button
                            type="button"
                            onClick={() =>
                              openUser(
                                user.id
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#008dd2]/8 hover:text-[#008dd2]"
                            title="View User"
                          >

                            <HiOutlineUserCircle
                              size={19}
                            />

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );
}


export default Users;