import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineTicket,
  HiOutlineClock,
  HiOutlineFlag,
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCube,
  HiOutlinePaperAirplane,
  HiOutlineChevronDown,
  HiOutlineX,
  HiOutlineChatAlt2,
  HiOutlineArrowLeft,
  HiOutlineInformationCircle,
  HiOutlineTag,
  HiOutlineCalendar,
  HiOutlineChevronRight,
} from "react-icons/hi";

import { API_BASE_URL } from "../../config/api";

const ADMIN_API_URL = `${API_BASE_URL}/admin`;

/* =========================================================
   OPTIONS
========================================================= */

const STATUS_OPTIONS = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CLOSED",
];

const PRIORITY_OPTIONS = ["LOW", "NORMAL", "HIGH", "URGENT"];

const CATEGORY_OPTIONS = [
  "SHIPMENT",
  "DELIVERY",
  "PICKUP",
  "PAYMENT",
  "RATE_BILLING",
  "ACCOUNT",
  "TECHNICAL",
  "OTHER",
];

/* =========================================================
   LABEL HELPERS
========================================================= */

const statusLabel = (status) => {
  const labels = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    WAITING_FOR_USER: "Waiting for User",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };

  return labels[String(status || "").toUpperCase()] || status || "—";
};

const priorityLabel = (priority) => {
  const labels = {
    LOW: "Low",
    NORMAL: "Normal",
    HIGH: "High",
    URGENT: "Urgent",
  };

  return labels[String(priority || "").toUpperCase()] || priority || "—";
};

const categoryLabel = (category) => {
  const labels = {
    SHIPMENT: "Shipment",
    DELIVERY: "Delivery",
    PICKUP: "Pickup",
    PAYMENT: "Payment",
    RATE_BILLING: "Rate & Billing",
    ACCOUNT: "Account",
    TECHNICAL: "Technical",
    OTHER: "Other",
  };

  return labels[String(category || "").toUpperCase()] || category || "—";
};

/* =========================================================
   DATE HELPERS
========================================================= */

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =========================================================
   API
========================================================= */

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    throw new Error("Admin authentication required");
  }

  const response = await fetch(`${ADMIN_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`,
    );
  }

  return data;
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status, small = false }) => {
  const value = String(status || "").toUpperCase();

  const styles = {
    OPEN: "border-blue-200 bg-blue-50 text-blue-700",
    IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700",
    WAITING_FOR_USER: "border-violet-200 bg-violet-50 text-violet-700",
    RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CLOSED: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${
        small ? "px-2 py-0.5 text-[9.5px]" : "px-2.5 py-1 text-[10.5px]"
      } font-semibold ${
        styles[value] || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(value)}
    </span>
  );
};

/* =========================================================
   PRIORITY BADGE
========================================================= */

const PriorityBadge = ({ priority }) => {
  const value = String(priority || "").toUpperCase();

  const styles = {
    LOW: "border-slate-200 bg-slate-50 text-slate-600",
    NORMAL: "border-blue-200 bg-blue-50 text-blue-700",
    HIGH: "border-orange-200 bg-orange-50 text-orange-700",
    URGENT: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
        styles[value] || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {priorityLabel(value)}
    </span>
  );
};

/* =========================================================
   SELECT CONTROL
========================================================= */

const SelectControl = ({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
}) => {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 disabled:opacity-60"
      >
        {children}
      </select>

      <HiOutlineChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
};

/* =========================================================
   DETAIL STATUS SELECT
========================================================= */

const StatusSelect = ({ value, onChange, disabled }) => {
  return (
    <div className="relative">
      <select
        value={value || "OPEN"}
        onChange={onChange}
        disabled={disabled}
        className="h-8.5 sm:h-9 min-w-[130px] appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-bold text-slate-700 outline-none transition focus:border-[#008dd2] focus:ring-2 focus:ring-[#008dd2]/10 disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>

      <HiOutlineChevronDown
        size={13}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({ label, value, icon: Icon, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-16 sm:h-[72px] shrink-0 sm:shrink sm:flex-1 items-center gap-2.5 sm:gap-3 border-r border-slate-200 px-3.5 sm:px-5 text-left transition last:border-r-0 ${
        active ? "bg-slate-50" : "bg-white hover:bg-slate-50/70"
      }`}
    >
      <span
        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl ${
          active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon size={16} />
      </span>

      <div>
        <span className="block text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>

        <span className="mt-0.5 sm:mt-1 block text-lg sm:text-[20px] font-black leading-none text-slate-900">
          {value}
        </span>
      </div>
    </button>
  );
};

/* =========================================================
   INFO ROW
========================================================= */

const InfoRow = ({ icon: Icon, label, children }) => {
  return (
    <div className="flex min-h-[44px] items-center gap-3 border-b border-slate-100 py-1.5 last:border-b-0">
      <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <Icon size={14} />
      </div>

      <span className="w-18 shrink-0 text-[11px] font-semibold text-slate-400">
        {label}
      </span>

      <div className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">
        {children}
      </div>
    </div>
  );
};

/* =========================================================
   ADMIN TICKETS
========================================================= */

function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    open: 0,
    pending: 0,
    urgent: 0,
    resolved: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (selectedTicket && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.messages]);

  /* =======================================================
     FETCH TICKETS
  ======================================================= */

  const fetchTickets = async (override = {}) => {
    const currentSearch =
      override.search !== undefined ? override.search : search;
    const currentStatus =
      override.status !== undefined ? override.status : statusFilter;
    const currentPriority =
      override.priority !== undefined ? override.priority : priorityFilter;
    const currentCategory =
      override.category !== undefined ? override.category : categoryFilter;

    const params = new URLSearchParams();

    if (currentSearch.trim()) {
      params.set("search", currentSearch.trim());
    }
    if (currentStatus) {
      params.set("status", currentStatus);
    }
    if (currentPriority) {
      params.set("priority", currentPriority);
    }
    if (currentCategory) {
      params.set("category", currentCategory);
    }

    const query = params.toString();
    const data = await apiRequest(`/tickets${query ? `?${query}` : ""}`);

    setTickets(Array.isArray(data.tickets) ? data.tickets : []);

    setCounts({
      total: Number(data.counts?.total || 0),
      open: Number(data.counts?.open || 0),
      pending: Number(data.counts?.pending || 0),
      urgent: Number(data.counts?.urgent || 0),
      resolved: Number(data.counts?.resolved || 0),
    });
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        await fetchTickets({
          search: "",
          status: "",
          priority: "",
          category: "",
        });
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Unable to load tickets");
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  /* =======================================================
     REFRESH
  ======================================================= */

  const refresh = async () => {
    try {
      setRefreshing(true);
      await fetchTickets();

      if (selectedTicket) {
        const data = await apiRequest(`/tickets/${selectedTicket.id}`);
        setSelectedTicket(data.ticket);
      }
    } catch (error) {
      toast.error(error.message || "Unable to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     OPEN TICKET
  ======================================================= */

  const openTicket = async (ticketId) => {
    try {
      setDetailLoading(true);
      const data = await apiRequest(`/tickets/${ticketId}`);
      setSelectedTicket(data.ticket);
      setReply("");
      setShowMobileDetails(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Unable to open ticket");
    } finally {
      setDetailLoading(false);
    }
  };

  /* =======================================================
     BACK
  ======================================================= */

  const backToTickets = () => {
    setSelectedTicket(null);
    setReply("");
    setShowMobileDetails(false);
  };

  /* =======================================================
     STATUS UPDATE
  ======================================================= */

  const updateStatus = async (status) => {
    if (!selectedTicket) {
      return;
    }

    const newStatus = String(status || "")
      .trim()
      .toUpperCase();

    const oldStatus = String(selectedTicket.status || "").toUpperCase();

    if (oldStatus === newStatus) {
      return;
    }

    try {
      setUpdatingStatus(true);

      const data = await apiRequest(`/tickets/${selectedTicket.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (data.ticket) {
        setSelectedTicket(data.ticket);
      } else {
        const detail = await apiRequest(`/tickets/${selectedTicket.id}`);
        setSelectedTicket(detail.ticket);
      }

      await fetchTickets();
      toast.success(`Ticket marked as ${statusLabel(newStatus)}`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Unable to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* =======================================================
     ADMIN REPLY
  ======================================================= */

  const sendReply = async () => {
    if (!selectedTicket) {
      return;
    }

    const message = reply.trim();

    if (!message) {
      toast.error("Please write a reply");
      return;
    }

    const currentStatus = String(selectedTicket.status || "").toUpperCase();

    if (currentStatus === "RESOLVED" || currentStatus === "CLOSED") {
      toast.error("Reopen the ticket before replying");
      return;
    }

    try {
      setSendingReply(true);

      await apiRequest(`/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          message,
        }),
      });

      setReply("");

      const data = await apiRequest(`/tickets/${selectedTicket.id}`);
      setSelectedTicket(data.ticket);
      await fetchTickets();
      toast.success("Reply sent");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Unable to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  /* =======================================================
     FILTERS
  ======================================================= */

  const changeStatusFilter = async (value) => {
    setStatusFilter(value);
    try {
      await fetchTickets({ status: value });
    } catch (error) {
      toast.error(error.message || "Unable to filter tickets");
    }
  };

  const changePriorityFilter = async (value) => {
    setPriorityFilter(value);
    try {
      await fetchTickets({ priority: value });
    } catch (error) {
      toast.error(error.message || "Unable to filter tickets");
    }
  };

  const changeCategoryFilter = async (value) => {
    setCategoryFilter(value);
    try {
      await fetchTickets({ category: value });
    } catch (error) {
      toast.error(error.message || "Unable to filter tickets");
    }
  };

  const searchTickets = async (event) => {
    if (event.key !== "Enter") {
      return;
    }

    try {
      await fetchTickets({
        search: event.currentTarget.value,
      });
    } catch (error) {
      toast.error(error.message || "Unable to search");
    }
  };

  /* =========================================================
     DETAIL VIEW (PURE MOBILE + DESKTOP RESILIENT)
  ========================================================= */

  if (selectedTicket) {
    const ticketStatus = String(selectedTicket.status || "").toUpperCase();
    const isClosed = ticketStatus === "CLOSED";
    const isResolved = ticketStatus === "RESOLVED";
    const messages = Array.isArray(selectedTicket.messages)
      ? selectedTicket.messages
      : [];

    return (
      <div className="fixed inset-0 lg:left-[250px] z-50 flex flex-col bg-[#f7f8fa] text-slate-800 overflow-hidden">
        {/* COMPACT APP-STYLE TOP HEADER */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-3 sm:px-6 py-2.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="min-w-0 flex items-center gap-2">
              <button
                type="button"
                onClick={backToTickets}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 active:scale-95 shrink-0"
                title="Back to Tickets"
              >
                <HiOutlineArrowLeft size={18} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs sm:text-sm font-black text-[#008dd2] shrink-0">
                    #{selectedTicket.ticket_number}
                  </span>
                  <StatusSelect
                    value={selectedTicket.status}
                    onChange={(event) => updateStatus(event.target.value)}
                    disabled={updatingStatus}
                  />
                  <PriorityBadge priority={selectedTicket.priority} />
                </div>
                <h1 className="truncate text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  {selectedTicket.subject || "No subject"}
                </h1>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              {/* MOBILE INFO DRAWER TOGGLE */}
              <button
                type="button"
                onClick={() => setShowMobileDetails((prev) => !prev)}
                className="flex lg:hidden h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                title="Ticket Info"
              >
                <HiOutlineInformationCircle size={17} />
              </button>

              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="flex h-8.5 sm:h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <HiOutlineRefresh
                  size={13}
                  className={refreshing ? "animate-spin text-[#008dd2]" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => updateStatus("RESOLVED")}
                disabled={isResolved || isClosed || updatingStatus}
                className="flex h-8.5 sm:h-9 items-center gap-1 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-40"
              >
                <HiOutlineCheckCircle size={14} />
                <span>Resolve</span>
              </button>

              <button
                type="button"
                onClick={() => updateStatus("CLOSED")}
                disabled={isClosed || updatingStatus}
                className="flex h-8.5 sm:h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-95 disabled:opacity-40"
              >
                <HiOutlineX size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* WORKSPACE CHAT + SIDEBAR */}
        <div className="flex-1 min-h-0 overflow-hidden p-0 sm:p-4">
          <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-3">
            {/* CONVERSATION VIEW: 100% WORKING VERTICAL SCROLL */}
            <section className="flex flex-col h-full min-h-0 rounded-none sm:rounded-2xl border-0 sm:border border-slate-200/80 bg-white shadow-none sm:shadow-xs overflow-hidden">
              {/* CHAT HEADER */}
              <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 text-[#008dd2]">
                    <HiOutlineChatAlt2 size={13} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    Customer Conversation
                  </span>
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.2 text-[10px] font-bold text-slate-600">
                    {messages.length}
                  </span>
                </div>
                <StatusBadge status={selectedTicket.status} small />
              </div>

              {/* MESSAGES SCROLL CONTAINER */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 [scrollbar-width:thin]">
                {detailLoading ? (
                  <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
                    Loading ticket messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
                    <HiOutlineChatAlt2 size={28} />
                    <p className="mt-2 text-xs font-bold text-slate-700">
                      No conversation yet
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Send a message below to reach out to the customer.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isAdmin =
                      String(message.sender_type || "").toUpperCase() ===
                      "ADMIN";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isAdmin ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className="max-w-[88%] sm:max-w-[76%] space-y-0.5">
                          <div
                            className={`flex items-center gap-1.5 px-1 text-[9.5px] text-slate-400 ${
                              isAdmin ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="font-bold text-slate-600">
                              {isAdmin ? "ShipDrop Support (You)" : "Customer"}
                            </span>
                            <span>•</span>
                            <span>{formatTime(message.created_at)}</span>
                          </div>

                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                              isAdmin
                                ? "rounded-tr-xs bg-slate-900 text-white shadow-xs"
                                : "rounded-tl-xs border border-slate-200/80 bg-slate-50 text-slate-800"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* PINNED REPLY DOCK */}
              <div className="shrink-0 border-t border-slate-100 bg-white p-2.5 sm:p-3">
                {isResolved || isClosed ? (
                  <div className="flex h-10 items-center justify-between rounded-xl bg-slate-50 px-3 text-xs text-slate-500 font-medium border border-slate-200">
                    <span>This ticket is closed or marked as resolved.</span>
                    <StatusBadge status={selectedTicket.status} small />
                  </div>
                ) : (
                  <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 focus-within:border-[#008dd2] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#008dd2]/10 transition">
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendReply();
                        }
                      }}
                      rows={1}
                      maxLength={2000}
                      placeholder="Write a response... (Press Enter to send)"
                      className="block flex-1 max-h-24 min-h-[36px] resize-none bg-transparent px-2 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={sendReply}
                      disabled={sendingReply || !reply.trim()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs transition hover:bg-slate-800 active:scale-95 disabled:opacity-40"
                      title="Send Response"
                    >
                      <HiOutlinePaperAirplane size={14} className="rotate-90" />
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* DESKTOP SIDEBAR INFO CARDS */}
            <aside className="hidden lg:block space-y-3 overflow-y-auto [scrollbar-width:none]">
              {/* TICKET DETAILS */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Ticket Details
                </h3>
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={HiOutlineTicket} label="Ticket #">
                    <span className="font-mono text-[#008dd2] font-bold">
                      #{selectedTicket.ticket_number}
                    </span>
                  </InfoRow>
                  <InfoRow icon={HiOutlineTag} label="Category">
                    {categoryLabel(selectedTicket.category)}
                  </InfoRow>
                  <InfoRow icon={HiOutlineCalendar} label="Created">
                    {formatDateTime(selectedTicket.created_at)}
                  </InfoRow>
                  <InfoRow icon={HiOutlineClock} label="Updated">
                    {formatDateTime(selectedTicket.updated_at)}
                  </InfoRow>
                </div>
              </div>

              {/* CUSTOMER INFO */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Customer
                </h3>
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={HiOutlineUser} label="Name">
                    {selectedTicket.customer_name || "—"}
                  </InfoRow>
                  <InfoRow icon={HiOutlineMail} label="Email">
                    {selectedTicket.customer_email || "—"}
                  </InfoRow>
                  <InfoRow icon={HiOutlinePhone} label="Phone">
                    {selectedTicket.customer_phone || "—"}
                  </InfoRow>
                </div>
              </div>

              {/* SHIPMENT INFO */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  Linked Shipment
                </h3>
                <div className="divide-y divide-slate-100">
                  <InfoRow icon={HiOutlineTicket} label="Order ID">
                    {selectedTicket.public_order_id ? `#${selectedTicket.public_order_id}` : "No order"}
                  </InfoRow>
                  <InfoRow icon={HiOutlineCube} label="AWB">
                    <span className="font-mono">{selectedTicket.awb || "No AWB"}</span>
                  </InfoRow>
                  <InfoRow icon={HiOutlineClock} label="Live Status">
                    {selectedTicket.tracking_status || "—"}
                  </InfoRow>
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Customer Note / Problem
                  </div>
                  <p className="line-clamp-4 leading-relaxed text-slate-700">
                    {selectedTicket.description || "No description provided."}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* MOBILE SLIDE-IN INFO SHEET */}
        {showMobileDetails && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs p-0 lg:hidden animate-in fade-in duration-150">
            <div className="w-full max-h-[80vh] flex flex-col rounded-t-3xl bg-white p-4 pb-20 shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ticket & Customer Information
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMobileDetails(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                <InfoRow icon={HiOutlineTicket} label="Ticket #">
                  <span className="font-mono text-[#008dd2] font-bold">
                    #{selectedTicket.ticket_number}
                  </span>
                </InfoRow>
                <InfoRow icon={HiOutlineTag} label="Category">
                  {categoryLabel(selectedTicket.category)}
                </InfoRow>
                <InfoRow icon={HiOutlineUser} label="Customer">
                  {selectedTicket.customer_name || "—"}
                </InfoRow>
                <InfoRow icon={HiOutlineMail} label="Email">
                  {selectedTicket.customer_email || "—"}
                </InfoRow>
                <InfoRow icon={HiOutlinePhone} label="Phone">
                  {selectedTicket.customer_phone || "—"}
                </InfoRow>
                {selectedTicket.public_order_id && (
                  <InfoRow icon={HiOutlineCube} label="Order ID">
                    #{selectedTicket.public_order_id}
                  </InfoRow>
                )}
                {selectedTicket.awb && (
                  <InfoRow icon={HiOutlineCube} label="AWB">
                    <span className="font-mono">{selectedTicket.awb}</span>
                  </InfoRow>
                )}
              </div>

              {selectedTicket.description && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Issue Description
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    {selectedTicket.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     LIST VIEW (RESPONSIVE TABLE + APP TILES)
  ========================================================= */

  return (
    <div className="min-h-full bg-[#f8fafc] p-3 sm:p-5 md:p-6 pb-20 lg:pb-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <HiOutlineTicket size={20} />
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Support Center
            </h1>
            <p className="text-xs text-slate-400">
              Manage and resolve merchant queries & delivery tickets
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="self-end sm:self-auto flex h-9.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
        >
          <HiOutlineRefresh
            size={14}
            className={refreshing ? "animate-spin text-[#008dd2]" : ""}
          />
          <span>Refresh</span>
        </button>
      </div>

      {/* STAT TILES: HORIZONTAL SCROLL ON SMALL PHONES */}
      <div className="mb-4 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs [scrollbar-width:none]">
        <div className="flex min-w-max sm:min-w-0">
          <StatCard
            label="Total"
            value={counts.total}
            icon={HiOutlineTicket}
            active={statusFilter === "" && priorityFilter === ""}
            onClick={() => {
              setStatusFilter("");
              setPriorityFilter("");
              fetchTickets({ status: "", priority: "" });
            }}
          />

          <StatCard
            label="Open"
            value={counts.open}
            icon={HiOutlineChatAlt2}
            active={statusFilter === "OPEN"}
            onClick={() => changeStatusFilter("OPEN")}
          />

          <StatCard
            label="Pending"
            value={counts.pending}
            icon={HiOutlineClock}
            active={statusFilter === "IN_PROGRESS"}
            onClick={() => changeStatusFilter("IN_PROGRESS")}
          />

          <StatCard
            label="Urgent"
            value={counts.urgent}
            icon={HiOutlineFlag}
            active={priorityFilter === "URGENT"}
            onClick={() => changePriorityFilter("URGENT")}
          />

          <StatCard
            label="Resolved"
            value={counts.resolved}
            icon={HiOutlineCheckCircle}
            active={statusFilter === "RESOLVED"}
            onClick={() => changeStatusFilter("RESOLVED")}
          />
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="mb-3.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {/* SEARCH */}
          <div className="relative min-w-0 flex-1">
            <HiOutlineSearch
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={searchTickets}
              placeholder="Search ticket #, customer, AWB or order..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
            />
          </div>

          {/* DROPDOWNS ROW */}
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2">
            <SelectControl
              value={statusFilter}
              onChange={(event) => changeStatusFilter(event.target.value)}
              className="w-full sm:w-[130px]"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </SelectControl>

            <SelectControl
              value={priorityFilter}
              onChange={(event) => changePriorityFilter(event.target.value)}
              className="w-full sm:w-[125px]"
            >
              <option value="">All Priority</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabel(priority)}
                </option>
              ))}
            </SelectControl>

            <SelectControl
              value={categoryFilter}
              onChange={(event) => changeCategoryFilter(event.target.value)}
              className="w-full sm:w-[140px]"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </SelectControl>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400 font-semibold">
          <span>{tickets.length} tickets found</span>
          <span>Sorted by latest</span>
        </div>
      </div>

      {/* =========================================================
          1. MOBILE VIEW: TOUCH-FRIENDLY TICKET TILES
      ========================================================= */}
      <div className="space-y-2.5 sm:hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-semibold">
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            <HiOutlineTicket size={30} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No tickets found</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Try changing your search or filters.</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => openTicket(ticket.id)}
              className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs active:scale-[0.99] transition cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-mono text-xs font-bold text-[#008dd2]">
                  #{ticket.ticket_number}
                </span>

                <div className="flex items-center gap-1.5">
                  <StatusBadge status={ticket.status} small />
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {ticket.subject || "No subject"}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[170px] font-medium">
                    {ticket.customer_name || "Unknown customer"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {categoryLabel(ticket.category)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] text-slate-400">
                <span>{formatDate(ticket.created_at)}</span>
                <span className="flex items-center gap-1 text-[#008dd2] font-bold">
                  Open Conversation
                  <HiOutlineChevronRight size={12} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =========================================================
          2. TABLET & DESKTOP: STRUCTURED TABLE
      ========================================================= */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3.5">Ticket</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Subject</th>
              <th className="px-4 py-3.5">Priority</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-16 text-center text-slate-400 font-semibold">
                  Loading tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center text-slate-400 font-semibold">
                  No tickets found matching your criteria.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => openTicket(ticket.id)}
                  className="cursor-pointer transition hover:bg-slate-50/70"
                >
                  {/* TICKET */}
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-xs font-bold text-[#008dd2]">
                      #{ticket.ticket_number}
                    </div>
                    {ticket.awb && (
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        AWB {ticket.awb}
                      </div>
                    )}
                  </td>

                  {/* CUSTOMER */}
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-800 truncate max-w-[160px]">
                      {ticket.customer_name || "Unknown"}
                    </div>
                    <div className="text-[10.5px] text-slate-400 truncate max-w-[160px]">
                      {ticket.customer_email || "—"}
                    </div>
                  </td>

                  {/* SUBJECT */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800 truncate max-w-xs">
                      {ticket.subject || "No subject"}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {categoryLabel(ticket.category)}
                    </div>
                  </td>

                  {/* PRIORITY */}
                  <td className="px-4 py-3.5">
                    <PriorityBadge priority={ticket.priority} />
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={ticket.status} small />
                  </td>

                  {/* DATE */}
                  <td className="px-4 py-3.5 text-right text-slate-400 font-medium">
                    {formatDate(ticket.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminTickets;