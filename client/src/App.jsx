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
import OnboardingForm from "./components/onboarding/OnboardingForm";
import OnboardingGuard from "./components/common/OnboardingGuard";
import { useAuthState, useAuthActions } from "./stores/useAuthStore";
import { Toaster } from "react-hot-toast";
import Loader from "./components/common/Loader";
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
        <Loader text="Initializing..." />
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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#10B981",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#EF4444",
                secondary: "#fff",
              },
            },
          }}
        />
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
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingForm />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes with Onboarding Guard */}
            <Route
              path="/dashboard/supplier"
              element={
                <ProtectedRoute role="supplier">
                  <OnboardingGuard>
                    <SupplierDashboard />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/vendor"
              element={
                <ProtectedRoute role="vendor">
                  <OnboardingGuard>
                    <VendorDashboard />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/items"
              element={
                <ProtectedRoute role="supplier">
                  <OnboardingGuard>
                    <SupplierItems />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts/price-warnings"
              element={
                <ProtectedRoute role="supplier">
                  <OnboardingGuard>
                    <PriceWarnings />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <Feedback />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <Checkout />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-confirmation"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <OrderConfirmation />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/profile"
              element={
                <ProtectedRoute role="supplier">
                  <OnboardingGuard>
                    <SupplierProfile />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/vendor/profile"
              element={
                <ProtectedRoute role="vendor">
                  <OnboardingGuard>
                    <VendorProfile />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/:id"
              element={
                <ProtectedRoute role="vendor">
                  <OnboardingGuard>
                    <SupplierPublicView />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplier/:id/detail"
              element={
                <ProtectedRoute role="vendor">
                  <OnboardingGuard>
                    <SupplierDetailView />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/prediction"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <PredictionPage />
                  </OnboardingGuard>
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
