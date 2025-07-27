import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different supplier types
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const VendorMap = ({ nearbySuppliers = [] }) => {
  const navigate = useNavigate();
  // Default center (can be set to vendor's location)
  const vendorLocation = [12.9716, 77.5946]; // Bangalore as default

  // Use real supplier data from API
  const suppliers = nearbySuppliers.map(supplier => ({
    ...supplier,
    // Use coordinates from API or generate random ones if not available
    coordinates: supplier.coordinates || [
      vendorLocation[0] + (Math.random() - 0.5) * 0.1,
      vendorLocation[1] + (Math.random() - 0.5) * 0.1
    ]
  }));

  const getSupplierIcon = (supplier) => {
    if (supplier.rating >= 4.5) {
      return createCustomIcon('#10B981'); // Green for high-rated suppliers
    } else if (supplier.rating >= 4.0) {
      return createCustomIcon('#3B82F6'); // Blue for good suppliers
    } else {
      return createCustomIcon('#F59E0B'); // Yellow for average suppliers
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    return 'text-yellow-600';
  };

  return (
    <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Nearby Suppliers
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Find local suppliers and their available products
        </p>
      </div>
      <div className="p-6">
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={vendorLocation}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Vendor location marker */}
            <Marker position={vendorLocation}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-gray-900 mb-2">Your Location</h4>
                  <p className="text-sm text-gray-600">SupplyMitra Vendor</p>
                </div>
              </Popup>
            </Marker>

            {/* Supplier markers */}
            {suppliers.map((supplier) => (
              <Marker key={supplier.name} position={supplier.coordinates} icon={getSupplierIcon(supplier)}>
                <Popup>
                  <div className="p-2 min-w-[250px]">
                    <h4 className="font-semibold text-gray-900 mb-2">{supplier.name}</h4>
                    
                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${i < Math.floor(supplier.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className={`ml-2 font-medium ${getRatingColor(supplier.rating)}`}>
                        {supplier.rating}
                      </span>
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quality:</span>
                        <span className="font-medium">{supplier.quality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Speed:</span>
                        <span className="font-medium">{supplier.speed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reliability:</span>
                        <span className="font-medium">{supplier.reliability}</span>
                      </div>
                    </div>

                    {/* Location */}
                    <p className="text-sm text-gray-600 mb-3">
                      📍 {supplier.location}
                    </p>

                    {/* Products */}
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-900 mb-2">Available Products:</h5>
                      <div className="space-y-1">
                        {supplier.products.slice(0, 3).map((product) => (
                          <div key={product.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{product.image} {product.name}</span>
                            <span className="font-medium text-blue-600">₹{product.price}/{product.unit}</span>
                          </div>
                        ))}
                        {supplier.products.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{supplier.products.length - 3} more products
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => navigate(`/vendors/${encodeURIComponent(supplier.name)}/public`)}
                      className="w-full bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      View All Products
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        {/* Enhanced Legend */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Legend</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2 border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-600">High Rated (4.5+)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-600">Good Rated (4.0-4.4)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2 border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-600">Average Rated (&lt;4.0)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-500 rounded-full mr-2 border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-600">Your Location</span>
            </div>
          </div>
        </div>

        {/* Supplier Summary */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Supplier Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{suppliers.length}</div>
              <div className="text-gray-600">Total Suppliers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {suppliers.filter(s => s.rating >= 4.5).length}
              </div>
              <div className="text-gray-600">High Rated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {suppliers.reduce((total, s) => total + s.products.length, 0)}
              </div>
              <div className="text-gray-600">Total Products</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorMap; 