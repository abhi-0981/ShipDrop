
import { Toaster } from "react-hot-toast";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";

import Dashboard from "./pages/dashboard/Dashboard";

import BusinessAnalytics from "./pages/analytics/BusinessAnalytics";

import RateCard from "./rate-card/RateCard";

import SetRate from "./rate-card/SetRate";

import Users from "./pages/users/Users";

import UserDetails from "./pages/users/UserDetails";

import AdminTickets from "./pages/ticket/AdminTickets";

import AdminLayout from "./components/AdminLayout";

import AllOrders from "./pages/orders/AllOrders";

import CODRemittance from "./pages/orders/CODRemittance";

import WeightChecking from "./pages/weightcheck/WeightChecking";

import Announcements from "./pages/announcements/Announcements";


// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// =====================================================
// ADMIN PAGE
// =====================================================

function AdminPage({ children }) {
  return (
    <ProtectedRoute>
      <AdminLayout>
        {children}
      </AdminLayout>
    </ProtectedRoute>
  );
}


// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>

      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 16,
          right: 16,
        }}
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "Inter, -apple-system, sans-serif",
            fontSize: "13px",
            fontWeight: "500",
            borderRadius: "10px",
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 4px 12px 0 rgba(15, 23, 42, 0.08), 0 1px 2px 0 rgba(15, 23, 42, 0.04)",
            padding: "10px 14px",
            maxWidth: "380px",
            lineHeight: "1.4",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            duration: 4500,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff",
            },
          },
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

        {/* BUSINESS ANALYTICS */}
        <Route
          path="/analytics"
          element={
            <AdminPage>
              <BusinessAnalytics />
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

        {/* SET RATE */}
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

        {/* USER DETAILS */}
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

        {/* ALL ORDERS */}
        <Route
          path="/orders"
          element={
            <AdminPage>
              <AllOrders />
            </AdminPage>
          }
        />

        {/* COD REMITTANCE */}
        <Route
          path="/cod-remittance"
          element={
            <AdminPage>
              <CODRemittance />
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

        {/* BROADCAST ANNOUNCEMENTS */}
        <Route
          path="/announcements"
          element={
            <AdminPage>
              <Announcements />
            </AdminPage>
          }
        />

        {/* DEFAULT */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* UNKNOWN URL */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
