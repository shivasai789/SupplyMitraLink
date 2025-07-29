import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import Loader from './Loader';

const OnboardingGuard = ({ children }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = () => {
      // Skip onboarding check for these routes
      const skipOnboardingRoutes = [
        '/onboarding',
        '/login',
        '/signup',
        '/logout',
        '/'
      ];

      if (skipOnboardingRoutes.includes(location.pathname)) {
        setIsChecking(false);
        return;
      }

      // If user is not logged in, let the auth system handle it
      if (!user) {
        setIsChecking(false);
        return;
      }

      // Check if user has completed onboarding
      // First check the explicit onboardingCompleted flag
      const hasExplicitOnboardingFlag = user.onboardingCompleted === true;
      
      // Also check if all required business fields are filled
      const hasRequiredBusinessFields = user.businessName && 
        user.businessName.trim() !== '' &&
        user.businessType && 
        user.businessType.trim() !== '' &&
        user.businessAddress && 
        user.businessAddress.trim() !== '' &&
        user.city && 
        user.city.trim() !== '' &&
        user.state && 
        user.state.trim() !== '' &&
        user.pincode && 
        user.pincode.trim() !== '';

      // Check if personal fields are filled
      const hasRequiredPersonalFields = user.fullname && 
        user.fullname.trim() !== '' &&
        user.phone && 
        user.phone.trim() !== '';

      const hasCompletedOnboarding = hasExplicitOnboardingFlag || (hasRequiredBusinessFields && hasRequiredPersonalFields);

      if (!hasCompletedOnboarding) {
        // Redirect to onboarding if not completed
        navigate('/onboarding');
      } else {
        // User has completed onboarding, allow access
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [user, navigate, location.pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader text="Checking your profile..." />
      </div>
    );
  }

  return children;
};

export default OnboardingGuard; 