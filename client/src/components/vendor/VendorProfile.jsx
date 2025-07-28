import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import VendorHeader from "./VendorHeader";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { useAuthStore } from "../../stores/useAuthStore";
import { useVendorStore } from "../../stores/useVendorStore";
import { useOrderStore } from "../../stores/useOrderStore";
import { useCartStore } from "../../stores/useCartStore";
import ApiService from "../../services/api";
import { toast } from "react-hot-toast";
import Loader from "../common/Loader";

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const VendorProfile = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Cart state management
  const { cartItems, fetchCartItems } = useCartStore();
  const [showCart, setShowCart] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showTrackOrder, setShowTrackOrder] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(null); // orderId or null
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviews, setReviews] = useState([]); // {orderId, supplier, rating, comment}
  const [allReviews, setAllReviews] = useState([]); // All reviews from API

  // Use vendor store for vendor-specific data
  const {
    profile: vendorStoreProfile,
    loading: profileLoading,
    error: profileError,
    fetchProfile,
    updateProfile,
    createReview,
    getReviews,
  } = useVendorStore();

  // Use order store for order-specific data
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    fetchVendorOrders,
  } = useOrderStore();

  // Use vendor store profile if available, otherwise fall back to auth user data
  const vendorProfile = vendorStoreProfile || user;

  // Use real orders from API, with fallback to empty array
  const realOrders = orders || [];

  // Fetch complete profile data if needed
  const fetchCompleteProfile = async () => {
    if (user?.token) {
      try {
        await fetchProfile(user.token);
      } catch (error) {
        // Handle error silently or with toast if needed
      }
    }
  };

  // Fetch reviews for a specific material
  const fetchMaterialReviews = async (materialId) => {
    if (user?.token && materialId) {
      try {
        const response = await getReviews(materialId, user.token);
        return response || [];
      } catch (error) {
        return [];
      }
    }
    return [];
  };

  // Fetch complete profile data and orders on component mount
  useEffect(() => {
    if (user?.token) {
      fetchCompleteProfile();
      fetchVendorOrders();
    }
  }, [user?.token, fetchProfile, fetchVendorOrders]);

  // Fetch cart items on component mount
  useEffect(() => {
    fetchCartItems().catch(err => {
      console.warn('Failed to fetch cart items:', err.message);
    });
  }, [fetchCartItems]);

  // Load reviews when reviews tab is accessed
  useEffect(() => {
    if (activeTab === "reviews" && user?.token && realOrders.length > 0) {
      const loadReviews = async () => {
        const deliveredOrders = realOrders.filter(order => order.status === "delivered");
        const allReviews = [];
        
        for (const order of deliveredOrders) {
          if (order.materialId?._id) {
            const materialReviews = await fetchMaterialReviews(order.materialId._id);
            // Filter reviews created by current user
            const userReviews = materialReviews.filter(review => 
              review.userId === user.id || review.userId?._id === user.id
            );
            allReviews.push(...userReviews);
          }
        }
        
        setAllReviews(allReviews);
      };
      
      loadReviews();
    }
  }, [activeTab, user?.token, realOrders]);

  // Initialize edit form with profile data
  const [editForm, setEditForm] = useState({
    fullname: vendorProfile?.fullname || "",
    email: vendorProfile?.email || "",
    phone: vendorProfile?.phone || "",
    businessName: vendorProfile?.businessName || "",
    businessType: vendorProfile?.businessType || "",
    businessAddress: vendorProfile?.businessAddress || "",
    city: vendorProfile?.city || "",
    state: vendorProfile?.state || "",
    pincode: vendorProfile?.pincode || "",
  });

  // Update edit form when profile data loads
  useEffect(() => {
    if (vendorProfile) {
      setEditForm({
        fullname: vendorProfile.fullname || "",
        email: vendorProfile.email || "",
        phone: vendorProfile.phone || "",
      });
    }
  }, [vendorProfile]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "in-transit":
        return "bg-orange-100 text-orange-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return t("vendor.orderPending");
      case "confirmed":
        return t("vendor.orderConfirmed");
      case "in-transit":
        return t("vendor.orderInTransit");
      case "delivered":
        return t("vendor.orderDelivered");
      case "cancelled":
        return t("vendor.orderCancelled");
      default:
        return status;
    }
  };

  const handleEditProfile = () => {
    setEditForm({
      fullname: vendorProfile?.fullname || "",
      email: vendorProfile?.email || "",
      phone: vendorProfile?.phone || "",
      businessName: vendorProfile?.businessName || "",
      businessType: vendorProfile?.businessType || "",
      businessAddress: vendorProfile?.businessAddress || "",
      city: vendorProfile?.city || "",
      state: vendorProfile?.state || "",
      pincode: vendorProfile?.pincode || "",
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm);
      updateUser(editForm); // Update user in auth store
      toast.success("Profile updated successfully!");
      setShowEditProfile(false);
    } catch (error) {
      toast.error("Failed to update profile: " + error.message);
    }
  };

  const handleCancelEdit = () => {
    setShowEditProfile(false);
  };

  const handleTrackOrder = (orderId) => {
    setShowTrackOrder(orderId);
  };

  const handleCloseTrack = () => {
    setShowTrackOrder(null);
  };

  const quickActions = [
    {
      title: t("vendor.editProfile"),
      description: t("vendor.updateProfileInfo"),
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
      action: handleEditProfile,
      color: "bg-blue-500",
    },
    {
      title: t("vendor.viewOrders"),
      description: t("vendor.trackOrderStatus"),
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
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      action: () => setActiveTab("orders"),
      color: "bg-green-500",
    },
    {
      title: t("vendor.orderHistory"),
      description: t("vendor.pastOrders"),
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      action: () => setActiveTab("history"),
      color: "bg-purple-500",
    },
    {
      title: t("common.dashboard"),
      description: t("vendor.backToDashboard"),
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
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
        </svg>
      ),
      action: () => (window.location.href = "/dashboard/vendor"),
      color: "bg-orange-500",
    },
  ];

  const filteredOrders = realOrders.filter((order) => {
    if (activeTab === "orders") return order.status !== "delivered";
    if (activeTab === "history") return order.status === "delivered";
    return true;
  });

  // Loading state
  if (profileLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader
          cart={cartItems}
          showCart={showCart}
          setShowCart={setShowCart}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (profileError || ordersError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader
          cart={cartItems}
          showCart={showCart}
          setShowCart={setShowCart}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Profile
            </h2>
            <p className="text-gray-600 mb-4">{profileError || ordersError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No profile data
  if (!vendorProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader
          cart={cartItems}
          showCart={showCart}
          setShowCart={setShowCart}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-gray-500 text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Profile Data
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to load profile information.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorHeader cart={cartItems} showCart={showCart} setShowCart={setShowCart} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t("vendor.profile")} 👤
          </h2>
          <p className="text-gray-600">{t("vendor.manageProfileOrders")}</p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("profile")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("vendor.profile")}
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("vendor.activeOrders")} (
              {realOrders.filter((o) => o.status !== "delivered").length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("vendor.orderHistory")} (
              {realOrders.filter((o) => o.status === "delivered").length})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "reviews"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("vendor.myReviews")} ({reviews.length + allReviews.length})
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === "profile" && (
          <>
            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("vendor.quickActions")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200 group text-left"
                  >
                    <div className="p-4 md:p-6">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                        >
                          <div className="text-white">{action.icon}</div>
                        </div>
                        <div className="ml-3 md:ml-4">
                          <h4 className="text-base md:text-lg font-medium text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                            {action.title}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 md:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 md:ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {t("vendor.totalOrders")}
                        </dt>
                        <dd className="text-xl md:text-2xl font-semibold text-gray-900">
                          {realOrders.length || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 md:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 md:ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {t("vendor.totalSpent")}
                        </dt>
                        <dd className="text-xl md:text-2xl font-semibold text-gray-900">
                          ₹{(realOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)).toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 md:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 md:ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {t("vendor.rating")}
                        </dt>
                        <dd className="text-xl md:text-2xl font-semibold text-gray-900">
                          {vendorProfile?.rating || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-4 md:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-3 md:ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {t("vendor.avgOrderValue")}
                        </dt>
                        <dd className="text-xl md:text-2xl font-semibold text-gray-900">
                          ₹{realOrders.length > 0 
                            ? Math.round(realOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / realOrders.length)
                            : 0
                          }
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {t("vendor.profileDetails")}
                </h3>
                <button
                  onClick={handleEditProfile}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                >
                  {t("vendor.editProfile")}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    {t("vendor.personalInfo")}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t("vendor.name")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {vendorProfile?.fullname || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t("vendor.email")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {vendorProfile?.email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t("vendor.phone")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {vendorProfile?.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t("vendor.role")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1 capitalize">
                        {vendorProfile?.role || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t("vendor.memberSince")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {vendorProfile?.createdAt 
                          ? new Date(vendorProfile.createdAt).toLocaleDateString()
                          : "Not available"
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    {t("vendor.businessInfo")}
                  </h4>
                  <div className="space-y-3">
                    {vendorProfile?.businessName && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Business Name
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {vendorProfile.businessName}
                        </p>
                      </div>
                    )}
                    {vendorProfile?.businessType && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Business Type
                        </label>
                        <p className="text-sm text-gray-900 mt-1 capitalize">
                          {vendorProfile.businessType}
                        </p>
                      </div>
                    )}
                    {vendorProfile?.businessAddress && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Business Address
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {vendorProfile.businessAddress}
                        </p>
                      </div>
                    )}
                    {(vendorProfile?.city || vendorProfile?.state || vendorProfile?.pincode) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Location
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {[vendorProfile.city, vendorProfile.state, vendorProfile.pincode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditProfile && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {t("vendor.editProfile")}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("vendor.name")} *
                        </label>
                        <input
                          type="text"
                          value={editForm.fullname}
                          onChange={(e) =>
                            setEditForm({ ...editForm, fullname: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("vendor.email")} *
                        </label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm({ ...editForm, email: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter your email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("vendor.phone")}
                        </label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm({ ...editForm, phone: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value={editForm.businessName}
                          onChange={(e) =>
                            setEditForm({ ...editForm, businessName: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter your business name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Type
                        </label>
                        <select
                          value={editForm.businessType}
                          onChange={(e) =>
                            setEditForm({ ...editForm, businessType: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="">Select business type</option>
                          <option value="retail">Retail Store</option>
                          <option value="wholesale">Wholesale</option>
                          <option value="restaurant">Restaurant</option>
                          <option value="catering">Catering</option>
                          <option value="manufacturing">Manufacturing</option>
                          <option value="distribution">Distribution</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Address
                        </label>
                        <textarea
                          value={editForm.businessAddress}
                          onChange={(e) =>
                            setEditForm({ ...editForm, businessAddress: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Enter your business address"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={editForm.city}
                            onChange={(e) =>
                              setEditForm({ ...editForm, city: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={editForm.state}
                            onChange={(e) =>
                              setEditForm({ ...editForm, state: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="State"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pincode
                          </label>
                          <input
                            type="text"
                            value={editForm.pincode}
                            onChange={(e) =>
                              setEditForm({ ...editForm, pincode: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        * Required fields. Email cannot be changed after registration.
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={handleSaveProfile}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                      >
                        {t("common.save")}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Orders Tab */}
        {(activeTab === "orders" || activeTab === "history") && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === "orders"
                  ? t("vendor.activeOrders")
                  : t("vendor.orderHistory")}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchVendorOrders()}
                  className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                >
                  Refresh Orders
                </button>
                <Link
                  to="/dashboard/vendor"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  {t("vendor.placeNewOrder")}
                </Link>
              </div>
            </div>

            {/* Debug info */}
            <div className="mb-4 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">
                Total orders: {realOrders.length} | Filtered orders: {filteredOrders.length} | Active tab: {activeTab}
              </p>
              {realOrders.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Sample order: {realOrders[0]._id} - {realOrders[0].status} - ₹{realOrders[0].totalAmount}
                </p>
              )}
            </div>

            {filteredOrders.map((order) => (
              <div key={order._id || order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {order.supplierId?.fullname || "Supplier"}
                    </h4>
                    <p className="text-sm text-gray-500">Order #{order._id || order.id}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{order.totalAmount}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    {t("vendor.orderItems")}
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-900">
                        {order.materialId?.name || "Material"}
                      </span>
                      <span className="text-gray-500">
                        {order.quantity} units × ₹{order.materialId?.pricePerUnit || 0} = ₹
                        {order.quantity * (order.materialId?.pricePerUnit || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("vendor.orderDate")}
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {order.createdAt 
                        ? new Date(order.createdAt).toLocaleDateString()
                        : "Not available"
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("vendor.quantity")}
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {order.quantity} units
                    </p>
                  </div>
                </div>

                {/* Supplier Contact */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    {t("vendor.supplierContact")}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t("vendor.supplierName")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1">
                        {order.supplierId?.fullname || "Not available"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        {t("vendor.orderStatus")}
                      </label>
                      <p className="text-sm text-gray-900 mt-1 capitalize">
                        {order.status || "pending"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200">
                    {t("vendor.contactSupplier")}
                  </button>
                  <button
                    onClick={() => handleTrackOrder(order._id || order.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    {t("vendor.trackOrder")}
                  </button>
                  {order.status === "delivered" && (
                    <button
                      onClick={() => {
                        setShowReviewForm(order._id || order.id);
                        setReviewForm({ rating: 5, comment: "" });
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors duration-200"
                    >
                      {t("vendor.leaveReview")}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === "orders"
                    ? t("vendor.noActiveOrders")
                    : t("vendor.noOrderHistory")}
                </h3>
                <p className="text-gray-500">
                  {activeTab === "orders"
                    ? t("vendor.startShopping")
                    : t("vendor.placeFirstOrder")}
                </p>
                {ordersLoading && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading orders...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {t("vendor.myReviews")}
              </h3>
            </div>

            {(reviews.length === 0 && allReviews.length === 0) ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">⭐</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("vendor.noReviewsYet")}
                </h3>
                <p className="text-gray-500">
                  {t("vendor.reviewDeliveredOrders")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Local reviews (newly submitted) */}
                {reviews.map((review, index) => (
                  <div key={`local-${index}`} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {review.supplier}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Order #{review.orderId}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-2xl ${
                              i < review.rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* API reviews (from database) */}
                {allReviews.map((review, index) => (
                  <div key={`api-${review._id || index}`} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {review.supplierId?.fullname || "Supplier"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Material: {review.materialId?.name || "Unknown"}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-2xl ${
                              i < review.rating ? "text-yellow-400" : "text-gray-300"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                      {review.createdAt && new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order Tracking Modal */}
        {showTrackOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("vendor.trackOrder")} #{showTrackOrder}
                  </h3>
                  <button
                    onClick={handleCloseTrack}
                    className="text-gray-400 hover:text-gray-600"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="h-96 mb-4">
                  <MapContainer
                    center={[12.9716, 77.5946]}
                    zoom={10}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {/* Supplier Location */}
                    <Marker position={[12.9716, 77.5946]}>
                      <Popup>
                        <div>
                          <h4 className="font-medium">Supplier Location</h4>
                          <p className="text-sm text-gray-600">
                            Fresh Farm Supplies
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                    {/* Delivery Location */}
                    <Marker position={[12.9716, 77.5946]}>
                      <Popup>
                        <div>
                          <h4 className="font-medium">Delivery Location</h4>
                          <p className="text-sm text-gray-600">Your Address</p>
                        </div>
                      </Popup>
                    </Marker>
                    {/* Route Line */}
                    <Polyline
                      positions={[
                        [12.9716, 77.5946], // Supplier
                        [12.9716, 77.5946], // Delivery
                      ]}
                      color="blue"
                      weight={3}
                    />
                  </MapContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Supplier</h4>
                    <p className="text-sm text-blue-700">Fresh Farm Supplies</p>
                    <p className="text-xs text-blue-600">
                      Farm Road, Bangalore Rural
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">
                      Current Status
                    </h4>
                    <p className="text-sm text-green-700">In Transit</p>
                    <p className="text-xs text-green-600">
                      Expected: 2024-01-22
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">Delivery</h4>
                    <p className="text-sm text-purple-700">Your Address</p>
                    <p className="text-xs text-purple-600">
                      123 Market Street, Bangalore
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCloseTrack}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200"
                  >
                    {t("common.close")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t("vendor.leaveReview")}
                </h3>
                <div className="mb-2 flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setReviewForm((f) => ({ ...f, rating: star }))
                      }
                      className={`text-2xl ${
                        star <= reviewForm.rating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      } hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {reviewForm.rating}/5
                  </span>
                </div>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-2"
                  rows={3}
                  placeholder={t("vendor.shareExperience")}
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((f) => ({ ...f, comment: e.target.value }))
                  }
                />
                <div className="flex space-x-2">
                  <button
                                          onClick={async () => {
                        try {
                          const order = realOrders.find((o) => o._id === showReviewForm);
                          if (!order) {
                            toast.error("Order not found!");
                            return;
                          }

                          // Prepare review data according to the Review model
                          const reviewData = {
                            materialId: order.materialId?._id,
                            supplierId: order.supplierId?._id,
                            rating: reviewForm.rating,
                            comment: reviewForm.comment,
                          };
                          
                          // Submit review to API
                          await createReview(reviewData, user.token);
                          
                          // Add to local reviews state
                          setReviews((r) => [
                            ...r,
                            {
                              orderId: showReviewForm,
                              supplier: order?.supplierId?.fullname || "Supplier",
                              rating: reviewForm.rating,
                              comment: reviewForm.comment,
                            },
                          ]);
                          
                          toast.success("Review submitted successfully!");
                          setShowReviewForm(null);
                        } catch (error) {
                          toast.error("Failed to submit review: " + error.message);
                        }
                      }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                  >
                    {t("vendor.submitFeedbackButton")}
                  </button>
                  <button
                    onClick={() => setShowReviewForm(null)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorProfile;
