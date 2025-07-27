import React, { useState, useEffect } from 'react';

const QuantityModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  product, 
  maxQuantity = 999,
  title = "Select Quantity"
}) => {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  // Reset quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setError('');
    }
  }, [isOpen]);

  const handleQuantityChange = (value) => {
    const newQuantity = Math.max(1, Math.min(maxQuantity, value));
    setQuantity(newQuantity);
    setError('');
  };

  const handleConfirm = () => {
    if (quantity > maxQuantity) {
      setError(`Maximum available quantity is ${maxQuantity}`);
      return;
    }
    
    if (quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    onConfirm(quantity);
    onClose();
  };

  const handleIncrement = () => {
    if (quantity < maxQuantity) {
      handleQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      handleQuantityChange(quantity - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {product && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Price: ₹{product.pricePerUnit || product.price} per {product.unit}</span>
              <span>Available: {product.availableQuantity || product.quantity || 0} {product.unit}</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              min="1"
              max={maxQuantity}
              className="w-20 text-center border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            
            <button
              onClick={handleIncrement}
              disabled={quantity >= maxQuantity}
              className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Total Price:</span>
            <span className="font-semibold text-green-600">
              ₹{((product?.pricePerUnit || product?.price || 0) * quantity).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuantityModal; 