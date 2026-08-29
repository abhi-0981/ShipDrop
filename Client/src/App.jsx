import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import CreateOrder from "./pages/Dashboard/CreateOrder";
import ProcessingOrders from "./pages/Dashboard/ProcessingOrders";
import AllOrders from "./pages/Dashboard/AllOrders";
import Manifested from "./pages/Dashboard/Manifested";
import RateCalculator from "./pages/Dashboard/RateCalculator";
import Tickets from "./pages/Dashboard/Tickets";
import GeneralSettings from "./pages/Dashboard/GeneralSettings";
import RateCard from "./pages/Dashboard/RateCard";

function App() {
  return (
    <Routes>

      {/* Public Pages */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />


      {/* Dashboard Pages */}

      <Route
        element={<DashboardLayout />}
      >

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/create-order"
          element={<CreateOrder />}
        />

        <Route
          path="/processing-orders"
          element={<ProcessingOrders />}
        />

        <Route
          path="/all-orders"
          element={<AllOrders />}
        />

        <Route
          path="/manifested"
          element={<Manifested />}
        />

        <Route
          path="/rate-calculator"
          element={<RateCalculator />}
        />

        <Route
          path="/tickets"
          element={<Tickets />}
        />

        {/* General Settings */}

        <Route
          path="/general-settings"
          element={<GeneralSettings />}
        />

        <Route
  path="/rate-card"
  element={<RateCard />}
/>

      </Route>

    </Routes>
  );
}

export default App;