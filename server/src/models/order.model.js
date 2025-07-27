// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // vendor who places the order
        required: true,
    },

    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // supplier who receives the order
        required: true,
    },

    vendorAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address', // address of the vendor
        required: false, // Made optional for now
    },

    supplierAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address', // address of the supplier
        required: false, // Made optional for now
    },

    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material', // material being ordered
        required: true,
    },

    quantity: {
        type: Number,
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'accepted', 'preparing', 'packed', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'],
        default: 'pending',
    },

    totalAmount: {
        type: Number,
        required: true,
    },

    notes: [{
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Order', orderSchema);
