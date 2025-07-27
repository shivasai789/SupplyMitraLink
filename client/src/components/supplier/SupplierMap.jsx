import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different order types
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const SupplierMap = ({ orders = [] }) => {
  // Default center (can be set to supplier's location)
  const supplierLocation = [12.9716, 77.5946]; // Bangalore as default

  // Transform orders to map markers with locations
  const mapOrders = orders.length > 0 ? orders.map((order) => {
    // Use real coordinates if available, otherwise generate random ones
    const coordinates = order.coordinates || {
      latitude: supplierLocation[0] + (Math.random() - 0.5) * 0.1,
      longitude: supplierLocation[1] + (Math.random() - 0.5) * 0.1
    };

    return {
      ...order,
      location: [coordinates.latitude, coordinates.longitude],
      customerName: order.vendorName || 'Unknown Vendor',
      items: order.materialName || 'Unknown Material',
      total: `₹${order.totalAmount}`,
      isLocal: order.isLocal || order.distance <= 5,
      distance: order.distance || Math.random() * 10
    };
  }) : [
    // Fallback sample data when no orders are available
    {
      id: 1,
      customerName: 'Fresh Market',
      items: 'Fresh Tomatoes, Onions',
      total: '₹2,500',
      location: [12.9716, 77.5946],
      status: 'pending',
      isLocal: true
    },
    {
      id: 2,
      customerName: 'Green Grocery',
      items: 'Potatoes, Bananas',
      total: '₹1,800',
      location: [12.9816, 77.6046],
      status: 'confirmed',
      isLocal: true
    },
    {
      id: 3,
      customerName: 'Organic Store',
      items: 'Fresh Tomatoes, Potatoes, Onions',
      total: '₹3,200',
      location: [13.0716, 77.6946],
      status: 'delivered',
      isLocal: false
    }
  ];

  const getMarkerIcon = (order) => {
    if (order.status === 'confirmed') {
      return createCustomIcon('#10B981'); // Green for confirmed
    } else if (order.isLocal) {
      return createCustomIcon('#3B82F6'); // Blue for local
    } else {
      return createCustomIcon('#F59E0B'); // Yellow for other
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-green-500';
      case 'packed': return 'bg-purple-500';
      case 'in_transit': return 'bg-orange-500';
      case 'out_for_delivery': return 'bg-indigo-500';
      case 'delivered': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'packed': return 'Packed';
      case 'in_transit': return 'In Transit';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getOrderType = (order) => {
    if (order.status === 'confirmed') return 'Confirmed Order';
    return order.isLocal ? 'Local Order (≤5km)' : 'Remote Order (>5km)';
  };

  return (
    <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Order Locations ({mapOrders.length} orders)
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          View all your customer orders on the map
        </p>
      </div>
      <div className="p-6">
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={supplierLocation}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Supplier location marker */}
            <Marker position={supplierLocation}>
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-gray-900 mb-2">Your Location</h4>
                  <p className="text-sm text-gray-600">SupplyMitra Supplier</p>
                </div>
              </Popup>
            </Marker>

            {/* Order markers */}
            {mapOrders.map((order) => (
              <Marker key={order.id} position={order.location} icon={getMarkerIcon(order)}>
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h4 className="font-semibold text-gray-900 mb-2">{order.customerName}</h4>
                    <div className="mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)} text-white`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Type:</strong> {getOrderType(order)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Items:</strong> {order.items}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Total:</strong> {order.total}
                    </p>
                    {order.distance && (
                      <p className="text-sm text-gray-600">
                        <strong>Distance:</strong> {order.distance.toFixed(1)} km
                      </p>
                    )}
                    {order.orderDate && (
                      <p className="text-sm text-gray-600">
                        <strong>Order Date:</strong> {new Date(order.orderDate).toLocaleDateString()}
                      </p>
                    )}
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
              <span className="text-sm text-gray-600">Confirmed Orders</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-600">Local Orders (≤5km)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2 border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-600">Remote Orders (>5km)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-500 rounded-full mr-2 border-2 border-white shadow-sm"></div>
              <span className="text-sm text-gray-600">Your Location</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierMap; 