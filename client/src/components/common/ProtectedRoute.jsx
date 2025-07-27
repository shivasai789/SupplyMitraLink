import React, { memo } from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "../../stores/useAuthStore";

const ProtectedRoute = memo(({ children, role, redirectTo = "/login" }) => {
  const { user, token, isAuthenticated, loading, initialized } = useAuthState();

  // Show loading while auth is initializing or loading
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !token || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If role is specified and user doesn't have the required role, redirect to appropriate dashboard
  if (role && user.role !== role) {
    const dashboardPath = user.role === "supplier" ? "/dashboard/supplier" : "/dashboard/vendor";
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;
