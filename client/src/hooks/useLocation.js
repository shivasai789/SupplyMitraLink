import { useState, useEffect } from "react";

export function useLocation() {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  useEffect(() => {
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

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  };

  return {
    location,
    permissionStatus,
    requestLocation,
    calculateDistance,
    formatDistance,
    loading: location.loading,
    error: location.error,
    latitude: location.latitude,
    longitude: location.longitude,
  };
} 