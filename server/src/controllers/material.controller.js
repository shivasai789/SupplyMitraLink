const { getOneByFilter, updateOneByFilter, createOne, deleteOneByFilter, getAllByFilter } = require('./factory.controller');
const Material = require('../models/material.model');

exports.getAllMaterials = (req, res, next) => {
    // For vendors, show all materials from all suppliers
    // For suppliers, show only their own materials
    const filter = req.user.role === 'supplier' ? { supplierId: req.user.id } : {};
    
    const populateOptions = { path: 'supplierId', select: 'fullname email phone' };
    return getAllByFilter(Material, req => filter, populateOptions)(req, res, next);
}

exports.getMaterial = (req, res, next) => {
    return getOneByFilter(Material, req => ({
        _id: req.params.id
    }))(req, res, next);
}

exports.createMaterial = (req, res, next) => {
    req.body.supplierId = req.user.id;
    
    return createOne(Material)(req, res, next);
}

exports.updateMaterial = (req, res, next) => {
    return updateOneByFilter(Material, req => ({
        _id: req.params.id,
        supplierId: req.user.id
    }))(req, res, next);
}

exports.deleteMaterial = (req, res, next) => {
    return deleteOneByFilter(Material, req => ({
        _id: req.params.id,
        supplierId: req.user.id
    }))(req, res, next);
}