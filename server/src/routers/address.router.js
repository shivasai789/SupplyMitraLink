const addressRouter = require('express').Router();
const { getAllAddresses, getAddress, createAddress, updateAddress, deleteAddress } = require('../controllers/address.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

// Read operations - available to all authenticated users
addressRouter.get('/', getAllAddresses);
addressRouter.get('/:id', getAddress);

// Write operations - available to all authenticated users (both suppliers and vendors)
addressRouter.post('/', createAddress);
addressRouter.put('/:id', updateAddress);
addressRouter.delete('/:id', deleteAddress);

module.exports = addressRouter;