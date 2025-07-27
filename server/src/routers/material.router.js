const materialRouter = require('express').Router();
const { getAllMaterials, getMaterial, createMaterial, updateMaterial, deleteMaterial } = require('../controllers/material.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

materialRouter.get('/', getAllMaterials);
materialRouter.get('/:id', getMaterial);

// Restrict creation, update, and deletion to suppliers only
materialRouter.use(restrictTo('supplier'))

materialRouter.post('/', createMaterial);
materialRouter.put('/:id', updateMaterial);
materialRouter.delete('/:id', deleteMaterial);

module.exports = materialRouter;