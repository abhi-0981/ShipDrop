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
import PickupAddress from "./pages/Dashboard/PickupAddress";


function App() {

  return (

    <Routes>

      {/* ================================================= */}
      {/* PUBLIC PAGES */}
      {/* ================================================= */}

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


      {/* ================================================= */}
      {/* DASHBOARD */}
      {/* ================================================= */}

      <Route
        element={<DashboardLayout />}
      >

        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* CREATE ORDER */}

        <Route
          path="/create-order"
          element={<CreateOrder />}
        />


        {/* PROCESSING */}

        <Route
          path="/processing-orders"
          element={<ProcessingOrders />}
        />


        {/* ALL ORDERS */}

        <Route
          path="/all-orders"
          element={<AllOrders />}
        />


        {/* MANIFESTED */}

        <Route
          path="/manifested"
          element={<Manifested />}
        />


        {/* RATE CALCULATOR */}

        <Route
          path="/rate-calculator"
          element={<RateCalculator />}
        />


        {/* TICKETS */}

        <Route
          path="/tickets"
          element={<Tickets />}
        />


        {/* GENERAL SETTINGS */}

        <Route
          path="/general-settings"
          element={<GeneralSettings />}
        />


        {/* RATE CARD */}

        <Route
          path="/rate-card"
          element={<RateCard />}
        />


        {/* ================================================= */}
        {/* SETTINGS → PICKUP ADDRESS */}
        {/* ================================================= */}

        <Route
          path="/settings/pickup-address"
          element={<PickupAddress />}
        />

      </Route>

    </Routes>

  );

}

export default App;