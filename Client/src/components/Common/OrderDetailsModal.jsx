import React from "react";

const safeString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value);
};
const isManualCarrierOrder = (order) => {
  const carrier = order?.carrier;
  return Boolean(carrier && carrier !== "Delivery");
};

const getOrderId = (order) => {
  if (isManualCarrierOrder(order)) {
    return order?.order_id || "—";
  }
  return order?.order_id || order?.id || "—";
};
const getAWB = (order) => order?.awb || order?.waybill || order?.awb_number || "—";
const getStatus = (order) => {
  const primary = safeString(order?.status || order?.order_status).trim().toUpperCase();
  if (primary === "CANCELLED" || primary === "CANCELED") return "CANCELLED";
  return safeString(order?.tracking_status || order?.status || order?.order_status || "PROCESSING")
    .trim().toUpperCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
};
const getStatusLabel = (status) =>
  String(status || "PROCESSING").trim().toUpperCase().replace(/[-_]+/g, " ").replace(/\\s+/g, " ");
const getServiceType = (order) => {
  const value = safeString(order?.manifest_service_type || order?.service_type || order?.service || order?.mode || order?.shipping_mode || "").trim().toUpperCase().replace(/[-_]/g, " ").replace(/\\s+/g, " ");
  return value === "AIR" || value === "EXPRESS" || value.includes("AIR") ? "AIR" : "ROAD";
};
const getPaymentType = (order) => {
  const value = safeString(order?.payment_type || order?.payment_method || order?.payment || order?.payment_mode || "").trim().toUpperCase().replace(/[-_]/g, " ").replace(/\\s+/g, " ");
  if (value === "COD" || value === "CASH ON DELIVERY") return "COD";
  if (value === "PREPAID" || value === "PRE PAID") return "PREPAID";
  return value;
};
const getCreatedAt = (order) => order?.created_at || order?.order_created_at || order?.createdAt || order?.manifested_at || null;
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};
const Icon = ({ name, size = 17, strokeWidth = 1.8 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "x") return <svg {...common}><path d="M6 6l12 12" /><path d="M18 6 6 18" /></svg>;
  if (name === "download") return <svg {...common}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>;
  if (name === "printer") return <svg {...common}><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /><path d="M17 12h1" /></svg>;
  return null;
};

export default function OrderDetailsModal({ order, loading = false, onClose, onTrack, onDownload, onPrint, onDuplicate, actionLoading = false }) {
  if (!order) return null;

  return (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-2 sm:p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div className="flex max-h-[94vh] w-full max-w-[980px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-slate-900 sm:text-base">
                  Order Details{" "}
                  {isManualCarrierOrder(order) ? (
                    <span className="ml-2 inline-block rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-bold text-indigo-700 uppercase">
                      {order.carrier}
                    </span>
                  ) : (
                    <span className="text-slate-400">— #{getOrderId(order)}</span>
                  )}
                </h2>
                {isManualCarrierOrder(order) ? (
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    Consignment No: <span className="font-mono font-semibold text-slate-800">{order?.consignment_no || "—"}</span>
                  </p>
                ) : (
                  getAWB(order) && getAWB(order) !== "—" && (
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      AWB: <button type="button" onClick={() => onTrack(getAWB(order))} className="font-mono font-semibold text-[#008dd2] hover:underline">{getAWB(order)}</button>
                    </p>
                  )
                )}
              </div>
              <button type="button" onClick={() => onClose()} aria-label="Close details" className="ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <Icon name="x" size={17} />
              </button>
            </div>

            {/* Compact body: no forced horizontal scroll; absent values are omitted */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
              {loading && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2 text-[11px] font-medium text-sky-700">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
                  Loading complete order details…
                </div>
              )}

              {(() => {
                const o = order;
                const present = (value) =>
                  value !== null && value !== undefined && String(value).trim() !== "";
                const address = [
                  o.address_line1, o.address_line2, o.floor_no, o.landmark,
                  o.city, o.state, o.pincode, o.country
                ].filter(present).join(", ");
                const pickupAddress = [
                  o.pickup_address,
                  o.warehouse?.address,
                  o.warehouse?.address_line1,
                  o.warehouse?.address_line2,
                  o.pickup_city,
                  o.pickup_state,
                  o.pickup_pincode
                ].filter(present).join(", ");
                const pickupName = o.pickup_name || o.warehouse_name || o.warehouse?.name || o.pickup_contact_name;
                const pickupPhone = o.pickup_phone || o.pickup_mobile || o.warehouse?.phone || o.pickup_contact;
                const buyerFields = [
                  ["Name", o.consignee_name || o.customer_name || o.name],
                  ["Mobile", o.mobile || o.phone || o.consignee_phone],
                  ["Alternate Mobile", o.alternate_mobile],
                  ["Email", o.email],
                  ["Company", o.company_name],
                  ["GSTIN", o.gstin],
                ].filter(([, value]) => present(value));
                const pickupFields = [
                  ["Pickup Name", pickupName],
                  ["Contact", pickupPhone],
                  ["Pickup Address", pickupAddress],
                ].filter(([, value]) => present(value));
                const isManual = isManualCarrierOrder(o);
                const shipmentFields = isManual
                  ? [
                      ["Carrier", o.carrier],
                      ["Consignment No", o.consignment_no],
                      ["Package Type", o.package_type],
                      ["Amount (Incl. GST)", present(o.manual_amount_including_gst) ? `₹${Number(o.manual_amount_including_gst).toFixed(2)}` : ""],
                      ["Status", "BOOKED"],
                      ["Party Identity", o.party_reference_name ? `${o.party_reference_name}${o.party_name ? ` (${o.party_name})` : ""}` : (o.party_name || o.party_identity_name || o.party)],
                      ["Order ID", getOrderId(o)],
                      ["Pickup ID", "—"],
                      ["Payment", getPaymentType(o) || "Manual"],
                      ["Created", present(getCreatedAt(o)) ? `${formatDate(getCreatedAt(o))} ${formatTime(getCreatedAt(o))}`.trim() : ""],
                    ].filter(([, value]) => present(value) && value !== "—")
                  : [
                      ["Order ID", `#${getOrderId(o)}`],
                      ["Party Identity", o.party_reference_name ? `${o.party_reference_name}${o.party_name ? ` (${o.party_name})` : ""}` : (o.party_name || o.party_identity_name || o.party)],
                      ["AWB", getAWB(o)],
                      ["Pickup ID", o.pickup_id || o.pickupId || o.pickup_request_id],
                      ["Status", getStatusLabel(getStatus(o))],
                      ["Payment", getPaymentType(o)],
                      ["Service", getServiceType(o) === "AIR" ? "By Air" : "By Surface"],
                      ["Shipping Charge", present(o.shipping_charge) ? `₹${Number(o.shipping_charge).toFixed(2)}` : ""],
                      ["Order Value", present(o.total_amount ?? o.total ?? o.amount) ? `₹${Number(o.total_amount ?? o.total ?? o.amount).toFixed(2)}` : ""],
                      ["COD Amount", present(o.cod_amount) ? `₹${Number(o.cod_amount).toFixed(2)}` : ""],
                      ["Distance", present(o.distance) ? `${o.distance} Km` : ""],
                      ["Risk Type", o.risk_type],
                      ["Created", present(getCreatedAt(o)) ? `${formatDate(getCreatedAt(o))} ${formatTime(getCreatedAt(o))}`.trim() : ""],
                    ].filter(([, value]) => present(value) && value !== "—");

                const products = Array.isArray(o.products) ? o.products : [];
                const packages = Array.isArray(o.packages) ? o.packages : [];
                const hasWeight = present(o.total_weight ?? o.weight ?? o.shipment_weight) ||
                  present(o.volumetric_weight ?? o.vol_weight ?? o.volumetricWeight) ||
                  present(o.billing_weight);
                const hasAddress = present(address);

                const Section = ({ title, children, className = "" }) => (
                  <section className={`min-w-0 rounded-xl border border-slate-200 bg-white p-3 ${className}`}>
                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{title}</h3>
                    {children}
                  </section>
                );
                const FieldGrid = ({ fields }) => (
                  <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                    {fields.map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <p className="text-[10px] text-slate-400">{label}</p>
                        <p className="mt-0.5 break-words text-[12px] font-medium leading-4 text-slate-700">{value}</p>
                      </div>
                    ))}
                  </div>
                );

                return (
                  <div className="space-y-2.5">
                    {(buyerFields.length > 0 || hasAddress) && (
                      <Section title="Buyer / Delivery Details">
                        {buyerFields.length > 0 && <FieldGrid fields={buyerFields} />}
                        {hasAddress && (
                          <div className={buyerFields.length > 0 ? "mt-2 border-t border-slate-100 pt-2" : ""}>
                            <p className="text-[10px] text-slate-400">Delivery Address</p>
                            <p className="mt-0.5 break-words text-[12px] leading-5 text-slate-700">{address}</p>
                          </div>
                        )}
                      </Section>
                    )}

                    {pickupFields.length > 0 && (
                      <Section title="Pickup Details">
                        <FieldGrid fields={pickupFields} />
                      </Section>
                    )}

                    {shipmentFields.length > 0 && (
                      <Section title="Shipment & Payment">
                        <FieldGrid fields={shipmentFields} />
                      </Section>
                    )}

                    {products.length > 0 && (
                      <Section title="Products">
                        <div className="space-y-1.5">
                          {products.map((product, index) => {
                            const details = [
                              product?.sku ? `SKU: ${product.sku}` : "",
                              present(product?.qty) ? `Qty: ${product.qty}` : "",
                              present(product?.price) ? `Price: ₹${Number(product.price).toFixed(2)}` : "",
                              present(product?.tax) ? `Tax: ₹${Number(product.tax).toFixed(2)}` : "",
                            ].filter(Boolean);
                            const name = product?.product_name || product?.name;
                            if (!present(name) && details.length === 0) return null;
                            return (
                              <div key={product?.id || index} className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                                {present(name) && <p className="min-w-0 break-words text-[12px] font-medium text-slate-700">{name}</p>}
                                {details.length > 0 && <p className="text-[11px] text-slate-500">{details.join(" · ")}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </Section>
                    )}

                    {(packages.length > 0 || hasWeight) && (
                      <Section title="Dimensions & Weight">
                        {hasWeight && (
                          <div className="mb-2 flex flex-wrap gap-x-5 gap-y-1">
                            {present(o.total_weight ?? o.weight ?? o.shipment_weight) && (
                              <p className="text-[11px] text-slate-600">Actual Weight: <span className="font-semibold text-slate-800">{Number(o.total_weight ?? o.weight ?? o.shipment_weight).toFixed(2)} kg</span></p>
                            )}
                            {present(o.volumetric_weight ?? o.vol_weight ?? o.volumetricWeight) && (
                              <p className="text-[11px] text-slate-600">Volumetric Weight: <span className="font-semibold text-slate-800">{Number(o.volumetric_weight ?? o.vol_weight ?? o.volumetricWeight).toFixed(2)} kg</span></p>
                            )}
                            {present(o.billing_weight) && (
                              <p className="text-[11px] text-slate-600">Billing Weight: <span className="font-semibold text-slate-800">{Number(o.billing_weight).toFixed(2)} kg</span></p>
                            )}
                          </div>
                        )}
                        {packages.length > 0 && (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {packages.map((pkg, index) => {
                              const dims = [pkg?.length, pkg?.width, pkg?.height].every(present)
                                ? `${pkg.length} × ${pkg.width} × ${pkg.height} cm`
                                : "";
                              const fields = [
                                present(pkg?.package_count ?? pkg?.count) ? `${pkg.package_count ?? pkg.count} box(es)` : "",
                                dims,
                                present(pkg?.weight) ? `${pkg.weight} kg` : "",
                              ].filter(Boolean);
                              if (!fields.length) return null;
                              return <div key={pkg?.id || index} className="rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">{fields.join(" · ")}</div>;
                            })}
                          </div>
                        )}
                      </Section>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-3 py-2.5 sm:px-4">
              <div className="flex flex-wrap gap-2">
                {onDuplicate && (
                  <button type="button" onClick={() => onDuplicate(order)} disabled={actionLoading} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Duplicate Order
                  </button>
                )}
                {!isManualCarrierOrder(order) && (
                  <>
                    <button type="button" onClick={() => onDownload(order)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#b9dff0] bg-white px-3 text-[11px] font-semibold text-[#008dd2] hover:bg-[#edf8ff]">
                      <Icon name="download" size={13} /> Download Label
                    </button>
                    <button type="button" onClick={() => onPrint(order)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#008dd2] px-3 text-[11px] font-semibold text-white hover:bg-[#007dbb]">
                      <Icon name="printer" size={13} /> Print Label
                    </button>
                  </>
                )}
              </div>
              <button type="button" onClick={() => onClose()} className="h-8 rounded-lg border border-slate-200 bg-white px-4 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
  );
}
