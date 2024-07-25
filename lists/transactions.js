const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;



const TransactionSchema = new Schema({
    _products: [{
        _product: { type: Schema.ObjectId, ref: 'Product' },
        _quantity: { type: Number },
        _price: { type: String }
    }],
    _productIds: [{
        type: Schema.ObjectId, ref: 'Product'
    }],
    _customer: {
        type: Schema.ObjectId, ref: 'Customer'
    },
    _provider: {
        type: Schema.ObjectId, ref: 'Provider'
    },
    totalPrice: {
        type: String
    },
    deliveryCost: {
        type: String
    },
    paymentMode: {
        type: String
    },
    paypalTranasctionId: {
        type: String
    },
    timestamp: {
        type: String
    },
    notes: {
        type: String
    },
    address: {
        type: String
    },
    pickupdateandtime:  {
        default:"none",
        type: String
    },
    phone: {
        default:"none",
        type: String
    },
    deliveryMode:{
        default:"pickup",
        type: String
    }
})

const Transaction = mongoose.mongoose.model("Transaction", TransactionSchema);

module.exports = Transaction;