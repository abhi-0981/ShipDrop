import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineRefresh,
  HiOutlineUserCircle,
  HiOutlineSearch,
  HiOutlineChevronRight,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineOfficeBuilding,
  HiOutlineCreditCard,
  HiOutlineDotsVertical,
  HiOutlineEye,
  HiOutlineSwitchHorizontal,
  HiOutlineShieldCheck,
  HiOutlineX,
  HiOutlineExclamation,
  HiOutlineExternalLink,
  HiOutlineCheckCircle,
  HiOutlineLocationMarker,
  HiOutlineIdentification,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

function Users() {
  const navigate = useNavigate();

  // =====================================================
  // STATES
  // =====================================================

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Action dropdown state
  const [openMenuId, setOpenMenuId] = useState(null);

  // Close open dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".action-menu-container")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // =====================================================
  // FETCH USERS
  // =====================================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/admin/users`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load users");
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message || "Unable to load users");
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

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    return (
      String(user.full_name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.company_name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.email || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.phone_no || "")
        .toLowerCase()
        .includes(searchText) ||
      String(user.id || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // =====================================================
  // OPEN USER
  // =====================================================

  const openUser = (userId) => {
    navigate(`/users/${userId}`);
  };

  // =====================================================
  // LOGIN AS USER (DIRECT IMPERSONATION - SAME TAB)
  // =====================================================

  const handleDirectLoginAsUser = async (user) => {
    if (!user) return;
    const toastId = toast.loading(`Logging in as ${user.full_name || "Merchant"}...`);

    try {
      const adminToken =
        localStorage.getItem("adminToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("admin_token");

      if (!adminToken) {
        toast.error("Admin session not found. Please log in again.", { id: toastId });
        return;
      }

      const origin = window.location.origin;
      const userAppUrl = origin.includes("localhost")
        ? origin.replace(":5174", ":5173")
        : "https://parceldrop.in";

      const response = await fetch(
        `${API_BASE_URL}/admin/impersonate/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            target_user_id: user.id,
            reason: "Admin Support Access",
            admin_return_url: window.location.href,
            user_app_url: userAppUrl,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || `Failed to login as user (Status: ${response.status})`
        );
      }

      toast.success(
        `Redirecting to ${user.full_name || "Merchant"} dashboard...`,
        { id: toastId }
      );

      if (data.redirect_url) {
        // Direct navigation in the SAME TAB
        window.location.href = data.redirect_url;
      }
    } catch (err) {
      console.error("Direct impersonation error:", err);
      toast.error(err.message || "Failed to switch to user dashboard", { id: toastId });
    }
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="p-4 sm:p-7 min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
          <p className="text-xs font-medium text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE RENDER
  // =====================================================

  return (
    <div className="p-3.5 sm:p-6 md:p-7 max-w-7xl mx-auto pb-20 lg:pb-7">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-4 sm:mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="mb-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#008dd2]">
            Management
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Registered Users
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
            View, track and assign rate cards to merchant accounts
          </p>
        </div>

        {/* REFRESH BUTTON */}
        <button
          type="button"
          onClick={fetchUsers}
          className="flex h-9.5 w-9.5 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:border-[#008dd2]/40 hover:text-[#008dd2] active:scale-95"
          title="Refresh Users"
        >
          <HiOutlineRefresh size={18} />
        </button>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs sm:text-sm text-rose-600 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchUsers}
            className="font-bold underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* SEARCH AND CONTROLS */}
      {/* ================================================= */}

      <div className="mb-3.5 sm:mb-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-xs font-semibold text-slate-600">
            Total Accounts:{" "}
            <span className="font-bold text-slate-900">
              {filteredUsers.length}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <HiOutlineSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, email..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* 1. MOBILE VIEW: APP-STYLE CARDS */}
      {/* ================================================= */}

      <div className="space-y-2.5 sm:hidden">
        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            <HiOutlineUserCircle size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No users found</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Try modifying your search text.</p>
          </div>
        ) : (
          <>
            {paginatedUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => openUser(user.id)}
                className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs active:scale-[0.99] transition cursor-pointer space-y-2.5"
              >
                {/* TOP ROW: USER INFO & ROLE */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                      {user.profile_image ? (
                        <img
                          src={user.profile_image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <HiOutlineUserCircle size={22} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                        {user.full_name || "Unnamed User"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        UID #{user.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold capitalize text-slate-600">
                      {user.role || "user"}
                    </span>
                    <div className="relative action-menu-container">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === `m-${user.id}` ? null : `m-${user.id}`
                          );
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs transition hover:text-[#008dd2]"
                        title="Actions"
                      >
                        <HiOutlineDotsVertical size={14} />
                      </button>

                      {openMenuId === `m-${user.id}` && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              openUser(user.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#008dd2]"
                          >
                            <HiOutlineEye size={15} className="text-slate-400" />
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              navigate(`/pickup-addresses?user_id=${user.id}`);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#008dd2]"
                          >
                            <HiOutlineLocationMarker size={15} className="text-slate-400" />
                            Pickup Locations
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              navigate(`/parties?user_id=${user.id}`);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#008dd2]"
                          >
                            <HiOutlineIdentification size={15} className="text-slate-400" />
                            Parties Info
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              handleOpenImpersonateModal(user);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#008dd2] hover:bg-[#008dd2]/10"
                          >
                            <HiOutlineSwitchHorizontal size={15} />
                            Login as User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  {user.company_name && (
                    <div className="flex items-center gap-2 truncate">
                      <HiOutlineOfficeBuilding size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate text-[11.5px] font-medium text-slate-700">
                        {user.company_name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 truncate">
                    <HiOutlineMail size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate text-[11px] text-slate-500">
                      {user.email || "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 truncate">
                    <HiOutlinePhone size={14} className="text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-500">
                      {user.phone_no || "—"}
                    </span>
                  </div>
                </div>

                {/* BOTTOM: RATE CARD BADGE */}
                <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[11px]">
                  <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                    <HiOutlineCreditCard size={13} />
                    Rate Card:
                  </span>
                  {user.rate_card_name ? (
                    <span className="rounded-md bg-[#008dd2]/10 px-2 py-0.5 text-[10px] font-bold text-[#008dd2] truncate max-w-[170px]">
                      {user.rate_card_name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">
                      Not Assigned
                    </span>
                  )}
                </div>
              </div>
            ))}

            {filteredUsers.length > pageSize && (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs shadow-xs">
                <span className="font-semibold text-slate-500">
                  Page {currentPage} of {totalPages} ({filteredUsers.length} total)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage <= 1}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================================================= */}
      {/* 2. DESKTOP & TABLET VIEW: FULL TABLE */}
      {/* ================================================= */}

      <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-800">
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Company</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Rate Card</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-700">
                      No users found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try modifying your search text.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => openUser(user.id)}
                    className="cursor-pointer transition hover:bg-slate-50/70"
                  >
                    {/* USER */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#008dd2]/10 text-[#008dd2]">
                          {user.profile_image ? (
                            <img
                              src={user.profile_image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <HiOutlineUserCircle size={22} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-800">
                            {user.full_name || "—"}
                          </p>
                          <p className="text-[10.5px] text-slate-600 font-medium font-mono">
                            #{user.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* COMPANY */}
                    <td className="px-5 py-3.5">
                      <p className="max-w-[180px] truncate text-slate-800 font-medium">
                        {user.company_name || "—"}
                      </p>
                    </td>

                    {/* CONTACT */}
                    <td className="px-5 py-3.5">
                      <p className="text-slate-800 font-medium truncate max-w-[200px]">
                        {user.email || "—"}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-600">
                        {user.phone_no || "—"}
                      </p>
                    </td>

                    {/* ROLE */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold capitalize text-slate-600">
                        {user.role || "user"}
                      </span>
                    </td>

                    {/* RATE CARD */}
                    <td className="px-5 py-3.5">
                      {user.rate_card_name ? (
                        <span className="inline-flex max-w-[170px] truncate rounded-md bg-[#008dd2]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#008dd2]">
                          {user.rate_card_name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium italic">
                          Not Assigned
                        </span>
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-3.5 text-right relative">
                      <div className="relative inline-block text-left action-menu-container">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === user.id ? null : user.id);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs transition hover:border-[#008dd2]/40 hover:text-[#008dd2] active:scale-95"
                          title="Actions Menu"
                        >
                          <HiOutlineDotsVertical size={16} />
                        </button>

                        {openMenuId === user.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-100 text-left"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                openUser(user.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#008dd2]"
                            >
                              <HiOutlineEye size={15} className="text-slate-400" />
                              View Profile
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate(`/pickup-addresses?user_id=${user.id}`);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#008dd2]"
                            >
                              <HiOutlineLocationMarker size={15} className="text-slate-400" />
                              Pickup Locations
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate(`/parties?user_id=${user.id}`);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-[#008dd2]"
                            >
                              <HiOutlineIdentification size={15} className="text-slate-400" />
                              Parties Info
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDirectLoginAsUser(user);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-[#008dd2] transition hover:bg-[#008dd2]/10"
                            >
                              <HiOutlineSwitchHorizontal size={15} />
                              Login as User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredUsers.length > pageSize && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs">
              <span className="font-semibold text-slate-500">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold mr-1">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;