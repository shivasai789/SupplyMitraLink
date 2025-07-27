import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { vendorAPI } from '../services/api';

// Sample data for development
const sampleReviews = [
  {
    _id: 'review-1',
    userId: {
      _id: 'vendor-1',
      fullname: 'Fresh Market Vendor'
    },
    supplierId: {
      _id: 'supplier-1',
      fullname: 'Fresh Farm Supplies'
    },
    materialId: {
      _id: 'material-1',
      name: 'Fresh Tomatoes'
    },
    rating: 5,
    comment: 'Excellent quality products and timely delivery. Highly recommended!',
    createdAt: '2024-01-19T14:30:00Z',
    helpful: 3,
    reported: false,
  },
  {
    _id: 'review-2',
    userId: {
      _id: 'vendor-1',
      fullname: 'Fresh Market Vendor'
    },
    supplierId: {
      _id: 'supplier-1',
      fullname: 'Fresh Farm Supplies'
    },
    materialId: {
      _id: 'material-2',
      name: 'Organic Carrots'
    },
    rating: 4,
    comment: 'Good quality vegetables, but delivery was slightly delayed.',
    createdAt: '2024-01-18T16:45:00Z',
    helpful: 1,
    reported: false,
  },
  {
    _id: 'review-3',
    userId: {
      _id: 'vendor-2',
      fullname: 'Green Grocery Store'
    },
    supplierId: {
      _id: 'supplier-1',
      fullname: 'Fresh Farm Supplies'
    },
    materialId: {
      _id: 'material-3',
      name: 'Fresh Lettuce'
    },
    rating: 5,
    comment: 'Great customer to work with. Clear communication and prompt payments.',
    createdAt: '2024-01-17T11:20:00Z',
    helpful: 2,
    reported: false,
  },
  {
    _id: 'review-4',
    userId: {
      _id: 'vendor-1',
      fullname: 'Fresh Market Vendor'
    },
    supplierId: {
      _id: 'supplier-2',
      fullname: 'Green Valley Farms'
    },
    materialId: {
      _id: 'material-4',
      name: 'Organic Potatoes'
    },
    rating: 3,
    comment: 'Products were fresh but packaging could be better.',
    createdAt: '2024-01-16T09:15:00Z',
    helpful: 0,
    reported: false,
  },
];

export const useFeedbackStore = create(
  devtools(
    (set, get) => ({
      // State
      reviews: [],
      userReviews: [],
      loading: false,
      error: null,

      // Actions
      submitReview: async (reviewData) => {
        set({ loading: true, error: null });
        
        try {
          if (import.meta.env.DEV) {
            await new Promise(resolve => setTimeout(resolve, 800));
            
            const newReview = {
              _id: `review-${Date.now()}`,
              ...reviewData,
              createdAt: new Date().toISOString(),
              helpful: 0,
              reported: false,
            };
            
            set((state) => ({
              reviews: [newReview, ...state.reviews],
              loading: false,
            }));
            
            return { success: true, data: newReview };
          } else {
            const response = await vendorAPI.createReview(reviewData);
            
            if (response.status === 'success') {
              set((state) => ({
                reviews: [response.data, ...state.reviews],
                loading: false,
              }));
            }
            
            return response;
          }
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchReviews: async (materialId, params = {}) => {
        set({ loading: true, error: null });
        
        try {
          if (import.meta.env.DEV) {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            let filteredReviews = [...sampleReviews];
            
            // Apply filters
            if (params.userId) {
              filteredReviews = filteredReviews.filter(review =>
                review.userId._id === params.userId || review.supplierId._id === params.userId
              );
            }
            
            if (params.rating) {
              filteredReviews = filteredReviews.filter(review =>
                review.rating >= params.rating
              );
            }
            
            // Sort by date (newest first)
            filteredReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            set({ reviews: filteredReviews, loading: false });
            return filteredReviews;
          } else {
            const response = await vendorAPI.getReviews(materialId);
            set({ reviews: response.data || [], loading: false });
            return response.data || [];
          }
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      fetchUserReviews: async (userId) => {
        set({ loading: true, error: null });
        
        try {
          if (import.meta.env.DEV) {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const userReviews = sampleReviews.filter(review =>
              review.supplierId._id === userId
            );
            
            set({ userReviews, loading: false });
            return userReviews;
          } else {
            // For real API, we need to get all materials first and then get reviews for each
            // This is a simplified approach - in production you might want a dedicated endpoint
            const response = await vendorAPI.getReviews(userId);
            set({ userReviews: response.data || [], loading: false });
            return response.data || [];
          }
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      updateReview: async (reviewId, updates) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.updateReview(reviewId, updates);
          
          // Update review in local state
          set(state => ({
            reviews: state.reviews.map(review =>
              review._id === reviewId ? { ...review, ...updates } : review
            ),
            userReviews: state.userReviews.map(review =>
              review._id === reviewId ? { ...review, ...updates } : review
            ),
            loading: false
          }));
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      deleteReview: async (reviewId) => {
        set({ loading: true, error: null });
        
        try {
          const response = await vendorAPI.deleteReview(reviewId);
          
          // Remove review from local state
          set(state => ({
            reviews: state.reviews.filter(review => review._id !== reviewId),
            userReviews: state.userReviews.filter(review => review._id !== reviewId),
            loading: false
          }));
          
          return response;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      markHelpful: (reviewId) => {
        set((state) => ({
          reviews: state.reviews.map(review =>
            review._id === reviewId
              ? { ...review, helpful: (review.helpful || 0) + 1 }
              : review
          ),
          userReviews: state.userReviews.map(review =>
            review._id === reviewId
              ? { ...review, helpful: (review.helpful || 0) + 1 }
              : review
          ),
        }));
      },

      reportReview: (reviewId) => {
        set((state) => ({
          reviews: state.reviews.map(review =>
            review._id === reviewId
              ? { ...review, reported: true }
              : review
          ),
          userReviews: state.userReviews.map(review =>
            review._id === reviewId
              ? { ...review, reported: true }
              : review
          ),
        }));
      },

      clearError: () => {
        set({ error: null });
      },

      // Utility functions
      getReviewById: (reviewId) => {
        const { reviews } = get();
        return reviews.find(r => r._id === reviewId);
      },

      getReviewsByUser: (userId) => {
        const { reviews } = get();
        return reviews.filter(r => r.userId._id === userId);
      },

      getReviewsForSupplier: (supplierId) => {
        const { reviews } = get();
        return reviews.filter(r => r.supplierId._id === supplierId);
      },

      getReviewsForMaterial: (materialId) => {
        const { reviews } = get();
        return reviews.filter(r => r.materialId._id === materialId);
      },

      getAverageRating: (userId) => {
        const { reviews } = get();
        const userReviews = reviews.filter(r => r.supplierId._id === userId);
        
        if (userReviews.length === 0) return 0;
        
        const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
        return Math.round((totalRating / userReviews.length) * 10) / 10;
      },

      getRatingDistribution: (userId) => {
        const { reviews } = get();
        const userReviews = reviews.filter(r => r.supplierId._id === userId);
        
        const distribution = {
          5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };
        
        userReviews.forEach(r => {
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });
        
        return distribution;
      },

      getRecentReviews: (limit = 5) => {
        const { reviews } = get();
        return reviews
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      },

      getPositiveReviews: (userId) => {
        const { reviews } = get();
        return reviews.filter(r => 
          r.supplierId._id === userId && r.rating >= 4
        );
      },

      getNegativeReviews: (userId) => {
        const { reviews } = get();
        return reviews.filter(r => 
          r.supplierId._id === userId && r.rating <= 2
        );
      },

      // Reset store
      reset: () => set({
        reviews: [],
        userReviews: [],
        loading: false,
        error: null
      }),
    }),
    {
      name: 'feedback-store',
    }
  )
); 