import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const OrderConfirmation = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { orderNumber, total, deliveryAddress } = location.state || {
    orderNumber: 'ORD-123456',
    total: 350,
    deliveryAddress: {
      addressLine1: '123 Main Street',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      phoneNumber: '9876543210'
    }
  };

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Success Header */}
          <div className="bg-green-50 px-6 py-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('vendor.orderPlacedSuccessfully')}
            </h1>
            <p className="text-gray-600">
              {t('vendor.orderNumber')}: <span className="font-semibold">{orderNumber}</span>
            </p>
          </div>

          {/* Order Details */}
          <div className="px-6 py-6">
            <div className="space-y-6">
              {/* Order Summary */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('vendor.orderSummary')}</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{total - 50}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">₹50</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-lg font-semibold text-gray-900">{t('vendor.totalAmount')}</span>
                    <span className="text-lg font-bold text-blue-600">₹{total}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('vendor.deliveryAddress')}</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 mb-1">{deliveryAddress.addressLine1}</p>
                  {deliveryAddress.addressLine2 && (
                    <p className="text-gray-900 mb-1">{deliveryAddress.addressLine2}</p>
                  )}
                  <p className="text-gray-900 mb-1">
                    {deliveryAddress.city}, {deliveryAddress.state} {deliveryAddress.pincode}
                  </p>
                  <p className="text-gray-600">Phone: {deliveryAddress.phoneNumber}</p>
                </div>
              </div>

              {/* Estimated Delivery */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('vendor.estimatedDelivery')}</h2>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-blue-900 font-medium">
                      {estimatedDelivery.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">1</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-900">Your order has been sent to the suppliers</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">2</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-900">Suppliers will confirm and prepare your order</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-medium">3</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-900">You'll receive updates on delivery status</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/dashboard/vendor')}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                {t('vendor.trackOrder')}
              </button>
              <button
                onClick={() => navigate('/dashboard/vendor')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-200 transition-colors font-medium"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation; 