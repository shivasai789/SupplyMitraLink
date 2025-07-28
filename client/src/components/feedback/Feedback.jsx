import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import VendorHeader from "../vendor/VendorHeader";
import { useAuthStore } from "../../stores/useAuthStore";
import { useFeedbackStore } from "../../stores/useFeedbackStore";
import { useCartStore } from "../../stores/useCartStore";

const Feedback = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  // Cart state management
  const { cartItems, fetchCartItems } = useCartStore();
  const [showCart, setShowCart] = useState(false);

  // Use feedback store
  const { feedback, loading, error, fetchFeedback } = useFeedbackStore();

  // Fetch feedback data on component mount
  useEffect(() => {
    if (user?.token) {
      fetchFeedback({}, user.token);
    }
  }, [user, fetchFeedback]);

  // Fetch cart items on component mount
  useEffect(() => {
    fetchCartItems().catch(err => {
      console.warn('Failed to fetch cart items:', err.message);
    });
  }, [fetchCartItems]);

  // Group feedback by supplier and calculate ratings
  const supplierRatings = React.useMemo(() => {
    const supplierMap = new Map();

    // Add null check for feedback
    if (!feedback || !Array.isArray(feedback)) {
      return [];
    }

    feedback.forEach((item) => {
      const supplierId = item.toUserId;
      const supplierName = item.toUserName;

      if (!supplierMap.has(supplierId)) {
        supplierMap.set(supplierId, {
          id: supplierId,
          supplierName,
          ratings: [],
          totalReviews: 0,
          averageRating: 0,
          categories: {
            Quality: 0,
            Price: 0,
            Delivery: 0,
            Communication: 0,
          },
          recentReviews: [],
        });
      }

      const supplier = supplierMap.get(supplierId);
      supplier.ratings.push(item.rating);
      supplier.totalReviews++;

      // Add to recent reviews (limit to 2)
      if (supplier.recentReviews.length < 2) {
        supplier.recentReviews.push({
          rating: item.rating,
          comment: item.comment,
          date: new Date(item.date).toLocaleDateString(),
        });
      }
    });

    // Calculate averages
    return Array.from(supplierMap.values()).map((supplier) => {
      const avgRating =
        supplier.ratings.reduce((sum, rating) => sum + rating, 0) /
        supplier.ratings.length;

      return {
        ...supplier,
        averageRating: avgRating,
        categories: {
          Quality: avgRating + (Math.random() - 0.5) * 0.4, // Simulate category ratings
          Price: avgRating + (Math.random() - 0.5) * 0.4,
          Delivery: avgRating + (Math.random() - 0.5) * 0.4,
          Communication: avgRating + (Math.random() - 0.5) * 0.4,
        },
      };
    });
  }, [feedback]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < rating ? "text-yellow-400" : "text-gray-300"}
      >
        ★
      </span>
    ));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader
          cart={cartItems}
          showCart={showCart}
          setShowCart={setShowCart}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader
          cart={cartItems}
          showCart={showCart}
          setShowCart={setShowCart}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Feedback
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorHeader cart={cartItems} showCart={showCart} setShowCart={setShowCart} />

      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          {t("common.feedback")} 📝
        </h2>

        {supplierRatings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No Feedback Available
            </h3>
            <p className="text-gray-600">
              There are no supplier ratings to display at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {supplierRatings.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {supplier.supplierName}
                  </h4>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {renderStars(Math.round(supplier.averageRating))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {supplier.averageRating.toFixed(1)} (
                      {supplier.totalReviews} {t("vendor.reviews")})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {Object.entries(supplier.categories).map(
                      ([category, rating]) => (
                        <div key={category} className="text-center">
                          <div className="text-sm text-gray-600">
                            {t(`vendor.${category.toLowerCase()}`)}
                          </div>
                          <div className="flex justify-center items-center mt-1">
                            {renderStars(Math.round(rating))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {rating.toFixed(1)}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  <div className="mt-4">
                    <h5 className="text-md font-medium text-gray-900 mb-2">
                      {t("vendor.recentReviews")}
                    </h5>
                    <div className="space-y-2">
                      {supplier.recentReviews.map((review, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-green-500 pl-4"
                        >
                          <div className="flex items-center mb-1">
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                            <span className="ml-2 text-xs text-gray-500">
                              {review.date}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {review.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 md:mt-0 md:ml-8 flex-shrink-0 flex items-center">
                  <Link
                    to={`/vendors/${encodeURIComponent(
                      supplier.supplierName
                    )}/public`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    {t("vendor.viewDetails")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Feedback;
