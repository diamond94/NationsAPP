class APIFeatures {
  constructor(query, queryString) {
    //queryString equals to queryString we get from the express => req.query
    // query equal to mongoose query => x.find()
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // Build Query
    // 1A- Filtering
    const queryObj = { ...this.queryString };
    const excludeFields = ['limit', 'page', 'sort', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    // 1B- Advance Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const querySort = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(querySort);
    } else {
      this.query = this.query.sort('-population_Billion');
    }
    return this;
  }

  selectFields() {
    if (this.queryString.fields) {
      const selectFields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(selectFields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
