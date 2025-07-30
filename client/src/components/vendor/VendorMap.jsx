import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../../hooks/useLocation';
import { useVendorStore } from '../../stores/useVendorStore';
import { toast } from 'react-hot-toast';
import Map from '../common/Map';
import Loader from '../common/Loader';

const VendorMap = () => {
  const navigate = useNavigate();
  const { location, permissionStatus, requestLocation, calculateDistance, formatDistance, loading, error } = useLocation();
  const { suppliers, fetchSuppliers, loading: suppliersLoading } = useVendorStore();
  
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [nearbySuppliers, setNearbySuppliers] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [showUserLocationPopup, setShowUserLocationPopup] = useState(false);
  const [selectedMapMarker, setSelectedMapMarker] = useState(null);
  
  // Refs to prevent infinite loops
  const suppliersLoadedRef = useRef(false);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const fetchSuppliersRef = useRef(fetchSuppliers);

  // Update the ref when fetchSuppliers changes
  useEffect(() => {
    fetchSuppliersRef.current = fetchSuppliers;
  }, [fetchSuppliers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Single useEffect to handle all supplier and location logic
  useEffect(() => {
    if (!mountedRef.current) return;

    // Clear local loading if suppliers are already loaded
    if (suppliers.length > 0 && localLoading) {
      setLocalLoading(false);
    }

    // Calculate nearby suppliers when suppliers or location changes
    if (suppliers.length > 0) {
      
              const validSuppliers = suppliers.filter(s => {
          const lat = parseFloat(s.latitude);
          const lng = parseFloat(s.longitude);
          const isValid = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
          return isValid;
        });
      
      if (validSuppliers.length > 0) {
        const suppliersWithDistance = validSuppliers.map(supplier => {
          const lat = parseFloat(supplier.latitude);
          const lng = parseFloat(supplier.longitude);
          
          let distance = 0;
          let formattedDistance = 'Location available';
          
          if (location && location.latitude && location.longitude) {
            try {
              distance = calculateDistance(
                location.latitude,
                location.longitude,
                lat,
                lng
              );
              formattedDistance = formatDistance(distance);
            } catch (error) {
              formattedDistance = 'Location available';
            }
          } else {
            // When user location is not available, show suppliers without distance
            formattedDistance = 'Location available (enable location for distance)';
          }
          
          return {
            ...supplier,
            latitude: lat,
            longitude: lng,
            distance,
            formattedDistance
          };
        });
        
        setNearbySuppliers(suppliersWithDistance);
      } else {
        setNearbySuppliers([]);
      }
    } else {
      setNearbySuppliers([]);
    }
  }, [suppliers, location, permissionStatus, loading, error, localLoading]); // Added more dependencies

  // Handle location changes and set map center
  useEffect(() => {
    if (!mountedRef.current) return;

    if (location && location.latitude && location.longitude) {
      setMapCenter(location);
    } else if (nearbySuppliers.length > 0) {
      // If no user location but suppliers available, center on first supplier
      const firstSupplier = nearbySuppliers[0];
      setMapCenter({ 
        latitude: parseFloat(firstSupplier.latitude), 
        longitude: parseFloat(firstSupplier.longitude) 
      });
    } else if (permissionStatus === 'prompt') {
      setShowLocationPrompt(true);
      // Set a default map center (Mumbai) for better UX
      setMapCenter({ latitude: 19.076, longitude: 72.8777 });
    } else if (permissionStatus === 'denied') {
      // Set a default map center when permission is denied
      setMapCenter({ latitude: 19.076, longitude: 72.8777 });
    } else {
      // Set a default map center while waiting for location
      setMapCenter({ latitude: 19.076, longitude: 72.8777 });
    }
  }, [location, permissionStatus, nearbySuppliers]);

  // Load suppliers on component mount
  useEffect(() => {
    if (!mountedRef.current || loadingRef.current || suppliersLoadedRef.current) {
      return;
    }

    loadingRef.current = true;
    
    const loadSuppliers = async () => {
      try {
        await fetchSuppliersRef.current();
        suppliersLoadedRef.current = true;
        setLocalLoading(false);
      } catch (error) {
        toast.error('Failed to load suppliers');
        setLocalLoading(false);
      } finally {
        loadingRef.current = false;
      }
    };

    loadSuppliers();
  }, []); // Empty dependency array - only run once

  const handleLocationRequest = async () => {
    const newLocation = await requestLocation();
    if (newLocation) {
      setShowLocationPrompt(false);
      setMapCenter(newLocation);
      
      // Force recalculation of suppliers with new location
      setLocalLoading(false);
      
      toast.success(t('common.locationAccessGranted'));
    } else {
      toast.error(t('common.locationAccessDenied'));
    }
  };

  const handleSupplierClick = (supplier) => {
    setSelectedSupplier(supplier);
  };

  const handleViewDetails = (supplierId) => {
    navigate(`/supplier/${supplierId}`);
  };

  const handleClosePopup = () => {
    setSelectedSupplier(null);
  };

  const handleMarkerClick = (marker) => {
    setSelectedMapMarker(marker);
  };

  const renderLocationPrompt = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Enable Location Access</h3>
        <p className="text-gray-600 mb-4">
          Allow location access to see nearby suppliers and find the best deals in your area
        </p>
        <button
          onClick={handleLocationRequest}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Enable Location
        </button>
      </div>
    </div>
  );

  const renderSupplierPopup = () => {
    if (!selectedSupplier) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{selectedSupplier.businessName}</h3>
              <button
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Business Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Business Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {selectedSupplier.businessType}
                  </div>

                  {selectedSupplier.businessAddress && (
                    <div className="flex items-start text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{selectedSupplier.businessAddress}, {selectedSupplier.city}, {selectedSupplier.state} - {selectedSupplier.pincode}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 001.21-.502l4.493 1.498a1 1 0 00.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {selectedSupplier.phone}
                  </div>
                </div>
              </div>

              {/* Location & Distance */}
              {selectedSupplier.formattedDistance && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Location & Distance</h4>
                  <div className="flex items-center text-sm text-blue-600 font-medium">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {selectedSupplier.formattedDistance === 'Location available' 
                      ? '📍 Location available' 
                      : `${selectedSupplier.formattedDistance} away`
                    }
                  </div>
                  {selectedSupplier.latitude && selectedSupplier.longitude && (
                    <p className="text-xs text-gray-500 mt-1">
                      Coordinates: {selectedSupplier.latitude.toFixed(6)}, {selectedSupplier.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              )}

              {/* Rating & Performance */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Rating & Performance</h4>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <span className="mr-2">Rating:</span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= (selectedSupplier.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {selectedSupplier.rating || 'No rating yet'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Member since: {new Date(selectedSupplier.memberSince).toLocaleDateString()}
                </p>
              </div>

              {/* Order Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Available for orders:</span>
                    <span className="text-green-600 font-medium">Yes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery area:</span>
                    <span className="text-gray-700">Local & Regional</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum order:</span>
                    <span className="text-gray-700">Contact supplier</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment methods:</span>
                    <span className="text-gray-700">Cash, Online</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  handleViewDetails(selectedSupplier._id);
                  handleClosePopup();
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Full Profile
              </button>
              <button
                onClick={handleClosePopup}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSupplierList = () => (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Nearby Suppliers</h2>
        <div className="flex space-x-2">
          <button
                              onClick={() => {
                    suppliersLoadedRef.current = false;
                    loadingRef.current = false;
                    setLocalLoading(true);
                    fetchSuppliersRef.current();
                  }}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          {location && location.latitude && location.longitude && (
            <button
                              onClick={() => {
                  // Force recalculation by triggering the useEffect
                  setLocalLoading(false);
                }}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Update Distances
            </button>
          )}
        </div>
      </div>

      {/* Suppliers with location */}
      {nearbySuppliers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <h3 className="text-lg font-medium text-gray-900">
              Suppliers with Location ({nearbySuppliers.length})
            </h3>
          </div>
          <div className="space-y-3">
            {nearbySuppliers.map((supplier) => (
              <div
                key={supplier._id}
                onClick={() => handleSupplierClick(supplier)}
                className="flex items-center justify-between p-3 border border-green-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{supplier.businessName}</h4>
                  <p className="text-sm text-gray-600">{supplier.businessType}</p>
                  {supplier.formattedDistance && (
                    <p className="text-sm text-green-600 font-medium">
                      {supplier.formattedDistance === 'Location available' || supplier.formattedDistance === 'Location available (enable location for distance)'
                        ? '📍 Location available' 
                        : `${supplier.formattedDistance} away`
                      }
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  Click to view details
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suppliers without location */}
      {suppliers.length > 0 && (
        <div>
          <div className="flex items-center mb-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <h3 className="text-lg font-medium text-gray-900">
              Suppliers without Location ({suppliers.filter(s => {
                const lat = parseFloat(s.latitude);
                const lng = parseFloat(s.longitude);
                return isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0;
              }).length})
            </h3>
          </div>
          <div className="space-y-3">
            {suppliers
              .filter(supplier => {
                const lat = parseFloat(supplier.latitude);
                const lng = parseFloat(supplier.longitude);
                return isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0;
              })
              .map((supplier) => (
                <div
                  key={supplier._id}
                  onClick={() => handleSupplierClick(supplier)}
                  className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg hover:bg-yellow-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{supplier.businessName}</h4>
                    <p className="text-sm text-gray-600">{supplier.businessType}</p>
                    <p className="text-sm text-yellow-600 font-medium">📍 Location not added</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    Click to view details
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* No suppliers message */}
      {suppliers.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🏪</div>
          <p className="text-gray-600">No suppliers available</p>
        </div>
      )}
    </div>
  );

  // Loading state - only show loader if we're actually loading suppliers
  if (localLoading) {
    return <Loader message="Loading suppliers..." />;
  }

  // Check if we have any suppliers at all
  if (suppliers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Supplier Map</h1>
          <p className="text-gray-600">Find suppliers near your location</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            No Suppliers Available
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            There are currently no suppliers registered in the system. Please check back later or contact support if you believe this is an error.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-600 text-sm">
              💡 Tip: Suppliers need to complete their registration to appear in the system
            </p>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Page
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Supplier Map</h1>
        <p className="text-gray-600">Find suppliers near your location</p>
      </div>



      {/* Map and Supplier List Section */}
      <div className="space-y-6">
        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Map View</h2>
            {location && location.latitude && location.longitude && (
              <button
                onClick={() => {
                  // Force recalculation by triggering the useEffect
                  setLocalLoading(false);
                }}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                {t("common.refreshMap")}
              </button>
            )}
          </div>
          <div className="relative">
            {mapCenter ? (
              // Show map if suppliers exist with valid location data
              suppliers.filter(s => {
                const lat = parseFloat(s.latitude);
                const lng = parseFloat(s.longitude);
                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
              }).length > 0 ? (
                <div className="relative">
                  <Map
                    latitude={mapCenter.latitude}
                    longitude={mapCenter.longitude}
                    height="500px"
                    showUserLocation={true}
                    markers={nearbySuppliers.map(supplier => ({
                      ...supplier,
                      name: supplier.businessName,
                      type: 'supplier'
                    }))}
                    onMarkerClick={handleMarkerClick}
                    zoom={12}
                  />
                  
                  {/* User Location Popup */}
                  {showUserLocationPopup && (
                    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 border border-blue-200 max-w-xs">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">Your Location</h3>
                        <button
                          onClick={() => setShowUserLocationPopup(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">SupplyMitra Vendor</p>
                      <p className="text-xs text-gray-500">
                        {location?.latitude?.toFixed(6)}, {location?.longitude?.toFixed(6)}
                      </p>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          📍 {nearbySuppliers.length} supplier(s) nearby
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Supplier Location Popup */}
                  {selectedMapMarker && (
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-green-200 max-w-xs">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{selectedMapMarker.businessName}</h3>
                        <button
                          onClick={() => setSelectedMapMarker(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{selectedMapMarker.businessType}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        📍 {selectedMapMarker.businessAddress}, {selectedMapMarker.city}
                      </p>
                      {selectedMapMarker.formattedDistance && (
                        <p className="text-xs text-green-600 font-medium mb-2">
                          {selectedMapMarker.formattedDistance === 'Location available' 
                            ? '📍 Location available' 
                            : `${selectedMapMarker.formattedDistance} away`
                          }
                        </p>
                      )}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">📞 {selectedMapMarker.phone}</p>
                        <p className="text-xs text-gray-500">
                          ⭐ Rating: {selectedMapMarker.rating || 'No rating yet'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleSupplierClick(selectedMapMarker)}
                        className="mt-3 w-full bg-green-600 text-white text-xs py-2 px-3 rounded hover:bg-green-700 transition-colors"
                      >
                        View Full Details
                      </button>
                    </div>
                  )}
                  
                  {/* User Location Toggle Button */}
                  <button
                    onClick={() => setShowUserLocationPopup(!showUserLocationPopup)}
                    className="absolute bottom-4 left-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    title="Toggle Your Location Info"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              ) : suppliers.filter(s => {
                const lat = parseFloat(s.latitude);
                const lng = parseFloat(s.longitude);
                return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
              }).length > 0 ? (
                <>
                  {/* Map with user location but no supplier markers */}
                  <div className="h-[500px] bg-gray-100 rounded-lg">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.longitude-0.1},${mapCenter.latitude-0.1},${mapCenter.longitude+0.1},${mapCenter.latitude+0.1}&layer=mapnik&marker=${mapCenter.latitude},${mapCenter.longitude}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  
                  {/* Overlay for suppliers without location data */}
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md mx-4">
                      <div className="text-center">
                        {/* Location data missing icon */}
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          Enable Location Access
                        </h3>
                        
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          We found {suppliers.filter(s => {
                            const lat = parseFloat(s.latitude);
                            const lng = parseFloat(s.longitude);
                            return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
                          }).length} supplier(s) with location data. Enable location access to see them on the map and calculate distances.
                        </p>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-blue-600 text-sm">
                            💡 Tip: Enable location access to see suppliers on the map and get distance calculations
                          </p>
                        </div>
                        
                        <button
                          onClick={handleLocationRequest}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Enable Location Access
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Map with user location but no suppliers */}
                  <div className="h-[500px] bg-gray-100 rounded-lg">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.longitude-0.1},${mapCenter.latitude-0.1},${mapCenter.longitude+0.1},${mapCenter.latitude+0.1}&layer=mapnik&marker=${mapCenter.latitude},${mapCenter.longitude}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight="0"
                      marginWidth="0"
                      style={{ borderRadius: '8px' }}
                    />
                  </div>
                  
                  {/* Overlay for no suppliers found */}
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md mx-4">
                      <div className="text-center">
                        {/* No suppliers icon */}
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          No Suppliers Found
                        </h3>
                        
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          No suppliers are currently available in the system. Please check back later.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )
            ) : (
              <>
                {/* Default map without location */}
                <div className="h-[500px] bg-gray-100 rounded-lg">
                  <iframe
                    src="https://www.openstreetmap.org/export/embed.html?bbox=72.8,18.9,73.2,19.2&layer=mapnik&marker=19.076,72.8777"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    style={{ borderRadius: '8px' }}
                  />
                </div>
                
                {/* Glass overlay for location permission */}
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md mx-4">
                    <div className="text-center">
                      {/* Location icon with gradient */}
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        Enable Location Access
                      </h3>
                      
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        Allow location access to discover suppliers near you and find the best deals in your area with real-time distance calculations.
                      </p>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-blue-600 text-sm">
                          Your location is only used to show nearby suppliers and calculate distances
                        </p>
                      </div>
                      
                      <button
                        onClick={handleLocationRequest}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Allow Location Access
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Supplier List Section */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          {renderSupplierList()}
        </div>
      </div>

      {/* Popups */}
      {renderSupplierPopup()}
    </div>
  );
};

export default VendorMap; 