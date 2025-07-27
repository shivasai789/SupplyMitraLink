const { getOneByFilter, updateOneByFilter, createOne, deleteOneByFilter, getAllByFilter } = require('./factory.controller');
const Material = require('../models/material.model');

exports.getAllMaterials = (req, res, next) => {
    console.log('🔍 getAllMaterials called');
    console.log('👤 User:', req.user.email, 'Role:', req.user.role, 'ID:', req.user.id);
    
    // For vendors, show all materials from all suppliers
    // For suppliers, show only their own materials
    const filter = req.user.role === 'supplier' ? { supplierId: req.user.id } : {};
    console.log('🔍 Filter:', filter);
    
    const populateOptions = { path: 'supplierId', select: 'fullname email phone' };
    return getAllByFilter(Material, req => filter, populateOptions)(req, res, next);
}

exports.getMaterial = (req, res, next) => {
    return getOneByFilter(Material, req => ({
        _id: req.params.id
    }))(req, res, next);
}

exports.createMaterial = (req, res, next) => {
    console.log('🔍 createMaterial called');
    console.log('👤 User:', req.user.email, 'ID:', req.user.id);
    console.log('📦 Request body:', req.body);
    
    req.body.supplierId = req.user.id;
    console.log('📦 Final request body:', req.body);
    
    return createOne(Material)(req, res, next);
}

exports.updateMaterial = (req, res, next) => {
    console.log('🔍 updateMaterial called');
    console.log('👤 User:', req.user.email, 'ID:', req.user.id);
    console.log('📦 Material ID:', req.params.id);
    console.log('📦 Request body:', req.body);
    
    return updateOneByFilter(Material, req => ({
        _id: req.params.id,
        supplierId: req.user.id
    }))(req, res, next);
}

exports.deleteMaterial = (req, res, next) => {
    console.log('🔍 deleteMaterial called');
    console.log('👤 User:', req.user.email, 'ID:', req.user.id);
    console.log('📦 Material ID:', req.params.id);
    
    return deleteOneByFilter(Material, req => ({
        _id: req.params.id,
        supplierId: req.user.id
    }))(req, res, next);
}