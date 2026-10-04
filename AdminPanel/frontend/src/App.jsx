import { Toaster } from "react-hot-toast";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";

import Dashboard from "./pages/dashboard/Dashboard";

import RateCard from "./rate-card/RateCard";
import SetRate from "./rate-card/SetRate";

import Users from "./pages/users/Users";
import UserDetails from "./pages/users/UserDetails";

import AdminTickets from "./pages/ticket/AdminTickets";

import AdminLayout from "./components/AdminLayout";

import AllOrders from "./pages/orders/AllOrders";

import WeightChecking from "./pages/weightcheck/WeightChecking";


/* =========================================================
   ADMIN PROTECTED ROUTE
========================================================= */

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


/* =========================================================
   ADMIN PAGE
========================================================= */

function AdminPage({ children }) {
  return (
    <ProtectedRoute>
      <AdminLayout>
        {children}
      </AdminLayout>
    </ProtectedRoute>
  );
}


/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />


        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <AdminPage>
              <Dashboard />
            </AdminPage>
          }
        />


        {/* ALL ORDERS */}
        <Route
          path="/orders"
          element={
            <AdminPage>
              <AllOrders />
            </AdminPage>
          }
        />


        {/* WEIGHT CHECKING */}
        <Route
          path="/weight-checking"
          element={
            <AdminPage>
              <WeightChecking />
            </AdminPage>
          }
        />


        {/* RATE CARD */}
        <Route
          path="/rate-card"
          element={
            <AdminPage>
              <RateCard />
            </AdminPage>
          }
        />

        <Route
          path="/rate-card/:id/set-rate"
          element={
            <AdminPage>
              <SetRate />
            </AdminPage>
          }
        />


        {/* USERS */}
        <Route
          path="/users"
          element={
            <AdminPage>
              <Users />
            </AdminPage>
          }
        />

        <Route
          path="/users/:id"
          element={
            <AdminPage>
              <UserDetails />
            </AdminPage>
          }
        />


        {/* TICKETS */}
        <Route
          path="/tickets"
          element={
            <AdminPage>
              <AdminTickets />
            </AdminPage>
          }
        />


        {/* ROOT */}
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* UNKNOWN */}
        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;