import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../stores/useCartStore';
import { useOrderStore } from '../../stores/useOrderStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { vendorAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  // Get cart and order data from stores
  const { cartItems, getCartTotalAmount, clearCart } = useCartStore();
  const { createOrder, loading: orderLoading } = useOrderStore();
  
  const [formData, setFormData] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    phoneNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if no cart items
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/dashboard/vendor');
    }
  }, [cartItems, navigate]);

  const subtotal = getCartTotalAmount();
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First, create vendor address from form data
      const vendorAddressData = {
        street: formData.addressLine1,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        phoneNumber: formData.phoneNumber,
        addressLine2: formData.addressLine2
      };

      // Create vendor address
      let vendorAddressId = null;
      try {
        const vendorAddressResponse = await vendorAPI.createAddress(vendorAddressData);
        vendorAddressId = vendorAddressResponse.data._id;
      } catch (error) {
        console.warn('Could not create vendor address:', error);
        // Continue without address for now
      }

      // Create orders for each cart item
      const orderPromises = cartItems.map(async (cartItem) => {
        const orderData = {
          materialId: cartItem.materialId._id,
          quantity: cartItem.quantity,
          supplierId: cartItem.supplierId._id,
          vendorAddressId: vendorAddressId,
          supplierAddressId: undefined // We'll handle addresses later
        };

        return await createOrder(orderData);
      });

      const orders = await Promise.all(orderPromises);

      // Clear cart after successful order
      await clearCart();

      // Navigate to order confirmation
      navigate('/order-confirmation', { 
        state: { 
          orderNumber: `ORD-${Date.now()}`,
          total,
          deliveryAddress: formData,
          orders
        }
      });
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Object.values(formData).every(value => value.trim() !== '');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('vendor.checkout')}</h1>
          <p className="text-gray-600 mt-2">{t('vendor.enterAddress')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('vendor.orderSummary')}</h2>
              
              <div className="space-y-4 mb-6">
                {cartItems && cartItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📦</span>
                      <div>
                        <p className="font-medium text-gray-900">{item.materialId?.name || 'Product'}</p>
                        <p className="text-sm text-gray-500">{item.supplierId?.fullname || 'Supplier'}</p>
                        <p className="text-sm text-gray-500">{item.quantity} {item.materialId?.unit || 'unit'} × ₹{item.materialId?.pricePerUnit || 0}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">₹{(item.materialId?.pricePerUnit || 0) * item.quantity}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-2">
                  <span>{t('vendor.totalAmount')}</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('vendor.deliveryAddress')}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('vendor.addressLine1')} *
                    </label>
                    <input
                      type="text"
                      id="addressLine1"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Street address, P.O. box, company name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('vendor.addressLine2')}
                    </label>
                    <input
                      type="text"
                      id="addressLine2"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('vendor.city')} *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('vendor.state')} *
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('vendor.pincode')} *
                    </label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                      pattern="[0-9]{6}"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="6-digit pincode"
                    />
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('vendor.phoneNumber')} *
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      pattern="[0-9]{10}"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting || orderLoading}
                    className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isSubmitting || orderLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      t('vendor.placeOrder')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 