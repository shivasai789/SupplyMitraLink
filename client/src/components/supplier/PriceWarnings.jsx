import React, { useState } from "react";
import { useAuthStore } from "../../stores/useAuthStore";
import { useTranslation } from "react-i18next";
import SupplierHeader from "./SupplierHeader";

const PriceWarnings = () => {
  const { t } = useTranslation();
  const [warnings, setWarnings] = useState([
    {
      id: 1,
      itemName: "Fresh Tomatoes",
      currentPrice: 45,
      suggestedPrice: 40,
      difference: 5,
      severity: "high",
      date: "2024-01-15",
      status: "pending",
    },
    {
      id: 2,
      itemName: "Onions",
      currentPrice: 30,
      suggestedPrice: 25,
      difference: 5,
      severity: "high",
      date: "2024-01-14",
      status: "resolved",
    },
    {
      id: 3,
      itemName: "Potatoes",
      currentPrice: 35,
      suggestedPrice: 30,
      difference: 5,
      severity: "medium",
      date: "2024-01-13",
      status: "pending",
    },
    {
      id: 4,
      itemName: "Bananas",
      currentPrice: 65,
      suggestedPrice: 60,
      difference: 5,
      severity: "low",
      date: "2024-01-12",
      status: "pending",
    },
  ]);

  const [filter, setFilter] = useState("all");

  const handleResolveWarning = (id) => {
    setWarnings(
      warnings.map((warning) =>
        warning.id === id ? { ...warning, status: "resolved" } : warning
      )
    );
  };

  const handleDismissWarning = (id) => {
    setWarnings(
      warnings.map((warning) =>
        warning.id === id ? { ...warning, status: "dismissed" } : warning
      )
    );
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredWarnings = warnings.filter((warning) => {
    if (filter === "all") return true;
    return warning.status === filter;
  });

  const pendingCount = warnings.filter((w) => w.status === "pending").length;
  const resolvedCount = warnings.filter((w) => w.status === "resolved").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <SupplierHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("supplier.priceWarningsTitle")}
            </h1>
            <p className="text-gray-600">
              Monitor and manage price alerts for your inventory items
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="text-gray-500 text-sm font-medium">
                {t("supplier.totalWarnings")}
              </h2>
              <p className="text-2xl font-bold text-gray-900">
                {warnings.length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="text-gray-500 text-sm font-medium">
                {t("common.pending")}
              </h2>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingCount}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="text-gray-500 text-sm font-medium">
                {t("common.resolved")}
              </h2>
              <p className="text-2xl font-bold text-green-600">
                {resolvedCount}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === "all"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {t("common.all")}
              </button>
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === "pending"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {t("common.pending")}
              </button>
              <button
                onClick={() => setFilter("resolved")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === "resolved"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {t("common.resolved")}
              </button>
            </div>
          </div>

          {/* Warnings Table */}
          <div className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {t("supplier.priceWarningAlerts")}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.itemName")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.currentPrice")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.suggestedPrice")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.difference")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.severity")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.status")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.date")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t("supplier.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredWarnings.map((warning) => (
                    <tr
                      key={warning.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {warning.itemName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        ₹{warning.currentPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{warning.suggestedPrice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{warning.difference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(
                            warning.severity
                          )}`}
                        >
                          {warning.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            warning.status
                          )}`}
                        >
                          {warning.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {warning.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {warning.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleResolveWarning(warning.id)}
                              className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-150"
                            >
                              {t("supplier.resolve")}
                            </button>
                            <button
                              onClick={() => handleDismissWarning(warning.id)}
                              className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
                            >
                              {t("supplier.dismiss")}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredWarnings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("supplier.noWarningsFound")}
              </h3>
              <p className="text-gray-500">
                {t("supplier.noWarningsMatching")}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PriceWarnings;
