import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../hooks/useLocation';
import { useOrderStore } from '../../stores/useOrderStore';

import { toast } from 'react-hot-toast';
import Map from '../common/Map';
import Loader from '../common/Loader';

const SupplierMap = () => {
  const navigate = useNavigate();
  const { location, permissionStatus, requestLocation, refreshLocationFromProfile, saveLocationToStorage, calculateDistance, formatDistance, loading, error } = useLocation();
  const { orders, fetchSupplierOrders, loading: ordersLoading } = useOrderStore();

  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderOrigins, setOrderOrigins] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Debug: Log orders when they change
  useEffect(() => {
    // Orders, filter status, or order origins updated
  }, [orders, filterStatus, orderOrigins]);

  useEffect(() => {
    loadOrders();
  }, []); // Empty dependency array - only run once on mount



  useEffect(() => {
    if (location && location.latitude && location.longitude) {
      setMapCenter(location);
      calculateOrderOrigins();
    } else if (permissionStatus === 'prompt') {
      setShowLocationPrompt(true);
    }
  }, [location, permissionStatus]); // Remove orders dependency to prevent infinite loop

  // Separate effect to recalculate order origins when orders change
  useEffect(() => {
    if (location && location.latitude && location.longitude && orders.length > 0) {
      calculateOrderOrigins();
    }
  }, [orders]); // Only depend on orders for recalculation

  const loadOrders = async () => {
    try {
      await fetchSupplierOrders();
    } catch (error) {
      toast.error('Failed to load orders');
    }
  };

  const calculateOrderOrigins = () => {
    if (!orders.length) {
      setOrderOrigins([]);
      return;
    }

    // If no location, still show orders but without distance calculation
    if (!location || !location.latitude || !location.longitude) {

      const ordersWithoutDistance = orders
        .filter(order => {
          if (filterStatus !== 'all' && order.status !== filterStatus) {
            return false;
          }
          return true; // Show all orders regardless of location
        })
        .map(order => ({
          ...order,
          distance: null,
          formattedDistance: 'Location not available'
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setOrderOrigins(ordersWithoutDistance);
      return;
    }

    const ordersWithDistance = orders
      .filter(order => {
        // Filter by status if not 'all'
        if (filterStatus !== 'all' && order.status !== filterStatus) {
          return false;
        }
        
        // Check if order has vendor location data
        const hasVendorLocation = order.vendorId && order.vendorId.latitude && order.vendorId.longitude;

        // For now, show all orders regardless of location data
        // TODO: Later we can filter by location when needed
        return true;
      })
      .map(order => {
        // Check if vendor location is available
        const hasVendorLocation = order.vendorId && order.vendorId.latitude && order.vendorId.longitude;
        
        let distance = null;
        let formattedDistance = 'Location not available';
        
        if (hasVendorLocation && location && location.latitude && location.longitude) {
          distance = calculateDistance(
            location.latitude,
            location.longitude,
            order.vendorId.latitude,
            order.vendorId.longitude
          );
          formattedDistance = formatDistance(distance);
        }
        
        const orderWithDistance = {
          ...order,
          distance,
          formattedDistance
        };
        
        return orderWithDistance;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


    setOrderOrigins(ordersWithDistance);
  };

  const handleLocationRequest = async () => {
    const newLocation = await requestLocation();
    if (newLocation) {
      setShowLocationPrompt(false);
      
      // Save location coordinates to localStorage
      const locationData = {
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        permissionStatus: 'granted'
      };
      

      
      // Save to localStorage
      saveLocationToStorage(locationData);
      
      // Refresh location from localStorage
      refreshLocationFromProfile();
      
      toast.success('Location access granted and saved!');
    }
  };

  const handleOrderClick = (order) => {

    setSelectedOrder(order);
  };

  const handleViewOrderDetails = (orderId) => {

    navigate(`/orders/${orderId}`);
  };

  const handleClosePopup = () => {
    setSelectedOrder(null);
  };

  const handleLocationSharingToggle = async (shareLocation) => {
    if (!location || !location.latitude || !location.longitude) {
      toast.error('Location not available');
      return;
    }

    try {
      if (shareLocation) {
        // Update supplier profile with location data
        const locationData = {
          latitude: location.latitude,
          longitude: location.longitude,
          locationShared: true
        };
        
        // Update supplier profile with location data
        const response = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')).state.token : ''}`
          },
          body: JSON.stringify(locationData)
        });
        
        if (response.ok) {
          toast.success('Location shared with vendors! You will now appear on their map.');
        } else {
          throw new Error('Failed to update profile');
        }
      } else {
        // Remove location from supplier profile
        const locationData = {
          latitude: null,
          longitude: null,
          locationShared: false
        };
        
        // Remove location from supplier profile
        const response = await fetch('/api/user/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')).state.token : ''}`
          },
          body: JSON.stringify(locationData)
        });
        
        if (response.ok) {
          toast.success('Location sharing disabled. You will no longer appear on vendor maps.');
        } else {
          throw new Error('Failed to update profile');
        }
      }
    } catch (error) {
      toast.error('Failed to update location sharing settings');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'packed': return 'bg-orange-100 text-orange-800';
      case 'in_transit': return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'preparing': return '⚙️';
      case 'packed': return '📦';
      case 'in_transit': return '🚚';
      case 'out_for_delivery': return '🚛';
      case 'delivered': return '🎉';
      case 'cancelled': return '❌';
      case 'rejected': return '🚫';
      default: return '📋';
    }
  };

  const renderLocationPrompt = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Enable Location Access</h3>
        <p className="text-gray-600 mb-4">
          Allow location access to see where your orders are coming from and optimize delivery routes
        </p>
        <div className="space-y-3">
          <button
            onClick={handleLocationRequest}
            className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Enable Location (Private)
          </button>
          <p className="text-xs text-gray-500">
            Location will be stored locally and used for distance calculations only
          </p>
        </div>
      </div>
    </div>
  );

  const renderOrderPopup = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Order #{selectedOrder._id.slice(-8)}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Status */}
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)} {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {selectedOrder.vendorId?.fullname || 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {selectedOrder.vendorId?.phone || 'N/A'}
                  </div>
                  <div className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>
                      {selectedOrder.vendorId?.businessAddress || 'N/A'}, {selectedOrder.vendorId?.city || 'N/A'}
                    </span>
                  </div>
                  {selectedOrder.formattedDistance && (
                    <div className="flex items-center text-green-600 font-medium">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {selectedOrder.formattedDistance} away
                    </div>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-medium">#{selectedOrder._id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Date:</span>
                    <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Time:</span>
                    <span className="font-medium">{new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {selectedOrder.updatedAt && (
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-medium">{new Date(selectedOrder.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{selectedOrder.materialId?.name || 'Product'}</p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.quantity || 0} {selectedOrder.materialId?.unit || 'unit'} × ₹{selectedOrder.materialId?.pricePerUnit || 0}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{selectedOrder.totalAmount || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Delivery Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Delivery Status:</span>
                    <span className={`font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Address:</span>
                    <span className="font-medium">Customer Location</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Delivery:</span>
                    <span className="font-medium">
                      {selectedOrder.status === 'pending' ? 'To be confirmed' : 
                       selectedOrder.status === 'accepted' ? '2-3 business days' :
                       selectedOrder.status === 'preparing' ? '1-2 business days' :
                       selectedOrder.status === 'packed' ? 'Ready for pickup' :
                       selectedOrder.status === 'in_transit' ? '1-2 business days' :
                       selectedOrder.status === 'out_for_delivery' ? 'Today' :
                       selectedOrder.status === 'delivered' ? 'Delivered' : 'TBD'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Payment Status:</span>
                    <span className="font-medium text-green-600">Paid</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-medium">Online/Cash on Delivery</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">₹{selectedOrder.totalAmount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span className="font-medium">₹50</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold text-gray-900">
                    <span>Total Amount:</span>
                    <span className="text-lg text-green-600">₹{(selectedOrder.totalAmount || 0) + 50}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  handleViewOrderDetails(selectedOrder._id);
                  handleClosePopup();
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Full Details
              </button>
              <button
                onClick={handleClosePopup}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOrderList = () => (
    <div className="bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Order Origins</h3>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="packed">Packed</option>
          <option value="in_transit">In Transit</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Loading State */}
      {ordersLoading && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      )}

      {/* No Orders State */}
      {!ordersLoading && orders.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">No orders found</p>
          <p className="text-sm text-gray-400">Orders will appear here once customers place them</p>
        </div>
      )}

      {/* Filtered Orders Empty State */}
      {!ordersLoading && orders.length > 0 && orderOrigins.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">No orders match the current filter</p>
          <p className="text-sm text-gray-400">Try changing the status filter to see more orders</p>
        </div>
      )}

      {/* Orders List */}
      {!ordersLoading && orderOrigins.length > 0 && (
        <div className="space-y-3">
          {orderOrigins.map((order) => (
            <div
              key={order._id}
              onClick={() => handleOrderClick(order)}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">Order #{order._id.slice(-8)}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">₹{order.totalAmount || 0}</p>
                  {order.formattedDistance && (
                    <p className="text-xs text-gray-500">{order.formattedDistance}</p>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-gray-50 rounded p-3 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium text-gray-900">{order.vendorId?.fullname || 'Customer'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{order.vendorId?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600 mt-1">
                  <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="flex-1">
                    {order.vendorId?.businessAddress || 'N/A'}, {order.vendorId?.city || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Order Items Summary */}
              <div className="text-sm text-gray-600">
                <div className="flex justify-between items-center mb-1">
                  <span>Material:</span>
                  <span className="font-medium text-gray-900">
                    {order.materialId?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Quantity:</span>
                  <span className="font-medium">
                    {order.quantity || 0} {order.materialId?.unit || 'units'}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-400 text-center">
                Click to view full details
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Early returns for loading and error states
  if (loading) return <Loader message="Getting your location..." />;
  if (ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader text="Loading orders..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Map</h1>
              <p className="text-gray-600">View your orders and their origins on the map</p>
            </div>
            
            {/* Location Sharing Toggle */}
            {location && location.latitude && location.longitude && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="shareLocation"
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      onChange={(e) => handleLocationSharingToggle(e.target.checked)}
                    />
                    <label htmlFor="shareLocation" className="ml-2 text-sm font-medium text-gray-700">
                      Share my location with vendors
                    </label>
                  </div>
                  <div className="text-xs text-gray-500">
                    This will help vendors find you on their map
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Statistics */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-lg font-semibold text-gray-900">{orders.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">On Map</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {orderOrigins.filter(order => order.distance !== null).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {orders.filter(order => order.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivered</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {orders.filter(order => order.status === 'delivered').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Map View</h2>
              <div className="relative">
                {mapCenter ? (
                  (() => {
                    const markers = orderOrigins.map(order => ({
                      ...order.vendorId,
                      name: order.vendorId?.fullname || 'Unknown Customer',
                      orderId: order._id,
                      orderStatus: order.status,
                      type: 'order'
                    }));
                    
                    
                    
                    return (
                      <Map
                        latitude={mapCenter.latitude}
                        longitude={mapCenter.longitude}
                        height="500px"
                        showUserLocation={true}
                        markers={markers}
                        onMarkerClick={handleOrderClick}
                        zoom={12}
                      />
                    );
                  })()
                ) : (
                  <>
                    {/* Default map without location */}
                    <div className="h-[500px] bg-gray-100 rounded-lg">
                      <iframe
                        src="https://www.openstreetmap.org/export/embed.html?bbox=72.8,18.9,73.2,19.2&layer=mapnik&marker=19.076,72.8777"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight="0"
                        marginWidth="0"
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    
                    {/* Glass overlay for location permission */}
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md mx-4">
                        <div className="text-center">
                          {/* Location icon with gradient */}
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Enable Location Access
                          </h3>
                          
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            Allow location access to see your order origins on the map and optimize your delivery routes with real-time distance calculations.
                          </p>
                          
                          {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                              <p className="text-red-600 text-sm">{error}</p>
                            </div>
                          )}
                          
                          <button
                            onClick={handleLocationRequest}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Allow Location Access
                            </div>
                          </button>
                          
                          <p className="text-xs text-gray-500 mt-4">
                            Your location is only used to show nearby orders and calculate distances
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Order List Section */}
          <div className="lg:col-span-1">
            {renderOrderList()}
          </div>
        </div>

        {/* Order Popup */}
        {renderOrderPopup()}
      </div>
    </div>
  );
};

export default SupplierMap; 