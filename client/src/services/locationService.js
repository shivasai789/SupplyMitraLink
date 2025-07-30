/**
 * Location Service
 * Handles browser geolocation and location permissions
 */

class LocationService {
  constructor() {
    this.isSupported = 'geolocation' in navigator;
  }

  /**
   * Check if geolocation is supported by the browser
   */
  isGeolocationSupported() {
    return this.isSupported;
  }

  /**
   * Get current location permission status
   */
  async getPermissionStatus() {
    if (!this.isSupported) {
      return 'unsupported';
    }

    try {
      // Check if we can get permission status
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state; // 'granted', 'denied', or 'prompt'
      } else {
        // Fallback for browsers that don't support permissions API
        return 'prompt';
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      return 'prompt';
    }
  }

  /**
   * Request location permission and get current position
   */
  async getCurrentLocation(options = {}) {
    if (!this.isSupported) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'Unknown location error';
          }
          
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }

  /**
   * Watch user's location (for real-time updates)
   */
  watchLocation(callback, options = {}) {
    if (!this.isSupported) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        callback(locationData);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      defaultOptions
    );
  }

  /**
   * Clear location watch
   */
  clearWatch(watchId) {
    if (this.isSupported && watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /**
   * Request location permission explicitly
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Geolocation is not supported by this browser');
    }

    try {
      // Try to get current position to trigger permission request
      const location = await this.getCurrentLocation();
      return {
        status: 'granted',
        location
      };
    } catch (error) {
      if (error.message.includes('permission denied')) {
        return {
          status: 'denied',
          location: null
        };
      }
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Format distance for display
   */
  formatDistance(distance) {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }
}

export default new LocationService(); 