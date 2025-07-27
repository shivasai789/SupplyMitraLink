const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch((err) => {
        // console.error('Error caught in catchAsync:', err);
        next(err);
        });
    };
}

module.exports = catchAsync;