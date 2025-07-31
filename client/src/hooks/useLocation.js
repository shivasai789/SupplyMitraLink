import { useState, useEffect } from "react";
import { 
  saveLocationToStorage, 
  getLocationFromStorage, 
  clearLocationFromStorage,
  calculateDistance as calculateDistanceUtil,
  formatDistance as formatDistanceUtil
} from "../utils/locationUtils";

export function useLocation() {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  // Get user's saved location from localStorage
  const getSavedLocation = () => {
    return getLocationFromStorage();
  };

  useEffect(() => {
    // First, check if we have saved location data
    const savedLocation = getSavedLocation();
    if (savedLocation) {
      setLocation({
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude,
        error: null,
        loading: false,
      });
      setPermissionStatus(savedLocation.permissionStatus);
      return; // Don't request location if we have saved data
    }

    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        loading: false,
      }));
      setPermissionStatus('denied');
      return;
    }

    // Check permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state);
        if (result.state === 'granted') {
          getCurrentLocation();
        }
      });
    } else {
      // Fallback for browsers that don't support permissions API
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
        setPermissionStatus('granted');
      },
      (error) => {
        setLocation((prev) => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
        setPermissionStatus('denied');
      }
    );
  };

  const requestLocation = async () => {
    setLocation(prev => ({ ...prev, loading: true }));
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            error: null,
            loading: false,
          };
          setLocation(newLocation);
          setPermissionStatus('granted');
          resolve(newLocation);
        },
        (error) => {
          const errorLocation = {
            latitude: null,
            longitude: null,
            error: error.message,
            loading: false,
          };
          setLocation(errorLocation);
          setPermissionStatus('denied');
          resolve(null);
        }
      );
    });
  };

  const saveLocationToStorageHook = (locationData) => {
    return saveLocationToStorage(locationData);
  };

  const clearLocationFromStorageHook = () => {
    return clearLocationFromStorage();
  };

  const refreshLocationFromProfile = () => {
    const savedLocation = getSavedLocation();
    if (savedLocation) {
      setLocation({
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude,
        error: null,
        loading: false,
      });
      setPermissionStatus(savedLocation.permissionStatus);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    return calculateDistanceUtil(lat1, lon1, lat2, lon2);
  };

  const formatDistance = (distance) => {
    return formatDistanceUtil(distance);
  };

  return {
    location,
    permissionStatus,
    requestLocation,
    refreshLocationFromProfile,
    saveLocationToStorage: saveLocationToStorageHook,
    clearLocationFromStorage: clearLocationFromStorageHook,
    calculateDistance,
    formatDistance,
    loading: location.loading,
    error: location.error,
    latitude: location.latitude,
    longitude: location.longitude,
  };
} 