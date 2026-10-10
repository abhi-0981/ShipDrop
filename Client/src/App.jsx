import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import PageLoader from "./components/Common/PageLoader";

// Public Pages (Lazy Loaded)
const Home = lazy(() => import("./pages/Home/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));

// Dashboard Layout & Core (Lazy Loaded)
const DashboardLayout = lazy(() => import("./pages/Dashboard/DashboardLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const CreateOrder = lazy(() => import("./pages/Dashboard/CreateOrder"));
const ProcessingOrders = lazy(() => import("./pages/Dashboard/ProcessingOrders"));
const OrdersProcessing = lazy(() => import("./pages/Dashboard/OrdersProcessing"));

// Orders Pages (Lazy Loaded)
const AllOrders = lazy(() => import("./pages/Dashboard/AllOrders"));
const Manifested = lazy(() => import("./pages/Dashboard/Manifested"));
const NotPicked = lazy(() => import("./pages/Dashboard/NotPicked"));
const InTransit = lazy(() => import("./pages/Dashboard/InTransit"));
const OutForDelivery = lazy(() => import("./pages/Dashboard/OutForDelivery"));
const Delivered = lazy(() => import("./pages/Dashboard/Delivered"));
const RTOInTransit = lazy(() => import("./pages/Dashboard/RTOInTransit"));
const RTODelivered = lazy(() => import("./pages/Dashboard/RTODelivered"));
const Cancelled = lazy(() => import("./pages/Dashboard/Cancelled"));
const Returned = lazy(() => import("./pages/Dashboard/Returned"));
const Pending = lazy(() => import("./pages/Dashboard/Pending"));

// Tools & Finance (Lazy Loaded)
const RateCalculator = lazy(() => import("./pages/Dashboard/RateCalculator"));
const Serviceability = lazy(() => import("./pages/Dashboard/Serviceability"));
const RateCard = lazy(() => import("./pages/Dashboard/RateCard"));
const WalletHistory = lazy(() => import("./pages/Dashboard/WalletHistory"));
const CODRemittance = lazy(() => import("./pages/Dashboard/CODRemittance"));

// Settings & Support (Lazy Loaded)
const Tickets = lazy(() => import("./pages/Dashboard/Tickets"));
const GeneralSettings = lazy(() => import("./pages/Dashboard/GeneralSettings"));
const PickupAddress = lazy(() => import("./pages/Dashboard/PickupAddress"));
const ReturnAddresses = lazy(() => import("./pages/Dashboard/ReturnAddresses"));
const LabelSettings = lazy(() => import("./pages/Dashboard/LabelSettings"));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
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
                element={<Dashboard />}
              />

              {/* Create Order */}
              <Route
                path="/create-order"
                element={<CreateOrder />}
              />

              {/* Processing Orders */}
              <Route
                path="/processing-orders"
                element={<ProcessingOrders />}
              />

              {/* New Orders → Processing */}
              <Route
                path="/orders/processing"
                element={<OrdersProcessing />}
              />

              {/* ========================================
                  ORDERS
              ======================================== */}

              <Route
                path="/all-orders"
                element={<AllOrders />}
              />

              <Route
                path="/in-transit"
                element={<InTransit />}
              />

              <Route
                path="/out-for-delivery"
                element={<OutForDelivery />}
              />

              <Route
                path="/delivered"
                element={<Delivered />}
              />

              <Route
                path="/rto-in-transit"
                element={<RTOInTransit />}
              />

              <Route
                path="/rto-delivered"
                element={<RTODelivered />}
              />

              <Route
                path="/returned"
                element={<Returned />}
              />

              <Route
                path="/pending"
                element={<Pending />}
              />

              <Route
                path="/cancelled"
                element={<Cancelled />}
              />

              <Route
                path="/orders/ndr-pending"
                element={<Pending />}
              />

              {/* ========================================
                  ORDER STATUS FILTER ROUTES
              ======================================== */}

              <Route
                path="/orders/ofd"
                element={
                  <AllOrders
                    statusScope="OFD"
                    pageTitle="OFD"
                  />
                }
              />

              <Route
                path="/orders/delivered"
                element={
                  <AllOrders
                    statusScope="DELIVERED"
                    pageTitle="Delivered"
                  />
                }
              />

              <Route
                path="/orders/rto-in-transit"
                element={
                  <AllOrders
                    statusScope="RTO_IN_TRANSIT"
                    pageTitle="RTO In Transit"
                  />
                }
              />

              <Route
                path="/orders/rto-delivered"
                element={
                  <AllOrders
                    statusScope="RTO_DELIVERED"
                    pageTitle="RTO Delivered"
                  />
                }
              />

              <Route
                path="/orders/lost"
                element={
                  <AllOrders
                    statusScope="LOST"
                    pageTitle="Lost"
                  />
                }
              />

              {/* ========================================
                  MANIFEST
              ======================================== */}

              <Route
                path="/manifested"
                element={<Manifested />}
              />

              <Route
                path="/not-picked"
                element={<NotPicked />}
              />

              {/* ========================================
                  TOOLS
              ======================================== */}

              <Route
                path="/rate-calculator"
                element={<RateCalculator />}
              />

              <Route
                path="/serviceability"
                element={<Serviceability />}
              />

              {/* ========================================
                  SUPPORT
              ======================================== */}

              <Route
                path="/tickets"
                element={<Tickets />}
              />

              {/* ========================================
                  SETTINGS
              ======================================== */}

              <Route
                path="/general-settings"
                element={<GeneralSettings />}
              />

              <Route
                path="/rate-card"
                element={<RateCard />}
              />

              <Route
                path="/wallet"
                element={<WalletHistory />}
              />

              <Route
                path="/cod-remittance"
                element={<CODRemittance />}
              />

              {/* Pickup Address */}
              <Route
                path="/settings/pickup-address"
                element={<PickupAddress />}
              />

              {/* Return Addresses */}
              <Route
                path="/settings/return-addresses"
                element={<ReturnAddresses />}
              />

              {/* Label Settings */}
              <Route
                path="/settings/label-settings"
                element={<LabelSettings />}
              />

            </Route>
          </Route>

          {/* ========================================
              404 NOT FOUND ROUTE
          ======================================== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;