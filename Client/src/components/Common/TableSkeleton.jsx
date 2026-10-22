import React from "react";

/**
 * High-performance, shimmering skeleton row for desktop/tablet order tables.
 */
export const TableSkeleton = ({ rows = 6, cols = 8 }) => {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      {/* Header bar shimmer */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200 skeleton-shimmer" />
          <div className="h-3.5 w-24 rounded-md bg-slate-200 skeleton-shimmer" />
        </div>
        <div className="h-3.5 w-16 rounded-md bg-slate-200 skeleton-shimmer" />
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-3.5 gap-4 transition"
            style={{ opacity: 1 - i * 0.1 }}
          >
            {/* Checkbox */}
            <div className="h-4 w-4 shrink-0 rounded bg-slate-200 skeleton-shimmer" />

            {/* Party Badge */}
            <div className="h-5 w-16 shrink-0 rounded-md bg-slate-200 skeleton-shimmer" />

            {/* Customer Details */}
            <div className="flex-1 space-y-1.5 min-w-[120px]">
              <div className="h-3.5 w-28 rounded bg-slate-200 skeleton-shimmer" />
              <div className="h-3 w-20 rounded bg-slate-100 skeleton-shimmer" />
            </div>

            {/* Shipment / AWB */}
            <div className="flex-1 space-y-1.5 min-w-[120px] hidden sm:block">
              <div className="h-3.5 w-24 rounded bg-slate-200 skeleton-shimmer" />
              <div className="h-3 w-16 rounded bg-slate-100 skeleton-shimmer" />
            </div>

            {/* Route */}
            <div className="flex-1 space-y-1.5 min-w-[130px] hidden md:block">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-300 skeleton-shimmer" />
                <div className="h-3 w-16 rounded bg-slate-200 skeleton-shimmer" />
                <div className="h-2 w-2 rounded-full bg-slate-300 skeleton-shimmer" />
                <div className="h-3 w-16 rounded bg-slate-200 skeleton-shimmer" />
              </div>
            </div>

            {/* Status / Mode */}
            <div className="h-5 w-20 shrink-0 rounded-full bg-slate-200 skeleton-shimmer hidden lg:block" />

            {/* Price / Weight */}
            <div className="h-4 w-14 shrink-0 rounded bg-slate-200 skeleton-shimmer" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="h-7 w-7 rounded-lg bg-slate-200 skeleton-shimmer" />
              <div className="h-7 w-7 rounded-lg bg-slate-200 skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Shimmering skeleton cards for mobile device views.
 */
export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-3 sm:hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3"
          style={{ opacity: 1 - i * 0.15 }}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-slate-200 skeleton-shimmer" />
              <div className="h-4 w-28 rounded bg-slate-200 skeleton-shimmer" />
            </div>
            <div className="h-5 w-16 rounded-full bg-slate-200 skeleton-shimmer" />
          </div>

          {/* Card Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-slate-200 skeleton-shimmer" />
              <div className="h-3.5 w-16 rounded bg-slate-200 skeleton-shimmer" />
            </div>
            <div className="h-8 w-full rounded-xl bg-slate-100 skeleton-shimmer" />
            <div className="flex items-center justify-between pt-1">
              <div className="h-3 w-20 rounded bg-slate-100 skeleton-shimmer" />
              <div className="h-3 w-20 rounded bg-slate-100 skeleton-shimmer" />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <div className="h-8 flex-1 rounded-xl bg-slate-200 skeleton-shimmer" />
            <div className="h-8 flex-1 rounded-xl bg-slate-200 skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Full Page Route Skeleton fallback for smooth, instant page transitions without jumpiness.
 */
export const RouteSkeleton = () => {
  return (
    <div className="min-h-[80vh] w-full p-4 sm:p-6 space-y-4 animate-fadeIn">
      {/* Top Header Shimmer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200 skeleton-shimmer" />
          <div className="space-y-1.5">
            <div className="h-5 w-36 rounded-md bg-slate-200 skeleton-shimmer" />
            <div className="h-3.5 w-56 rounded-md bg-slate-100 skeleton-shimmer" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-200 skeleton-shimmer" />
          <div className="h-9 w-28 rounded-xl bg-slate-200 skeleton-shimmer" />
        </div>
      </div>

      {/* Filter / Search Bar Shimmer */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
        <div className="h-10 flex-1 min-w-[200px] rounded-xl bg-slate-100 skeleton-shimmer" />
        <div className="h-10 w-32 rounded-xl bg-slate-100 skeleton-shimmer hidden sm:block" />
        <div className="h-10 w-28 rounded-xl bg-slate-100 skeleton-shimmer" />
      </div>

      {/* Main Table Skeleton */}
      <TableSkeleton rows={7} />
    </div>
  );
};

/**
 * Direct TableRowSkeleton for rendering directly inside standard <tbody> tags
 */
export const TableRowSkeleton = ({ rows = 6, cols = 8 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr
          key={i}
          className="border-b border-slate-100 last:border-b-0"
          style={{ opacity: 1 - i * 0.1 }}
        >
          {/* Checkbox / ID */}
          <td className="px-2.5 py-3.5">
            <div className="h-4 w-4 rounded bg-slate-200 skeleton-shimmer" />
          </td>

          {/* Party / Consignee */}
          <td className="px-2.5 py-3.5 space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-slate-200 skeleton-shimmer" />
            <div className="h-2.5 w-20 rounded bg-slate-100 skeleton-shimmer" />
          </td>

          {/* Shipment / Product */}
          <td className="px-2.5 py-3.5 space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-slate-200 skeleton-shimmer" />
            <div className="h-2.5 w-16 rounded bg-slate-100 skeleton-shimmer" />
          </td>

          {/* Route */}
          <td className="px-2.5 py-3.5 space-y-1.5">
            <div className="h-3.5 w-28 rounded bg-slate-200 skeleton-shimmer" />
            <div className="h-2.5 w-20 rounded bg-slate-100 skeleton-shimmer" />
          </td>

          {/* Status Badge */}
          <td className="px-2.5 py-3.5">
            <div className="h-5 w-20 rounded-full bg-slate-200 skeleton-shimmer" />
          </td>

          {/* Weight */}
          <td className="px-2.5 py-3.5">
            <div className="h-4 w-12 rounded bg-slate-200 skeleton-shimmer" />
          </td>

          {/* Payment */}
          <td className="px-2.5 py-3.5">
            <div className="h-4 w-16 rounded bg-slate-200 skeleton-shimmer" />
          </td>

          {/* Date */}
          {cols >= 8 && (
            <td className="px-2.5 py-3.5">
              <div className="h-3.5 w-16 rounded bg-slate-200 skeleton-shimmer" />
            </td>
          )}

          {/* Actions */}
          {cols >= 9 && (
            <td className="px-2.5 py-3.5">
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-7 rounded-lg bg-slate-200 skeleton-shimmer" />
                <div className="h-7 w-7 rounded-lg bg-slate-200 skeleton-shimmer" />
              </div>
            </td>
          )}
        </tr>
      ))}
    </>
  );
};

/**
 * Pixel-perfect Dashboard skeleton that mirrors the layout of Dashboard.jsx
 */
export const DashboardSkeleton = () => {
  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#f6f8fb] p-3.5 sm:p-5 md:p-6 pb-24 lg:pb-8 animate-fadeIn">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-6 w-32 rounded-md bg-slate-200 skeleton-shimmer" />
          <div className="h-3.5 w-48 rounded bg-slate-100 skeleton-shimmer" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-slate-200 skeleton-shimmer" />
      </div>

      {/* 5 Stats Cards Grid */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs space-y-2.5 ${
              i === 4 ? "col-span-2 sm:col-span-1 xl:col-span-1" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 rounded bg-slate-200 skeleton-shimmer" />
              <div className="h-8 w-8 rounded-xl bg-slate-100 skeleton-shimmer" />
            </div>
            <div className="h-6 w-24 rounded-md bg-slate-200 skeleton-shimmer" />
            <div className="h-2.5 w-16 rounded bg-slate-100 skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Main Grid: Left Banner + Recent Orders, Right Wallet & Partners */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Column */}
        <div className="min-w-0 space-y-4">
          {/* Action Banner */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="h-4 w-36 rounded bg-slate-200 skeleton-shimmer" />
              <div className="h-3 w-56 rounded bg-slate-100 skeleton-shimmer" />
            </div>
            <div className="h-9 w-28 rounded-xl bg-slate-200 skeleton-shimmer shrink-0" />
          </div>

          {/* Recent Orders Box */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
              <div className="space-y-1">
                <div className="h-4 w-28 rounded bg-slate-200 skeleton-shimmer" />
                <div className="h-3 w-36 rounded bg-slate-100 skeleton-shimmer" />
              </div>
              <div className="h-4 w-16 rounded bg-slate-200 skeleton-shimmer" />
            </div>
            <div className="divide-y divide-slate-100 p-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-3 gap-3"
                  style={{ opacity: 1 - idx * 0.15 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-200 skeleton-shimmer" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-24 rounded bg-slate-200 skeleton-shimmer" />
                      <div className="h-2.5 w-32 rounded bg-slate-100 skeleton-shimmer" />
                    </div>
                  </div>
                  <div className="h-5 w-20 rounded-full bg-slate-200 skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="h-4 w-28 rounded bg-slate-200 skeleton-shimmer" />
              <div className="h-8 w-8 rounded-xl bg-slate-100 skeleton-shimmer" />
            </div>
            <div className="h-8 w-36 rounded-md bg-slate-200 skeleton-shimmer" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-9 rounded-xl bg-slate-200 skeleton-shimmer" />
              <div className="h-9 rounded-xl bg-slate-100 skeleton-shimmer" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200 skeleton-shimmer" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-slate-100 skeleton-shimmer" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Address card skeleton for PickupAddress, ReturnAddresses, and PartyIdentities
 */
export const AddressCardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
          style={{ opacity: 1 - idx * 0.15 }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="space-y-1">
              <div className="h-4 w-28 rounded bg-slate-200 skeleton-shimmer" />
              <div className="h-3 w-16 rounded bg-slate-100 skeleton-shimmer" />
            </div>
            <div className="h-5 w-16 rounded-full bg-slate-200 skeleton-shimmer" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded bg-slate-100 skeleton-shimmer" />
            <div className="h-3.5 w-4/5 rounded bg-slate-100 skeleton-shimmer" />
            <div className="h-3.5 w-1/2 rounded bg-slate-100 skeleton-shimmer" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <div className="h-7 w-14 rounded-lg bg-slate-100 skeleton-shimmer" />
            <div className="h-7 w-14 rounded-lg bg-slate-200 skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Rate Card Skeleton for RateCard.jsx
 */
export const RateCardSkeleton = () => {
  return (
    <div className="min-h-screen bg-[#F5F8FC] p-4 sm:p-6 space-y-4 animate-fadeIn">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header Shimmer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="space-y-1.5">
            <div className="h-6 w-36 rounded-md bg-slate-200 skeleton-shimmer" />
            <div className="h-3.5 w-52 rounded bg-slate-100 skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 rounded-xl bg-slate-200 skeleton-shimmer" />
            <div className="h-9 w-28 rounded-xl bg-slate-200 skeleton-shimmer" />
          </div>
        </div>

        {/* Zones Tabs Shimmer */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-24 shrink-0 rounded-xl bg-slate-200 skeleton-shimmer" />
          ))}
        </div>

        {/* Matrix Table Skeleton */}
        <TableSkeleton rows={8} cols={7} />
      </div>
    </div>
  );
};

export default TableSkeleton;
