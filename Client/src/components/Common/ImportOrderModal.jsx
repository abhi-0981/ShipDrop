import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../services/api";
import { notifyOrderChange } from "../../services/orderEvents";

const ImportIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

export default function ImportOrderModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [returnAddresses, setReturnAddresses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedReturnAddressId, setSelectedReturnAddressId] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef(null);

  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?.id || null;
    } catch {
      return null;
    }
  };

  const getStoredDefaultWarehouse = (userId, list) => {
    if (!userId || !Array.isArray(list) || list.length === 0) return null;

    const explicitDefault = list.find((warehouse) => {
      const values = [
        warehouse.is_default,
        warehouse.isDefault,
        warehouse.default,
        warehouse.is_default_pickup,
        warehouse.isDefaultPickup,
        warehouse.default_pickup,
        warehouse.defaultPickup,
        warehouse.is_primary,
        warehouse.isPrimary,
      ];
      return values.some(
        (val) =>
          val === true ||
          val === 1 ||
          String(val).trim().toLowerCase() === "true" ||
          String(val).trim().toLowerCase() === "default"
      );
    });

    if (explicitDefault) return explicitDefault;

    const possibleKeys = [
      `shipdrop_default_warehouse_${userId}`,
      "shipdrop_default_warehouse",
      `default_warehouse_${userId}`,
      "default_warehouse",
      `defaultWarehouseId_${userId}`,
      "defaultWarehouseId",
    ];

    for (const key of possibleKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        let stored = raw;
        try {
          stored = JSON.parse(raw);
        } catch {}
        const storedId =
          typeof stored === "object" && stored !== null
            ? stored.id ?? stored.warehouse_id ?? stored.warehouseId
            : stored;
        const match = list.find((w) => String(w.id) === String(storedId));
        if (match) return match;
      } catch {}
    }

    return null;
  };

  const loadAddresses = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error("Please login again");
      return;
    }

    setLoadingAddresses(true);
    setErrors([]);
    setMessage("");

    try {
      const [warehouseResult, returnResult, defaultReturnResult] =
        await Promise.allSettled([
          api.get("/warehouses", { params: { user_id: userId } }),
          api.get("/return-addresses", { params: { user_id: userId } }),
          api.get("/return-addresses/default", { params: { user_id: userId } }),
        ]);

      // PICKUP WAREHOUSES
      if (warehouseResult.status === "fulfilled") {
        const warehouseList = Array.isArray(warehouseResult.value?.data?.warehouses)
          ? warehouseResult.value.data.warehouses.filter(
              (item) => String(item.status || "ACTIVE").toUpperCase() === "ACTIVE"
            )
          : [];
        setWarehouses(warehouseList);

        const defaultWarehouse = getStoredDefaultWarehouse(userId, warehouseList);
        if (defaultWarehouse?.id) {
          setSelectedWarehouseId(String(defaultWarehouse.id));
        } else if (warehouseList.length === 1) {
          setSelectedWarehouseId(String(warehouseList[0].id));
        } else {
          setSelectedWarehouseId("");
        }
      } else {
        setWarehouses([]);
        setSelectedWarehouseId("");
        toast.error("Unable to load pickup addresses");
      }

      // RETURN ADDRESSES
      let returnList = [];
      if (returnResult.status === "fulfilled") {
        returnList = Array.isArray(returnResult.value?.data?.addresses)
          ? returnResult.value.data.addresses
          : [];
      }

      let defaultReturn = null;
      if (defaultReturnResult.status === "fulfilled") {
        defaultReturn =
          defaultReturnResult.value?.data?.return_address ||
          defaultReturnResult.value?.data?.address ||
          null;
      }

      if (
        defaultReturn?.id &&
        !returnList.some((item) => String(item.id) === String(defaultReturn.id))
      ) {
        returnList = [defaultReturn, ...returnList];
      }

      setReturnAddresses(returnList);

      if (defaultReturn?.id) {
        setSelectedReturnAddressId(String(defaultReturn.id));
      } else if (returnList.length === 1) {
        setSelectedReturnAddressId(String(returnList[0].id));
      } else {
        setSelectedReturnAddressId("");
      }
    } catch (err) {
      console.error("Import address loading error:", err);
      toast.error("Unable to load import addresses");
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setErrors([]);
      setMessage("");
      setImportedCount(0);
      setSelectedWarehouseId("");
      setSelectedReturnAddressId("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      loadAddresses();
    }
  }, [isOpen]);

  const handleClose = () => {
    if (loading) return;
    setFile(null);
    setErrors([]);
    setMessage("");
    setImportedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose?.();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setErrors([]);
    setMessage("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const name = String(selectedFile.name || "").toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      event.target.value = "";
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Excel file must be smaller than 10 MB");
      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleImport = async () => {
    const userId = getUserId();
    if (!userId) {
      toast.error("Please login again");
      return;
    }

    if (!selectedWarehouseId) {
      toast.error("Please select a pickup address");
      return;
    }

    if (!selectedReturnAddressId) {
      toast.error("Please select a return address");
      return;
    }

    if (!file) {
      toast.error("Please select an Excel file");
      return;
    }

    setLoading(true);
    setErrors([]);
    setMessage("");
    setImportedCount(0);

    try {
      const formData = new FormData();
      formData.append("user_id", String(userId));
      formData.append("warehouse_id", String(selectedWarehouseId));
      formData.append("return_address_id", String(selectedReturnAddressId));
      formData.append("file", file);

      const response = await api.post("/orders/import", formData);
      const count = Number(response.data?.total_imported || 0);

      setImportedCount(count);
      setMessage(
        response.data?.message || `${count} orders imported successfully.`
      );
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      notifyOrderChange({ type: "created", count });
      toast.success(`${count} orders moved to Processing`);
    } catch (error) {
      const responseData = error.response?.data;
      const rawErrors = responseData?.errors;
      let normalizedErrors = [];

      if (Array.isArray(rawErrors)) {
        normalizedErrors = rawErrors.map((item) => {
          if (item && typeof item === "object" && item.row !== undefined) {
            return {
              row: item.row,
              errors: Array.isArray(item.errors)
                ? item.errors
                : [String(item.errors || "Invalid row")],
            };
          }
          return {
            row: "Excel Header",
            errors: [String(item)],
          };
        });
      }

      setErrors(normalizedErrors);
      setMessage(
        responseData?.message ||
          "Excel import failed. Please fix the errors and try again."
      );

      if (!normalizedErrors.length) {
        toast.error(responseData?.message || "Excel import failed");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-800 sm:text-lg">
              Import Orders
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
              Upload your Excel file to create multiple orders in Processing
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto px-5 py-4 sm:px-6">
          {/* ADDRESS SELECTION */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Pickup Address <span className="text-red-500">*</span>
              </label>

              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                disabled={loadingAddresses || loading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#008dd2] disabled:bg-slate-50"
              >
                <option value="">
                  {loadingAddresses
                    ? "Loading pickup addresses..."
                    : "Select pickup address"}
                </option>

                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.warehouse_name || "Warehouse"} —{" "}
                    {warehouse.address_line1 || ""}{" "}
                    {warehouse.city || ""}{" "}
                    {warehouse.pincode || ""}
                  </option>
                ))}
              </select>

              {selectedWarehouseId && (
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Default pickup address is selected automatically.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Return Address <span className="text-red-500">*</span>
              </label>

              <select
                value={selectedReturnAddressId}
                onChange={(e) => setSelectedReturnAddressId(e.target.value)}
                disabled={loadingAddresses || loading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-[#008dd2] disabled:bg-slate-50"
              >
                <option value="">
                  {loadingAddresses
                    ? "Loading return addresses..."
                    : "Select return address"}
                </option>

                {returnAddresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.name || "Return Address"} —{" "}
                    {address.address_line1 || ""}{" "}
                    {address.city || ""}{" "}
                    {address.pincode || ""}
                  </option>
                ))}
              </select>

              {selectedReturnAddressId && (
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Default return address is selected automatically.
                </p>
              )}
            </div>
          </div>

          {/* EXCEL UPLOAD */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Excel File <span className="text-red-500">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex min-h-[86px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 text-center transition hover:border-[#008dd2] hover:bg-sky-50/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-[#008dd2]">
                <ImportIcon />
              </div>

              {file ? (
                <>
                  <p className="max-w-full truncate text-xs font-bold text-slate-700">
                    {file.name}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-700">
                    Click to select Excel file
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    .xlsx / .xls — maximum 10 MB
                  </p>
                </>
              )}
            </button>
          </div>

          {/* ERROR BOX */}
          {message && (
            <div
              className={`mt-5 rounded-xl border p-4 ${
                errors.length
                  ? "border-rose-200 bg-rose-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}
            >
              <p
                className={`text-xs font-bold ${
                  errors.length ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {message}
              </p>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-rose-200 bg-white">
              <div className="sticky top-0 border-b border-rose-100 bg-rose-50 px-4 py-2.5">
                <p className="text-xs font-bold text-rose-700">
                  Excel Errors — fix all rows before importing
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {errors.map((item, index) => (
                  <div key={`${item.row}-${index}`} className="px-4 py-3">
                    <p className="text-[11px] font-bold text-slate-800">
                      Row {item.row}
                    </p>

                    <ul className="mt-1 space-y-1">
                      {(Array.isArray(item.errors)
                        ? item.errors
                        : [String(item.errors || "Invalid row")]
                      ).map((errorText, errorIndex) => (
                        <li
                          key={`${item.row}-${errorIndex}`}
                          className="text-[10px] leading-4 text-rose-600"
                        >
                          • {errorText}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {importedCount > 0 && !errors.length && (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-bold text-emerald-700">
                {importedCount} orders are now in Processing.
              </p>
              <p className="mt-1 text-[10px] text-emerald-600">
                No Delhivery manifest or wallet deduction is performed by this import.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          {importedCount > 0 && !errors.length ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate("/processing-orders");
                }}
                className="h-10 rounded-xl bg-[#008dd2] px-5 text-xs font-bold text-white transition hover:bg-[#007ab6] cursor-pointer"
              >
                View Processing Orders
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleImport}
                disabled={
                  loading ||
                  loadingAddresses ||
                  !selectedWarehouseId ||
                  !selectedReturnAddressId ||
                  !file
                }
                className="h-10 rounded-xl bg-[#008dd2] px-6 text-xs font-bold text-white shadow-sm transition hover:bg-[#007ab6] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Importing Orders..." : "Import Orders"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
