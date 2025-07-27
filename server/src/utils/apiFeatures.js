class APIFeatures {
    constructor(query, queryString, totalDocs) {
        this.query = query;
        this.queryString = queryString;
        this.totalDocs = totalDocs;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'max', 'min', 'search', 'lat', 'lng'];
        excludedFields.forEach((el) => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|ne)\b/g, (match) => `$${match}`);
        this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy + ' _id'); // 👈 Add _id as tiebreaker
        } else {
            this.query = this.query.sort('-createdAt _id'); // 👈 Default with tiebreaker
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = +this.queryString.page || 1;
        const limit = +this.queryString.limit || 10;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        if (this.queryString.page && this.totalDocs > 0) {
            const totalPages = Math.ceil(this.totalDocs / limit);
            if (page > totalPages) {
                throw new Error('This page does not exist');
            }
        }

        return this;
    }

}

module.exports = APIFeatures;