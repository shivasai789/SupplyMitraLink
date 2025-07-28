import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/useAuthStore';
import { useVendorStore } from '../../stores/useVendorStore';
import { useCartStore } from '../../stores/useCartStore';
import VendorHeader from './VendorHeader';

const SupplierDetailView = () => {
  const { t } = useTranslation();
  const { id: supplierId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Cart state management
  const { cartItems, fetchCartItems } = useCartStore();
  const [showCart, setShowCart] = useState(false);

  // Use vendor store for supplier data
  const {
    loading,
    error,
    getSupplierDetails,
    getSupplierProducts,
    getSupplierPerformance,
  } = useVendorStore();

  // State for supplier data
  const [supplierDetails, setSupplierDetails] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [supplierPerformance, setSupplierPerformance] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch supplier data on component mount
  useEffect(() => {
    if (supplierId) {
      fetchSupplierData();
    }
  }, [supplierId]);

  // Fetch cart items on component mount
  useEffect(() => {
    fetchCartItems().catch(err => {
      console.warn('Failed to fetch cart items:', err.message);
    });
  }, [fetchCartItems]);

  const fetchSupplierData = async () => {
    try {
      // Fetch supplier details
      const details = await getSupplierDetails(supplierId);
      setSupplierDetails(details);

      // Fetch supplier products
      const products = await getSupplierProducts(supplierId);
      setSupplierProducts(products.materials || []);

      // Fetch supplier performance
      const performance = await getSupplierPerformance(supplierId);
      setSupplierPerformance(performance);
    } catch (error) {
      // Handle error silently
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span
        key={i}
        className={`text-2xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in-transit':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader cart={cartItems} showCart={showCart} setShowCart={setShowCart} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading supplier details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader cart={cartItems} showCart={showCart} setShowCart={setShowCart} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Supplier</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/vendor/dashboard')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!supplierDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader cart={cartItems} showCart={showCart} setShowCart={setShowCart} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-gray-500 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Supplier Not Found</h3>
            <p className="text-gray-600 mb-4">The supplier you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/vendor/dashboard')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorHeader cart={cartItems} showCart={showCart} setShowCart={setShowCart} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/vendor/dashboard')}
          className="mb-6 flex items-center text-green-600 hover:text-green-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {/* Supplier Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {supplierDetails.supplier.fullname}
              </h1>
              <div className="flex items-center mb-2">
                {renderStars(Math.round(supplierDetails.performance.averageRating))}
                <span className="ml-2 text-lg text-gray-600">
                  {supplierDetails.performance.averageRating.toFixed(1)} (
                  {supplierDetails.performance.totalReviews} reviews)
                </span>
              </div>
              <p className="text-gray-600">
                Member since {new Date(supplierDetails.supplier.memberSince).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {supplierDetails.performance.totalMaterials}
                  </div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {supplierDetails.performance.totalReviews}
                  </div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Products ({supplierProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reviews ({supplierPerformance?.performance?.totalReviews || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900 mt-1">{supplierDetails.supplier.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900 mt-1">{supplierDetails.supplier.phone}</p>
                  </div>
                </div>
                {supplierDetails.address && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {supplierDetails.address.street}, {supplierDetails.address.city}, {supplierDetails.address.state} - {supplierDetails.address.pincode}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {supplierDetails.performance.averageRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-green-600">Average Rating</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {supplierDetails.performance.totalMaterials}
                    </div>
                    <div className="text-sm text-blue-600">Total Products</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {supplierDetails.performance.totalReviews}
                    </div>
                    <div className="text-sm text-purple-600">Total Reviews</div>
                  </div>
                </div>
              </div>

              {supplierDetails.performance.recentReviews.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Reviews</h3>
                  <div className="space-y-4">
                    {supplierDetails.performance.recentReviews.map((review, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4">
                        <div className="flex items-center mb-2">
                          {renderStars(review.rating)}
                          <span className="ml-2 text-sm text-gray-600">
                            by {review.reviewer}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 text-sm">{review.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Products</h3>
              {supplierProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-4xl mb-4">📦</div>
                  <p className="text-gray-600">No products available from this supplier.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {supplierProducts.map((product) => (
                    <div key={product._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <div className="flex items-center">
                          {renderStars(Math.round(product.averageRating || 0))}
                          <span className="ml-1 text-xs text-gray-600">
                            ({product.totalReviews || 0})
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            ₹{product.pricePerUnit}
                          </div>
                          <div className="text-xs text-gray-500">per {product.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {product.availableQuantity} {product.unit} available
                          </div>
                        </div>
                      </div>
                      <button className="w-full mt-3 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && supplierPerformance && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reviews & Ratings</h3>
              
              {/* Rating Distribution */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Rating Distribution</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = supplierPerformance.performance.ratingDistribution[rating] || 0;
                    const percentage = supplierPerformance.performance.totalReviews > 0 
                      ? (count / supplierPerformance.performance.totalReviews) * 100 
                      : 0;
                    
                    return (
                      <div key={rating} className="flex items-center">
                        <span className="w-8 text-sm text-gray-600">{rating}★</span>
                        <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="w-12 text-sm text-gray-600">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">All Reviews</h4>
                {supplierPerformance.reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-4xl mb-4">⭐</div>
                    <p className="text-gray-600">No reviews yet for this supplier.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {supplierPerformance.reviews.map((review) => (
                      <div key={review._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                              <span className="ml-2 text-sm text-gray-600">
                                by {review.reviewer}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              Product: {review.material}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailView; 