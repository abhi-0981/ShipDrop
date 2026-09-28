import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import CreateOrder from "./pages/Dashboard/CreateOrder";
import ProcessingOrders from "./pages/Dashboard/ProcessingOrders";
import OrdersProcessing from "./pages/Dashboard/OrdersProcessing";
import AllOrders from "./pages/Dashboard/AllOrders";
import Manifested from "./pages/Dashboard/Manifested";
import RateCalculator from "./pages/Dashboard/RateCalculator";
import Serviceability from "./pages/Dashboard/Serviceability";
import Tickets from "./pages/Dashboard/Tickets";
import GeneralSettings from "./pages/Dashboard/GeneralSettings";
import RateCard from "./pages/Dashboard/RateCard";
import WalletHistory from "./pages/Dashboard/WalletHistory";
import PickupAddress from "./pages/Dashboard/PickupAddress";
import ReturnAddresses from "./pages/Dashboard/ReturnAddresses";
import LabelSettings from "./pages/Dashboard/LabelSettings";
import NotPicked from "./pages/Dashboard/NotPicked";
import InTransit from "./pages/Dashboard/InTransit";
import OutForDelivery from "./pages/Dashboard/OutForDelivery";
import Delivered from "./pages/Dashboard/Delivered";
import RTOInTransit from "./pages/Dashboard/RTOInTransit";
import RTODelivered from "./pages/Dashboard/RTODelivered";
import Cancelled from "./pages/Dashboard/Cancelled";
import Returned from "./pages/Dashboard/Returned";
import Pending from "./pages/Dashboard/Pending";

function App() {
  return (
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
    </Routes>
  );
}

export default App;