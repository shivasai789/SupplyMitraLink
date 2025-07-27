import React, { useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PublicRoute from "./components/common/PublicRoute";
import ScrollToTop from "./components/common/ScrollToTop";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import SupplierDashboard from "./components/supplier/SupplierDashboard";
import VendorDashboard from "./components/vendor/VendorDashboard";
import SupplierItems from "./components/supplier/SupplierItems";
import PriceWarnings from "./components/supplier/PriceWarnings";
import Feedback from "./components/feedback/Feedback";
import Checkout from "./components/orders/Checkout";
import OrderConfirmation from "./components/orders/OrderConfirmation";
import SupplierProfile from "./components/supplier/SupplierProfile";
import VendorProfile from "./components/vendor/VendorProfile";
import SupplierPublicView from "./components/vendor/SupplierPublicView";
import SupplierDetailView from "./components/vendor/SupplierDetailView";
import PredictionPage from "./pages/PredictionPage";
import { useAuthState, useAuthActions } from "./stores/useAuthStore";
import "./i18n";

// Auth Initializer Component
const AuthInitializer = ({ children }) => {
  const { initialized } = useAuthState();
  const { initializeAuth } = useAuthActions();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!initialized && !hasInitialized.current) {
      hasInitialized.current = true;
      initializeAuth();
    }
  }, [initialized, initializeAuth]);

  // Show loading while initializing auth
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default function App() {
  return (
    <AuthInitializer>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard/supplier"
              element={
                <ProtectedRoute role="supplier">
                  <SupplierDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/vendor"
              element={
                <ProtectedRoute role="vendor">
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/items"
              element={
                <ProtectedRoute role="supplier">
                  <SupplierItems />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts/price-warnings"
              element={
                <ProtectedRoute role="supplier">
                  <PriceWarnings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <Feedback />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-confirmation"
              element={
                <ProtectedRoute>
                  <OrderConfirmation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/profile"
              element={
                <ProtectedRoute role="supplier">
                  <SupplierProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/profile"
              element={
                <ProtectedRoute role="vendor">
                  <VendorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/:id"
              element={
                <ProtectedRoute role="vendor">
                  <SupplierPublicView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/:id/detail"
              element={
                <ProtectedRoute role="vendor">
                  <SupplierDetailView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prediction"
              element={
                <ProtectedRoute>
                  <PredictionPage />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route
              path="/"
              element={<Navigate to="/login" replace />}
            />
            
            {/* Catch all route */}
            <Route
              path="*"
              element={<Navigate to="/login" replace />}
            />
        </Routes>
      </Router>
    </AuthInitializer>
  );
}
