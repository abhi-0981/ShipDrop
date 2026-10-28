import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Public pages loaded normally for instant initial paint
import Home from "./pages/Home/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ImpersonateExchange from "./pages/Auth/ImpersonateExchange";
import NotFound from "./pages/NotFound/NotFound";

import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

// Code-split dashboard pages to dramatically reduce initial bundle size
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const CreateOrder = lazy(() => import("./pages/Dashboard/CreateOrder"));
const ProcessingOrders = lazy(() => import("./pages/Dashboard/ProcessingOrders"));
const OrdersProcessing = lazy(() => import("./pages/Dashboard/OrdersProcessing"));
const AllOrders = lazy(() => import("./pages/Dashboard/AllOrders"));
const Manifested = lazy(() => import("./pages/Dashboard/Manifested"));
const RateCalculator = lazy(() => import("./pages/Dashboard/RateCalculator"));
const Serviceability = lazy(() => import("./pages/Dashboard/Serviceability"));
const Tickets = lazy(() => import("./pages/Dashboard/Tickets"));
const GeneralSettings = lazy(() => import("./pages/Dashboard/GeneralSettings"));
const RateCard = lazy(() => import("./pages/Dashboard/RateCard"));
const WalletHistory = lazy(() => import("./pages/Dashboard/WalletHistory"));
const PickupAddress = lazy(() => import("./pages/Dashboard/PickupAddress"));
const ReturnAddresses = lazy(() => import("./pages/Dashboard/ReturnAddresses"));
const LabelSettings = lazy(() => import("./pages/Dashboard/LabelSettings"));
const PartyIdentities = lazy(() => import("./pages/Dashboard/PartyIdentities"));
const NotPicked = lazy(() => import("./pages/Dashboard/NotPicked"));
const InTransit = lazy(() => import("./pages/Dashboard/InTransit"));
const OutForDelivery = lazy(() => import("./pages/Dashboard/OutForDelivery"));
const Delivered = lazy(() => import("./pages/Dashboard/Delivered"));
const RTOInTransit = lazy(() => import("./pages/Dashboard/RTOInTransit"));
const RTODelivered = lazy(() => import("./pages/Dashboard/RTODelivered"));
const Cancelled = lazy(() => import("./pages/Dashboard/Cancelled"));
const Pending = lazy(() => import("./pages/Dashboard/Pending"));
const CODRemittance = lazy(() => import("./pages/Dashboard/CODRemittance"));
const OfflineOrders = lazy(() => import("./pages/Dashboard/OfflineOrders"));
const CreateOfflineOrder = lazy(() => import("./pages/Dashboard/CreateOfflineOrder"));
const Reports = lazy(() => import("./pages/Dashboard/Reports"));
const ShipmentLifecycleReport = lazy(() => import("./pages/Dashboard/ShipmentLifecycleReport"));
const WeightDiscrepancyReport = lazy(() => import("./pages/Dashboard/WeightDiscrepancyReport"));
const Analytics = lazy(() => import("./pages/Dashboard/Analytics"));
const Tracking = lazy(() => import("./pages/Dashboard/Tracking"));

import { RouteSkeleton } from "./components/Common/TableSkeleton";

// Elegant, shimmering transition fallback (instant perceived performance)
const RouteLoader = () => <RouteSkeleton />;

// Preload high-frequency routes during browser idle time for zero-delay tab switching
if (typeof window !== "undefined") {
  const preloadCoreRoutes = () => {
    import("./pages/Dashboard/Dashboard");
    import("./pages/Dashboard/AllOrders");
    import("./pages/Dashboard/InTransit");
    import("./pages/Dashboard/ProcessingOrders");
    import("./pages/Dashboard/CreateOrder");
    import("./pages/Dashboard/OfflineOrders");
    import("./pages/Dashboard/CreateOfflineOrder");
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(preloadCoreRoutes, { timeout: 2500 });
  } else {
    setTimeout(preloadCoreRoutes, 1200);
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* ========================================
            PUBLIC ROUTES
        ======================================== */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/impersonate" element={<ImpersonateExchange />} />

        {/* ========================================
            PROTECTED ROUTES
        ======================================== */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Dashboard />
                </Suspense>
              }
            />

            {/* Business Analytics */}
            <Route
              path="/analytics"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Analytics />
                </Suspense>
              }
            />

            {/* Create Order */}
            <Route
              path="/create-order"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <CreateOrder />
                </Suspense>
              }
            />

            {/* Create Offline Order */}
            <Route
              path="/create-offline-order"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <CreateOfflineOrder />
                </Suspense>
              }
            />

            {/* Processing Orders */}
            <Route
              path="/processing-orders"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <ProcessingOrders />
                </Suspense>
              }
            />

            {/* New Orders -> Processing */}
            <Route
              path="/orders/processing"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <OrdersProcessing />
                </Suspense>
              }
            />

            {/* ========================================
                ORDERS
            ======================================== */}
            <Route
              path="/all-orders"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AllOrders />
                </Suspense>
              }
            />

            {/* Offline Orders */}
            <Route
              path="/offline-orders"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <OfflineOrders />
                </Suspense>
              }
            />

            <Route
              path="/in-transit"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <InTransit />
                </Suspense>
              }
            />

            <Route
              path="/out-for-delivery"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <OutForDelivery />
                </Suspense>
              }
            />

            <Route
              path="/delivered"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Delivered />
                </Suspense>
              }
            />

            <Route
              path="/rto-in-transit"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <RTOInTransit />
                </Suspense>
              }
            />

            <Route
              path="/rto-delivered"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <RTODelivered />
                </Suspense>
              }
            />

            <Route
              path="/pending"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Pending />
                </Suspense>
              }
            />

            <Route
              path="/cancelled"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Cancelled />
                </Suspense>
              }
            />

            <Route
              path="/orders/ndr-pending"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Pending />
                </Suspense>
              }
            />

            {/* ========================================
                ORDER STATUS FILTER ROUTES
            ======================================== */}
            <Route
              path="/orders/ofd"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AllOrders statusScope="OFD" pageTitle="OFD" />
                </Suspense>
              }
            />

            <Route
              path="/orders/delivered"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AllOrders statusScope="DELIVERED" pageTitle="Delivered" />
                </Suspense>
              }
            />

            <Route
              path="/orders/rto-in-transit"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AllOrders statusScope="RTO_IN_TRANSIT" pageTitle="RTO In Transit" />
                </Suspense>
              }
            />

            <Route
              path="/orders/rto-delivered"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AllOrders statusScope="RTO_DELIVERED" pageTitle="RTO Delivered" />
                </Suspense>
              }
            />

            <Route
              path="/orders/lost"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <AllOrders statusScope="LOST" pageTitle="Lost" />
                </Suspense>
              }
            />

            {/* ========================================
                MANIFEST
            ======================================== */}
            <Route
              path="/manifested"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Manifested />
                </Suspense>
              }
            />

            <Route
              path="/not-picked"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <NotPicked />
                </Suspense>
              }
            />

            {/* ========================================
                TOOLS
            ======================================== */}
            <Route
              path="/rate-calculator"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <RateCalculator />
                </Suspense>
              }
            />

            <Route
              path="/serviceability"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Serviceability />
                </Suspense>
              }
            />

            <Route
              path="/tracking"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Tracking />
                </Suspense>
              }
            />

            {/* ========================================
                SUPPORT
            ======================================== */}
            <Route
              path="/tickets"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Tickets />
                </Suspense>
              }
            />

            {/* ========================================
                SETTINGS
            ======================================== */}
            <Route
              path="/general-settings"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <GeneralSettings />
                </Suspense>
              }
            />

            <Route
              path="/rate-card"
              element={<Navigate to="/rate-calculator" replace />}
            />

            <Route
              path="/wallet"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <WalletHistory />
                </Suspense>
              }
            />

            <Route
              path="/cod-remittance"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <CODRemittance />
                </Suspense>
              }
            />

            {/* ========================================
                REPORTS
            ======================================== */}
            <Route
              path="/reports"
              element={<Navigate to="/reports/shipment-lifecycle" replace />}
            />
            <Route
              path="/reports/shipment-lifecycle"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <ShipmentLifecycleReport />
                </Suspense>
              }
            />
            <Route
              path="/reports/weight-discrepancy"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <WeightDiscrepancyReport />
                </Suspense>
              }
            />

            <Route
              path="/settings/pickup-address"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <PickupAddress />
                </Suspense>
              }
            />

            <Route
              path="/settings/return-addresses"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <ReturnAddresses />
                </Suspense>
              }
            />

            <Route
              path="/settings/label-settings"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <LabelSettings />
                </Suspense>
              }
            />

            <Route
              path="/settings/party-identities"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <PartyIdentities />
                </Suspense>
              }
            />

            <Route
              path="/party-identities"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <PartyIdentities />
                </Suspense>
              }
            />
          </Route>
        </Route>

        {/* ========================================
            404 NOT FOUND (CATCH-ALL)
        ======================================== */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;