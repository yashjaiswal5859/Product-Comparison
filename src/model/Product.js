const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  _id: { type: String, required: true },  // Use search term as ID
  amazon: { type: Boolean, default: false },
  flipkart: { type: Boolean, default: false },
  dmart: { type: Boolean, default: false },
  snapdeal: { type: Boolean, default: false },
  products: { type: Array, default: [] }  // Array of product objects
});

module.exports = mongoose.model('Product', ProductSchema);
