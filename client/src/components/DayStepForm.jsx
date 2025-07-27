import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const DayStepForm = ({ 
  dayNumber, 
  data, 
  onChange, 
  errors = {}, 
  onValidationChange 
}) => {
  const { t } = useTranslation();
  const [newItem, setNewItem] = useState({ name: '', soldQty: '', leftoverQty: '' });
  const [newPopularItem, setNewPopularItem] = useState('');
  const [localErrors, setLocalErrors] = useState({});

  const weatherOptions = [
    'Sunny', 'Rainy', 'Cloudy', 'Hot', 'Cold', 'Windy', 'Stormy', 'Foggy'
  ];

  useEffect(() => {
    validateStep();
  }, [data]);

  const validateField = (field, value) => {
    switch (field) {
      case 'date':
        return !value ? 'Date is required' : '';
      case 'customersServed':
        return (value === undefined || value === null || value === '') ? 'Customers served is required' : '';
      case 'weatherCondition':
        return !value ? 'Weather condition is required' : '';
      case 'itemsSold':
        return (!value || value.length === 0) ? 'At least one item is required' : '';
      default:
        return '';
    }
  };

  const validateStep = () => {
    const newErrors = {};
    
    // Validate required fields
    newErrors.date = validateField('date', data.date);
    newErrors.customersServed = validateField('customersServed', data.customersServed);
    newErrors.weatherCondition = validateField('weatherCondition', data.weatherCondition);
    newErrors.itemsSold = validateField('itemsSold', data.itemsSold);
    
    // Validate items
    if (data.itemsSold && data.itemsSold.length > 0) {
      data.itemsSold.forEach((item, index) => {
        if (!item.name || item.name.trim() === '') {
          newErrors[`item_${index}_name`] = 'Item name is required';
        }
        if (item.quantity < 0) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be 0 or greater';
        }
      });
    }
    
    setLocalErrors(newErrors);
    onValidationChange(Object.keys(newErrors).filter(key => newErrors[key]).length === 0);
  };

  const handleFieldChange = (field, value) => {
    const newData = { ...data, [field]: value };
    onChange(newData);
  };

  const handleBlur = (field, value) => {
    const error = validateField(field, value);
    setLocalErrors(prev => ({ ...prev, [field]: error }));
  };

  const addItem = () => {
    if (newItem.name && newItem.soldQty >= 0) {
      const item = {
        name: newItem.name.trim(),
        quantity: parseInt(newItem.soldQty) || 0,
        leftoverQty: parseInt(newItem.leftoverQty) || 0
      };
      
      const newItems = [...(data.itemsSold || []), item];
      handleFieldChange('itemsSold', newItems);
      setNewItem({ name: '', soldQty: '', leftoverQty: '' });
    }
  };

  const removeItem = (index) => {
    const newItems = data.itemsSold.filter((_, i) => i !== index);
    handleFieldChange('itemsSold', newItems);
  };

  const addPopularItem = () => {
    if (newPopularItem.trim()) {
      const newItems = [...(data.popularItems || []), newPopularItem.trim()];
      handleFieldChange('popularItems', newItems);
      setNewPopularItem('');
    }
  };

  const removePopularItem = (index) => {
    const newItems = data.popularItems.filter((_, i) => i !== index);
    handleFieldChange('popularItems', newItems);
  };

  const allErrors = { ...errors, ...localErrors };

  return (
    <div className="space-y-6">
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date *
        </label>
        <input
          type="date"
          value={data.date || ''}
          onChange={(e) => handleFieldChange('date', e.target.value)}
          onBlur={(e) => handleBlur('date', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            allErrors.date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {allErrors.date && (
          <p className="mt-1 text-sm text-red-500">{allErrors.date}</p>
        )}
      </div>

      {/* Customers Served */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Customers Served *
        </label>
        <input
          type="number"
          min="0"
          value={data.customersServed || ''}
          onChange={(e) => handleFieldChange('customersServed', parseInt(e.target.value) || 0)}
          onBlur={(e) => handleBlur('customersServed', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            allErrors.customersServed ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {allErrors.customersServed && (
          <p className="mt-1 text-sm text-red-500">{allErrors.customersServed}</p>
        )}
      </div>

      {/* Weather Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Weather Condition *
        </label>
        <select
          value={data.weatherCondition || ''}
          onChange={(e) => handleFieldChange('weatherCondition', e.target.value)}
          onBlur={(e) => handleBlur('weatherCondition', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            allErrors.weatherCondition ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select weather condition</option>
          {weatherOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {allErrors.weatherCondition && (
          <p className="mt-1 text-sm text-red-500">{allErrors.weatherCondition}</p>
        )}
      </div>

      {/* Items Sold & Leftovers */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Items Sold & Leftovers *
        </label>
        
        {/* Existing Items */}
        {data.itemsSold && data.itemsSold.length > 0 && (
          <div className="mb-4 space-y-2">
            {data.itemsSold.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="flex-1 font-medium">{item.name}</span>
                <span className="text-sm text-gray-600">Sold: {item.quantity}</span>
                <span className="text-sm text-gray-600">Leftover: {item.leftoverQty || 0}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Item */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            min="0"
            placeholder="Sold qty"
            value={newItem.soldQty}
            onChange={(e) => setNewItem(prev => ({ ...prev, soldQty: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            min="0"
            placeholder="Leftover qty"
            value={newItem.leftoverQty}
            onChange={(e) => setNewItem(prev => ({ ...prev, leftoverQty: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={!newItem.name || newItem.soldQty < 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            title="Click to add this item"
          >
            Add
          </button>
        </div>
        
        <p className="mt-2 text-sm text-gray-500">
          💡 Tip: Fill in the item details above and click the "Add" button to add it to your list
        </p>
        
        {allErrors.itemsSold && (
          <p className="mt-1 text-sm text-red-500">{allErrors.itemsSold}</p>
        )}
      </div>

      {/* Popular Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Popular Items
        </label>
        
        {/* Existing Popular Items */}
        {data.popularItems && data.popularItems.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {data.popularItems.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removePopularItem(index)}
                  className="text-green-600 hover:text-green-800"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add New Popular Item */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Popular item name"
            value={newPopularItem}
            onChange={(e) => setNewPopularItem(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addPopularItem}
            disabled={!newPopularItem.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            title="Click to add this popular item"
          >
            Add
          </button>
        </div>
        
        <p className="mt-2 text-sm text-gray-500">
          💡 Tip: Type a popular item name and click the "Add" button to add it
        </p>
      </div>

      {/* Local Events */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Local Events
        </label>
        <textarea
          placeholder="Any local events that might have affected sales..."
          value={data.localEvents || ''}
          onChange={(e) => handleFieldChange('localEvents', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
};

export default DayStepForm; 