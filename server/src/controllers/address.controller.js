const Address = require('../models/address.model');
const { getOneByFilter, updateOneByFilter, createOne, deleteOneByFilter, getAllByFilter } = require('./factory.controller');    

exports.getAllAddresses = (req, res, next) => {
    return getAllByFilter(Address, req => ({
        userId: req.user.id
    }))(req, res, next);
}

exports.getAddress = (req, res, next) => {
    return getOneByFilter(Address, req => ({
        _id: req.params.id,
        userId: req.user.id // Ensure only user can access their address
    }))(req, res, next);
}

exports.createAddress = (req, res, next) => {
    req.body.userId = req.user.id; // Set userId from authenticated user
    return createOne(Address)(req, res, next);
}

exports.updateAddress = (req, res, next) => {
    return updateOneByFilter(Address, req => ({
        _id: req.params.id,
        userId: req.user.id // Ensure only user can update their address
    }))(req, res, next);
}

exports.deleteAddress = (req, res, next) => {
    return deleteOneByFilter(Address, req => ({
        _id: req.params.id,
        userId: req.user.id // Ensure only user can delete their address
    }))(req, res, next);
}
