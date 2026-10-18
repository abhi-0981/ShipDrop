import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

// Public pages loaded normally for instant initial paint
import Home from "./pages/Home/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

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
const NotPicked = lazy(() => import("./pages/Dashboard/NotPicked"));
const InTransit = lazy(() => import("./pages/Dashboard/InTransit"));
const OutForDelivery = lazy(() => import("./pages/Dashboard/OutForDelivery"));
const Delivered = lazy(() => import("./pages/Dashboard/Delivered"));
const RTOInTransit = lazy(() => import("./pages/Dashboard/RTOInTransit"));
const RTODelivered = lazy(() => import("./pages/Dashboard/RTODelivered"));
const Cancelled = lazy(() => import("./pages/Dashboard/Cancelled"));
const Returned = lazy(() => import("./pages/Dashboard/Returned"));
const Pending = lazy(() => import("./pages/Dashboard/Pending"));
const CODRemittance = lazy(() => import("./pages/Dashboard/CODRemittance"));

// Elegant, ultra-lightweight transition fallback
const RouteLoader = () => (
  <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6">
    <div className="h-8 w-8 animate-spin rounded-full border-[2.5px] border-slate-200 border-t-[#008dd2]" />
    <span className="mt-3 text-[12px] font-medium text-slate-400">Loading page...</span>
  </div>
);

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

            {/* Create Order */}
            <Route
              path="/create-order"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <CreateOrder />
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
              path="/returned"
              element={
                <Suspense fallback={<RouteLoader />}>
                  <Returned />
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
              element={
                <Suspense fallback={<RouteLoader />}>
                  <RateCard />
                </Suspense>
              }
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
          </Route>
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;