import React, { useEffect, useMemo, useState } from "react";
import {
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineUpload,
  HiOutlineCheck,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";

/* =========================================================
   HELPERS
========================================================= */

const valueOrDash = (value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return "-";
  }

  return String(value);
};

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatWeight = (value) => {
  const number = numberValue(value);
  return `${number
    .toFixed(3)
    .replace(/\.?0+$/, "")} kg`;
};

const formatMoney = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "₹0.00";
  }
  return `₹${number.toFixed(2)}`;
};

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return String(date);
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeOrderId = (item) => {
  return (
    item?.order_id ||
    item?.orderId ||
    item?.order_number ||
    item?.id ||
    "-"
  );
};

const getStatus = (item) => {
  return String(
    item?.status ||
      item?.wc_status ||
      "PENDING"
  )
    .trim()
    .toUpperCase();
};

/* =========================================================
   STATUS BADGE
========================================================= */

const StatusBadge = ({ status }) => {
  const normalized = String(
    status || "PENDING"
  )
    .trim()
    .toUpperCase();

  if (normalized === "SETTLED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Settled
      </span>
    );
  }

  if (normalized === "WAIVED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Waived
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
};

/* =========================================================
   IMPORT MODAL (RESPONSIVE)
========================================================= */

const ImportWeightFileModal = ({
  file,
  onFileChange,
  onImport,
  importing,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          if (!importing) {
            onClose();
          }
        }
      }}
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-t-3xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#ff5a2f]">
              <HiOutlineUpload className="text-[18px]" />
            </div>

            <div>
              <h2 className="text-[14px] font-bold text-slate-800">
                Import Weight File
              </h2>
              <p className="text-[10.5px] text-slate-400">
                Upload courier weight discrepancy data
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[18px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-5">
          <label className="block cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={onFileChange}
              disabled={importing}
            />

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-7 text-center transition hover:border-orange-300 hover:bg-orange-50/30">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-xs">
                <HiOutlineUpload className="text-[20px]" />
              </div>

              <p className="mt-2.5 text-xs font-bold text-slate-700 truncate max-w-xs mx-auto">
                {file ? file.name : "Choose Excel or CSV file"}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Supported formats: .xlsx, .xls, .csv
              </p>
            </div>
          </label>

          <div className="mt-3.5 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-[10.5px] leading-relaxed text-blue-700">
              AWB and courier weight will be matched with the existing order. The system will calculate the revised shipping charge and create/update pending settlement records.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="h-9.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onImport}
            disabled={!file || importing}
            className="inline-flex h-9.5 items-center gap-2 rounded-xl bg-[#ff5a2f] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#ed4d24] active:scale-95 disabled:opacity-40"
          >
            {importing && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {importing ? "Importing..." : "Import File"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   MAIN
========================================================= */

const WeightChecking = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [importedRecordIds, setImportedRecordIds] = useState([]);
  const [resettingImport, setResettingImport] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [settlingAll, setSettlingAll] = useState(false);

  /* =======================================================
     FETCH
  ======================================================= */

  const fetchWeightChecking = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_BASE_URL}/admin/weight-checking`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch weight checking records"
        );
      }

      const apiRecords = Array.isArray(data?.records)
        ? data.records
        : Array.isArray(data?.weightCheckings)
        ? data.weightCheckings
        : [];

      setRecords(apiRecords);
    } catch (error) {
      console.error("Fetch weight checking error:", error);
      toast.error(
        error.message || "Unable to load weight checking records"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeightChecking();
  }, []);

  useEffect(() => {
    setSelectedIds((previous) => {
      const availableIds = new Set(
        records
          .filter(
            (item) =>
              getStatus(item) === "PENDING" &&
              Number.isInteger(Number(item?.id))
          )
          .map((item) => Number(item?.id))
      );

      const next = new Set(
        [...previous].filter((id) => availableIds.has(Number(id)))
      );

      if (next.size === previous.size) {
        return previous;
      }

      return next;
    });
  }, [records]);

  const counts = useMemo(() => {
    return {
      all: records.length,
      pending: records.filter((item) => getStatus(item) === "PENDING").length,
      settled: records.filter((item) => getStatus(item) === "SETTLED").length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((item) => {
      const orderId = String(normalizeOrderId(item)).toLowerCase();
      const awb = String(item?.awb || "").toLowerCase();
      const customer = String(
        item?.user_name ||
          item?.customer_name ||
          item?.full_name ||
          ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        orderId.includes(query) ||
        awb.includes(query) ||
        customer.includes(query);

      const status = getStatus(item);
      const matchesStatus = statusFilter === status;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const pendingRecords = useMemo(() => {
    return records.filter((item) => {
      return (
        getStatus(item) === "PENDING" &&
        Number.isInteger(Number(item?.id))
      );
    });
  }, [records]);

  const pendingExtraTotal = useMemo(() => {
    return pendingRecords.reduce((total, item) => {
      return (
        total +
        numberValue(
          item?.extra_charge ?? item?.extra_weight_charge
        )
      );
    }, 0);
  }, [pendingRecords]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("PENDING");
  };

  const handleImportFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowed = /\.(xlsx|xls|csv)$/i;

    if (!allowed.test(file.name)) {
      toast.error("Only XLSX, XLS or CSV files are allowed");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleImportWeightFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a weight file first");
      return;
    }

    try {
      setImporting(true);
      const token = localStorage.getItem("adminToken");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/admin/weight-checking/import`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to import weight file");
      }

      const imported = Number(data?.summary?.imported || 0);

      const importedIds = Array.isArray(data?.imported)
        ? data.imported
            .map((item) => Number(item?.id))
            .filter((id) => Number.isInteger(id) && id > 0)
        : [];

      setImportedRecordIds(importedIds);
      setSelectedIds(new Set());

      const skipped = Number(data?.summary?.skipped || 0);
      const errors = Number(data?.summary?.errors || 0);

      if (imported > 0) {
        toast.success(
          `${imported} weight record${imported === 1 ? "" : "s"} imported successfully`
        );
      } else {
        toast.success("Weight file processed successfully");
      }

      if (skipped > 0 || errors > 0) {
        toast(`${skipped} skipped, ${errors} error${errors === 1 ? "" : "s"}`, {
          icon: "ℹ️",
        });
      }

      setShowImportModal(false);
      setSelectedFile(null);

      await fetchWeightChecking();
    } catch (error) {
      console.error("Import weight file error:", error);
      toast.error(error.message || "Failed to import weight file");
    } finally {
      setImporting(false);
    }
  };

  const selectablePendingRecords = useMemo(() => {
    return filteredRecords.filter((item) => {
      return (
        getStatus(item) === "PENDING" &&
        Number.isInteger(Number(item?.id))
      );
    });
  }, [filteredRecords]);

  const selectedPendingRecords = useMemo(() => {
    return pendingRecords.filter((item) =>
      selectedIds.has(Number(item?.id))
    );
  }, [pendingRecords, selectedIds]);

  const selectedExtraTotal = useMemo(() => {
    return selectedPendingRecords.reduce(
      (total, item) =>
        total +
        numberValue(item?.extra_charge ?? item?.extra_weight_charge),
      0
    );
  }, [selectedPendingRecords]);

  const allVisiblePendingSelected =
    selectablePendingRecords.length > 0 &&
    selectablePendingRecords.every((item) =>
      selectedIds.has(Number(item?.id))
    );

  const toggleRecordSelection = (id) => {
    const numericId = Number(id);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return;
    }

    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(numericId)) {
        next.delete(numericId);
      } else {
        next.add(numericId);
      }

      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (allVisiblePendingSelected) {
        selectablePendingRecords.forEach((item) => {
          next.delete(Number(item.id));
        });
      } else {
        selectablePendingRecords.forEach((item) => {
          next.add(Number(item.id));
        });
      }

      return next;
    });
  };

  const handleSettleSelected = async () => {
    const ids = [...selectedIds].filter((id) =>
      pendingRecords.some(
        (item) => Number(item?.id) === Number(id)
      )
    );

    if (ids.length === 0) {
      toast.error("Please select at least one pending settlement");
      return;
    }

    const adjustmentText =
      selectedExtraTotal > 0
        ? `Net amount to recover: ${formatMoney(selectedExtraTotal)}`
        : selectedExtraTotal < 0
        ? `Net amount to refund: ${formatMoney(Math.abs(selectedExtraTotal))}`
        : "Net wallet adjustment: ₹0.00";

    const confirmed = window.confirm(
      `Settle ${ids.length} selected weight record${
        ids.length === 1 ? "" : "s"
      }?\n\n` +
        `${adjustmentText}\n\n` +
        `Only the selected records will be settled.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSettlingAll(true);
      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_BASE_URL}/admin/weight-checking/settle-selected`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ ids }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to settle selected weight records"
        );
      }

      const settledCount = Number(data?.settled_count || 0);
      const totalAmount = Number(data?.total_amount || 0);

      if (settledCount > 0) {
        const settlementMessage =
          totalAmount > 0
            ? `${formatMoney(totalAmount)} recovered from wallets.`
            : totalAmount < 0
            ? `${formatMoney(Math.abs(totalAmount))} refunded to wallets.`
            : "No net wallet adjustment.";

        toast.success(
          `${settledCount} settlement${
            settledCount === 1 ? "" : "s"
          } completed. ${settlementMessage}`
        );
      } else {
        toast.error("No selected pending settlements were available");
      }

      setSelectedIds(new Set());
      setImportedRecordIds((previous) =>
        previous.filter((id) => !ids.includes(Number(id)))
      );

      await fetchWeightChecking();
    } catch (error) {
      console.error("Settle selected error:", error);
      toast.error(
        error.message || "Failed to settle selected weight records"
      );
    } finally {
      setSettlingAll(false);
    }
  };

  const handleResetImported = async () => {
    const ids = [
      ...new Set(
        importedRecordIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];

    if (ids.length === 0) {
      toast.error("There are no imported pending records to reset");
      return;
    }

    const confirmed = window.confirm(
      `Reset ${ids.length} imported weight record${
        ids.length === 1 ? "" : "s"
      }?\n\n` +
        `This will remove only pending courier-import records.\n` +
        `Settled records will not be affected.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setResettingImport(true);
      const token = localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_BASE_URL}/admin/weight-checking/reset-imported`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ ids }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || "Failed to reset imported weight records"
        );
      }

      setSelectedIds(new Set());
      setImportedRecordIds([]);

      toast.success(
        data?.message || "Imported pending records reset successfully"
      );

      await fetchWeightChecking();
    } catch (error) {
      console.error("Reset imported weight records error:", error);
      toast.error(
        error.message || "Failed to reset imported weight records"
      );
    } finally {
      setResettingImport(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] p-3 sm:p-5 md:p-6 pb-24 lg:pb-8 max-w-7xl mx-auto">
      {/* =================================================
          HEADER
      ================================================= */}
      <div className="mb-4 sm:mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
              Weight Checking
            </h1>
            <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
              {counts.all}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Audit and reconcile merchant declared weight with courier verified weight
          </p>
        </div>

        {/* TOP ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* IMPORT */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            disabled={settlingAll || resettingImport}
            className="flex-1 sm:flex-none inline-flex h-9.5 items-center justify-center gap-1.5 rounded-xl bg-[#ff5a2f] px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#ed4d24] active:scale-95 disabled:opacity-50"
          >
            <HiOutlineUpload className="text-[16px]" />
            <span>Import Weight File</span>
          </button>

          {/* RESET IMPORT */}
          {importedRecordIds.length > 0 && (
            <button
              type="button"
              onClick={handleResetImported}
              disabled={resettingImport || settlingAll || importing}
              className="inline-flex h-9.5 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-600 shadow-xs transition hover:bg-red-50 active:scale-95 disabled:opacity-50"
            >
              {resettingImport && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
              )}
              {resettingImport
                ? "Resetting..."
                : `Reset (${importedRecordIds.length})`}
            </button>
          )}

          {/* SETTLE SELECTED */}
          <button
            type="button"
            onClick={handleSettleSelected}
            disabled={settlingAll || resettingImport || selectedIds.size === 0}
            className="flex-1 sm:flex-none inline-flex h-9.5 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
          >
            {settlingAll && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            <span>
              {settlingAll
                ? "Settling..."
                : `Settle Selected${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
            </span>
          </button>

          {/* REFRESH */}
          <button
            type="button"
            onClick={fetchWeightChecking}
            disabled={loading || settlingAll}
            className="inline-flex h-9.5 w-9.5 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-60 shrink-0"
            title="Refresh Records"
          >
            <HiOutlineRefresh
              className={`text-base ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* =================================================
          SUMMARY STAT TILES
      ================================================= */}
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {/* TOTAL */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Records
              </p>
              <p className="mt-1 text-2xl font-black text-slate-800">
                {counts.all}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-xs font-bold text-slate-600 border border-slate-100">
              {counts.all}
            </div>
          </div>
        </div>

        {/* PENDING */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Pending Disputes
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <p className="text-2xl font-black text-slate-800">
                  {counts.pending}
                </p>
                <span className="text-[10px] font-semibold text-slate-400">records</span>
              </div>
            </div>
            <div className="rounded-xl bg-white border border-amber-200/80 px-2.5 py-1 text-right shadow-2xs">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Adjustment</p>
              <p
                className={`text-xs font-black ${
                  pendingExtraTotal > 0
                    ? "text-rose-600"
                    : pendingExtraTotal < 0
                    ? "text-emerald-600"
                    : "text-slate-600"
                }`}
              >
                {pendingExtraTotal < 0
                  ? `-${formatMoney(Math.abs(pendingExtraTotal))}`
                  : formatMoney(pendingExtraTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* SETTLED */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Settled Records
              </p>
              <p className="mt-1 text-2xl font-black text-slate-800">
                {counts.settled}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-700 font-bold text-sm">
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTER BAR
      ================================================= */}
      <div className="mb-3.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* SEARCH */}
          <div className="relative min-w-0 flex-1">
            <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID, AWB or customer..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#008dd2] focus:bg-white focus:ring-2 focus:ring-[#008dd2]/10"
            />
          </div>

          {/* STATUS PILLS */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {["PENDING", "SETTLED"].map((status) => {
              const active = statusFilter === status;
              const count = status === "PENDING" ? counts.pending : counts.settled;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition active:scale-95 ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{status}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {(search || statusFilter !== "PENDING") && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-[#008dd2] hover:underline px-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* SELECT ALL VISIBLE (MOBILE VIEW BAR) */}
        {selectablePendingRecords.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-2 sm:hidden text-xs">
            <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allVisiblePendingSelected}
                onChange={toggleSelectAllVisible}
                disabled={settlingAll || resettingImport}
                className="h-4 w-4 rounded accent-emerald-600"
              />
              <span>Select Pending ({selectablePendingRecords.length})</span>
            </label>

            <span className="text-[11px] text-slate-400 font-semibold">
              {filteredRecords.length} results
            </span>
          </div>
        )}
      </div>

      {/* =================================================
          1. MOBILE VIEW: APP-STYLE CARD TILES
      ================================================= */}
      <div className="space-y-3 sm:hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-[#008dd2]" />
            <p className="mt-3 text-xs font-medium text-slate-400">Loading discrepancies...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            <p className="text-xs font-bold text-slate-700">No weight discrepancies found</p>
            <p className="mt-1 text-[11px] text-slate-400">Try switching status filters or search query.</p>
          </div>
        ) : (
          filteredRecords.map((item, index) => {
            const declaredWeight = numberValue(
              item?.declared_weight ?? item?.previous_weight ?? item?.original_weight
            );
            const actualWeight = numberValue(
              item?.actual_weight ?? item?.new_weight ?? item?.verified_weight
            );
            const difference = numberValue(
              item?.weight_difference ?? item?.weight_diff ?? (actualWeight - declaredWeight)
            );
            const currentCharge = numberValue(
              item?.original_shipping_charge ?? item?.current_shipping_charge
            );
            const extraCharge = numberValue(
              item?.extra_charge ?? item?.extra_weight_charge
            );
            const recalculatedTotal = numberValue(
              item?.recalculated_shipping_charge
            );

            const isPending = getStatus(item) === "PENDING";
            const isSelected = selectedIds.has(Number(item?.id));

            return (
              <div
                key={item?.id || `${normalizeOrderId(item)}-${index}`}
                className={`rounded-2xl border bg-white p-3.5 shadow-xs space-y-2.5 transition ${
                  isSelected ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-200/80"
                }`}
              >
                {/* CARD HEADER */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRecordSelection(item?.id)}
                      disabled={!isPending || settlingAll || resettingImport}
                      className="h-4 w-4 rounded accent-emerald-600 disabled:opacity-40"
                    />
                    <span className="font-mono text-xs font-bold text-slate-800 truncate">
                      #{normalizeOrderId(item)}
                    </span>
                  </div>

                  <StatusBadge status={getStatus(item)} />
                </div>

                {/* CUSTOMER & AWB */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate">
                      {valueOrDash(item?.user_name || item?.customer_name || item?.full_name)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      UID: {valueOrDash(item?.user_id)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-600 bg-slate-50/80 px-2 py-1 rounded-lg border border-slate-100">
                    <span className="truncate font-semibold">AWB: {valueOrDash(item?.awb)}</span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(item?.imported_at || item?.created_at)}
                    </span>
                  </div>
                </div>

                {/* WEIGHT COMPARISON GRID */}
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-center">
                  <div>
                    <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Declared</span>
                    <span className="text-xs font-bold text-slate-700 block mt-0.5">
                      {formatWeight(declaredWeight)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Actual</span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {formatWeight(actualWeight)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9.5px] font-bold uppercase text-slate-400 block">Diff</span>
                    <span
                      className={`text-xs font-black block mt-0.5 ${
                        difference > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {difference > 0 ? "+" : ""}
                      {formatWeight(difference)}
                    </span>
                  </div>
                </div>

                {/* FINANCIAL DETAILS */}
                <div className="border-t border-slate-50 pt-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Original Charge:</span>
                    <span className="font-semibold text-slate-700">{formatMoney(currentCharge)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Discrepancy Extra:</span>
                    <span
                      className={`font-black ${
                        extraCharge > 0
                          ? "text-rose-600"
                          : extraCharge < 0
                          ? "text-emerald-600"
                          : "text-slate-600"
                      }`}
                    >
                      {extraCharge > 0 ? `+${formatMoney(extraCharge)}` : formatMoney(extraCharge)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-dashed border-slate-100 pt-1 text-slate-800 font-bold">
                    <span>Recalculated Total:</span>
                    <span className="text-[#008dd2] font-black">{formatMoney(recalculatedTotal)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* =================================================
          2. TABLET & DESKTOP: STRUCTURED TABLE VIEW
      ================================================= */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70">
                <th className="w-[46px] border-r border-slate-200 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allVisiblePendingSelected}
                    onChange={toggleSelectAllVisible}
                    disabled={
                      selectablePendingRecords.length === 0 ||
                      settlingAll ||
                      resettingImport
                    }
                    className="h-3.5 w-3.5 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
                    title="Select visible pending records"
                  />
                </th>

                <th className="border-r border-slate-200 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Order
                </th>

                <th className="border-r border-slate-200 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Customer
                </th>

                <th className="border-r border-slate-200 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  AWB
                </th>

                <th className="border-r border-slate-200 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Declared
                </th>

                <th className="border-r border-slate-200 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Actual
                </th>

                <th className="border-r border-slate-200 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Difference
                </th>

                <th className="border-r border-slate-200 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Current Shipping Charge
                </th>

                <th className="border-r border-slate-200 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Extra Weight Charge
                </th>

                <th className="border-r border-slate-200 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Recalculated Total
                </th>

                <th className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#008dd2]" />
                      <p className="mt-3 text-xs font-semibold text-slate-400">
                        Loading weight records...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-16 text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No weight discrepancies found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Weight checking records will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => {
                  const declaredWeight = numberValue(
                    item?.declared_weight ?? item?.previous_weight ?? item?.original_weight
                  );
                  const actualWeight = numberValue(
                    item?.actual_weight ?? item?.new_weight ?? item?.verified_weight
                  );
                  const difference = numberValue(
                    item?.weight_difference ?? item?.weight_diff ?? (actualWeight - declaredWeight)
                  );
                  const currentCharge = numberValue(
                    item?.original_shipping_charge ?? item?.current_shipping_charge
                  );
                  const extraCharge = numberValue(
                    item?.extra_charge ?? item?.extra_weight_charge
                  );
                  const recalculatedTotal = numberValue(
                    item?.recalculated_shipping_charge
                  );

                  return (
                    <tr
                      key={item?.id || `${normalizeOrderId(item)}-${index}`}
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                    >
                      <td className="w-[46px] border-r border-slate-100 px-3 py-3 text-center align-top">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(Number(item?.id))}
                          onChange={() => toggleRecordSelection(item?.id)}
                          disabled={
                            getStatus(item) !== "PENDING" ||
                            !Number.isInteger(Number(item?.id)) ||
                            settlingAll ||
                            resettingImport
                          }
                          className="mt-0.5 h-3.5 w-3.5 cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
                        />
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3 align-top">
                        <div className="text-xs font-bold text-slate-800">
                          #{normalizeOrderId(item)}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {formatDate(item?.imported_at || item?.created_at)}
                        </div>
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3 align-top">
                        <div className="max-w-[160px] truncate text-xs font-semibold text-slate-700">
                          {valueOrDash(
                            item?.user_name || item?.customer_name || item?.full_name
                          )}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          UID: {valueOrDash(item?.user_id)}
                        </div>
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3 align-top font-mono text-[11px] font-semibold text-slate-700">
                        {valueOrDash(item?.awb)}
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3 align-top">
                        <div className="text-xs font-semibold text-slate-700">
                          {formatWeight(declaredWeight)}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">User declared</div>
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3 align-top">
                        <div className="text-xs font-semibold text-slate-700">
                          {formatWeight(actualWeight)}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">Courier verified</div>
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3 align-top">
                        <div
                          className={`text-xs font-bold ${
                            difference > 0 ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {difference > 0 ? "+" : ""}
                          {formatWeight(difference)}
                        </div>
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3 align-top">
                        <div className="text-xs font-semibold text-slate-700">
                          {formatMoney(currentCharge)}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">Already charged</div>
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3 align-top">
                        <div
                          className={`text-xs font-bold ${
                            extraCharge > 0
                              ? "text-rose-600"
                              : extraCharge < 0
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {extraCharge > 0
                            ? `+${formatMoney(extraCharge)}`
                            : extraCharge < 0
                            ? formatMoney(Math.abs(extraCharge))
                            : "₹0.00"}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {extraCharge > 0
                            ? "To recover"
                            : extraCharge < 0
                            ? "Refund to wallet"
                            : "No adjustment"}
                        </div>
                      </td>

                      <td className="border-r border-slate-100 px-3 py-3 align-top">
                        <div className="text-xs font-bold text-[#008dd2]">
                          {formatMoney(recalculatedTotal)}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">Actual weight rate</div>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <StatusBadge status={getStatus(item)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* IMPORT MODAL */}
      {showImportModal && (
        <ImportWeightFileModal
          file={selectedFile}
          onFileChange={handleImportFileChange}
          onImport={handleImportWeightFile}
          importing={importing}
          onClose={() => {
            if (importing) {
              return;
            }
            setShowImportModal(false);
            setSelectedFile(null);
          }}
        />
      )}
    </div>
  );
};

export default WeightChecking;