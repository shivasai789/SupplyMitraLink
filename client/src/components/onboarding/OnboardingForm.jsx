import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSupplierStore } from '../../stores/useSupplierStore';
import { useVendorStore } from '../../stores/useVendorStore';
import { toast } from 'react-hot-toast';
import Loader from '../common/Loader';

const OnboardingForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { updateProfile: updateSupplierProfile } = useSupplierStore();
  const { updateProfile: updateVendorProfile } = useVendorStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    fullname: '',
    email: '',
    phone: '',
    
    // Business Information
    businessName: '',
    businessType: '',
    businessAddress: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [errors, setErrors] = useState({});

  // Initialize form with user data if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullname: user.fullname || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Personal Information
        if (!formData.fullname.trim()) newErrors.fullname = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (formData.phone && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
          newErrors.phone = 'Please enter a valid 10-digit phone number';
        }
        break;

      case 2: // Business Information
        if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
        if (!formData.businessType.trim()) newErrors.businessType = 'Business type is required';
        if (!formData.businessAddress.trim()) newErrors.businessAddress = 'Business address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
        if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
          newErrors.pincode = 'Please enter a valid 6-digit pincode';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };



  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    console.log('🔍 OnboardingForm Debug - handleSubmit called');
    console.log('🔍 OnboardingForm Debug - Current step:', currentStep);
    console.log('🔍 OnboardingForm Debug - User role:', user?.role);
    
    if (!validateStep(currentStep)) {
      console.log('🔍 OnboardingForm Debug - Validation failed');
      return;
    }

    console.log('🔍 OnboardingForm Debug - Validation passed, starting submission');
    setLoading(true);
    
    try {
      const profileData = {
        ...formData,
        onboardingCompleted: true,
        onboardingDate: new Date().toISOString()
      };

      console.log('🔍 OnboardingForm Debug - Sending profileData to API:', profileData);

      // Update profile based on user role
      let response;
      if (user?.role === 'supplier') {
        console.log('🔍 OnboardingForm Debug - Calling updateSupplierProfile');
        response = await updateSupplierProfile(profileData);
        console.log('🔍 OnboardingForm Debug - Supplier profile updated successfully');
        toast.success('Profile updated successfully! Welcome to SupplyMitraLink!');
        navigate('/dashboard/supplier');
      } else if (user?.role === 'vendor') {
        console.log('🔍 OnboardingForm Debug - Calling updateVendorProfile');
        response = await updateVendorProfile(profileData);
        console.log('🔍 OnboardingForm Debug - Vendor profile updated successfully');
        toast.success('Profile updated successfully! Welcome to SupplyMitraLink!');
        navigate('/dashboard/vendor');
      } else {
        console.log('🔍 OnboardingForm Debug - Unknown user role:', user?.role);
        throw new Error('Unknown user role');
      }

      // Update user in auth store with the response data from backend
      console.log('🔍 OnboardingForm Debug - Response:', response);
      console.log('🔍 OnboardingForm Debug - ProfileData:', profileData);
      
      if (response?.data) {
        console.log('🔍 OnboardingForm Debug - Using response data');
        updateUser(response.data);
      } else {
        // Fallback to form data if no response data
        console.log('🔍 OnboardingForm Debug - Using form data as fallback');
        updateUser(profileData);
      }
      
      console.log('🔍 OnboardingForm Debug - User updated in store');
    } catch (error) {
      console.error('🔍 OnboardingForm Debug - Error occurred:', error);
      console.error('🔍 OnboardingForm Debug - Error stack:', error.stack);
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      console.log('🔍 OnboardingForm Debug - Setting loading to false');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          value={formData.fullname}
          onChange={(e) => handleInputChange('fullname', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.fullname ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your full name"
        />
        {errors.fullname && <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your email address"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number *
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your phone number"
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Name *
        </label>
        <input
          type="text"
          value={formData.businessName}
          onChange={(e) => handleInputChange('businessName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.businessName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your business name"
        />
        {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Type *
        </label>
        <select
          value={formData.businessType}
          onChange={(e) => handleInputChange('businessType', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.businessType ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select business type</option>
          <option value="retail">Retail Store</option>
          <option value="wholesale">Wholesale</option>
          <option value="restaurant">Restaurant</option>
          <option value="catering">Catering</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="distribution">Distribution</option>
          <option value="other">Other</option>
        </select>
        {errors.businessType && <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Address *
        </label>
        <textarea
          value={formData.businessAddress}
          onChange={(e) => handleInputChange('businessAddress', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.businessAddress ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your complete business address"
        />
        {errors.businessAddress && <p className="text-red-500 text-sm mt-1">{errors.businessAddress}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="City"
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="State"
          />
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pincode *
          </label>
          <input
            type="text"
            value={formData.pincode}
            onChange={(e) => handleInputChange('pincode', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.pincode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Pincode"
          />
          {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
        </div>
      </div>
    </div>
  );



  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      default: return renderStep1();
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info' },
    { number: 2, title: 'Business Info' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader text="Setting up your profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to SupplyMitraLink!
          </h1>
          <p className="text-gray-600">
            Complete your profile to get started with {user?.role === 'supplier' ? 'supplying' : 'purchasing'} on our platform
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep >= step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            {steps.map(step => (
              <span key={step.number} className="text-center">
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderCurrentStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {currentStep < 2 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingForm; 