const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
mongoose.connect((rej, res) => {
    console.log(rej, res)
});

const productSchema = new Schema({
    name: {
        type: String
    },
    
    maxQuantity: {
        type: Number
    },
    inStock: {
        type: Number
    },

    _provider: {
        type: Schema.ObjectId, ref: 'Provider'
    },

    category: { type: String },
    size: { type: String },
    ingredients: { type: String },
    
    price: { type: String },

    shortDescription: { type: String },
    longDescription: { type: String },

    productImage: {},

    status: { type: Boolean, default: true },

    deactivate: { type: Boolean, default: false },
})

const Product = mongoose.mongoose.model("Product", productSchema);

module.exports = Product;
