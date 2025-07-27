import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { api } from '../../services/api';

const OrderStatusManager = ({ order, onStatusUpdate }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');

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

  const handleStatusAction = async (action) => {
    if (action === 'reject' && !reason.trim()) {
      toast.error(t('Please provide a rejection reason'));
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let data = {};

      switch (action) {
        case 'accept':
          endpoint = `/api/order/supplier/${order._id}/accept`;
          data = { note: note.trim() || undefined };
          break;
        case 'reject':
          endpoint = `/api/order/supplier/${order._id}/reject`;
          data = { reason: reason.trim() };
          break;
        case 'prepare':
          endpoint = `/api/order/supplier/${order._id}/prepare`;
          data = { note: note.trim() || undefined };
          break;
        case 'pack':
          endpoint = `/api/order/supplier/${order._id}/pack`;
          data = { note: note.trim() || undefined };
          break;
        default:
          throw new Error('Invalid action');
      }

      const response = await api.post(endpoint, data);
      
      if (response.data.status === 'success') {
        toast.success(response.data.message);
        setNote('');
        setReason('');
        if (onStatusUpdate) {
          onStatusUpdate(response.data.data);
        }
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.message || t('Failed to update order status'));
    } finally {
      setLoading(false);
    }
  };

  const canAccept = order.status === 'pending';
  const canReject = order.status === 'pending';
  const canPrepare = order.status === 'accepted';
  const canPack = order.status === 'preparing';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('Order Status Management')}
        </h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
          <span className="mr-1">{getStatusIcon(order.status)}</span>
          {t(order.status.replace('_', ' '))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Accept Order */}
        {canAccept && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">{t('Accept Order')}</h4>
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('Add a note (optional)')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
              />
              <button
                onClick={() => handleStatusAction('accept')}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('Processing...') : t('Accept Order')}
              </button>
            </div>
          </div>
        )}

        {/* Reject Order */}
        {canReject && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">{t('Reject Order')}</h4>
            <div className="space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('Rejection reason (required)')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="2"
                required
              />
              <button
                onClick={() => handleStatusAction('reject')}
                disabled={loading}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('Processing...') : t('Reject Order')}
              </button>
            </div>
          </div>
        )}

        {/* Start Preparing */}
        {canPrepare && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">{t('Start Preparing')}</h4>
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('Add preparation notes (optional)')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows="2"
              />
              <button
                onClick={() => handleStatusAction('prepare')}
                disabled={loading}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('Processing...') : t('Start Preparing')}
              </button>
            </div>
          </div>
        )}

        {/* Mark as Packed */}
        {canPack && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">{t('Mark as Packed')}</h4>
            <div className="space-y-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('Add packing notes (optional)')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="2"
              />
              <button
                onClick={() => handleStatusAction('pack')}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('Processing...') : t('Mark as Packed')}
              </button>
            </div>
          </div>
        )}

        {/* No actions available */}
        {!canAccept && !canReject && !canPrepare && !canPack && (
          <div className="text-center py-4 text-gray-500">
            {t('No actions available for current order status')}
          </div>
        )}
      </div>

      {/* Order Notes History */}
      {order.notes && order.notes.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">{t('Order Notes')}</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {order.notes.map((note, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{note.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(note.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusManager; 