import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// API functions
const authAPI = {
  login: async (credentials) => {
    const requestBody = {
      email: credentials.email,
      password: credentials.password,
      role: credentials.role
    };
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Login failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  },

  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Signup failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  },

  getCurrentUser: async (token) => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get current user: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  },
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      initialized: false,

      // Actions
      initializeAuth: async () => {
        const { token, user } = get();
        
        if (token && user) {
          set({ 
            isAuthenticated: true, 
            loading: false, 
            initialized: true 
          });
        } else if (token) {
          set({ loading: true });
          
          try {
            const userData = await get().getCurrentUser();
            if (userData) {
              // Ensure all user fields are properly set with defaults
              const completeUserData = {
                id: userData.id || userData._id,
                email: userData.email || "",
                fullname: userData.fullname || "",
                phone: userData.phone || "",
                role: userData.role,
                createdAt: userData.createdAt,
                onboardingCompleted: userData.onboardingCompleted || false,
                businessName: userData.businessName || "",
                businessType: userData.businessType || "",
                businessAddress: userData.businessAddress || "",
                city: userData.city || "",
                state: userData.state || "",
                pincode: userData.pincode || "",
                onboardingDate: userData.onboardingDate || null,
              };
              
              set({ 
                user: completeUserData,
                isAuthenticated: true, 
                loading: false, 
                initialized: true 
              });
            }
          } catch (error) {
            get().logout();
          }
        } else {
          set({ initialized: true });
        }
      },

      login: async (email, password, role) => {
        set({ loading: true, error: null });
        
        try {
          const response = await authAPI.login({ email, password, role });
          
          if (response.status === 'success' && response.data) {
            const userData = response.data;
            const token = response.data.token;
            
            const completeUserData = {
              id: userData.id || userData._id,
              email: userData.email,
              fullname: userData.fullname || "",
              phone: userData.phone || "",
              role: userData.role,
              createdAt: userData.createdAt,
              onboardingCompleted: userData.onboardingCompleted || false,
              businessName: userData.businessName || "",
              businessType: userData.businessType || "",
              businessAddress: userData.businessAddress || "",
              city: userData.city || "",
              state: userData.state || "",
              pincode: userData.pincode || "",
              onboardingDate: userData.onboardingDate || null,
            };
            
            set({
              user: completeUserData,
              token: token,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            
            return { success: true, user: completeUserData, token };
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          set({
            loading: false,
            error: error.message,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      signup: async (userData) => {
        set({ loading: true, error: null });
        
        try {
          const response = await authAPI.signup(userData);
          
          if (response.status === 'success') {
            // Automatically log the user in after successful signup
            const loginResponse = await authAPI.login({
              email: userData.email,
              password: userData.password,
              role: userData.role
            });
            
            if (loginResponse.status === 'success' && loginResponse.data) {
              const userData = loginResponse.data;
              const token = loginResponse.data.token;
              
              const completeUserData = {
                id: userData.id || userData._id,
                email: userData.email,
                fullname: userData.fullname || "",
                phone: userData.phone || "",
                role: userData.role,
                createdAt: userData.createdAt,
                onboardingCompleted: userData.onboardingCompleted || false,
                businessName: userData.businessName || "",
                businessType: userData.businessType || "",
                businessAddress: userData.businessAddress || "",
                city: userData.city || "",
                state: userData.state || "",
                pincode: userData.pincode || "",
                onboardingDate: userData.onboardingDate || null,
              };
              
              set({
                user: completeUserData,
                token: token,
                isAuthenticated: true,
                loading: false,
                error: null,
              });
              
              return { success: true, message: response.message, user: completeUserData, token };
            } else {
              throw new Error('Auto-login failed after signup');
            }
          } else {
            throw new Error(response.message || 'Signup failed');
          }
        } catch (error) {
          set({
            loading: false,
            error: error.message,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('auth-storage');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      getCurrentUser: async () => {
        const { token } = get();
        if (!token) {
          throw new Error('No token available');
        }
        
        try {
          const response = await authAPI.getCurrentUser(token);
          return response.data;
        } catch (error) {
          throw error;
        }
      },

              updateUser: (updatedUserData) => {
          set((state) => {
            const updatedUser = {
              ...state.user,
              ...updatedUserData,
              // Ensure all fields are properly set with defaults
              id: updatedUserData.id || updatedUserData._id || state.user?.id,
              email: updatedUserData.email || state.user?.email || "",
              fullname: updatedUserData.fullname || state.user?.fullname || "",
              phone: updatedUserData.phone || state.user?.phone || "",
              role: updatedUserData.role || state.user?.role,
              createdAt: updatedUserData.createdAt || state.user?.createdAt,
              onboardingCompleted: updatedUserData.onboardingCompleted !== undefined ? updatedUserData.onboardingCompleted : (state.user?.onboardingCompleted || false),
              businessName: updatedUserData.businessName || state.user?.businessName || "",
              businessType: updatedUserData.businessType || state.user?.businessType || "",
              businessAddress: updatedUserData.businessAddress || state.user?.businessAddress || "",
              city: updatedUserData.city || state.user?.city || "",
              state: updatedUserData.state || state.user?.state || "",
              pincode: updatedUserData.pincode || state.user?.pincode || "",
              onboardingDate: updatedUserData.onboardingDate || state.user?.onboardingDate || null,
            };
            return { user: updatedUser };
          });
        },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initialized = true;
        }
      },
    }
  )
);

// Selectors for better performance
export const useAuthState = () => useAuthStore((state) => ({
  user: state.user,
  token: state.token,
  isAuthenticated: state.isAuthenticated,
  loading: state.loading,
  error: state.error,
  initialized: state.initialized,
}));

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  signup: state.signup,
  logout: state.logout,
  clearError: state.clearError,
  initializeAuth: state.initializeAuth,
  updateUser: state.updateUser,
})); 