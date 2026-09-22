import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import CreateOrder from "./pages/Dashboard/CreateOrder";
import ProcessingOrders from "./pages/Dashboard/ProcessingOrders";
import OrdersProcessing from "./pages/Dashboard/OrdersProcessing";
import AllOrders from "./pages/Dashboard/AllOrders";
import Manifested from "./pages/Dashboard/Manifested";
import RateCalculator from "./pages/Dashboard/RateCalculator";
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
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-order" element={<CreateOrder />} />

        {/* Existing standalone Processing Orders page */}
        <Route
          path="/processing-orders"
          element={<ProcessingOrders />}
        />

        {/* New Orders → Processing page */}
        <Route
          path="/orders/processing"
          element={<OrdersProcessing />}
        />

        {/* Orders status pages — same table, fixed status */}
        <Route path="/all-orders" element={<AllOrders />} />
        <Route path="/in-transit" element={<InTransit />} />
        <Route
          path="/out-for-delivery"
          element={<OutForDelivery />}
        />
        <Route path="/delivered" element={<Delivered />} />
        <Route
          path="/rto-in-transit"
          element={<RTOInTransit />}
        />
        <Route
          path="/rto-delivered"
          element={<RTODelivered />}
        />
        <Route path="/returned" element={<Returned />} />

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

        {/* Manifested keeps its existing special manifest actions */}
        <Route
          path="/manifested"
          element={<Manifested />}
        />

        <Route
          path="/not-picked"
          element={<NotPicked />}
        />

        <Route
          path="/rate-calculator"
          element={<RateCalculator />}
        />

        <Route
          path="/tickets"
          element={<Tickets />}
        />

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

        {/* SETTINGS */}
        <Route
          path="/settings/pickup-address"
          element={<PickupAddress />}
        />

        <Route
          path="/settings/return-addresses"
          element={<ReturnAddresses />}
        />

        <Route
          path="/settings/label-settings"
          element={<LabelSettings />}
        />
      </Route>
    </Routes>
  );
}

export default App;