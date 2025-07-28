import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useTranslation } from "react-i18next";
import SupplierHeader from "./SupplierHeader";
import { useSupplierStore } from "../../stores/useSupplierStore";
import { toast } from "react-hot-toast";
import Loader from "../common/Loader";

const SupplierItems = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // Use supplier store
  const {
    materials: items,
    loading,
    error,
    fetchMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    uploadImages,
  } = useSupplierStore();

  // All state hooks must be declared before any conditional returns
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    unit: "kg",
    category: "Vegetables",
    images: [],
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch materials data on component mount and when user changes
  useEffect(() => {
    const loadMaterials = async () => {
      if (user?.token) {
        try {
          const response = await fetchMaterials();
        } catch (error) {
          toast.error("Failed to fetch materials: " + error.message);
        }
      }
    };

    // Always try to load materials when component mounts or user changes
    loadMaterials();
  }, [user?.token, fetchMaterials]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SupplierHeader />
        <main className="p-6">
          <div className="flex items-center justify-center h-64">
            <Loader text="Loading materials..." />
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SupplierHeader />
        <main className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Materials</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => fetchMaterials()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleAddItem = async () => {
    if (formData.name && formData.price && formData.quantity) {
      try {
        const newItem = {
          name: formData.name,
          pricePerUnit: parseFloat(formData.price),
          availableQuantity: parseInt(formData.quantity),
          unit: formData.unit,
          category: formData.category || 'Vegetables', // Default to Vegetables if not provided
          images: formData.images,
        };
        await createMaterial(newItem);
        // Refresh the materials list after successful creation
        await fetchMaterials();
        toast.success("Item added successfully!");
        setFormData({
          name: "",
          price: "",
          quantity: "",
          unit: "kg",
          category: "Vegetables",
          images: [],
        });
        setSelectedFiles([]);
        setUploadedImages([]);
        setShowAddForm(false);
      } catch (error) {
        toast.error("Failed to add item: " + error.message);
      }
    } else {
      toast.error("Please fill in all required fields (name, price, quantity)");
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: (item.pricePerUnit || item.price).toString(),
      quantity: (item.availableQuantity || item.quantity).toString(),
      unit: item.unit,
      category: item.category,
      images: item.images || [],
    });
    setUploadedImages(item.images || []);
    setSelectedFiles([]);
    setShowAddForm(true);
  };

  const handleUpdateItem = async () => {
    if (formData.name && formData.price && formData.quantity) {
      try {
        const itemId = editingItem._id || editingItem.id;
        if (!itemId) {
          toast.error("Error: Item ID is missing. Cannot update item.");
          return;
        }
        
        const updatedItem = {
          name: formData.name,
          pricePerUnit: parseFloat(formData.price),
          availableQuantity: parseInt(formData.quantity),
          unit: formData.unit,
          category: formData.category || 'Vegetables', // Default to Vegetables if not provided
          images: formData.images,
        };
        
        await updateMaterial(
          itemId,
          updatedItem
        );
        // Refresh the materials list after successful update
        await fetchMaterials();
        toast.success("Item updated successfully!");
        setFormData({
          name: "",
          price: "",
          quantity: "",
          unit: "kg",
          category: "Vegetables",
          images: [],
        });
        setSelectedFiles([]);
        setUploadedImages([]);
        setEditingItem(null);
        setShowAddForm(false);
      } catch (error) {
        toast.error("Failed to update item: " + error.message);
      }
    } else {
      toast.error("Please fill in all required fields (name, price, quantity)");
    }
  };

  const handleDeleteItem = async (id) => {
    if (!id) {
      toast.error("Error: Item ID is missing. Cannot delete item.");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteMaterial(id);
        // Refresh the materials list after successful deletion
        await fetchMaterials();
        toast.success("Item deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete item: " + error.message);
      }
    }
  };



  // Image upload handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB limit
    );
    
    if (validFiles.length + selectedFiles.length > 5) {
      toast.error("You can only upload up to 5 images");
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      const response = await uploadImages(selectedFiles);
      const newUploadedImages = [...uploadedImages, ...response.files];
      setUploadedImages(newUploadedImages);
      setFormData(prev => ({ ...prev, images: newUploadedImages }));
      setSelectedFiles([]);
    } catch (error) {
      toast.error("Failed to upload images: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveUploadedImage = (index) => {
    const newUploadedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newUploadedImages);
    setFormData(prev => ({ ...prev, images: newUploadedImages }));
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      price: "",
      quantity: "",
      unit: "kg",
      category: "Vegetables",
      images: [],
    });
    setSelectedFiles([]);
    setUploadedImages([]);
    setEditingItem(null);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SupplierHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("supplier.manageItemsTitle")}
            </h1>
            <p className="text-gray-600">
              Manage your inventory items and track their availability
            </p>
          </div>

          {/* Add Item Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-400 to-blue-800 hover:from-blue-500 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {t("supplier.addNewItem")}
            </button>
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {editingItem
                  ? t("supplier.editItem")
                  : t("supplier.addNewItem")}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <input
                  type="text"
                  placeholder={t("supplier.itemName")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <input
                  type="number"
                  placeholder={`${t("supplier.price")} (₹)`}
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <input
                  type="number"
                  placeholder={t("supplier.quantity")}
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="kg">{t("supplier.kg")}</option>
                  <option value="g">{t("supplier.g")}</option>
                  <option value="litre">{t("supplier.litre")}</option>
                  <option value="ml">{t("supplier.ml")}</option>
                  <option value="piece">{t("supplier.piece")}</option>
                </select>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="Vegetables">{t("supplier.vegetables")}</option>
                  <option value="Fruits">{t("supplier.fruits")}</option>
                  <option value="Dairy">{t("supplier.dairy")}</option>
                  <option value="Grains">{t("supplier.grains")}</option>
                  <option value="Others">{t("supplier.others")}</option>
                </select>
              </div>

              {/* Image Upload Section */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Product Images (Up to 5 images)
                </h3>
                
                {/* File Selection */}
                <div className="mb-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Select up to 5 images (JPG, PNG, GIF). Max size: 5MB per image.
                  </p>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleUploadImages}
                      disabled={isUploading}
                      className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? "Uploading..." : "Upload Images"}
                    </button>
                  </div>
                )}

                {/* Uploaded Images */}
                {uploadedImages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                      {uploadedImages.map((imageUrl, index) => (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => handleRemoveUploadedImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={editingItem ? handleUpdateItem : handleAddItem}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                >
                  {editingItem ? t("common.save") : t("common.add")}
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {t("supplier.inventoryItems")} ({items.length})
              </h3>
              <button
                onClick={() => fetchMaterials()}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.itemName")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.category")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.price")} (₹)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.quantity")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.unit")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Images
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(items) ? items.map((item) => (
                    <tr
                      key={item._id || item.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.category && item.category.trim() !== '' 
                            ? t(`supplier.${item.category.toLowerCase()}`) 
                            : t("supplier.uncategorized")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ₹{item.pricePerUnit || item.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.availableQuantity || item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.images && item.images.length > 0 ? (
                          <div className="flex space-x-1">
                            {item.images.slice(0, 3).map((imageUrl, index) => (
                              <img
                                key={index}
                                src={imageUrl}
                                alt={`Product ${index + 1}`}
                                className="w-8 h-8 object-cover rounded border border-gray-200"
                              />
                            ))}
                            {item.images.length > 3 && (
                              <span className="text-xs text-gray-400 flex items-center">
                                +{item.images.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No images</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-150"
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id || item.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-150"
                        >
                          {t("common.delete")}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                        {t("supplier.noItemsFound")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {items.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Materials Found
              </h3>
              <p className="text-gray-500 mb-4">
                You haven't added any materials to your inventory yet. 
                Start by adding your first material using the form above.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Your First Material
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SupplierItems;
