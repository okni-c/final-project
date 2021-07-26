const mongoose = require('mongoose');

const { Schema } = mongoose;
const Review = require('./Review');

const productSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  modelImage: {
    type: String
  },
  thumbnail: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0.99
  },
  quantity: {
    type: Number,
    min: 0,
    default: 0
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  reviews: [Review.schema]
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
