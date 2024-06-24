const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
mongoose.connect((rej, res) => {
    console.log(rej, res)
});

const customerSchema = new Schema({
    name: { type: String },
    street: { type: String },
    postcode: { type: String },
    place: { type: String },
    region: { type: String },
    mobile: { type: String },
    deactivate: { type: Boolean, default: false },

    voucherTaken: { type: Boolean, default: false },
    
    _voucher: [{
        type: Schema.ObjectId, ref: 'Voucher'
    }],

    _voucherTransaction: [{
        type: Schema.ObjectId, ref: 'Vouchertransaction'
    }],

    _cart: [{
        _product: { type: Schema.ObjectId, ref: 'Product' },
        _quantity: { type: Number },
         _pid: { type: String }
    }],

    email: {
        type: String,
        unique: true,
    },

    emailVerified: {
        type: Boolean,
        default: false
    },

    password: {
        type: String,
    },

    deliveryNote: {
        type: String
    },
    token: {
        type: String
    }
})

const Customer = mongoose.mongoose.model("Customer", customerSchema);

module.exports = Customer
