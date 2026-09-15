import React, { useEffect, useState } from "react";
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
} from "react-icons/hi";

const API_BASE_URL = "http://localhost:5001/api/admin";

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

const PRIORITY_OPTIONS = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

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

  return (
    labels[String(status || "").toUpperCase()] ||
    status ||
    "—"
  );
};

const priorityLabel = (priority) => {
  const labels = {
    LOW: "Low",
    NORMAL: "Normal",
    HIGH: "High",
    URGENT: "Urgent",
  };

  return (
    labels[String(priority || "").toUpperCase()] ||
    priority ||
    "—"
  );
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

  return (
    labels[String(category || "").toUpperCase()] ||
    category ||
    "—"
  );
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

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (
    !response.ok ||
    data.success === false
  ) {
    throw new Error(
      data.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({
  status,
  small = false,
}) => {
  const value = String(
    status || ""
  ).toUpperCase();

  const styles = {
    OPEN:
      "border-blue-200 bg-blue-50 text-blue-700",

    IN_PROGRESS:
      "border-amber-200 bg-amber-50 text-amber-700",

    WAITING_FOR_USER:
      "border-violet-200 bg-violet-50 text-violet-700",

    RESOLVED:
      "border-emerald-200 bg-emerald-50 text-emerald-700",

    CLOSED:
      "border-slate-200 bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${
        small
          ? "px-2.5 py-1 text-[10px]"
          : "px-3 py-1.5 text-[11px]"
      } font-medium ${
        styles[value] ||
        "border-slate-200 bg-slate-50 text-slate-600"
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

const PriorityBadge = ({
  priority,
}) => {
  const value = String(
    priority || ""
  ).toUpperCase();

  const styles = {
    LOW:
      "border-slate-200 bg-slate-50 text-slate-600",

    NORMAL:
      "border-blue-200 bg-blue-50 text-blue-700",

    HIGH:
      "border-orange-200 bg-orange-50 text-orange-700",

    URGENT:
      "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-medium ${
        styles[value] ||
        "border-slate-200 bg-slate-50 text-slate-600"
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
    <div
      className={`relative ${className}`}
    >
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-[12px] font-medium text-slate-600 outline-none transition hover:border-slate-300 focus:border-[#0788ca] focus:ring-2 focus:ring-[#0788ca]/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>

      <HiOutlineChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
};

/* =========================================================
   DETAIL STATUS SELECT
========================================================= */

const StatusSelect = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="relative">
      <select
        value={value || "OPEN"}
        onChange={onChange}
        disabled={disabled}
        className="h-9 min-w-[145px] appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-[11px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-[#0788ca] focus:ring-2 focus:ring-[#0788ca]/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((status) => (
          <option
            key={status}
            value={status}
          >
            {statusLabel(status)}
          </option>
        ))}
      </select>

      <HiOutlineChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
};

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  label,
  value,
  icon: Icon,
  active,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[72px] flex-1 items-center gap-3 border-r border-slate-200 px-5 text-left transition last:border-r-0 ${
        active
          ? "bg-slate-50"
          : "bg-white hover:bg-slate-50/70"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          active
            ? "bg-[#111c33] text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <Icon size={16} />
      </span>

      <span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
          {label}
        </span>

        <span className="mt-1 block text-[20px] font-semibold leading-none text-slate-900">
          {value}
        </span>
      </span>
    </button>
  );
};

/* =========================================================
   INFO ROW
========================================================= */

const InfoRow = ({
  icon: Icon,
  label,
  children,
}) => {
  return (
    <div className="flex min-h-[48px] items-center gap-3 border-b border-slate-100 last:border-b-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <Icon size={14} />
      </div>

      <span className="w-[72px] shrink-0 text-[11px] font-medium text-slate-400">
        {label}
      </span>

      <div className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-700">
        {children}
      </div>
    </div>
  );
};

/* =========================================================
   ADMIN TICKETS
========================================================= */

function AdminTickets() {
  const [tickets, setTickets] =
    useState([]);

  const [counts, setCounts] =
    useState({
      total: 0,
      open: 0,
      pending: 0,
      urgent: 0,
      resolved: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [priorityFilter, setPriorityFilter] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [selectedTicket, setSelectedTicket] =
    useState(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [reply, setReply] =
    useState("");

  const [sendingReply, setSendingReply] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  /* =======================================================
     FETCH TICKETS
  ======================================================= */

  const fetchTickets = async (
    override = {}
  ) => {
    const currentSearch =
      override.search !== undefined
        ? override.search
        : search;

    const currentStatus =
      override.status !== undefined
        ? override.status
        : statusFilter;

    const currentPriority =
      override.priority !== undefined
        ? override.priority
        : priorityFilter;

    const currentCategory =
      override.category !== undefined
        ? override.category
        : categoryFilter;

    const params =
      new URLSearchParams();

    if (currentSearch.trim()) {
      params.set(
        "search",
        currentSearch.trim()
      );
    }

    if (currentStatus) {
      params.set(
        "status",
        currentStatus
      );
    }

    if (currentPriority) {
      params.set(
        "priority",
        currentPriority
      );
    }

    if (currentCategory) {
      params.set(
        "category",
        currentCategory
      );
    }

    const query =
      params.toString();

    const data =
      await apiRequest(
        `/tickets${
          query ? `?${query}` : ""
        }`
      );

    setTickets(
      Array.isArray(data.tickets)
        ? data.tickets
        : []
    );

    setCounts({
      total: Number(
        data.counts?.total || 0
      ),

      open: Number(
        data.counts?.open || 0
      ),

      pending: Number(
        data.counts?.pending || 0
      ),

      urgent: Number(
        data.counts?.urgent || 0
      ),

      resolved: Number(
        data.counts?.resolved || 0
      ),
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

        toast.error(
          error.message ||
            "Unable to load tickets"
        );
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
        const data =
          await apiRequest(
            `/tickets/${selectedTicket.id}`
          );

        setSelectedTicket(
          data.ticket
        );
      }
    } catch (error) {
      toast.error(
        error.message ||
          "Unable to refresh"
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     OPEN TICKET
  ======================================================= */

  const openTicket = async (
    ticketId
  ) => {
    try {
      setDetailLoading(true);

      const data =
        await apiRequest(
          `/tickets/${ticketId}`
        );

      setSelectedTicket(
        data.ticket
      );

      setReply("");
    } catch (error) {
      console.error(error);

      toast.error(
        error.message ||
          "Unable to open ticket"
      );
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
  };

  /* =======================================================
     STATUS UPDATE
  ======================================================= */

  const updateStatus = async (
    status
  ) => {
    if (!selectedTicket) {
      return;
    }

    const newStatus =
      String(status || "")
        .trim()
        .toUpperCase();

    const oldStatus =
      String(
        selectedTicket.status || ""
      ).toUpperCase();

    if (oldStatus === newStatus) {
      return;
    }

    try {
      setUpdatingStatus(true);

      const data =
        await apiRequest(
          `/tickets/${selectedTicket.id}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

      if (data.ticket) {
        setSelectedTicket(
          data.ticket
        );
      } else {
        const detail =
          await apiRequest(
            `/tickets/${selectedTicket.id}`
          );

        setSelectedTicket(
          detail.ticket
        );
      }

      await fetchTickets();

      toast.success(
        `Ticket marked as ${statusLabel(
          newStatus
        )}`
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error.message ||
          "Unable to update status"
      );
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

    const message =
      reply.trim();

    if (!message) {
      toast.error(
        "Please write a reply"
      );
      return;
    }

    const currentStatus =
      String(
        selectedTicket.status || ""
      ).toUpperCase();

    if (
      currentStatus ===
        "RESOLVED" ||
      currentStatus === "CLOSED"
    ) {
      toast.error(
        "Reopen the ticket before replying"
      );

      return;
    }

    try {
      setSendingReply(true);

      await apiRequest(
        `/tickets/${selectedTicket.id}/reply`,
        {
          method: "POST",
          body: JSON.stringify({
            message,
          }),
        }
      );

      setReply("");

      const data =
        await apiRequest(
          `/tickets/${selectedTicket.id}`
        );

      setSelectedTicket(
        data.ticket
      );

      await fetchTickets();

      toast.success(
        "Reply sent"
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error.message ||
          "Unable to send reply"
      );
    } finally {
      setSendingReply(false);
    }
  };

  /* =======================================================
     FILTERS
  ======================================================= */

  const changeStatusFilter =
    async (value) => {
      setStatusFilter(value);

      try {
        await fetchTickets({
          status: value,
        });
      } catch (error) {
        toast.error(
          error.message ||
            "Unable to filter tickets"
        );
      }
    };

  const changePriorityFilter =
    async (value) => {
      setPriorityFilter(value);

      try {
        await fetchTickets({
          priority: value,
        });
      } catch (error) {
        toast.error(
          error.message ||
            "Unable to filter tickets"
        );
      }
    };

  const changeCategoryFilter =
    async (value) => {
      setCategoryFilter(value);

      try {
        await fetchTickets({
          category: value,
        });
      } catch (error) {
        toast.error(
          error.message ||
            "Unable to filter tickets"
        );
      }
    };

  const searchTickets = async (
    event
  ) => {
    if (
      event.key !== "Enter"
    ) {
      return;
    }

    try {
      await fetchTickets({
        search:
          event.currentTarget.value,
      });
    } catch (error) {
      toast.error(
        error.message ||
          "Unable to search"
      );
    }
  };

  /* =========================================================
     DETAIL VIEW
  ========================================================= */

  if (selectedTicket) {
    const ticketStatus =
      String(
        selectedTicket.status || ""
      ).toUpperCase();

    const isClosed =
      ticketStatus === "CLOSED";

    const isResolved =
      ticketStatus === "RESOLVED";

    const messages =
      Array.isArray(
        selectedTicket.messages
      )
        ? selectedTicket.messages
        : [];

    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f8fa] text-slate-800">

        {/* =================================================
            DETAIL HEADER
        ================================================= */}

        <div className="shrink-0 border-b border-slate-200 bg-white">

          <div className="flex min-h-[82px] items-center justify-between gap-4 px-6">

            <div className="min-w-0">

              <button
                type="button"
                onClick={
                  backToTickets
                }
                className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 transition hover:text-slate-700"
              >
                <HiOutlineArrowLeft
                  size={13}
                />

                Back to Tickets
              </button>

              <div className="flex min-w-0 items-center gap-2.5">

                <span className="shrink-0 text-[14px] font-semibold text-[#0788ca]">
                  #
                  {
                    selectedTicket.ticket_number
                  }
                </span>

                {/* STATUS DROPDOWN */}

                <StatusSelect
                  value={
                    selectedTicket.status
                  }
                  onChange={(event) =>
                    updateStatus(
                      event.target.value
                    )
                  }
                  disabled={
                    updatingStatus
                  }
                />

                {/* PRIORITY BADGE */}

                <PriorityBadge
                  priority={
                    selectedTicket.priority
                  }
                />

                <span className="mx-1 h-4 w-px bg-slate-200" />

                <h1 className="truncate text-[16px] font-semibold text-slate-900">
                  {
                    selectedTicket.subject ||
                    "No subject"
                  }
                </h1>

              </div>

            </div>

            {/* HEADER ACTIONS */}

            <div className="flex shrink-0 items-center gap-2">

              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
              >
                <HiOutlineRefresh
                  size={13}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={() =>
                  updateStatus(
                    "RESOLVED"
                  )
                }
                disabled={
                  isResolved ||
                  isClosed ||
                  updatingStatus
                }
                className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <HiOutlineCheckCircle
                  size={13}
                />

                Resolve
              </button>

              <button
                type="button"
                onClick={() =>
                  updateStatus(
                    "CLOSED"
                  )
                }
                disabled={
                  isClosed ||
                  updatingStatus
                }
                className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <HiOutlineX
                  size={13}
                />

                Close
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            DETAIL CONTENT
        ================================================= */}

        <div className="min-h-0 flex-1 overflow-hidden p-5">

          {detailLoading ? (
            <div className="flex h-full items-center justify-center text-[12px] text-slate-400">
              Loading ticket...
            </div>
          ) : (
            <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_350px] gap-5">

              {/* =================================================
                  CONVERSATION
              ================================================= */}

              <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

                {/* CHAT HEADER */}

                <div className="flex h-[62px] shrink-0 items-center justify-between border-b border-slate-100 px-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0788ca]">
                      <HiOutlineChatAlt2
                        size={17}
                      />
                    </div>

                    <div>
                      <div className="text-[13px] font-semibold text-slate-800">
                        Customer Conversation
                      </div>

                      <div className="mt-0.5 text-[10px] text-slate-400">
                        {
                          messages.length
                        }{" "}
                        {messages.length ===
                        1
                          ? "message"
                          : "messages"}
                      </div>
                    </div>

                  </div>

                  <StatusBadge
                    status={
                      selectedTicket.status
                    }
                    small
                  />

                </div>

                {/* MESSAGES */}

                <div className="min-h-0 flex-1 overflow-hidden px-5 py-4">

                  {messages.length ===
                  0 ? (
                    <div className="flex h-full flex-col items-center justify-center">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                        <HiOutlineChatAlt2
                          size={19}
                        />
                      </div>

                      <p className="mt-3 text-[11px] text-slate-400">
                        No conversation yet.
                      </p>

                    </div>
                  ) : (
                    <div className="flex h-full flex-col justify-start gap-4 overflow-hidden">

                      {messages
                        .slice(-7)
                        .map(
                          (
                            message
                          ) => {
                            const isAdmin =
                              String(
                                message.sender_type ||
                                  ""
                              ).toUpperCase() ===
                              "ADMIN";

                            return (
                              <div
                                key={
                                  message.id
                                }
                                className={`flex ${
                                  isAdmin
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div
                                  className={`max-w-[72%] ${
                                    isAdmin
                                      ? "items-end"
                                      : "items-start"
                                  }`}
                                >

                                  <div className="mb-1.5 flex items-center gap-2">

                                    <span className="text-[10px] font-semibold text-slate-500">
                                      {isAdmin
                                        ? "Support"
                                        : "Customer"}
                                    </span>

                                    <span className="text-[9px] text-slate-400">
                                      {formatTime(
                                        message.created_at
                                      )}
                                    </span>

                                  </div>

                                  <div
                                    className={`rounded-xl px-4 py-2.5 ${
                                      isAdmin
                                        ? "rounded-tr-sm bg-[#111c33] text-white"
                                        : "rounded-tl-sm border border-slate-200 bg-slate-50 text-slate-700"
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap break-words text-[12px] leading-5">
                                      {
                                        message.message
                                      }
                                    </p>
                                  </div>

                                </div>
                              </div>
                            );
                          }
                        )}

                    </div>
                  )}

                </div>

                {/* =================================================
                    REPLY BOX
                ================================================= */}

                <div className="shrink-0 border-t border-slate-100 bg-white p-4">

                  {isResolved ||
                  isClosed ? (
                    <div className="flex h-[58px] items-center justify-between rounded-lg bg-slate-50 px-4">

                      <div>
                        <div className="text-[11px] font-medium text-slate-600">
                          Conversation closed
                        </div>

                        <div className="mt-0.5 text-[9px] text-slate-400">
                          Change the status above to continue replying.
                        </div>
                      </div>

                      <StatusBadge
                        status={
                          selectedTicket.status
                        }
                        small
                      />

                    </div>
                  ) : (
                    <div className="relative">

                      <textarea
                        value={reply}
                        onChange={(event) =>
                          setReply(
                            event.target
                              .value
                          )
                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                              "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();

                            sendReply();
                          }
                        }}
                        rows={2}
                        placeholder="Write a professional response..."
                        className="h-[68px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 py-3 pl-3.5 pr-[82px] text-[12px] leading-5 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0788ca] focus:bg-white"
                      />

                      <button
                        type="button"
                        onClick={
                          sendReply
                        }
                        disabled={
                          sendingReply ||
                          !reply.trim()
                        }
                        className="absolute bottom-2.5 right-2.5 flex h-8 items-center gap-1.5 rounded-md bg-[#111c33] px-3 text-[10px] font-semibold text-white transition hover:bg-[#1b2946] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <HiOutlinePaperAirplane
                          size={12}
                        />

                        {sendingReply
                          ? "Sending"
                          : "Send"}
                      </button>

                    </div>
                  )}

                </div>

              </section>

              {/* =================================================
                  RIGHT SIDE
              ================================================= */}

              <aside className="min-h-0 overflow-hidden">

                <div className="flex h-full min-h-0 flex-col gap-4">

                  {/* =================================================
                      TICKET DETAILS
                  ================================================= */}

                  <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

                    <div className="flex h-[55px] items-center justify-between border-b border-slate-100">

                      <div className="flex items-center gap-2.5">

                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0788ca]">
                          <HiOutlineInformationCircle
                            size={15}
                          />
                        </div>

                        <span className="text-[12px] font-semibold text-slate-800">
                          Ticket Details
                        </span>

                      </div>

                      <PriorityBadge
                        priority={
                          selectedTicket.priority
                        }
                      />

                    </div>

                    <InfoRow
                      icon={
                        HiOutlineTicket
                      }
                      label="Ticket"
                    >
                      <span className="text-[#0788ca]">
                        #
                        {
                          selectedTicket.ticket_number
                        }
                      </span>
                    </InfoRow>

                    <InfoRow
                      icon={HiOutlineTag}
                      label="Category"
                    >
                      {categoryLabel(
                        selectedTicket.category
                      )}
                    </InfoRow>

                    <InfoRow
                      icon={
                        HiOutlineCalendar
                      }
                      label="Created"
                    >
                      {formatDateTime(
                        selectedTicket.created_at
                      )}
                    </InfoRow>

                    <InfoRow
                      icon={
                        HiOutlineClock
                      }
                      label="Updated"
                    >
                      {formatDateTime(
                        selectedTicket.updated_at
                      )}
                    </InfoRow>

                  </div>

                  {/* =================================================
                      CUSTOMER
                  ================================================= */}

                  <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

                    <div className="flex h-[55px] items-center gap-2.5 border-b border-slate-100">

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <HiOutlineUser
                          size={15}
                        />
                      </div>

                      <div>
                        <div className="text-[12px] font-semibold text-slate-800">
                          Customer
                        </div>

                        <div className="text-[9px] text-slate-400">
                          Customer information
                        </div>
                      </div>

                    </div>

                    <InfoRow
                      icon={
                        HiOutlineUser
                      }
                      label="Name"
                    >
                      {
                        selectedTicket.customer_name ||
                        "—"
                      }
                    </InfoRow>

                    <InfoRow
                      icon={
                        HiOutlineMail
                      }
                      label="Email"
                    >
                      {
                        selectedTicket.customer_email ||
                        "—"
                      }
                    </InfoRow>

                    <InfoRow
                      icon={
                        HiOutlinePhone
                      }
                      label="Phone"
                    >
                      {
                        selectedTicket.customer_phone ||
                        "—"
                      }
                    </InfoRow>

                  </div>

                  {/* =================================================
                      SHIPMENT
                  ================================================= */}

                  <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white px-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

                    <div className="flex h-[55px] items-center gap-2.5 border-b border-slate-100">

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0788ca]">
                        <HiOutlineCube
                          size={15}
                        />
                      </div>

                      <div>
                        <div className="text-[12px] font-semibold text-slate-800">
                          Shipment
                        </div>

                        <div className="text-[9px] text-slate-400">
                          Linked shipment details
                        </div>
                      </div>

                    </div>

                    <InfoRow
                      icon={
                        HiOutlineTicket
                      }
                      label="Order"
                    >
                      {
                        selectedTicket.public_order_id ||
                        "No order"
                      }
                    </InfoRow>

                    <InfoRow
                      icon={
                        HiOutlineCube
                      }
                      label="AWB"
                    >
                      {
                        selectedTicket.awb ||
                        "No AWB"
                      }
                    </InfoRow>

                    <InfoRow
                      icon={
                        HiOutlineClock
                      }
                      label="Tracking"
                    >
                      {
                        selectedTicket.tracking_status ||
                        "—"
                      }
                    </InfoRow>

                    <div className="mt-4 rounded-lg bg-slate-50 px-3.5 py-3">

                      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                        Issue
                      </div>

                      <p className="line-clamp-4 text-[11px] leading-5 text-slate-600">
                        {
                          selectedTicket.description ||
                          "No description provided."
                        }
                      </p>

                    </div>

                  </div>

                </div>

              </aside>

            </div>
          )}

        </div>

      </div>
    );
  }

  /* =========================================================
     LIST VIEW
  ========================================================= */

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f8fa] text-slate-800">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="shrink-0 border-b border-slate-200 bg-white">

        <div className="flex h-[62px] items-center justify-between px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#111c33] text-white">
              <HiOutlineTicket
                size={17}
              />
            </div>

            <div>
              <h1 className="text-[15px] font-semibold text-slate-900">
                Support Center
              </h1>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Customer support workspace
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
          >
            <HiOutlineRefresh
              size={13}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="flex h-[72px] border-t border-slate-100">

          <StatCard
            label="Total Tickets"
            value={counts.total}
            icon={
              HiOutlineTicket
            }
            active={
              statusFilter === "" &&
              priorityFilter === ""
            }
            onClick={() => {
              setStatusFilter("");
              setPriorityFilter("");

              fetchTickets({
                status: "",
                priority: "",
              });
            }}
          />

          <StatCard
            label="Open"
            value={counts.open}
            icon={
              HiOutlineChatAlt2
            }
            active={
              statusFilter ===
              "OPEN"
            }
            onClick={() =>
              changeStatusFilter(
                "OPEN"
              )
            }
          />

          <StatCard
            label="Pending"
            value={counts.pending}
            icon={
              HiOutlineClock
            }
            active={
              statusFilter ===
              "IN_PROGRESS"
            }
            onClick={() =>
              changeStatusFilter(
                "IN_PROGRESS"
              )
            }
          />

          <StatCard
            label="Urgent"
            value={counts.urgent}
            icon={HiOutlineFlag}
            active={
              priorityFilter ===
              "URGENT"
            }
            onClick={() =>
              changePriorityFilter(
                "URGENT"
              )
            }
          />

          <StatCard
            label="Resolved"
            value={counts.resolved}
            icon={
              HiOutlineCheckCircle
            }
            active={
              statusFilter ===
              "RESOLVED"
            }
            onClick={() =>
              changeStatusFilter(
                "RESOLVED"
              )
            }
          />

        </div>

      </div>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div className="shrink-0 border-b border-slate-200 bg-[#f7f8fa] px-5 py-3">

        <div className="flex items-center gap-2.5">

          <div className="relative min-w-0 flex-1">

            <HiOutlineSearch
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={
                searchTickets
              }
              placeholder="Search ticket, customer, AWB or order..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#0788ca] focus:ring-2 focus:ring-[#0788ca]/10"
            />

          </div>

          <SelectControl
            value={statusFilter}
            onChange={(event) =>
              changeStatusFilter(
                event.target.value
              )
            }
            className="w-[140px]"
          >
            <option value="">
              All Status
            </option>

            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {statusLabel(
                    status
                  )}
                </option>
              )
            )}
          </SelectControl>

          <SelectControl
            value={priorityFilter}
            onChange={(event) =>
              changePriorityFilter(
                event.target.value
              )
            }
            className="w-[140px]"
          >
            <option value="">
              All Priority
            </option>

            {PRIORITY_OPTIONS.map(
              (priority) => (
                <option
                  key={priority}
                  value={priority}
                >
                  {priorityLabel(
                    priority
                  )}
                </option>
              )
            )}
          </SelectControl>

          <SelectControl
            value={categoryFilter}
            onChange={(event) =>
              changeCategoryFilter(
                event.target.value
              )
            }
            className="w-[155px]"
          >
            <option value="">
              All Categories
            </option>

            {CATEGORY_OPTIONS.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {categoryLabel(
                    category
                  )}
                </option>
              )
            )}
          </SelectControl>

        </div>

      </div>

      {/* =====================================================
          TICKET TABLE
      ===================================================== */}

      <div className="min-h-0 flex-1 overflow-hidden p-5">

        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">

          {/* TABLE TITLE */}

          <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-100 px-5">

            <div>
              <div className="text-[13px] font-semibold text-slate-800">
                Tickets
              </div>

              <div className="mt-0.5 text-[10px] text-slate-400">
                {tickets.length}{" "}
                results
              </div>
            </div>

            <span className="text-[10px] text-slate-400">
              Latest first
            </span>

          </div>

          {/* TABLE */}

          <div className="min-h-0 flex-1 overflow-hidden">

            {loading ? (
              <div className="flex h-full items-center justify-center text-[12px] text-slate-400">
                Loading tickets...
              </div>
            ) : tickets.length ===
              0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-300">
                  <HiOutlineTicket
                    size={20}
                  />
                </div>

                <div className="mt-3 text-[12px] font-medium text-slate-600">
                  No tickets found
                </div>

                <div className="mt-1 text-[10px] text-slate-400">
                  Try changing your filters.
                </div>

              </div>
            ) : (
              <div className="h-full overflow-hidden">

                <table className="w-full table-fixed border-collapse">

                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">

                      <th className="w-[18%] px-5 py-3.5 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Ticket
                      </th>

                      <th className="w-[24%] px-4 py-3.5 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Customer
                      </th>

                      <th className="w-[25%] px-4 py-3.5 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Subject
                      </th>

                      <th className="w-[11%] px-4 py-3.5 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Priority
                      </th>

                      <th className="w-[13%] px-4 py-3.5 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Status
                      </th>

                      <th className="w-[9%] px-4 py-3.5 text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        Date
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {tickets
                      .slice(0, 8)
                      .map(
                        (ticket) => (
                          <tr
                            key={
                              ticket.id
                            }
                            onClick={() =>
                              openTicket(
                                ticket.id
                              )
                            }
                            className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                          >

                            {/* TICKET */}

                            <td className="px-5 py-4">

                              <div className="truncate text-[12px] font-semibold text-[#0788ca]">
                                #
                                {
                                  ticket.ticket_number
                                }
                              </div>

                              {ticket.awb && (
                                <div className="mt-1 truncate text-[9px] text-slate-400">
                                  AWB{" "}
                                  {
                                    ticket.awb
                                  }
                                </div>
                              )}

                            </td>

                            {/* CUSTOMER */}

                            <td className="px-4 py-4">

                              <div className="truncate text-[12px] font-medium text-slate-700">
                                {
                                  ticket.customer_name ||
                                  "Unknown customer"
                                }
                              </div>

                              <div className="mt-1 truncate text-[9px] text-slate-400">
                                {
                                  ticket.customer_email ||
                                  "—"
                                }
                              </div>

                            </td>

                            {/* SUBJECT */}

                            <td className="px-4 py-4">

                              <div className="truncate text-[12px] font-medium text-slate-700">
                                {
                                  ticket.subject ||
                                  "No subject"
                                }
                              </div>

                              <div className="mt-1 text-[9px] text-slate-400">
                                {categoryLabel(
                                  ticket.category
                                )}
                              </div>

                            </td>

                            {/* PRIORITY */}

                            <td className="px-4 py-4">
                              <PriorityBadge
                                priority={
                                  ticket.priority
                                }
                              />
                            </td>

                            {/* STATUS */}

                            <td className="px-4 py-4">
                              <StatusBadge
                                status={
                                  ticket.status
                                }
                                small
                              />
                            </td>

                            {/* DATE */}

                            <td className="px-4 py-4 text-[10px] text-slate-400">
                              {formatDate(
                                ticket.created_at
                              )}
                            </td>

                          </tr>
                        )
                      )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminTickets;