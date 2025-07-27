import React, { memo } from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "../../stores/useAuthStore";

const PublicRoute = memo(({ children }) => {
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

  // If user is authenticated, redirect to appropriate dashboard
  if (isAuthenticated && token && user && user.role) {
    const dashboardPath = user.role === "supplier" ? "/dashboard/supplier" : "/dashboard/vendor";
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
});

PublicRoute.displayName = 'PublicRoute';

export default PublicRoute;
