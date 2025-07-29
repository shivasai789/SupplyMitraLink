// utils/handlerFactory.js
const { statusOK, statusCreated, statusNotFound, statusBadRequest, statusError } = require('../utils/response.util');
const catchAsync = require('../utils/catchAsync');
const APPError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// 🔍 Get All Documents
exports.getAllByFilter = (
    Model,
    getFilter = (req) => ({}),
    populateOptions = null
) =>
    catchAsync(async (req, res, next) => {
        const filter = getFilter(req);
        
        const totalDocs = await Model.countDocuments(filter);

        let query = Model.find(filter);
        if (populateOptions) query = query.populate(populateOptions); // <-- Add populate here

        const features = new APIFeatures(query, req.query, totalDocs)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const docs = await features.query;

        return statusOK(res, docs, 'Fetched all filtered records');
    });

// 🔍 Get One Document by ID
exports.getOneByFilter = (
    Model,
    getFilter = (req) => ({ _id: req.params.id }),
    populateOptions = null
) =>
    catchAsync(async (req, res, next) => {
        const filter = getFilter(req);
        
        let query = Model.findOne(filter);
        if (populateOptions) query = query.populate(populateOptions); // <-- Add populate here

        const doc = await query;
        
        if (!doc) return statusNotFound(res, 'No document found with that ID');

        return statusOK(res, doc, 'Fetched document');
    });


// ➕ Create One Document
exports.createOne = (Model) => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    return statusCreated(res, doc, 'Document created');
});

// 📝 Update One Document by ID
exports.updateOneByFilter = (Model, getFilter = (req) => ({ _id: req.params.id })) =>
    catchAsync(async (req, res, next) => {
        const filter = getFilter(req);
        
        const doc = await Model.findOneAndUpdate(filter, req.body, {
            new: true,
            runValidators: true
        });

        if (!doc) return statusNotFound(res, 'No document found to update');
        return statusOK(res, doc, 'Document updated');
    });

// ✅ Delete with ownership check
exports.deleteOneByFilter = (Model, getFilter = (req) => ({ _id: req.params.id })) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findOneAndDelete(getFilter(req));
        if (!doc) return statusNotFound(res, 'No document found to delete');
        return statusOK(res, null, 'Document deleted');
    });