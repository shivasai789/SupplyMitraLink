import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from '../../hooks/useLocation';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color = 'blue', number = null) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
      ">
        ${number || ''}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30]
  });
};

// Component to handle map center updates
const MapUpdater = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
};

const Map = ({ 
  latitude, 
  longitude, 
  height = '500px', 
  width = '100%',
  showUserLocation = false,
  markers = [], // Array of markers to display
  className = "",
  onLocationClick = null,
  onMarkerClick = null,
  zoom = 13
}) => {
  const { permissionStatus, requestLocation } = useLocation();
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);

  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (showUserLocation && permissionStatus === 'granted') {
      getUserLocation();
    }
  }, [showUserLocation, permissionStatus]);

  const getUserLocation = async () => {
    setIsLoading(true);
    try {
      const location = await requestLocation();
      if (location) {
        setUserLocation(location);
        setMapCenter([location.latitude, location.longitude]);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationRequest = async () => {
    await getUserLocation();
  };

  const renderPermissionOverlay = () => {
    if (permissionStatus === 'granted') return null;

    return (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
        <div className="text-center p-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-3">Location access required</p>
          <button
            onClick={handleLocationRequest}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Getting Location...' : 'Enable Location'}
          </button>
        </div>
      </div>
    );
  };

  const renderMarkersLegend = () => {
    if (markers.length === 0) return null;

    return (
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs shadow-lg z-40">
        <div className="font-medium text-gray-900 mb-1">Markers</div>
        <div className="space-y-1">
          {markers.map((marker, index) => (
            <div key={index} className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600">
                {marker.name || marker.businessName || `Marker ${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!mapCenter) {
    return (
      <div 
        className={`relative rounded-lg overflow-hidden ${className}`}
        style={{ height, width }}
      >
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
            </div>
            <p className="text-gray-500">Map loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-lg overflow-hidden ${className}`}
      style={{ height, width }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Update map center when props change */}
        <MapUpdater center={mapCenter} />
        
        {/* User Location Marker */}
        {userLocation && showUserLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={createCustomIcon('#3B82F6', 'U')}
          >
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-blue-600">Your Location</div>
                <div className="text-sm text-gray-600">
                  {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Custom Markers */}
        {markers.map((marker, index) => {
          if (!marker.latitude || !marker.longitude) {
            return null;
          }
          
          const markerColor = marker.type === 'supplier' ? '#10B981' : 
                             marker.type === 'order' ? '#F59E0B' : '#3B82F6';
          
          return (
            <Marker
              key={index}
              position={[marker.latitude, marker.longitude]}
              icon={createCustomIcon(markerColor, index + 1)}
              eventHandlers={{
                click: () => onMarkerClick?.(marker)
              }}
            >
                             <Popup>
                 <div className="min-w-48">
                   <div className="font-semibold text-gray-900 mb-2">
                     {marker.name || marker.businessName || `Location ${index + 1}`}
                   </div>
                   
                   {marker.orderStatus && (
                     <div className="text-sm text-gray-600 mb-1">
                       <span className="font-medium">Order Status:</span> 
                       <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                         marker.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                         marker.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                         marker.orderStatus === 'processing' ? 'bg-purple-100 text-purple-800' :
                         marker.orderStatus === 'shipped' ? 'bg-orange-100 text-orange-800' :
                         marker.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                         marker.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                         'bg-gray-100 text-gray-800'
                       }`}>
                         {marker.orderStatus}
                       </span>
                     </div>
                   )}
                   
                   {marker.businessType && (
                     <div className="text-sm text-gray-600 mb-1">
                       <span className="font-medium">Type:</span> {marker.businessType}
                     </div>
                   )}
                   
                   {marker.businessAddress && (
                     <div className="text-sm text-gray-600 mb-1">
                       <span className="font-medium">Address:</span> {marker.businessAddress}
                     </div>
                   )}
                   
                   {marker.city && (
                     <div className="text-sm text-gray-600 mb-1">
                       <span className="font-medium">City:</span> {marker.city}
                     </div>
                   )}
                   
                   {marker.distance && (
                     <div className="text-sm text-blue-600 font-medium">
                       Distance: {marker.distance}
                     </div>
                   )}
                   
                   {marker.formattedDistance && (
                     <div className="text-sm text-blue-600 font-medium">
                       Distance: {marker.formattedDistance}
                     </div>
                   )}
                   
                   <div className="text-xs text-gray-500 mt-2">
                     {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
                   </div>
                 </div>
               </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {renderPermissionOverlay()}
      {renderMarkersLegend()}
      
      {/* Location Info */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs shadow-lg z-40">
        <div className="font-medium text-gray-900">Center Location</div>
        <div className="text-gray-600">
          {mapCenter[0].toFixed(6)}, {mapCenter[1].toFixed(6)}
        </div>
      </div>
    </div>
  );
};

export default Map; 