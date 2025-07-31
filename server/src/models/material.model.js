// models/Material.js
const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  images: [
    {
      type: String,
      default: [],
    },
  ],
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  pricePerUnit: {
    type: Number,
    required: true,
  },
  availableQuantity: {
    type: Number,
    required: true,
    default: 0,
  },
  unit: {
    type: String,
    enum: [
      "kg",
      "g",
      "l",
      "ml",
      "pieces",
      "dozen",
      "pack",
      "bundle",
      "box",
      "bag",
      "litre",
      "piece",
    ],
    default: "kg",
  },
  category: {
    type: String,
    enum: [
      "Vegetables",
      "Fruits",
      "Dairy",
      "Grains",
      "Poultry",
      "Fish",
      "Spices",
      "Beverages",
      "Snacks",
      "Others",
    ],
    default: "Vegetables",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "out_of_stock"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
MaterialSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Material = mongoose.model("Material", MaterialSchema);

module.exports = Material;
