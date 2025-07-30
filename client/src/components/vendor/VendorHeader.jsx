import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../common/LanguageSwitcher";
import logo from "../../assets/logo.png";

const VendorHeader = ({ cart, showCart, setShowCart }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // Calculate cart total based on cart store structure
  const cartTotal = cart?.reduce((total, item) => {
    const itemPrice = item.materialId?.pricePerUnit || 0;
    const itemQuantity = item.quantity || 0;
    return total + (itemPrice * itemQuantity);
  }, 0) || 0;

  const cartItemCount = cart?.length || 0;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <button
            className="flex items-center space-x-4 focus:outline-none"
            onClick={() => navigate("/dashboard/vendor")}
            aria-label="Go to Vendor Dashboard"
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {/* <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {t("brand.name")}
              </h1>
              <p className="text-xs text-gray-500">{t("brand.tagline")}</p>
            </div> */}
            <img src={logo} alt="logo" className="h-8 md:h-10" />
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/dashboard/vendor"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              {t("navigation.dashboard")}
            </Link>
            <Link
              to="/vendor/profile"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              {t("vendor.profile")}
            </Link>
            <Link
              to="/feedback"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              {t("common.feedback")}
            </Link>
            <Link
              to="/prediction"
              className="relative text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 group"
            >
              <div className="flex items-center gap-2">
                <span>{t("stockPredictor")}</span>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-blue-400 to-blue-800 text-white text-xs font-bold rounded-full animate-pulse">
                    <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
                    <span>AI</span>
                  </div>
                  {/* <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full">
                    <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                    <span>LIVE</span>
                  </div> */}
                </div>
              </div>
              {/* Floating NEW badge */}
              {/* <div className="absolute -top-1 -right-1 transform rotate-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-bounce">
                  NEW
                </div>
              </div> */}
            </Link>
          </nav>

          {/* Right side - Cart, Language Switcher, User Menu */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <div className="relative">
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6"
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
                {cart && cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Cart Dropdown */}
              {showCart && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">
                      {t("vendor.cart")}
                    </h3>
                  </div>
                  {cart && cart.length > 0 ? (
                    <>
                      <div className="max-h-64 overflow-y-auto">
                        {cart.map((item) => (
                          <div
                            key={item._id}
                            className="px-4 py-2 border-b border-gray-100"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {item.materialId?.name || 'Unknown Item'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.supplierId?.fullname || 'Unknown Supplier'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  ₹{((item.materialId?.pricePerUnit || 0) * (item.quantity || 0)).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Qty: {item.quantity || 0}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {t("vendor.total")}:
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            ₹{cartTotal.toFixed(2)}
                          </span>
                        </div>
                        <Link
                          to="/checkout"
                          className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-center block"
                        >
                          {t("vendor.checkout")}
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-4 text-center">
                      <p className="text-sm text-gray-500">
                        {t("vendor.cartEmpty")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <LanguageSwitcher />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "V"}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                    <p className="font-medium">{user?.name || user?.email}</p>
                    <p className="text-gray-500 text-xs">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  >
                    {t("common.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <Link
              to="/dashboard/vendor"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              {t("navigation.dashboard")}
            </Link>
            <Link
              to="/vendor/profile"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              {t("vendor.profile")}
            </Link>
            <Link
              to="/feedback"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              {t("common.feedback")}
            </Link>
            <Link
              to="/prediction"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              <div className="flex items-center justify-between">
                <span>{t("stockPredictor")}</span>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-blue-400 to-blue-800 text-white text-xs font-bold rounded-full animate-pulse">
                    <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
                    <span>AI</span>
                  </div>
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-bounce">
                    NEW
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default VendorHeader;
