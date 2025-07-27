import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';
import OrderStatusManager from './OrderStatusManager';

const OrderList = ({ userRole = 'vendor' }) => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchOrders();
  }, [userRole]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const endpoint = userRole === 'supplier' ? '/api/order/supplier' : '/api/order/vendor';
      const response = await api.get(endpoint);
      
      if (response.data.status === 'success') {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(t('Failed to fetch orders'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      packed: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-pink-100 text-pink-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      accepted: '✅',
      preparing: '🔧',
      packed: '📦',
      in_transit: '🚚',
      out_for_delivery: '🛵',
      delivered: '🎉',
      cancelled: '❌',
      rejected: '❌'
    };
    return icons[status] || '📋';
  };

  const handleStatusUpdate = (updatedOrder) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
    setShowStatusManager(false);
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const statusFilters = [
    { value: 'all', label: t('All Orders') },
    { value: 'pending', label: t('Pending') },
    { value: 'accepted', label: t('Accepted') },
    { value: 'preparing', label: t('Preparing') },
    { value: 'packed', label: t('Packed') },
    { value: 'in_transit', label: t('In Transit') },
    { value: 'out_for_delivery', label: t('Out for Delivery') },
    { value: 'delivered', label: t('Delivered') },
    { value: 'cancelled', label: t('Cancelled') },
    { value: 'rejected', label: t('Rejected') }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {userRole === 'supplier' ? t('Incoming Orders') : t('My Orders')}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('Manage and track your orders')}
          </p>
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">{t('Filter by status:')}</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusFilters.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('No orders found')}
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? t('You don\'t have any orders yet')
              : t(`No orders with status "${filter}"`)
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {t('Order')} #{order._id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      <span className="mr-1">{getStatusIcon(order.status)}</span>
                      {t(order.status.replace('_', ' '))}
                    </div>
                  </div>

                  {/* Material Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{t('Material')}</h4>
                      <p className="text-gray-700">{order.materialId?.name}</p>
                      <p className="text-sm text-gray-600">
                        {order.quantity} {order.materialId?.unit} @ ₹{order.materialId?.pricePerUnit}/unit
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        {userRole === 'supplier' ? t('Customer') : t('Supplier')}
                      </h4>
                      <p className="text-gray-700">
                        {userRole === 'supplier' 
                          ? order.vendorId?.fullname 
                          : order.supplierId?.fullname
                        }
                      </p>
                      <p className="text-sm text-gray-600">
                        {userRole === 'supplier' 
                          ? order.vendorId?.email 
                          : order.supplierId?.email
                        }
                      </p>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{t('Total Amount')}</span>
                      <span className="text-xl font-bold text-green-600">
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 lg:w-48">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowStatusManager(true);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {t('View Details')}
                  </button>
                  
                  {userRole === 'supplier' && (
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={async () => {
                              setActionLoading(prev => ({ ...prev, [`accept-${order._id}`]: true }));
                              try {
                                const response = await api.post(`/api/order/supplier/${order._id}/accept`);
                                if (response.data.status === 'success') {
                                  toast.success(response.data.message);
                                  fetchOrders(); // Refresh the orders list
                                }
                              } catch (error) {
                                console.error('Error accepting order:', error);
                                toast.error(error.response?.data?.message || t('Failed to accept order'));
                              } finally {
                                setActionLoading(prev => ({ ...prev, [`accept-${order._id}`]: false }));
                              }
                            }}
                            disabled={actionLoading[`accept-${order._id}`]}
                            className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[`accept-${order._id}`] ? t('Processing...') : t('Accept')}
                          </button>
                          <button
                            onClick={async () => {
                              const reason = prompt(t('Please provide a rejection reason:'));
                              if (reason && reason.trim()) {
                                setActionLoading(prev => ({ ...prev, [`reject-${order._id}`]: true }));
                                try {
                                  const response = await api.post(`/api/order/supplier/${order._id}/reject`, {
                                    reason: reason.trim()
                                  });
                                  if (response.data.status === 'success') {
                                    toast.success(response.data.message);
                                    fetchOrders(); // Refresh the orders list
                                  }
                                } catch (error) {
                                  console.error('Error rejecting order:', error);
                                  toast.error(error.response?.data?.message || t('Failed to reject order'));
                                } finally {
                                  setActionLoading(prev => ({ ...prev, [`reject-${order._id}`]: false }));
                                }
                              } else if (reason !== null) {
                                toast.error(t('Rejection reason is required'));
                              }
                            }}
                            disabled={actionLoading[`reject-${order._id}`]}
                            className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading[`reject-${order._id}`] ? t('Processing...') : t('Reject')}
                          </button>
                        </>
                      )}
                      
                      {order.status === 'accepted' && (
                        <button
                          onClick={async () => {
                            setActionLoading(prev => ({ ...prev, [`prepare-${order._id}`]: true }));
                            try {
                              const response = await api.post(`/api/order/supplier/${order._id}/prepare`);
                              if (response.data.status === 'success') {
                                toast.success(response.data.message);
                                fetchOrders(); // Refresh the orders list
                              }
                            } catch (error) {
                              console.error('Error starting preparation:', error);
                              toast.error(error.response?.data?.message || t('Failed to start preparation'));
                            } finally {
                              setActionLoading(prev => ({ ...prev, [`prepare-${order._id}`]: false }));
                            }
                          }}
                          disabled={actionLoading[`prepare-${order._id}`]}
                          className="w-full bg-orange-600 text-white py-2 px-3 rounded-md hover:bg-orange-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[`prepare-${order._id}`] ? t('Processing...') : t('Start Preparing')}
                        </button>
                      )}
                      
                      {order.status === 'preparing' && (
                        <button
                          onClick={async () => {
                            setActionLoading(prev => ({ ...prev, [`pack-${order._id}`]: true }));
                            try {
                              const response = await api.post(`/api/order/supplier/${order._id}/pack`);
                              if (response.data.status === 'success') {
                                toast.success(response.data.message);
                                fetchOrders(); // Refresh the orders list
                              }
                            } catch (error) {
                              console.error('Error marking as packed:', error);
                              toast.error(error.response?.data?.message || t('Failed to mark as packed'));
                            } finally {
                              setActionLoading(prev => ({ ...prev, [`pack-${order._id}`]: false }));
                            }
                          }}
                          disabled={actionLoading[`pack-${order._id}`]}
                          className="w-full bg-purple-600 text-white py-2 px-3 rounded-md hover:bg-purple-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading[`pack-${order._id}`] ? t('Processing...') : t('Mark as Packed')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Manager Modal */}
      {showStatusManager && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('Order Details')} #{selectedOrder._id.slice(-8)}
                </h3>
                <button
                  onClick={() => {
                    setShowStatusManager(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {userRole === 'supplier' && (
                <OrderStatusManager 
                  order={selectedOrder} 
                  onStatusUpdate={handleStatusUpdate}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList; 