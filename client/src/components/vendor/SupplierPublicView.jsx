import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useVendorStore } from "../../stores/useVendorStore";
import VendorHeader from "./VendorHeader";
import QuantityModal from "../common/QuantityModal";
import Toast from "../common/Toast";

const SupplierPublicView = () => {
  const { t } = useTranslation();
  const { id: supplierId } = useParams();
  const navigate = useNavigate();
  
  // State for UI
  const [sort, setSort] = useState("priceLowHigh");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const pageSize = 4;

  // State for data
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use vendor store for API calls
  const {
    getSupplierDetails,
    getSupplierProducts,
    getSupplierPerformance,
  } = useVendorStore();

  // Fetch supplier data on component mount
  useEffect(() => {
    if (supplierId) {
      fetchSupplierData();
    }
  }, [supplierId]);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching supplier data for:', supplierId);
      
      // Fetch supplier details, products, and performance in parallel
      const [detailsResult, productsResult, performanceResult] = await Promise.allSettled([
        getSupplierDetails(supplierId),
        getSupplierProducts(supplierId),
        getSupplierPerformance(supplierId)
      ]);

      // Handle supplier details
      if (detailsResult.status === 'fulfilled') {
        console.log('✅ Supplier details:', detailsResult.value);
        setSupplier(detailsResult.value.supplier || detailsResult.value);
      } else {
        console.error('❌ Failed to fetch supplier details:', detailsResult.reason);
      }

      // Handle supplier products
      if (productsResult.status === 'fulfilled') {
        console.log('✅ Supplier products:', productsResult.value);
        const productsData = productsResult.value.materials || productsResult.value || [];
        setProducts(productsData);
      } else {
        console.error('❌ Failed to fetch supplier products:', productsResult.reason);
      }

      // Handle supplier performance
      if (performanceResult.status === 'fulfilled') {
        console.log('✅ Supplier performance:', performanceResult.value);
        setPerformance(performanceResult.value);
      } else {
        console.error('❌ Failed to fetch supplier performance:', performanceResult.reason);
      }

    } catch (error) {
      console.error('❌ Error fetching supplier data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sorting/filtering logic
  const filteredProducts = [...products]
    .sort((a, b) => {
      if (sort === "priceLowHigh") return (a.pricePerUnit || a.price) - (b.pricePerUnit || b.price);
      if (sort === "priceHighLow") return (b.pricePerUnit || b.price) - (a.pricePerUnit || a.price);
      return 0;
    })
    .filter((p) => {
      if (filter === "all") return true;
      if (filter === "in-stock") return (p.availableQuantity || p.quantity || 0) > 0;
      if (filter === "low-stock") return (p.availableQuantity || p.quantity || 0) > 0 && (p.availableQuantity || p.quantity || 0) <= 10;
      if (filter === "out-of-stock") return (p.availableQuantity || p.quantity || 0) === 0;
      return true;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Badge color helper
  const badgeColor = (score) => {
    if (score >= 4.5) return "bg-green-100 text-green-800";
    if (score >= 3.5) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Progress bar color
  const progressColor = (score) => {
    if (score >= 4.5) return "bg-green-500";
    if (score >= 3.5) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Star rating rendering
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <svg
            key={i}
            className="w-6 h-6 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
          </svg>
        ))}
        {halfStar && (
          <svg
            className="w-6 h-6 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <path
              fill="url(#half)"
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z"
            />
          </svg>
        )}
        <span className="ml-2 text-lg font-bold text-gray-900">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  // Cart functions
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: quantity }];
    });
  };

  const handleShowQuantityModal = (product) => {
    setSelectedProduct(product);
    setShowQuantityModal(true);
  };

  const handleQuantityConfirm = (quantity) => {
    if (selectedProduct) {
      addToCart(selectedProduct, quantity);
      setToast({
        show: true,
        message: `Added ${quantity} ${selectedProduct.name} to cart`,
        type: 'success'
      });
    }
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  };

  const handleCheckout = () => {
    navigate("/checkout", { state: { cart } });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader cart={cart} showCart={showCart} setShowCart={setShowCart} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading supplier details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader cart={cart} showCart={showCart} setShowCart={setShowCart} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Supplier</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchSupplierData}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No supplier data
  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader cart={cart} showCart={showCart} setShowCart={setShowCart} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-gray-500 text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Supplier Not Found</h2>
              <p className="text-gray-600 mb-4">The supplier you're looking for doesn't exist or has been removed.</p>
              <button
                onClick={() => navigate('/dashboard/vendor')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorHeader cart={cart} showCart={showCart} setShowCart={setShowCart} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  to="/dashboard/vendor"
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-green-600"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  Dashboard
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {supplier.fullname || supplier.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section - Supplier Details */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {supplier.fullname || supplier.name}
              </h1>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                {supplier.address && (
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {supplier.address}
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {supplier.email}
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              {performance && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Performance Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Materials:</span>
                      <span className="font-semibold">{performance.totalMaterials || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Reviews:</span>
                      <span className="font-semibold">{performance.totalReviews || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Rating:</span>
                      <span className="font-semibold">{performance.averageRating || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ratings Card */}
              {performance && performance.averageRating && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                    Ratings & Performance
                  </h3>
                  <div className="flex flex-col items-center mb-4">
                    {renderStars(performance.averageRating)}
                  </div>
                  {performance.ratingDistribution && (
                    <div className="space-y-2">
                      {Object.entries(performance.ratingDistribution).reverse().map(([rating, count]) => (
                        <div key={rating} className="flex items-center">
                          <span className="text-xs text-gray-600 w-8">{rating}★</span>
                          <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{ 
                                width: `${performance.totalReviews > 0 ? (count / performance.totalReviews) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 w-8">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* View Details Button */}
              <div className="mt-6">
                <button
                  onClick={() => navigate(`/supplier/${supplierId}/detail`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Detailed Profile
                </button>
              </div>
            </div>
          </div>

          {/* Right Section - Products */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Available Products ({products.length})
                </h2>
                <div className="flex gap-2">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    <option value="priceLowHigh">Price: Low to High</option>
                    <option value="priceHighLow">Price: High to Low</option>
                  </select>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              {paginatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {paginatedProducts.map((product) => (
                    <div
                      key={product._id || product.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-800">
                          {product.name}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            (product.availableQuantity || product.quantity || 0) > 10
                              ? "bg-green-100 text-green-800"
                              : (product.availableQuantity || product.quantity || 0) > 0
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {(product.availableQuantity || product.quantity || 0) > 10
                            ? "in stock"
                            : (product.availableQuantity || product.quantity || 0) > 0
                            ? "low stock"
                            : "out of stock"}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 mb-3">
                        ₹{product.pricePerUnit || product.price} / {product.unit}
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="text-sm text-gray-500 mb-3">
                        Available: {product.availableQuantity || product.quantity || 0} {product.unit}
                      </div>
                      <button
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleShowQuantityModal(product)}
                        disabled={(product.availableQuantity || product.quantity || 0) === 0}
                      >
                        {(product.availableQuantity || product.quantity || 0) === 0 
                          ? "Out of Stock" 
                          : "Add to Cart"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Products Available
                  </h3>
                  <p className="text-gray-500">
                    This supplier doesn't have any products available at the moment.
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quantity Modal */}
      <QuantityModal
        isOpen={showQuantityModal}
        onClose={() => setShowQuantityModal(false)}
        onConfirm={handleQuantityConfirm}
        product={selectedProduct}
        maxQuantity={selectedProduct?.availableQuantity || selectedProduct?.quantity || 999}
        title="Add to Cart"
      />

      {/* Toast Notification */}
      <Toast
        isVisible={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default SupplierPublicView;
