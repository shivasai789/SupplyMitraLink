import React, { useState, useEffect, useRef } from 'react';
import locationService from '../../services/locationService';
import { toast } from 'react-hot-toast';

const LocationPicker = ({ 
  onLocationChange, 
  onPermissionChange,
  initialLatitude = null, 
  initialLongitude = null,
  showMap = true,
  className = "",
  onSave = null,
  showSaveButton = false,
  isSaving = false
}) => {
  const [location, setLocation] = useState({
    latitude: initialLatitude,
    longitude: initialLongitude
  });
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    checkLocationSupport();
    checkPermissionStatus();
  }, []);

  useEffect(() => {
    // Call permission change callback when permission status changes
    if (permissionStatus) {
      onPermissionChange?.(permissionStatus);
    }
  }, [permissionStatus, onPermissionChange]);

  useEffect(() => {
    if (location.latitude && location.longitude && showMap) {
      initializeMap();
    }
  }, [location, showMap]);

  const checkLocationSupport = () => {
    const supported = locationService.isGeolocationSupported();
    setIsSupported(supported);
    if (!supported) {
      setPermissionStatus('unsupported');
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const status = await locationService.getPermissionStatus();
      setPermissionStatus(status);
      onPermissionChange?.(status);
    } catch (error) {
      console.error('Error checking permission status:', error);
      setPermissionStatus('prompt');
      onPermissionChange?.('prompt');
    }
  };

  const requestLocationPermission = async () => {
    setIsLoading(true);
    try {
      const result = await locationService.requestPermission();
      setPermissionStatus(result.status);
      onPermissionChange?.(result.status);
      
      if (result.status === 'granted' && result.location) {
        const newLocation = {
          latitude: result.location.latitude,
          longitude: result.location.longitude
        };
        setLocation(newLocation);
        onLocationChange?.(newLocation);
        toast.success('Location access granted!');
      } else {
        toast.error('Location permission denied');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      toast.error('Failed to get location');
      setPermissionStatus('denied');
      onPermissionChange?.('denied');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMap = () => {
    if (!showMap || !mapRef.current) return;

    // Simple map implementation using OpenStreetMap
    const mapContainer = mapRef.current;
    const lat = location.latitude;
    const lng = location.longitude;
    const zoom = 15;

    // Clear previous map
    mapContainer.innerHTML = '';

    // Create iframe for OpenStreetMap
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
    iframe.width = '100%';
    iframe.height = '300';
    iframe.frameBorder = '0';
    iframe.scrolling = 'no';
    iframe.marginHeight = '0';
    iframe.marginWidth = '0';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';

    mapContainer.appendChild(iframe);
  };

  const handleManualLocationInput = (field, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const newLocation = {
        ...location,
        [field]: numValue
      };
      setLocation(newLocation);
      onLocationChange?.(newLocation);
    }
  };

  const renderPermissionPrompt = () => (
    <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Enable Location Access</h3>
      <p className="text-gray-600 mb-4">
        Allow location access to see nearby suppliers and get better recommendations
      </p>
      <button
        onClick={requestLocationPermission}
        disabled={isLoading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Getting Location...' : 'Enable Location'}
      </button>
    </div>
  );

  const renderPermissionDenied = () => (
    <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Access Denied</h3>
      <p className="text-gray-600 mb-4">
        Location access is required for better experience. Please enable it in your browser settings.
      </p>
      <button
        onClick={requestLocationPermission}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  const renderMap = () => (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden"
      />
      
      {/* Blur overlay when permission is denied */}
      {permissionStatus === 'denied' && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">Location access required</p>
            <button
              onClick={requestLocationPermission}
              className="mt-2 px-4 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              Enable Location
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderManualInput = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Latitude
        </label>
        <input
          type="number"
          step="any"
          value={location.latitude || ''}
          onChange={(e) => handleManualLocationInput('latitude', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter latitude"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Longitude
        </label>
        <input
          type="number"
          step="any"
          value={location.longitude || ''}
          onChange={(e) => handleManualLocationInput('longitude', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter longitude"
        />
      </div>
    </div>
  );

  if (!isSupported) {
    return (
      <div className={`text-center p-6 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Not Supported</h3>
        <p className="text-gray-600 mb-4">
          Your browser doesn't support location services. You can manually enter your coordinates.
        </p>
        {renderManualInput()}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Permission Status Display */}
      {permissionStatus === 'prompt' && renderPermissionPrompt()}
      {permissionStatus === 'denied' && renderPermissionDenied()}
      
      {/* Map Display */}
      {showMap && (location.latitude && location.longitude) && renderMap()}
      
      {/* Manual Input */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Location Coordinates</h4>
        {renderManualInput()}
      </div>
      
      {/* Current Location Button */}
      {permissionStatus === 'granted' && (
        <button
          onClick={requestLocationPermission}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Getting Location...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use Current Location
            </>
          )}
        </button>
      )}
      
      {/* Save Button */}
      {showSaveButton && location.latitude && location.longitude && (
        <button
          onClick={() => onSave?.(location)}
          disabled={isSaving}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving Location...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Location
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default LocationPicker; 