import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SupplierHeader from "./SupplierHeader";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { useAuthStore } from "../../stores/useAuthStore";
import { useSupplierStore } from "../../stores/useSupplierStore";
import { useOrderStore } from "../../stores/useOrderStore";
import apiService from "../../services/api";
import { toast } from "react-hot-toast";
import Loader from "../common/Loader";
import LocationPicker from "../common/LocationPicker";

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

const SupplierProfile = () => {
  const { t } = useTranslation();
  const { user, updateUser, getCurrentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [cart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showTrackOrder, setShowTrackOrder] = useState(null);
  const [profileFetched, setProfileFetched] = useState(false);
  const [materialsFetched, setMaterialsFetched] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const isMountedRef = useRef(true);

  // Use supplier store for materials and other supplier-specific data
  const {
    materials,
    loading: materialsLoading,
    error: materialsError,
    fetchMaterials,
    updateProfile,
  } = useSupplierStore();

  // Use order store for orders data
  const {
    orders,
    activeOrders,
    loading: ordersLoading,
    error: ordersError,
    fetchOrders,
    updateOrderStatus,
  } = useOrderStore();

  // Use user data from auth store as the profile data
  const supplierProfile = user;

  // Fetch data only once when component mounts and user is available
  useEffect(() => {
    const initializeData = async () => {
      if (user?.token && isMountedRef.current) {
        try {
          // Fetch materials if not already fetched
          if (!materialsFetched) {
            setMaterialsFetched(true);
            await fetchMaterials();
          }
          
          // Fetch orders
          await fetchOrders();
          
          // Only fetch complete profile if we don't have complete user data and haven't fetched it yet
          if (!user.fullname || !user.phone) {
            if (!profileFetched && isMountedRef.current) {
              setProfileFetched(true);
              const completeProfile = await getCurrentUser();
              if (completeProfile && isMountedRef.current) {
                updateUser(completeProfile);
              }
            }
          }
        } catch (error) {
          console.error("❌ Error initializing data:", error);
          if (isMountedRef.current) {
            setMaterialsFetched(false); // Reset flag on error
            setProfileFetched(false); // Reset profile flag on error
          }
        }
      }
    };

    initializeData();
  }, [user?.token]); // Only depend on token to prevent infinite re-renders

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize edit form with profile data (only fields from backend)
  const [editForm, setEditForm] = useState({
    fullname: supplierProfile?.fullname || "",
    email: supplierProfile?.email || "",
    phone: supplierProfile?.phone || "",
    latitude: supplierProfile?.latitude || null,
    longitude: supplierProfile?.longitude || null,
  });

  // Update edit form when profile data loads
  useEffect(() => {
    if (supplierProfile) {
      setEditForm({
        fullname: supplierProfile.fullname || "",
        email: supplierProfile.email || "",
        phone: supplierProfile.phone || "",
        latitude: supplierProfile.latitude || null,
        longitude: supplierProfile.longitude || null,
      });
    }
  }, [supplierProfile?.fullname, supplierProfile?.email, supplierProfile?.phone, supplierProfile?.latitude, supplierProfile?.longitude]); // Only depend on specific fields that can change

  // Orders data will come from the order store

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "packed":
        return "bg-yellow-100 text-yellow-800";
      case "in_transit":
        return "bg-orange-100 text-orange-800";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800";
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
        return t("supplierProfile.order.status.pending");
      case "confirmed":
        return t("supplierProfile.order.status.confirmed");
      case "packed":
        return t("supplierProfile.order.status.packed");
      case "in_transit":
        return t("supplierProfile.order.status.inTransit");
      case "out_for_delivery":
        return t("supplierProfile.order.status.outForDelivery");
      case "delivered":
        return t("supplierProfile.order.status.delivered");
      case "cancelled":
        return t("supplierProfile.order.status.cancelled");
      default:
        return status;
    }
  };

  const handleEditProfile = () => {
    setEditForm({
      fullname: supplierProfile?.fullname || "",
      email: supplierProfile?.email || "",
      phone: supplierProfile?.phone || "",
      businessName: supplierProfile?.businessName || "",
      businessType: supplierProfile?.businessType || "",
      businessAddress: supplierProfile?.businessAddress || "",
      city: supplierProfile?.city || "",
      state: supplierProfile?.state || "",
      pincode: supplierProfile?.pincode || "",
      latitude: supplierProfile?.latitude || null,
      longitude: supplierProfile?.longitude || null,
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      // Validate form data
      if (!editForm.fullname || !editForm.email) {
        toast.error("Please fill in all required fields (Name and Email)");
        return;
      }
      
      setIsUpdatingProfile(true);
      
      // Update profile via API using the store function
      const response = await updateProfile(editForm);
      
      // Update local user state with the updated profile data
      if (response?.data) {
        const updatedUserData = {
          ...user,
          ...response.data
        };
        updateUser(updatedUserData);
        
        toast.success(t("supplierProfile.profileUpdated") || "Profile updated successfully!");
        setShowEditProfile(false);
      } else {
        throw new Error("Failed to update profile - no data received. Response: " + JSON.stringify(response));
      }
    } catch (error) {
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditProfile(false);
  };

  const handleSaveLocation = async (locationData) => {
    setIsSavingLocation(true);
    try {
      const response = await updateProfile({
        latitude: locationData.latitude,
        longitude: locationData.longitude
      });
      
      if (response?.data) {
        // Update the user data in auth store
        updateUser(response.data);
        toast.success('Location saved successfully!');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location. Please try again.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleCloseTrack = () => {
    setShowTrackOrder(null);
  };

  const handleOrderAction = async (orderId, action) => {
    try {
      let successMessage = "";
      
      // First, get the current order to check its status
      const currentOrder = orders.find(order => order._id === orderId);
      if (!currentOrder) {
        toast.error("Order not found");
        return;
      }
      
      switch (action) {
        case "accept":
          // Use the specific accept endpoint
          await apiService.post(`/order/supplier/${orderId}/accept`);
          successMessage = t("supplierProfile.statusUpdate.acceptedSuccess");
          break;
        case "reject":
          // Use the specific reject endpoint
          const reason = prompt(t("supplierProfile.enterRejectionReason"));
          if (reason && reason.trim()) {
            await apiService.post(`/order/supplier/${orderId}/reject`, { reason: reason.trim() });
            successMessage = t("supplierProfile.statusUpdate.rejectedSuccess");
          } else if (reason !== null) {
            toast.error(t("supplierProfile.rejectionReasonRequired"));
            return;
          } else {
            return; // User cancelled
          }
          break;
        case "prepare":
          // Use the specific prepare endpoint
          await apiService.post(`/order/supplier/${orderId}/prepare`);
          successMessage = t("supplierProfile.statusUpdate.preparingStarted");
          break;
        case "pack":
          // Use the specific pack endpoint
          await apiService.post(`/order/supplier/${orderId}/pack`);
          successMessage = t("supplierProfile.statusUpdate.packedSuccess");
          break;
        case "start-transit":
          // Use the specific transit endpoint
          await apiService.post(`/order/supplier/${orderId}/transit`);
          successMessage = t("supplierProfile.statusUpdate.transitStarted");
          break;
        case "out-delivery":
          // Use the specific delivery endpoint
          await apiService.post(`/order/supplier/${orderId}/delivery`);
          successMessage = t("supplierProfile.statusUpdate.outForDelivery");
          break;
        case "mark-delivered":
          // Use the specific delivered endpoint
          await apiService.post(`/order/supplier/${orderId}/delivered`);
          successMessage = t("supplierProfile.statusUpdate.deliveryComplete");
          break;
        default:
          toast.error("Invalid action");
          return;
      }
      
      // Show success message
      toast.success(successMessage);
      
      // Refresh orders data
      await fetchOrders();
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update order status";
      toast.error("Failed to update order status: " + errorMessage);
    }
  };

  const quickActions = [
    {
      title: t("supplierProfile.editProfile"),
      description: t("supplierProfile.updateProfileInfo"),
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
      title: t("supplierProfile.viewOrders"),
      description: t("supplierProfile.manageIncomingOrders"),
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
      color: "bg-purple-500",
    },
    {
      title: t("supplierProfile.dashboard"),
      description: t("supplierProfile.backToDashboard"),
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
      action: () => (window.location.href = "/dashboard/supplier"),
      color: "bg-orange-500",
    },
  ];

  const filteredOrders = Array.isArray(orders) ? orders.filter((order) => {
    if (activeTab === "orders") return order.status !== "delivered";
    if (activeTab === "history") return order.status === "delivered";
    return true;
  }) : [];

  // Loading state
  if (materialsLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SupplierHeader
          cart={cart}
          showCart={showCart}
          setShowCart={setShowCart}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile and orders...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (materialsError || ordersError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SupplierHeader
          cart={cart}
          showCart={showCart}
          setShowCart={setShowCart}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Data
            </h2>
            <p className="text-gray-600 mb-4">
              {materialsError || ordersError}
            </p>
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
  if (!supplierProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SupplierHeader
          cart={cart}
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

  // Vendor read-only view
  if (user && user.role === "vendor") {
    return (
      <div className="min-h-screen bg-gray-50">
        <SupplierHeader
          cart={cart}
          showCart={showCart}
          setShowCart={setShowCart}
        />
        <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {t("supplierProfile.profile")} 👨‍🌾
            </h2>
            <p className="text-gray-600">
              {t("supplierProfile.supplierInfoForVendor")}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {t("supplierProfile.profile")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {supplierProfile?.fullname && (
                  <p className="text-gray-700 mb-2">
                    <strong>{t("supplierProfile.fullname")}:</strong> {supplierProfile.fullname}
                  </p>
                )}
                {supplierProfile?.email && (
                  <p className="text-gray-700 mb-2">
                    <strong>{t("supplierProfile.email")}:</strong> {supplierProfile.email}
                  </p>
                )}
                {supplierProfile?.phone && (
                  <p className="text-gray-700 mb-2">
                    <strong>{t("supplierProfile.phone")}:</strong> {supplierProfile.phone}
                  </p>
                )}
              </div>
              <div>
                {supplierProfile?.role && (
                  <p className="text-gray-700 mb-2">
                    <strong>{t("supplierProfile.role")}:</strong> <span className="capitalize">{supplierProfile.role}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SupplierHeader
        cart={cart}
        showCart={showCart}
        setShowCart={setShowCart}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {t("supplierProfile.profile")} 👨‍🌾
          </h2>
          <p className="text-gray-600">
            {t("supplierProfile.manageProfileOrders")}
          </p>
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
              {t("supplierProfile.profile")}
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("supplierProfile.activeOrders")} (
              {Array.isArray(orders) ? orders.filter((o) => o.status !== "delivered").length : 0})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("supplierProfile.orderHistory")} (
              {Array.isArray(orders) ? orders.filter((o) => o.status === "delivered").length : 0})
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === "profile" && (
          <>
            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("supplierProfile.quickActions")}
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

            {/* Basic Profile Info */}
            <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t("supplierProfile.basicInfo")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supplierProfile?.fullname && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        {t("supplierProfile.fullname")}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {supplierProfile.fullname}
                      </dd>
                    </div>
                  )}
                  {supplierProfile?.email && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        {t("supplierProfile.email")}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {supplierProfile.email}
                      </dd>
                    </div>
                  )}
                  {supplierProfile?.phone && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        {t("supplierProfile.phone")}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {supplierProfile.phone}
                      </dd>
                    </div>
                  )}
                  {supplierProfile?.role && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        {t("supplierProfile.role")}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 capitalize">
                        {supplierProfile.role}
                      </dd>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {t("supplierProfile.profileDetails")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    {t("supplierProfile.personalInfo")}
                  </h4>
                  <div className="space-y-3">
                    {supplierProfile?.fullname && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t("supplierProfile.fullname")}
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {supplierProfile.fullname}
                        </p>
                      </div>
                    )}
                    {supplierProfile?.email && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t("supplierProfile.email")}
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {supplierProfile.email}
                        </p>
                      </div>
                    )}
                    {supplierProfile?.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t("supplierProfile.phone")}
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {supplierProfile.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    {t("supplierProfile.businessInfo")}
                  </h4>
                  <div className="space-y-3">
                    {supplierProfile?.businessName && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Business Name
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {supplierProfile.businessName}
                        </p>
                      </div>
                    )}
                    {supplierProfile?.businessType && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Business Type
                        </label>
                        <p className="text-sm text-gray-900 mt-1 capitalize">
                          {supplierProfile.businessType}
                        </p>
                      </div>
                    )}
                    {supplierProfile?.businessAddress && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Business Address
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {supplierProfile.businessAddress}
                        </p>
                      </div>
                    )}
                    {(supplierProfile?.city || supplierProfile?.state || supplierProfile?.pincode) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Location
                        </label>
                        <p className="text-sm text-gray-900 mt-1">
                          {[supplierProfile.city, supplierProfile.state, supplierProfile.pincode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleEditProfile}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                >
                  {t("supplierProfile.editProfile")}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t("supplierProfile.editProfile")}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Fields marked with <span className="text-red-500">*</span> are required.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("supplierProfile.fullname")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.fullname}
                      onChange={(e) =>
                        setEditForm({ ...editForm, fullname: e.target.value })
                      }
                      placeholder="Enter your full name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("supplierProfile.email")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      placeholder="Enter your email address"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("supplierProfile.phone")}
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      placeholder="Enter your phone number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      placeholder="Enter your business name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      placeholder="Enter your business address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        placeholder="City"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        placeholder="State"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        placeholder="Pincode"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Location Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Business Location
                    </label>
                    <LocationPicker
                      initialLatitude={supplierProfile?.latitude}
                      initialLongitude={supplierProfile?.longitude}
                      onLocationChange={(location) => {
                        setEditForm({ ...editForm, latitude: location.latitude, longitude: location.longitude });
                      }}
                      onSave={handleSaveLocation}
                      showSaveButton={true}
                      isSaving={isSavingLocation}
                      showMap={true}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isUpdatingProfile}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                        Updating...
                      </>
                    ) : (
                      t("supplierProfile.save")
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdatingProfile}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("supplierProfile.cancel")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {(activeTab === "orders" || activeTab === "history") && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {activeTab === "orders"
                  ? t("supplierProfile.activeOrders")
                  : t("supplierProfile.orderHistory")}
              </h3>
            </div>

            {filteredOrders.map((order) => (
              <div key={order._id || order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {order.vendorId?.fullname || order.vendorName || "Unknown Vendor"}
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
                      ₹{order.totalAmount || 0}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    {t("supplierProfile.orderItems")}
                  </h5>
                  <div className="space-y-2">
                    {Array.isArray(order.items) && order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-900">{item.material?.name || item.name || "Unknown Item"}</span>
                        <span className="text-gray-500">
                          {item.quantity} {item.material?.unit || item.unit || "units"} × ₹{item.material?.pricePerUnit || item.price || 0} = ₹
                          {(item.quantity * (item.material?.pricePerUnit || item.price || 0)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("supplierProfile.orderDate")}
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("supplierProfile.expectedDelivery")}
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString() : "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {order.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleOrderAction(order._id || order.id, "accept")}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                      >
                        {t("supplierProfile.actions.accept")}
                      </button>
                      <button
                        onClick={() => handleOrderAction(order._id || order.id, "reject")}
                        className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200"
                      >
                        {t("supplierProfile.actions.reject")}
                      </button>
                    </>
                  )}
                  {order.status === "accepted" && (
                    <button
                      onClick={() => handleOrderAction(order._id || order.id, "prepare")}
                      className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 transition-colors duration-200"
                    >
                      {t("supplierProfile.actions.startPreparing")}
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button
                      onClick={() => handleOrderAction(order._id || order.id, "pack")}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                    >
                      {t("supplierProfile.actions.markAsPacked")}
                    </button>
                  )}
                  {order.status === "packed" && (
                    <button
                      onClick={() =>
                        handleOrderAction(order._id || order.id, "start-transit")
                      }
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors duration-200"
                    >
                      {t("supplierProfile.actions.startTransit")}
                    </button>
                  )}
                  {order.status === "in_transit" && (
                    <button
                      onClick={() =>
                        handleOrderAction(order._id || order.id, "out-delivery")
                      }
                      className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors duration-200"
                    >
                      {t("supplierProfile.actions.outForDelivery")}
                    </button>
                  )}
                  {order.status === "out_for_delivery" && (
                    <button
                      onClick={() =>
                        handleOrderAction(order._id || order.id, "mark-delivered")
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                    >
                      {t("supplierProfile.actions.markAsDelivered")}
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
                    ? t("supplierProfile.noActiveOrders")
                    : t("supplierProfile.noOrderHistory")}
                </h3>
                <p className="text-gray-500">
                  {activeTab === "orders"
                    ? t("supplierProfile.waitingForOrders")
                    : t("supplierProfile.noCompletedOrders")}
                </p>
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
                    {t("supplierProfile.tracking.trackOrder")} #{showTrackOrder}
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
                          <h4 className="font-medium">
                            {t("supplierProfile.tracking.supplier")}
                          </h4>
                          <p className="text-sm text-blue-700">
                            Fresh Farm Supplies
                          </p>
                          <p className="text-xs text-blue-600">
                            Farm Road, Bangalore Rural
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                    {/* Vendor Location */}
                    <Marker position={[12.9716, 77.5946]}>
                      <Popup>
                        <div>
                          <h4 className="font-medium">
                            {t("supplierProfile.tracking.vendor")}
                          </h4>
                          <p className="text-sm text-purple-700">
                            Fresh Market Vendor
                          </p>
                          <p className="text-xs text-purple-600">
                            123 Market Street, Bangalore
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                    {/* Route Line */}
                    <Polyline
                      positions={[
                        [12.9716, 77.5946], // Supplier
                        [12.9716, 77.5946], // Vendor
                      ]}
                      color="blue"
                      weight={3}
                    />
                  </MapContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">
                      {t("supplierProfile.tracking.supplier")}
                    </h4>
                    <p className="text-sm text-blue-700">Fresh Farm Supplies</p>
                    <p className="text-xs text-blue-600">
                      Farm Road, Bangalore Rural
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">
                      {t("supplierProfile.tracking.currentStatus")}
                    </h4>
                    <p className="text-sm text-green-700">
                      {t("supplierProfile.tracking.confirmed")}
                    </p>
                    <p className="text-xs text-green-600">
                      {t("supplierProfile.order.expected", {
                        date: "2024-01-22",
                      })}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">
                      {t("supplierProfile.tracking.vendor")}
                    </h4>
                    <p className="text-sm text-purple-700">
                      Fresh Market Vendor
                    </p>
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
                    {t("supplierProfile.close")}
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

export default SupplierProfile;
