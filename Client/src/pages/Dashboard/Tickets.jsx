import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../services/api";
import { CardSkeleton, TableRowSkeleton } from "../../components/Common/TableSkeleton";

/* =========================================================
   OPTIONS
========================================================= */

const CATEGORY_OPTIONS = [
  { value: "SHIPMENT", label: "Shipment" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "PICKUP", label: "Pickup" },
  { value: "PAYMENT", label: "Payment / Wallet" },
  { value: "RATE_BILLING", label: "Rate / Billing" },
  { value: "ACCOUNT", label: "Account" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "OTHER", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_FOR_USER", label: "Waiting for You" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

/* =========================================================
   ICONS
========================================================= */

const Icon = ({
  name,
  size = 18,
  strokeWidth = 1.8,
  className = "",
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };

  switch (name) {
    case "ticket":
      return (
        <svg {...common}>
          <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5V9a2 2 0 0 0 0 4v1.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 14.5V13a2 2 0 0 0 0-4V7.5Z" />
          <path d="M9 8v1M9 11.5v1M9 15v1" />
        </svg>
      );

    case "chat":
      return (
        <svg {...common}>
          <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.7 8.7 0 0 1-3.4-.7L4 20l1.7-3.5A7.3 7.3 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
          <path d="M3 5v5h5" />
          <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
          <path d="M21 19v-5h-5" />
        </svg>
      );

    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );

    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "send":
      return (
        <svg {...common}>
          <path d="m22 2-7 20-4-9-9-4 20-7Z" />
          <path d="M22 2 11 13" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6" />
          <path d="M12 7h.01" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M16 2.5v4M8 2.5v4M3 9h18" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "box":
      return (
        <svg {...common}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </svg>
      );

    case "barcode":
      return (
        <svg {...common}>
          <path d="M5 5v14M8 5v14M11 5v14M15 5v14M18 5v14M20 5v14" />
        </svg>
      );

    case "tag":
      return (
        <svg {...common}>
          <path d="M20 13 13 20l-9-9V4h7l9 9Z" />
          <circle cx="8" cy="8" r="1" />
        </svg>
      );

    default:
      return null;
  }
};

/* =========================================================
   HELPERS
========================================================= */

const getUserId = () => {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.id || user?.user_id) return user.id || user.user_id;
    }
    const token = localStorage.getItem("token");
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return payload?.id || payload?.user_id || null;
      }
    }
    return null;
  } catch {
    return null;
  }
};

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`
    );
  }

  return data;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (status) => {
  const value = String(status || "").toUpperCase();
  const labels = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    WAITING_FOR_USER: "Waiting for You",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  return labels[value] || status || "-";
};

const categoryLabel = (category) => {
  const found = CATEGORY_OPTIONS.find(
    (item) => item.value === String(category || "").toUpperCase()
  );
  return found?.label || category || "-";
};

const priorityLabel = (priority) => {
  const found = PRIORITY_OPTIONS.find(
    (item) => item.value === String(priority || "").toUpperCase()
  );
  return found?.label || priority || "-";
};

/* =========================================================
   BADGES
========================================================= */

const StatusBadge = ({ status }) => {
  const value = String(status || "").toUpperCase();

  const styles = {
    OPEN: "bg-blue-50 text-blue-700 border-blue-200/90",
    IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200/90",
    WAITING_FOR_USER: "bg-violet-50 text-violet-700 border-violet-200/90",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
    CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const dots = {
    OPEN: "bg-blue-500",
    IN_PROGRESS: "bg-amber-500",
    WAITING_FOR_USER: "bg-violet-500",
    RESOLVED: "bg-emerald-500",
    CLOSED: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold tracking-tight shadow-2xs ${
        styles[value] || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          dots[value] || "bg-slate-400"
        } ${value === "IN_PROGRESS" || value === "OPEN" ? "animate-pulse" : ""}`}
      />
      {statusLabel(value)}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const value = String(priority || "").toUpperCase();

  const styles = {
    LOW: "bg-slate-50 text-slate-600 border-slate-200",
    NORMAL: "bg-sky-50 text-[#008dd2] border-sky-200/80 font-semibold",
    HIGH: "bg-amber-50 text-amber-700 border-amber-200/90 font-bold",
    URGENT: "bg-rose-50 text-rose-700 border-rose-200/90 font-bold animate-pulse",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
        styles[value] || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {priorityLabel(value)}
    </span>
  );
};

/* =========================================================
   DETAIL ROW
========================================================= */

const DetailRow = ({ icon, label, children }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-b-0">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
      <Icon name={icon} size={14} />
    </div>

    <span className="w-20 shrink-0 text-[11px] font-semibold text-slate-400">
      {label}
    </span>

    <div className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
      {children}
    </div>
  </div>
);

/* =========================================================
   STAT CARD
========================================================= */

const StatCard = ({
  label,
  value,
  subtitle,
  icon,
  iconClass,
  active,
  onClick,
  activeClass,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
      active
        ? `${activeClass} shadow-xs`
        : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition">
        {label}
      </span>

      <div
        className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl transition ${iconClass}`}
      >
        <Icon name={icon} size={15} />
      </div>
    </div>

    <div className="mt-2.5">
      <span className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 font-mono">
        {value}
      </span>

      {subtitle && (
        <p className="mt-0.5 text-[10.5px] font-medium text-slate-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  </button>
);

/* =========================================================
   MAIN COMPONENT
========================================================= */

function Tickets() {
  const userId = useMemo(() => getUserId(), []);

  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    open: 0,
    pending: 0,
    resolved: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const searchTimerRef = useRef(null);
  const chatBottomRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tickets.slice(start, start + pageSize);
  }, [tickets, currentPage, pageSize]);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [closing, setClosing] = useState(false);

  const [newTicket, setNewTicket] = useState({
    category: "SHIPMENT",
    priority: "NORMAL",
    order_id: "",
    awb: "",
    subject: "",
    description: "",
  });

  useEffect(() => {
    if (selectedTicket && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.messages]);

  const getActiveUserId = () => userId || getUserId();

  const fetchTickets = async ({
    searchValue = search,
    statusValue = statusFilter,
  } = {}) => {
    const activeUserId = getActiveUserId();
    if (!activeUserId) throw new Error("Please login again to continue");

    const params = new URLSearchParams();
    params.set("user_id", activeUserId);
    if (searchValue.trim()) params.set("search", searchValue.trim());
    if (statusValue) params.set("status", statusValue);

    const data = await apiRequest(`/tickets?${params.toString()}`);

    setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    setCounts({
      total: Number(data.counts?.total || 0),
      open: Number(data.counts?.open || 0),
      pending: Number(data.counts?.pending || 0),
      resolved: Number(data.counts?.resolved || 0),
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await fetchTickets({ searchValue: "", statusValue: "" });
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Unable to load tickets");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const refresh = async () => {
    try {
      setRefreshing(true);
      await fetchTickets();

      if (selectedTicket?.id) {
        const activeUserId = getActiveUserId();
        const data = await apiRequest(
          `/tickets/${selectedTicket.id}?user_id=${activeUserId}`
        );
        setSelectedTicket(data.ticket);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Unable to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const [searchParams] = useSearchParams();
  const location = useLocation();

  const openTicket = async (ticketId) => {
    try {
      setDetailLoading(true);
      const activeUserId = getActiveUserId();
      const data = await apiRequest(`/tickets/${ticketId}?user_id=${activeUserId}`);
      setSelectedTicket(data.ticket);
      setReply("");
      setShowMobileInfo(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Unable to open ticket");
    } finally {
      setDetailLoading(false);
    }
  };

  // Auto-open ticket if ticket_id is present in URL params or router location state (e.g. from Notification click)
  useEffect(() => {
    const targetTicketId = searchParams.get("ticket_id") || location.state?.ticketId;
    if (targetTicketId) {
      openTicket(Number(targetTicketId));
    }
  }, [searchParams, location.state]);

  const goBack = () => {
    setSelectedTicket(null);
    setReply("");
    setShowMobileInfo(false);
  };

  const createTicket = async (event) => {
    event.preventDefault();
    if (!newTicket.subject.trim()) return toast.error("Please enter a subject");
    if (!newTicket.description.trim()) return toast.error("Please describe your issue");

    try {
      setCreating(true);
      const activeUserId = getActiveUserId();
      const payload = {
        user_id: Number(activeUserId),
        category: newTicket.category,
        priority: newTicket.priority,
        subject: newTicket.subject.trim(),
        description: newTicket.description.trim(),
      };

      if (newTicket.order_id.trim()) {
        payload.order_id = Number(newTicket.order_id.trim());
      }
      if (newTicket.awb.trim()) {
        payload.awb = newTicket.awb.trim();
      }

      const data = await apiRequest("/tickets/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Ticket created successfully");
      setShowCreate(false);
      setNewTicket({
        category: "SHIPMENT",
        priority: "NORMAL",
        order_id: "",
        awb: "",
        subject: "",
        description: "",
      });

      await fetchTickets();
      if (data.ticket?.id) {
        await openTicket(data.ticket.id);
      }
    } catch (error) {
      toast.error(error.message || "Unable to create ticket");
    } finally {
      setCreating(false);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket) return;
    const message = reply.trim();
    if (!message) return;

    const status = String(selectedTicket.status || "").toUpperCase();
    if (status === "RESOLVED" || status === "CLOSED") {
      toast.error("This ticket is closed");
      return;
    }

    try {
      setSendingReply(true);
      const activeUserId = getActiveUserId();
      await apiRequest(`/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          user_id: Number(activeUserId),
          message,
        }),
      });

      setReply("");
      const data = await apiRequest(
        `/tickets/${selectedTicket.id}?user_id=${activeUserId}`
      );
      setSelectedTicket(data.ticket);
      await fetchTickets();
      toast.success("Reply sent");
    } catch (error) {
      toast.error(error.message || "Unable to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const closeTicket = async () => {
    if (!selectedTicket) return;
    if (!window.confirm("Are you sure you want to close this ticket?")) return;

    try {
      setClosing(true);
      const activeUserId = getActiveUserId();
      await apiRequest(`/tickets/${selectedTicket.id}/close`, {
        method: "POST",
        body: JSON.stringify({ user_id: Number(activeUserId) }),
      });

      const data = await apiRequest(
        `/tickets/${selectedTicket.id}?user_id=${activeUserId}`
      );
      setSelectedTicket(data.ticket);
      await fetchTickets();
      toast.success("Ticket closed successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Unable to close ticket");
    } finally {
      setClosing(false);
    }
  };

  const applyStatus = async (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
    try {
      await fetchTickets({ searchValue: search, statusValue: value });
    } catch (error) {
      toast.error(error.message || "Unable to filter tickets");
    }
  };

  const runSearch = async (value) => {
    setCurrentPage(1);
    try {
      await fetchTickets({ searchValue: value, statusValue: statusFilter });
    } catch (error) {
      toast.error(error.message || "Unable to search tickets");
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      runSearch(value);
    }, 350);
  };

  const handleSearch = async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    await runSearch(event.currentTarget.value);
  };

  /* =========================================================
     DETAIL VIEW (MAXIMIZED CHAT HEIGHT ON MOBILE & DESKTOP)
  ========================================================= */

  if (selectedTicket) {
    const ticketStatus = String(selectedTicket.status || "").toUpperCase();
    const canReply = ticketStatus !== "RESOLVED" && ticketStatus !== "CLOSED";
    const messages = Array.isArray(selectedTicket.messages)
      ? selectedTicket.messages
      : [];
    const hasShipment =
      selectedTicket.order_id ||
      selectedTicket.public_order_id ||
      selectedTicket.awb;

    return (
      <div className="fixed inset-x-0 top-[64px] bottom-16 lg:bottom-0 z-20 flex flex-col bg-[#f6f8fb] dark:bg-[#090b10] text-slate-800 dark:text-slate-100 overflow-hidden lg:pl-[250px]">
        {/* ULTRA-COMPACT SLIM HEADER */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-3 sm:px-6 py-2 shadow-xs">
          <div className="flex items-center justify-between gap-2 max-w-[1500px] mx-auto">
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={goBack}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#008dd2] hover:bg-sky-50 active:scale-95 shrink-0"
                title="Back to Tickets"
              >
                <Icon name="arrow-left" size={17} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-black text-[#008dd2] shrink-0">
                    #{selectedTicket.ticket_number}
                  </span>
                  <StatusBadge status={selectedTicket.status} />
                </div>
                <h1 className="truncate text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {selectedTicket.subject}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* MOBILE INFO BUTTON */}
              <button
                type="button"
                onClick={() => setShowMobileInfo((prev) => !prev)}
                className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                title="View Ticket Details"
              >
                <Icon name="info" size={15} />
              </button>

              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <Icon
                  name="refresh"
                  size={12}
                  className={refreshing ? "animate-spin text-[#008dd2]" : ""}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {ticketStatus !== "CLOSED" && (
                <button
                  type="button"
                  onClick={closeTicket}
                  disabled={closing}
                  className="flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                >
                  <Icon name="check" size={12} />
                  <span className="hidden sm:inline">Close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* WORKSPACE AREA: Full height, zero outer padding on mobile */}
        <div className="flex-1 min-h-0 overflow-hidden p-0 sm:p-3.5 max-w-[1500px] w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-3 h-full min-h-0">
            {/* CHAT SECTION */}
            <section className="flex flex-col h-full min-h-0 rounded-none sm:rounded-2xl border-0 sm:border border-slate-200/80 bg-white shadow-none sm:shadow-xs overflow-hidden">
              {/* CHAT HEADER BAR */}
              <div className="flex h-9 shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5.5 w-5.5 items-center justify-center rounded-md bg-blue-50 text-[#008dd2]">
                    <Icon name="chat" size={12} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">
                    Live Support Chat
                  </span>
                  <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[9.5px] font-bold text-slate-600">
                    {messages.length}
                  </span>
                </div>
                <span className="text-[10.5px] font-medium text-slate-400">
                  Priority:{" "}
                  <b className="font-bold text-slate-700">
                    {priorityLabel(selectedTicket.priority)}
                  </b>
                </span>
              </div>

              {/* MESSAGES SCROLL VIEW: TIGHTER SPACING FOR MORE VISIBLE MESSAGES */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-2.5 [scrollbar-width:thin]">
                {detailLoading ? (
                  <div className="space-y-3 py-2">
                    <div className="flex justify-start">
                      <div className="h-10 w-48 rounded-2xl rounded-bl-sm bg-slate-100 skeleton-shimmer" />
                    </div>
                    <div className="flex justify-end">
                      <div className="h-12 w-56 rounded-2xl rounded-br-sm bg-slate-200 skeleton-shimmer" />
                    </div>
                    <div className="flex justify-start">
                      <div className="h-8 w-40 rounded-2xl rounded-bl-sm bg-slate-100 skeleton-shimmer" />
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
                    <Icon name="chat" size={26} />
                    <p className="mt-2 text-xs font-bold text-slate-700">
                      No messages yet
                    </p>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Send your query below to get help from our operations team.
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
                          isAdmin ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div className="max-w-[88%] sm:max-w-[75%] space-y-0.5">
                          <div
                            className={`flex items-center gap-1.5 px-1 text-[9.5px] text-slate-400 ${
                              isAdmin ? "justify-start" : "justify-end"
                            }`}
                          >
                            <span className="font-bold text-slate-600">
                              {isAdmin ? "Support" : "You"}
                            </span>
                            <span>•</span>
                            <span>{formatDateTime(message.created_at)}</span>
                          </div>

                          <div
                            className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                              isAdmin
                                ? "rounded-tl-xs border border-slate-200/80 bg-slate-50 text-slate-800"
                                : "rounded-tr-xs bg-[#008dd2] text-white font-normal shadow-xs"
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

              {/* PINNED COMPACT ONE-LINE REPLY DOCK */}
              <div className="shrink-0 border-t border-slate-100 bg-white p-2 sm:p-3">
                {canReply ? (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1 focus-within:border-[#008dd2] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#008dd2]/10 transition">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                      rows={1}
                      maxLength={2000}
                      placeholder="Type a message..."
                      className="block flex-1 max-h-20 min-h-[32px] resize-none bg-transparent py-1 text-xs text-slate-800 outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={sendReply}
                      disabled={sendingReply || !reply.trim()}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#008dd2] text-white transition hover:bg-[#007ab6] active:scale-95 disabled:opacity-40 shadow-xs"
                      title="Send Message"
                    >
                      <Icon name="send" size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-9 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 text-[11px] font-medium text-slate-500">
                    <span>This ticket is closed.</span>
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                )}
              </div>
            </section>

            {/* DESKTOP RIGHT SIDEBAR INFO */}
            <aside className="hidden lg:block space-y-3 overflow-y-auto [scrollbar-width:none]">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Ticket Summary
                </h3>
                <div className="divide-y divide-slate-100">
                  <DetailRow icon="ticket" label="ID">
                    <span className="font-mono text-[#008dd2] font-bold">
                      #{selectedTicket.ticket_number}
                    </span>
                  </DetailRow>
                  <DetailRow icon="tag" label="Category">
                    {categoryLabel(selectedTicket.category)}
                  </DetailRow>
                  <DetailRow icon="info" label="Priority">
                    <PriorityBadge priority={selectedTicket.priority} />
                  </DetailRow>
                  <DetailRow icon="calendar" label="Created On">
                    {formatDateTime(selectedTicket.created_at)}
                  </DetailRow>
                </div>
              </div>

              {hasShipment && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Linked Shipment
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {selectedTicket.public_order_id && (
                      <DetailRow icon="box" label="Order ID">
                        #{selectedTicket.public_order_id}
                      </DetailRow>
                    )}
                    {selectedTicket.awb && (
                      <DetailRow icon="barcode" label="AWB Number">
                        <span className="font-mono">{selectedTicket.awb}</span>
                      </DetailRow>
                    )}
                    {selectedTicket.tracking_status && (
                      <DetailRow icon="clock" label="Live Status">
                        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                          {selectedTicket.tracking_status}
                        </span>
                      </DetailRow>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>

        {/* MOBILE BOTTOM SHEET FOR ALL 4 TICKET DETAILS */}
        {showMobileInfo && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs p-0 lg:hidden animate-in fade-in duration-150">
            <div className="w-full max-h-[75vh] flex flex-col rounded-t-3xl bg-white p-4 pb-24 shadow-2xl overflow-y-auto animate-in slide-in-from-bottom duration-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ticket Details
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMobileInfo(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                <DetailRow icon="ticket" label="ID">
                  <span className="font-mono text-[#008dd2] font-bold">
                    #{selectedTicket.ticket_number}
                  </span>
                </DetailRow>
                <DetailRow icon="tag" label="Category">
                  {categoryLabel(selectedTicket.category)}
                </DetailRow>
                <DetailRow icon="info" label="Priority">
                  <PriorityBadge priority={selectedTicket.priority} />
                </DetailRow>
                <DetailRow icon="calendar" label="Created On">
                  {formatDateTime(selectedTicket.created_at)}
                </DetailRow>

                {selectedTicket.public_order_id && (
                  <DetailRow icon="box" label="Order ID">
                    #{selectedTicket.public_order_id}
                  </DetailRow>
                )}
                {selectedTicket.awb && (
                  <DetailRow icon="barcode" label="AWB">
                    <span className="font-mono">{selectedTicket.awb}</span>
                  </DetailRow>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     LIST VIEW (FULL TICKETS DASHBOARD)
  ========================================================= */

  return (
    <div className="min-h-full w-full bg-[#f6f8fb] dark:bg-[#090b10] p-3 sm:p-5 md:p-6 pb-20 lg:pb-8">
      {/* ==================================================
          PAGE HEADER (MATCHES ALLORDERS & DASHBOARD)
      ================================================== */}
      <div className="mb-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-[0_1px_3px_rgba(15,23,42,0.03)] max-w-[1500px] mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#008dd2] ring-1 ring-sky-100 shadow-2xs">
              <Icon name="ticket" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Support & Helpdesk
                </h1>
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#008dd2] border border-sky-100">
                  Live Operations
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Manage inquiries, claim missing parcels, or reach out to our dedicated operations desk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="flex h-9.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh tickets"
            >
              <Icon
                name="refresh"
                size={13}
                className={refreshing ? "animate-spin text-[#008dd2]" : "text-slate-400"}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex h-9.5 items-center justify-center gap-1.5 rounded-xl bg-[#008dd2] px-4 text-xs font-bold text-white shadow-sm shadow-[#008dd2]/20 transition hover:bg-[#007ab6] active:scale-95 cursor-pointer"
            >
              <Icon name="plus" size={14} />
              <span>New Ticket</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto space-y-3.5">
        {/* ==================================================
            STAT TILES (PREMIUM METRIC CARDS)
        ================================================== */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3.5">
          <StatCard
            label="All Tickets"
            value={counts.total}
            subtitle="All logged issues"
            icon="ticket"
            iconClass="bg-sky-50 text-[#008dd2]"
            active={!statusFilter}
            activeClass="bg-gradient-to-br from-white to-sky-50/50 border-[#008dd2]/40 ring-2 ring-[#008dd2]/20"
            onClick={() => applyStatus("")}
          />
          <StatCard
            label="Open"
            value={counts.open}
            subtitle="Awaiting review"
            icon="chat"
            iconClass="bg-blue-50 text-blue-600"
            active={statusFilter === "OPEN"}
            activeClass="bg-gradient-to-br from-white to-blue-50/50 border-blue-400 ring-2 ring-blue-500/20"
            onClick={() => applyStatus("OPEN")}
          />
          <StatCard
            label="In Progress"
            value={counts.pending}
            subtitle="Under investigation"
            icon="clock"
            iconClass="bg-amber-50 text-amber-600"
            active={statusFilter === "PENDING"}
            activeClass="bg-gradient-to-br from-white to-amber-50/50 border-amber-400 ring-2 ring-amber-500/20"
            onClick={() => applyStatus("PENDING")}
          />
          <StatCard
            label="Resolved"
            value={counts.resolved}
            subtitle="Closed & completed"
            icon="check"
            iconClass="bg-emerald-50 text-emerald-600"
            active={statusFilter === "RESOLVED"}
            activeClass="bg-gradient-to-br from-white to-emerald-50/50 border-emerald-400 ring-2 ring-emerald-500/20"
            onClick={() => applyStatus("RESOLVED")}
          />
        </div>

        {/* ==================================================
            SEARCH & FILTERS BAR
        ================================================== */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.02)]">
          <div className="relative flex-1">
            <Icon
              name="search"
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearch}
              placeholder="Search by ticket #, subject, AWB, or order ID"
              className="h-10 w-full rounded-xl border border-slate-200/90 bg-slate-50/60 pl-10 pr-9 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-4 focus:ring-[#008dd2]/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  runSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => applyStatus(e.target.value)}
                className="h-10 appearance-none rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 pl-3.5 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#008dd2] focus:bg-white focus:ring-4 focus:ring-[#008dd2]/10 cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="chevron" size={12} className="rotate-90" />
              </div>
            </div>

            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50/60 text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Refresh list"
            >
              <Icon
                name="refresh"
                size={14}
                className={refreshing ? "animate-spin text-[#008dd2]" : ""}
              />
            </button>
          </div>
        </div>

        {/* ==================================================
            MOBILE TICKET CARDS
        ================================================== */}
        <div className="space-y-2.5 sm:hidden">
          {loading ? (
            <CardSkeleton count={4} />
          ) : tickets.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-400">
              <Icon name="ticket" size={24} />
              <p className="mt-2 text-xs font-bold text-slate-700">
                No tickets found
              </p>
            </div>
          ) : (
            <>
              {paginatedTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => openTicket(ticket.id)}
                  className="w-full rounded-2xl border border-slate-200/90 bg-white p-3.5 text-left shadow-xs active:scale-[0.99] transition hover:border-[#008dd2]/40"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#008dd2]">
                        #{ticket.ticket_number}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-600">
                        {categoryLabel(ticket.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                  </div>

                  <div className="py-2.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {ticket.subject}
                    </p>
                    <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                      {ticket.awb && <span className="font-mono font-semibold text-slate-700">AWB: {ticket.awb} • </span>}
                      {ticket.public_order_id && `Order #${ticket.public_order_id}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10.5px] text-slate-600 font-medium">
                    <span>{formatDate(ticket.created_at)}</span>
                    <span className="flex items-center gap-1 text-[#008dd2] font-bold">
                      Open Discussion
                      <Icon name="chevron" size={12} />
                    </span>
                  </div>
                </button>
              ))}

              {tickets.length > pageSize && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-xs shadow-xs">
                  <span className="font-semibold text-slate-500">
                    Page {currentPage} of {totalPages} ({tickets.length} total)
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

        {/* ==================================================
            DESKTOP TABLE
        ================================================== */}
        <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.02)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-800">
                <th className="py-3.5 px-5">Ticket</th>
                <th className="py-3.5 px-5">Subject</th>
                <th className="py-3.5 px-5">Category</th>
                <th className="py-3.5 px-5">Priority</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Created</th>
                <th className="py-3.5 px-5 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <TableRowSkeleton rows={5} cols={7} />
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#008dd2] ring-8 ring-sky-50/50 mb-3">
                        <Icon name="ticket" size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">No support tickets found</h3>
                      <p className="mt-1 text-xs text-slate-400 text-center leading-relaxed">
                        {search || statusFilter
                          ? "No tickets match your active search and filter criteria. Try clearing filters."
                          : "Need assistance with an order, NDR, or pickup? Create a new support ticket and our team will get right on it."}
                      </p>
                      {search || statusFilter ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            applyStatus("");
                          }}
                          className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCreate(true)}
                          className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-[#008dd2] px-4 py-2 text-xs font-bold text-white hover:bg-[#007ab6] transition active:scale-95 shadow-sm shadow-[#008dd2]/20 cursor-pointer"
                        >
                          <Icon name="plus" size={13} />
                          <span>Create New Ticket</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => openTicket(ticket.id)}
                    className="group cursor-pointer transition-all duration-150 hover:bg-sky-50/40"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#008dd2] group-hover:bg-[#008dd2] group-hover:text-white transition-colors duration-200 shadow-2xs">
                          <Icon name="ticket" size={15} />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-slate-900 group-hover:text-[#008dd2] transition-colors">
                            #{ticket.ticket_number}
                          </div>
                          {ticket.awb && (
                            <div className="font-mono text-[10.5px] text-slate-600 font-semibold">
                              AWB: {ticket.awb}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 group-hover:text-[#008dd2] transition-colors truncate max-w-sm">
                        {ticket.subject}
                      </div>
                      {ticket.public_order_id && (
                        <div className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-700 mt-0.5">
                          <Icon name="box" size={10} />
                          <span>Order #{ticket.public_order_id}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-800">
                        {categoryLabel(ticket.category)}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      <PriorityBadge priority={ticket.priority} />
                    </td>

                    <td className="py-3.5 px-5">
                      <StatusBadge status={ticket.status} />
                    </td>

                    <td className="py-3.5 px-5 text-slate-700 font-semibold">
                      {formatDate(ticket.created_at)}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-[#008dd2] bg-sky-50 opacity-80 group-hover:opacity-100 group-hover:bg-[#008dd2] group-hover:text-white transition-all shadow-2xs">
                        View
                        <Icon name="chevron" size={11} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* DESKTOP PAGINATION FOOTER */}
          {tickets.length > pageSize && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3 text-xs">
              <span className="font-semibold text-slate-500">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, tickets.length)} of {tickets.length} tickets
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

      {/* CREATE TICKET MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Create Support Ticket
                </h2>
                <p className="text-[11px] text-slate-400">
                  Our operations team will assist you immediately
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={createTicket}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">
                    Category *
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#008dd2]"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">
                    Priority *
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                    className="h-10.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#008dd2]"
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTicket.order_id}
                    onChange={(e) =>
                      setNewTicket((prev) => ({
                        ...prev,
                        order_id: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder="e.g. 133825"
                    className="h-10.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#008dd2]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">
                    AWB (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTicket.awb}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, awb: e.target.value }))
                    }
                    placeholder="AWB Tracking #"
                    className="h-10.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#008dd2]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-600">
                  Subject *
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="Summary of your issue"
                  className="h-10.5 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#008dd2]"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600">
                    Description *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {newTicket.description.length}/1000
                  </span>
                </div>
                <textarea
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  maxLength={1000}
                  placeholder="Describe your issue with order/shipment in detail..."
                  className="w-full resize-none rounded-xl border border-slate-200 p-3 text-xs text-slate-700 outline-none focus:border-[#008dd2]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="h-10 rounded-xl px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    creating ||
                    !newTicket.subject.trim() ||
                    !newTicket.description.trim()
                  }
                  className="h-10 rounded-xl bg-[#008dd2] hover:bg-[#007ab6] px-5 text-xs font-bold text-white shadow-sm shadow-[#008dd2]/20 disabled:opacity-50 transition active:scale-95 cursor-pointer"
                >
                  {creating ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tickets;