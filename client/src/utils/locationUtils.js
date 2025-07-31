// Location utility functions

/**
 * Save location data to localStorage
 * @param {Object} locationData - Object containing latitude, longitude, and permissionStatus
 */
export const saveLocationToStorage = (locationData) => {
  try {
    localStorage.setItem('user-location', JSON.stringify(locationData));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get location data from localStorage
 * @returns {Object|null} Location data or null if not found
 */
export const getLocationFromStorage = () => {
  try {
    const locationData = localStorage.getItem('user-location');
    if (locationData) {
      const parsed = JSON.parse(locationData);
      return parsed;
    }
  } catch (error) {
    // Error getting location from localStorage
  }
  return null;
};

/**
 * Clear location data from localStorage
 */
export const clearLocationFromStorage = () => {
  try {
    localStorage.removeItem('user-location');
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if location data exists in localStorage
 * @returns {boolean} True if location data exists
 */
export const hasLocationInStorage = () => {
  return getLocationFromStorage() !== null;
};

/**
 * Validate location coordinates
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {boolean} True if coordinates are valid
 */
export const validateCoordinates = (latitude, longitude) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  
  // Check if coordinates are within valid ranges
  if (latitude < -90 || latitude > 90) {
    return false;
  }
  
  if (longitude < -180 || longitude > 180) {
    return false;
  }
  
  return true;
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else {
    return `${distance.toFixed(1)}km`;
  }
}; 