import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useTranslation } from "react-i18next";
import VendorHeader from "./VendorHeader";
import VendorMap from "./VendorMap";
import { useVendorStore } from "../../stores/useVendorStore";
import { useOrderStore } from "../../stores/useOrderStore";
import { useCartStore } from "../../stores/useCartStore";
import QuantityModal from "../common/QuantityModal";
import Toast from "../common/Toast";

// --- SupplierProfilePreview Component ---
const SupplierProfilePreview = ({ supplier, products, onClose }) => {
  const [sort, setSort] = useState("priceLowHigh");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 4;

  // Sorting/filtering logic
  const filteredProducts = [...products]
    .sort((a, b) => {
      if (sort === "priceLowHigh") return a.price - b.price;
      if (sort === "priceHighLow") return b.price - a.price;
      return 0;
    })
    .filter((p) => (filter === "all" ? true : p.status === filter));

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

  // Reset page on sort/filter change
  React.useEffect(() => {
    setPage(1);
  }, [sort, filter, products]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity animate-fadeIn">
      <div className="bg-white rounded-lg shadow-2xl flex w-full max-w-5xl h-[80vh] overflow-hidden animate-slideUp">
        {/* Left Sticky Section */}
        <div className="w-80 bg-gray-50 border-r p-6 flex flex-col sticky left-0 top-0 h-full">
          <h2 className="text-2xl font-bold mb-2">{supplier.name}</h2>
          <div className="mb-2 text-gray-600">{supplier.address}</div>
          <div className="mb-2 text-sm">📞 {supplier.phone}</div>
          <div className="mb-2 text-sm">✉️ {supplier.email}</div>
          <div className="mb-2 text-sm">📍 {supplier.distance} km away</div>
          {/* Modern Ratings Card */}
          <div className="bg-white rounded-xl shadow p-4 mt-4 mb-2 flex flex-col items-center">
            {renderStars(supplier.rating)}
            <div className="w-full mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">Quality</span>
                <span
                  className={`font-semibold ${badgeColor(supplier.quality)}`}
                >
                  {supplier.quality}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                <div
                  className={`h-2 rounded-full ${progressColor(
                    supplier.quality
                  )}`}
                  style={{ width: `${(supplier.quality / 5) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">Reliability</span>
                <span
                  className={`font-semibold ${badgeColor(
                    supplier.reliability
                  )}`}
                >
                  {supplier.reliability}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-2">
                <div
                  className={`h-2 rounded-full ${progressColor(
                    supplier.reliability
                  )}`}
                  style={{ width: `${(supplier.reliability / 5) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">Speed</span>
                <span className={`font-semibold ${badgeColor(supplier.speed)}`}>
                  {supplier.speed}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className={`h-2 rounded-full ${progressColor(
                    supplier.speed
                  )}`}
                  style={{ width: `${(supplier.speed / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded transition"
          >
            Close
          </button>
        </div>
        {/* Right Scrollable Section */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Products</h3>
            <div className="flex gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="priceLowHigh">Price: Low to High</option>
                <option value="priceHighLow">Price: High to Low</option>
              </select>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedProducts.map((product) => (
              <div
                key={product._id || product.id}
                className="bg-white border rounded-lg p-4 flex flex-col shadow hover:shadow-md transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">
                    {product.name}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${badgeColor(
                      (product.availableQuantity || 0) > 10
                        ? 5
                        : (product.availableQuantity || 0) > 0
                        ? 3
                        : 1
                    )}`}
                  >
                    {(product.availableQuantity || 0) > 10
                      ? "in stock"
                      : (product.availableQuantity || 0) > 0
                      ? "low stock"
                      : "out of stock"}
                  </span>
                </div>
                <div className="mb-1 text-gray-600">
                  ₹{product.pricePerUnit || product.price} / {product.unit}
                </div>
                <button className="mt-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition">
                  Order Now
                </button>
              </div>
            ))}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// --- End SupplierProfilePreview ---

// --- Floating Checkout Component ---
const FloatingCheckout = ({ cart, onCheckout, onRemoveItem }) => {
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = cart.reduce(
    (sum, item) => {
      const itemPrice = item.materialId?.pricePerUnit || 0;
      const itemQuantity = item.quantity || 0;
      return sum + (itemPrice * itemQuantity);
    },
    0
  );

  if (cart.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                {totalItems}
              </div>
              <span className="text-gray-700 font-medium">Items in cart</span>
            </div>
            <div className="text-gray-600">
              {cart.map((item) => (
                <span
                  key={item._id}
                  className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm mr-2 mb-1"
                >
                  {item.materialId?.name || 'Unknown Item'} x{item.quantity}
                  <button
                    onClick={() => onRemoveItem(item._id)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xl font-bold text-gray-900">
                ₹{totalPrice.toFixed(2)}
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                />
              </svg>
              <span>Checkout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- End Floating Checkout ---

const VendorDashboard = () => {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCart, setShowCart] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  // Use vendor store
  const {
    profile,
    materials,
    loading,
    error,
    fetchProfile,
    fetchAllMaterials,

  } = useVendorStore();

  // Use order store for vendor orders
  const {
    orders,
    fetchVendorOrders,
    fetchVendorOrderStats,
  } = useOrderStore();

  // Use cart store for cart operations
  const {
    cartItems,
    addToCart: addToCartStore,
    removeFromCart: removeFromCartStore,
    fetchCartItems,
  } = useCartStore();

  // Fetch data on component mount
  useEffect(() => {
    const { token } = useAuthStore.getState();
    if (!token) {
      console.log('❌ No user token, skipping initialization');
      return; // Let route protection handle redirect
    }

    console.log('🔍 Starting initialization with token:', token ? 'present' : 'missing');

    // Fetch initial data
    const fetchInitialData = async () => {
      console.log('🚀 Starting to fetch initial data...');
      setIsInitializing(true);
      
      try {
        // Fetch profile and materials in parallel
        const [profileResult, materialsResult] = await Promise.allSettled([
          fetchProfile(),
          fetchAllMaterials()
        ]);

        console.log('✅ Profile fetch result:', profileResult.status);
        console.log('✅ Materials fetch result:', materialsResult.status);

        // Fetch orders and cart in background (non-blocking)
        Promise.allSettled([
          fetchVendorOrders(),
          fetchCartItems()
        ]).then(([ordersResult, cartResult]) => {
          console.log('✅ Orders fetch result:', ordersResult.status);
          console.log('✅ Cart fetch result:', cartResult.status);
        });
        
      } catch (error) {
        console.error('❌ Error in fetchInitialData:', error);
        // Don't logout for general errors, only auth errors
        if (error.message && (
          error.message.includes('not authorized') || 
          error.message.includes('unauthorized') ||
          error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('token')
        )) {
          console.log('🔐 Auth error detected, logging out...');
          logout();
        }
      } finally {
        console.log('🏁 Setting isInitializing to false');
        setIsInitializing(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout reached, forcing dashboard to load');
      setIsInitializing(false);
    }, 5000); // 5 second timeout

    fetchInitialData();

    // Cleanup timeout
    return () => clearTimeout(timeoutId);
  }, [fetchProfile, fetchAllMaterials, logout]);



  // Load materials when products tab is active
  useEffect(() => {
    if (activeTab === "products" && materials.length === 0 && !loading) {
      fetchAllMaterials().catch(err => {
        console.warn('⚠️ Materials fetch failed:', err.message);
      });
    }
  }, [activeTab, materials.length, fetchAllMaterials, loading]);

  // Search functionality
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // For now, filter from existing materials
      // In a real app, you might want to make an API call for search
      const filtered = materials.filter(material =>
        material.name?.toLowerCase().includes(query.toLowerCase()) ||
        material.description?.toLowerCase().includes(query.toLowerCase()) ||
        material.category?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, materials]);

  // Filter products based on search and category
  const filteredProducts = (searchQuery.trim() ? searchResults : (materials || [])).filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesCategory;
  });

  // Debug log for materials
  useEffect(() => {
    // Removed debug logs for cleaner console
  }, [materials]);

  // Calculate dashboard stats from real data
  const totalSpent = orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter(order => order.status === 'delivered').length || 0;
  const pendingOrders = orders?.filter(order => ['pending', 'confirmed', 'packed', 'in_transit', 'out_for_delivery'].includes(order.status)).length || 0;
  const suppliersConnected = orders ? [...new Set(orders.map(order => order.supplierId?.toString()))].length : 0;

  // Dashboard stats from real data
  const dashboardStats = [
    {
      title: t("vendorDashboard.totalPurchases"),
      value: `₹${totalSpent.toLocaleString()}`,
      change: "+15.2%",
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
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
    {
      title: t("vendorDashboard.itemsPurchased"),
      value: totalOrders.toString(),
      change: "+8.7%",
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
      title: t("vendorDashboard.suppliersConnected"),
      value: suppliersConnected.toString(),
      change: "+2",
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      title: t("vendorDashboard.monthlySpending"),
      value: `₹${(totalSpent / Math.max(1, totalOrders)).toLocaleString()}`,
      change: "+12.3%",
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  // Categories from supplier item form
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Vegetables": return "🥬";
      case "Fruits": return "🍎";
      case "Dairy": return "🥛";
      case "Grains": return "🌾";
      case "Others": return "📦";
      default: return "🌾";
    }
  };

  // Define all available categories (same as supplier form)
  const allCategories = [
    { id: "all", name: t("vendorDashboard.allCategories"), icon: "🛒" },
    { id: "Vegetables", name: t("supplier.vegetables"), icon: "🥬" },
    { id: "Fruits", name: t("supplier.fruits"), icon: "🍎" },
    { id: "Dairy", name: t("supplier.dairy"), icon: "🥛" },
    { id: "Grains", name: t("supplier.grains"), icon: "🌾" },
    { id: "Others", name: t("supplier.others"), icon: "📦" },
  ];

  // Use all categories instead of dynamic ones
  const categories = allCategories;

  // Quick actions
  const quickActions = [
    {
      title: t("vendorDashboard.searchProducts"),
      description: t("vendorDashboard.findBestSuppliers"),
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      action: () => setActiveTab("products"),
      color: "bg-blue-500",
    },
    {
      title: t("vendorDashboard.viewCart"),
      description: t("vendorDashboard.manageOrders"),
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
          />
        </svg>
      ),
      action: () => setShowCart(true),
      color: "bg-green-500",
    },
    {
      title: t("vendorDashboard.supplierPerformance"),
      description: t("vendorDashboard.ratingsAndReviews"),
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      action: () => setActiveTab("performance"),
      color: "bg-purple-500",
    },
    {
      title: t("common.feedback"),
      description: t("vendorDashboard.shareExperience"),
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      action: () => (window.location.href = "/feedback"),
      color: "bg-orange-500",
    },
  ];

  // Cart functions using cart store
  const handleAddToCart = async (product, quantity) => {
    try {
      // Validate quantity against available stock
      const availableQuantity = product.availableQuantity || product.quantity || 0;
      if (quantity > availableQuantity) {
        throw new Error(`Cannot add ${quantity} items. Only ${availableQuantity} available.`);
      }

      await addToCartStore({
        materialId: product._id,
        quantity: quantity
      });
      
      setToast({
        show: true,
        message: `Added ${quantity} ${product.name} to cart`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      setToast({
        show: true,
        message: error.message,
        type: 'error'
      });
    }
  };

  const handleShowQuantityModal = (product) => {
    setSelectedProduct(product);
    setShowQuantityModal(true);
  };

  const handleQuantityConfirm = async (quantity) => {
    if (selectedProduct) {
      await handleAddToCart(selectedProduct, quantity);
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      await removeFromCartStore(productId);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const handleCheckout = () => {
    navigate("/checkout", { state: { cart: cartItems } });
  };

  const handleSupplierSelect = async (supplierId) => {
    try {
      // This function is no longer needed as materials are fetched directly
      // await fetchSupplierMaterials(supplierId, user.token); 
    } catch (error) {
      console.error("Error fetching supplier materials:", error);
    }
  };

  // Loading state
  const isLoading = isInitializing || loading;

  // Debug logging
  const { token } = useAuthStore.getState();
  console.log('🔍 VendorDashboard Debug:', {
    isInitializing,
    loading,
    isLoading,
    error,
    user: !!user,
    token: !!token,
    profile: !!profile,
    materials: materials?.length || 0,
    orders: orders?.length || 0,
    cartItems: cartItems?.length || 0
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">
            isInitializing: {isInitializing ? 'true' : 'false'} | 
            loading: {loading ? 'true' : 'false'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Retry
          </button>
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
            {t("common.welcome")}, {profile?.name || user?.name || "Vendor"}! 👋
          </h2>
          <p className="text-gray-600">
            {t("vendorDashboard.monthlySpendingOverview")}
          </p>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {dashboardStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-4 md:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <div className="text-green-600">{stat.icon}</div>
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
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "products"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("vendorDashboard.searchProducts")} ({materials?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "orders"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Orders ({orders?.length || 0})
            </button>

          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("vendorDashboard.quickActions")}
              </h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <div className="text-white">{action.icon}</div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nearby Suppliers */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t("vendorDashboard.nearbySuppliers")}
              </h3>
              <div className="bg-white rounded-lg shadow p-6">
                <VendorMap nearbySuppliers={[]} /> {/* Placeholder for nearbySuppliers */}
              </div>
            </div>
          </div>
        )}



        {activeTab === "products" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {t("vendorDashboard.searchProducts")}
              </h3>
              <div className="flex items-center gap-2">
                {searchQuery.trim() && (
                  <span className="text-sm text-gray-500">
                    {isSearching ? "Searching..." : `${filteredProducts.length} products found`}
                  </span>
                )}
                <button
                  onClick={() => fetchAllMaterials()}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
                >
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("vendorDashboard.searchPlaceholder")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("vendorDashboard.searchPlaceholder")}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("vendorDashboard.category")}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading products...</p>
                </div>
              ) : isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Searching for products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🔍</div>
                  <p className="text-gray-600">
                    {searchQuery.trim() 
                      ? `No products found for "${searchQuery}"`
                      : error 
                        ? `Error loading products: ${error}`
                        : "No products available from suppliers"
                    }
                  </p>
                  {error && (
                    <button
                      onClick={() => fetchAllMaterials()}
                      className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200"
                    >
                      Retry Loading Products
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                <div
                  key={product._id || product.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">
                        {product.name}
                      </h4>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold text-green-600">
                        ₹{product.pricePerUnit || product.price}
                      </span>
                      <span className="text-sm text-gray-500">
                        per {product.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">
                        Available: {product.availableQuantity || product.quantity || 0} {product.unit}
                      </span>
                    </div>
                    {product.description && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="ml-1 text-sm text-gray-600">
                            {product.supplierId?.rating || "4.5"}
                          </span>
                        </div>
                        <span className="ml-2 text-sm text-gray-500">
                          • {product.supplierId?.fullname || product.supplierName || "Supplier"}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/supplier/${product.supplierId?._id}/detail`)}
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        View Details
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleShowQuantityModal(product)}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200"
                      >
                        {t("vendorDashboard.addToCart")}
                      </button>
                      <Link
                        to={`/supplier/${product.supplierId?._id}`}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 text-center"
                      >
                        {t("vendorDashboard.viewSupplierProfile")}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              )}
            </div>
          </div>
        )}


      </main>

      {/* Floating Cart */}
      {showCart && (
        <FloatingCheckout
          cart={cartItems}
          onCheckout={handleCheckout}
          onRemoveItem={handleRemoveFromCart}
        />
      )}

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

export default VendorDashboard;
