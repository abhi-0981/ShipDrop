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

import AdminLayout from "./components/AdminLayout";


// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {

  const token =
    localStorage.getItem(
      "adminToken"
    );

  if (!token) {

    return (
      <Navigate
        to="/login"
        replace
      />
    );
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

      {/* ================================================= */}
      {/* GLOBAL TOASTER */}
      {/* ================================================= */}

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />


      <Routes>


        {/* ================================================= */}
        {/* LOGIN */}
        {/* ================================================= */}

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        {/* ================================================= */}
        {/* DASHBOARD */}
        {/* ================================================= */}

        <Route
          path="/dashboard"
          element={
            <AdminPage>
              <Dashboard />
            </AdminPage>
          }
        />


        {/* ================================================= */}
        {/* RATE CARD */}
        {/* ================================================= */}

        <Route
          path="/rate-card"
          element={
            <AdminPage>
              <RateCard />
            </AdminPage>
          }
        />


        {/* ================================================= */}
        {/* SET RATE */}
        {/* ================================================= */}

        <Route
          path="/rate-card/:id/set-rate"
          element={
            <AdminPage>
              <SetRate />
            </AdminPage>
          }
        />


        {/* ================================================= */}
        {/* USERS → ALL USERS */}
        {/* ================================================= */}

        <Route
          path="/users"
          element={
            <AdminPage>
              <Users />
            </AdminPage>
          }
        />


        {/* ================================================= */}
        {/* USER DETAILS */}
        {/* ================================================= */}

        <Route
          path="/users/:id"
          element={
            <AdminPage>
              <UserDetails />
            </AdminPage>
          }
        />


        {/* ================================================= */}
        {/* DEFAULT */}
        {/* ================================================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />


        {/* ================================================= */}
        {/* UNKNOWN URL */}
        {/* ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;