import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import VendorHeader from '../components/vendor/VendorHeader';
import DayStepForm from '../components/DayStepForm';
import { getRecommendation, validatePredictionResponse } from '../utils/geminiAPI';
import { buildPrompt } from '../utils/buildPrompt';

const PredictionPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    day1: { date: '', customersServed: '', weatherCondition: '', itemsSold: [], popularItems: [], localEvents: '' },
    day2: { date: '', customersServed: '', weatherCondition: '', itemsSold: [], popularItems: [], localEvents: '' },
    day3: { date: '', customersServed: '', weatherCondition: '', itemsSold: [], popularItems: [], localEvents: '' }
  });
  const [stepValidation, setStepValidation] = useState({ day1: false, day2: false, day3: false });
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');

  // Load saved prediction from localStorage on component mount
  useEffect(() => {
    const savedPrediction = localStorage.getItem('vendorPrediction');
    if (savedPrediction) {
      try {
        const parsedPrediction = JSON.parse(savedPrediction);
        setPrediction(parsedPrediction);
      } catch (error) {
        console.error('Error parsing saved prediction:', error);
        localStorage.removeItem('vendorPrediction');
      }
    }
  }, []);

  // Save prediction to localStorage whenever it changes
  useEffect(() => {
    if (prediction) {
      localStorage.setItem('vendorPrediction', JSON.stringify(prediction));
    }
  }, [prediction]);

  const validateStep = (stepKey) => {
    const data = formData[stepKey];
    
    // Check required fields
    if (!data.date) return false;
    if (data.customersServed === undefined || data.customersServed === null || data.customersServed === '') return false;
    if (!data.weatherCondition) return false;
    
    // Check items
    if (data.itemsSold.length === 0) return false;
    
    // Check each item
    return data.itemsSold.every(item => 
      item.name && item.name.trim() !== '' && (item.quantity >= 0)
    );
  };

  const canProceed = () => {
    return validateStep(`day${currentStep}`);
  };

  const canPredict = () => {
    return currentStep === 3 && validateStep('day1') && validateStep('day2') && validateStep('day3');
  };

  const handleStepChange = (step) => {
    if (step >= 1 && step <= 3) {
      setCurrentStep(step);
    }
  };

  const handleFormDataChange = (stepKey, data) => {
    setFormData(prev => ({
      ...prev,
      [stepKey]: data
    }));
  };

  const handleValidationChange = (stepKey, isValid) => {
    setStepValidation(prev => ({
      ...prev,
      [stepKey]: isValid
    }));
  };

  // Transform formData to the new format expected by buildPrompt
  const transformFormDataForPrompt = (formData) => {
    const past3Days = [];
    
    // Convert day1, day2, day3 to past3Days array
    for (let i = 1; i <= 3; i++) {
      const dayKey = `day${i}`;
      const dayData = formData[dayKey];
      
      if (dayData) {
        // Convert itemsSold array to object format
        const itemsSold = {};
        const leftovers = {};
        
        if (dayData.itemsSold && dayData.itemsSold.length > 0) {
          dayData.itemsSold.forEach(item => {
            itemsSold[item.name] = item.quantity;
            if (item.leftoverQty > 0) {
              leftovers[item.name] = item.leftoverQty;
            }
          });
        }
        
        past3Days.push({
          date: dayData.date,
          itemsSold: itemsSold,
          leftovers: leftovers,
          customersServed: dayData.customersServed,
          weather: dayData.weatherCondition,
          dayType: dayData.localEvents || 'Regular day'
        });
      }
    }
    
    // Create today's context (using the last day's data as reference)
    const lastDay = formData.day3;
    const todayContext = {
      date: new Date().toISOString().split('T')[0], // Today's date
      weather: lastDay?.weatherCondition || 'Unknown',
      dayType: 'Regular day',
      specialNotes: lastDay?.localEvents || null
    };
    
    return {
      past3Days,
      todayContext
    };
  };

  const handlePredict = async () => {
    setLoading(true);
    setError('');

    try {
      const transformedData = transformFormDataForPrompt(formData);
      const prompt = buildPrompt(transformedData);
      const response = await getRecommendation(prompt);
      
      if (response.success) {
        const validation = validatePredictionResponse(response.data);
        if (validation.valid) {
          setPrediction(response.data);
        } else {
          setError(`Invalid response structure: missing ${validation.missingField}`);
        }
      } else {
        setError(response.error || 'Failed to get prediction');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderNow = () => {
    navigate('/vendor/dashboard');
  };

  const clearPrediction = () => {
    setPrediction(null);
    localStorage.removeItem('vendorPrediction');
  };

  const addTestData = () => {
    const testData = {
      day1: {
        date: '2025-01-20',
        customersServed: 150,
        weatherCondition: 'Sunny',
        itemsSold: [
          { name: 'Panipuri', quantity: 80, leftoverQty: 20 },
          { name: 'Samosa', quantity: 45, leftoverQty: 5 }
        ],
        popularItems: ['Panipuri', 'Chai'],
        localEvents: 'Local festival'
      },
      day2: {
        date: '2025-01-21',
        customersServed: 120,
        weatherCondition: 'Cloudy',
        itemsSold: [
          { name: 'Panipuri', quantity: 65, leftoverQty: 15 },
          { name: 'Samosa', quantity: 35, leftoverQty: 10 }
        ],
        popularItems: ['Samosa', 'Coffee'],
        localEvents: ''
      },
      day3: {
        date: '2025-01-22',
        customersServed: 180,
        weatherCondition: 'Rainy',
        itemsSold: [
          { name: 'Panipuri', quantity: 95, leftoverQty: 5 },
          { name: 'Samosa', quantity: 55, leftoverQty: 0 },
          { name: 'Pakora', quantity: 30, leftoverQty: 0 }
        ],
        popularItems: ['Pakora', 'Hot Tea'],
        localEvents: 'Rainy day special'
      }
    };
    setFormData(testData);
  };

  if (prediction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader />
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Saved Prediction Notice */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-full">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-green-800 font-semibold">AI Prediction Generated!</span>
                    <div className="text-green-600 text-sm">Your smart stock recommendations are ready</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span>SUCCESS</span>
                </div>
              </div>
              <button
                onClick={clearPrediction}
                className="text-green-600 hover:text-green-800 font-medium bg-white px-3 py-1 rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
              >
                {t('newPrediction')}
              </button>
            </div>
          </div>

          {/* Prediction Results */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-400 to-blue-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">Stock Prediction Results</h1>
                  <p className="text-blue-100 mt-1">AI-powered recommendations for tomorrow's stock</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>AI GENERATED</span>
                  </div>
                  {/* <div className="flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
                    <span>REAL-TIME</span>
                  </div> */}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Suggested Stock */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Suggested Stock to Purchase</h3>
                  </div>
                  <div className="space-y-3">
                    {prediction.suggested_stock?.map((item, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-green-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-800">{item.item}</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer & Demand Info */}
                <div className="space-y-6">
                  {/* Estimated Customers */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">Estimated Customer Count</h3>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{prediction.estimated_customers}</div>
                    <p className="text-sm text-gray-600 mt-2">Expected customers for tomorrow</p>
                  </div>

                  {/* Product Demand Score */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">Product Demand Score</h3>
                    </div>
                    <div className="space-y-2">
                      {prediction.product_demand_forecast?.map((product, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-purple-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-800">{product.product}</span>
                            <span className="text-sm font-medium text-purple-600">
                              {product.expected_orders} orders
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <div className="font-medium mb-1">Ingredients needed:</div>
                            {Object.entries(product.ingredients_required || {}).map(([ingredient, qty]) => (
                              <div key={ingredient} className="flex justify-between">
                                <span>{ingredient}:</span>
                                <span>{qty}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tip for Today */}
              <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">One Tip for Today</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{prediction.daily_tip}</p>
              </div>

              {/* Offers */}
              {prediction.offers && prediction.offers.length > 0 && (
                <div className="mt-6 bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Recommended Offers</h3>
                  </div>
                  <div className="space-y-3">
                    {prediction.offers.map((offer, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-cyan-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-800">{offer.name}</span>
                          <span className="text-sm text-cyan-600">{offer.product}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="font-medium mb-1">Ingredients needed:</div>
                          {Object.entries(offer.estimated_qty_needed || {}).map(([ingredient, qty]) => (
                            <div key={ingredient} className="flex justify-between">
                              <span>{ingredient}:</span>
                              <span>{qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                                  <button
                    onClick={handleOrderNow}
                    className="flex-1 bg-gradient-to-r from-blue-400 to-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-500 hover:to-blue-900 transition-all duration-300 transform hover:scale-105 animate-bounce"
                  style={{ animationDuration: '2s' }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    {t('orderNow')}
                  </div>
                </button>
                
                <button
                  onClick={clearPrediction}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  {t('newPrediction')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 relative">
          {/* Floating AI Badge */}
          {/* <div className="absolute -top-4 -right-4 transform rotate-12">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce">
              NEW AI FEATURE
            </div>
          </div> */}
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Stock Predictor</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-400 to-blue-800 text-white text-xs font-semibold rounded-full animate-pulse shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                <span>AI</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-700 text-white text-xs font-semibold rounded-full shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <span>LIVE</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600">Enter your past 3 days of sales data to predict tomorrow's stock requirements</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium">Powered by Advanced AI</span>
          </div>
        </div>

        {/* Step Timeline */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                  step <= currentStep 
                    ? 'bg-gradient-to-r from-blue-400 to-blue-800 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-gradient-to-r from-blue-400 to-blue-800' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-600">
              Step {currentStep} of 3
            </span>
          </div>
          
          {/* Step Completion Status */}
          <div className="mt-4 flex justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  stepValidation[`day${step}`] ? 'bg-gradient-to-r from-blue-400 to-blue-800' : 'bg-gray-300'
                }`}></div>
                <span className="text-xs text-gray-600">
                  Day {step} {stepValidation[`day${step}`] ? '✓' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Day {currentStep} ({currentStep === 1 ? '3 days ago' : currentStep === 2 ? '2 days ago' : 'yesterday'})
            </h2>
            <p className="text-gray-600">Enter your sales and stock data for this day</p>
          </div>

          {/* Data Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Data Summary:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {[1, 2, 3].map((day) => {
                const dayData = formData[`day${day}`];
                const hasData = dayData.date || dayData.customersServed || dayData.weatherCondition || (dayData.itemsSold && dayData.itemsSold.length > 0);
                return (
                  <div key={day} className={`p-2 rounded ${hasData ? 'bg-blue-100 border border-blue-200' : 'bg-gray-100 border border-gray-200'}`}>
                    <div className="font-medium text-gray-700">Day {day}</div>
                    <div className="text-gray-600">
                      {hasData ? (
                        <>
                          <div>Date: {dayData.date || 'Not set'}</div>
                          <div>Customers: {dayData.customersServed || 'Not set'}</div>
                          <div>Weather: {dayData.weatherCondition || 'Not set'}</div>
                          <div>Items: {dayData.itemsSold?.length || 0} items</div>
                        </>
                      ) : (
                        <div className="text-gray-500">No data entered</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DayStepForm
            dayNumber={currentStep}
            data={formData[`day${currentStep}`]}
            onChange={(data) => handleFormDataChange(`day${currentStep}`, data)}
            onValidationChange={(isValid) => handleValidationChange(`day${currentStep}`, isValid)}
          />

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => handleStepChange(currentStep - 1)}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex gap-3">
              {currentStep < 3 ? (
                <button
                  onClick={() => handleStepChange(currentStep + 1)}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-400 to-blue-800 text-white rounded-lg font-medium hover:from-blue-500 hover:to-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Day
                </button>
              ) : (
                <button
                  onClick={handlePredict}
                  disabled={!canPredict() || loading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-400 to-blue-800 text-white rounded-lg font-medium hover:from-blue-500 hover:to-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Predicting...' : 'Predict Tomorrow\'s Stock'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Debug Info:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Current Step: {currentStep} of 3</div>
            <div>Can Proceed: {canProceed().toString()}</div>
            <div>Can Predict: {canPredict().toString()}</div>
            <div>Current Step Valid: {stepValidation[`day${currentStep}`].toString()}</div>
            <div>All Steps Valid: {(stepValidation.day1 && stepValidation.day2 && stepValidation.day3).toString()}</div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Form Data:</h4>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Test Data Button */}
        <div className="mt-4 text-center">
          <button
            onClick={addTestData}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Add Test Data
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Your Data</h3>
                <p className="text-gray-600 mb-4">Our AI is processing your sales patterns...</p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionPage; 