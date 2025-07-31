import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useTranslation } from "react-i18next";
import { useSupplierStore } from "../../stores/useSupplierStore";
import { useOrderStore } from "../../stores/useOrderStore";
import SupplierHeader from "./SupplierHeader";
import SupplierMap from "./SupplierMap";
import { toast } from "react-hot-toast";
import Loader from "../common/Loader";

const SupplierDashboard = () => {
  const { user, token, logout } = useAuthStore();
  const { t, ready } = useTranslation();
  
  // Safety function to ensure translation is available
  const safeT = (key, fallback) => {
    try {
      return ready && t ? t(key) : fallback;
    } catch (error) {
      return fallback;
    }
  };
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Zustand store hooks
  const {
    profile,
    materials,
    dashboardStats: supplierDashboardStats,
    loading: supplierLoading,
    error: supplierError,
    fetchProfile,
    fetchMaterials,
  } = useSupplierStore();

  const {
    orders,
    activeOrders,
    mapOrders,
    dashboardStats: orderDashboardStats,
    loading: ordersLoading,
    error: ordersError,
    fetchOrders,
    fetchSupplierOrders,
    fetchMapOrders,
    updateOrderStatus,
  } = useOrderStore();

  // Single useEffect for data fetching - Fixed to prevent infinite re-renders
  useEffect(() => {
    if (!token) {
      return; // Let route protection handle redirect
    }

    // Add a flag to prevent multiple simultaneous calls
    let isMounted = true;

    const fetchDashboardData = async () => {
      if (!isMounted) return;
      

      
      try {
        await Promise.all([
          fetchProfile(),
          fetchMaterials(),
          fetchSupplierOrders(),
          fetchMapOrders()
        ]);

      } catch (error) {
        console.error('❌ SupplierDashboard: Data fetch error:', error);
        // Only handle auth errors, let other errors bubble up
        if (error.message && (
          error.message.includes('not authorized') || 
          error.message.includes('unauthorized') ||
          error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('token')
        )) {
          logout();
          // Don't navigate here - let route protection handle it
        }
      }
    };

    fetchDashboardData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [token]); // Only depend on token, not the functions

  // Loading state
  const isLoading = supplierLoading || ordersLoading;

  // Error state
  const hasError = supplierError || ordersError;

  // Don't render until translations are ready
  if (!ready) {
    return <Loader message="Loading..." />;
  }

  // Stats data with real data from store
  const dashboardStatsData = [
    {
      title: t("supplierDashboard.totalMaterials"),
      value: supplierDashboardStats?.totalMaterials?.toString() || materials.length.toString() || "0",
      change: "+5.2%",
      changeType: "positive",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      title: t("supplierDashboard.activeMaterials"),
      value: supplierDashboardStats?.activeMaterials?.toString() || "0",
      change: "+8.2%",
      changeType: "positive",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: t("supplierDashboard.pendingOrders"),
      value: Array.isArray(orders) ? orders.filter(order => order.status === "pending").length.toString() : "0",
      change: "-3.1%",
      changeType: "negative",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: t("supplierDashboard.confirmedOrders"),
      value: Array.isArray(orders) ? orders.filter(order => order.status === "confirmed").length.toString() : "0",
      change: "+15.3%",
      changeType: "positive",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const quickActions = [
    {
      title: t("supplierDashboard.manageItems"),
      description: t("supplierDashboard.addEditRemove"),
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      link: "/supplier/items",
      color: "bg-blue-500",
    },
    {
      title: t("supplierDashboard.viewManageWarnings"),
      description: t("supplierDashboard.priceWarningAlerts"),
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      ),
      link: "/alerts/price-warnings",
      color: "bg-orange-500",
    },
    {
      title: "Manage Profile",
      description: "Update your profile information and settings",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      link: "/supplier/profile",
      color: "bg-green-500",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-purple-100 text-purple-800";
      case "packed":
        return "bg-orange-100 text-orange-800";
      case "in_transit":
        return "bg-indigo-100 text-indigo-800";
      case "out_for_delivery":
        return "bg-green-100 text-green-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "accepted":
        return "Accepted";
      case "preparing":
        return "Preparing";
      case "packed":
        return "Packed";
      case "in_transit":
        return "In Transit";
      case "out_for_delivery":
        return "Out for Delivery";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const handleOrderAction = async (orderId, action) => {
    try {
      let newStatus = "";
      let note = "";

      switch (action) {
        case "accept":
          newStatus = "accepted";
          note = "Order accepted by supplier";
          break;
        case "reject":
          newStatus = "rejected";
          note = "Order rejected by supplier";
          break;
        case "pack":
          newStatus = "preparing";
          note = "Items being prepared";
          break;
        case "start-transit":
          newStatus = "packed";
          note = "Items packed and ready for transit";
          break;
        case "out-delivery":
          newStatus = "in_transit";
          note = "Order in transit";
          break;
        case "mark-delivered":
          newStatus = "out_for_delivery";
          note = "Out for delivery";
          break;
        default:
          return;
      }

      await updateOrderStatus(orderId, newStatus, note);

      // Show success message
      const actionMessages = {
        accept: "Order accepted and moved to history!",
        reject: "Order rejected and moved to history!",
        pack: "Order marked as preparing!",
        "start-transit": "Order marked as packed!",
        "out-delivery": "Order marked as in transit!",
        "mark-delivered": "Order marked as out for delivery!",
      };

      toast.success(actionMessages[action] || "Order status updated!");
      
      // Refresh orders after status update
      await fetchSupplierOrders();
    } catch (error) {
      console.error('Order action error:', error);
      toast.error("Failed to update order status. Please try again.");
    }
  };

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    // Ensure orders is an array
    const safeOrders = Array.isArray(orders) ? orders : [];
    
    switch (activeTab) {
      case "active":
        return safeOrders.filter(order => 
          ['pending', 'preparing', 'packed', 'in_transit', 'out_for_delivery'].includes(order.status)
        );
      case "history":
        return safeOrders.filter(order => 
          ['accepted', 'delivered', 'cancelled', 'rejected'].includes(order.status)
        );
      default:
        return [];
    }
  };

  const filteredOrders = getFilteredOrders();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SupplierHeader />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <Loader text="Loading dashboard data..." />
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (hasError) {
    const errorMessage = supplierError || ordersError || "Failed to load dashboard data.";
    const isAuthError = errorMessage && (
      errorMessage.includes('not authorized') || 
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('token')
    );

    if (isAuthError) {
      logout();
      navigate('/login');
      return null;
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <SupplierHeader />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-red-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">
                  Error Loading Dashboard
                </h3>
                <p className="text-red-700 mt-1">
                  {errorMessage}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SupplierHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t("common.welcome")}, {user?.fullname || user?.name || "Supplier"}! 👋
          </h2>
          <p className="text-gray-600">
            {t("supplierDashboard.monthlySalesOverview")}
          </p>
        </div>



        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {dashboardStatsData.map((stat, index) => (
            <div
              key={index}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-4 md:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <div className="text-blue-600">{stat.icon}</div>
                    </div>
                  </div>
                  <div className="ml-3 md:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-xl md:text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === "positive"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "active"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
                              Active Orders ({Array.isArray(orders) ? orders.filter(order => ['pending', 'preparing', 'packed', 'in_transit', 'out_for_delivery'].includes(order.status)).length : 0})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
                              Orders History ({Array.isArray(orders) ? orders.filter(order => ['accepted', 'delivered', 'cancelled', 'rejected'].includes(order.status)).length : 0})
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <>
            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("supplierDashboard.quickActions")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 group"
                  >
                    <div className="p-4 md:p-6">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                        >
                          <div className="text-white">{action.icon}</div>
                        </div>
                        <div className="ml-3 md:ml-4">
                          <h4 className="text-base md:text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {action.title}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Map View Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("supplierDashboard.mapView")}
              </h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <SupplierMap orders={mapOrders} />
              </div>
            </div>
          </>
        )}

        {/* Orders Lists */}
        {(activeTab === "active" || activeTab === "history") && (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No orders found
                </h3>
                <p className="text-gray-500">
                  {activeTab === "active" && "No active orders available."}
                  {activeTab === "history" && "No order history available."}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order._id || order.id}
                  className="bg-white rounded-lg shadow p-4 md:p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {order.vendorId?.fullname || "Vendor"}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Material:</strong>{" "}
                            {order.materialId?.name || "Material"}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Quantity:</strong> {order.quantity} units
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Total:</strong> ₹{order.totalAmount}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Order Date:</strong>{" "}
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Order ID:</strong> {order._id || order.id}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Only show for active orders */}
                    {activeTab === "active" && (
                      <div className="flex space-x-2 mt-4 md:mt-0">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleOrderAction(order._id || order.id, "accept")
                              }
                              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              Accept Order
                            </button>
                            <button
                              onClick={() =>
                                handleOrderAction(order._id || order.id, "reject")
                              }
                              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                              Reject Order
                            </button>
                          </>
                        )}
                        {order.status === "accepted" && (
                          <button
                            onClick={() => handleOrderAction(order._id || order.id, "pack")}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Start Preparing
                          </button>
                        )}
                        {order.status === "preparing" && (
                          <button
                            onClick={() =>
                              handleOrderAction(order._id || order.id, "start-transit")
                            }
                            className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors"
                          >
                            Mark as Packed
                          </button>
                        )}
                        {order.status === "packed" && (
                          <button
                            onClick={() =>
                              handleOrderAction(order._id || order.id, "out-delivery")
                            }
                            className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                          >
                            Start Transit
                          </button>
                        )}
                        {order.status === "in_transit" && (
                          <button
                            onClick={() =>
                              handleOrderAction(order._id || order.id, "mark-delivered")
                            }
                            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            Out for Delivery
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SupplierDashboard;
