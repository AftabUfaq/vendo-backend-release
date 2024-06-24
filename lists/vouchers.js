const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
// mongoose.connect((rej, res) => {
//     console.log(rej, res)
// });

const voucherSchema = new Schema({
    title: {
        type: String
    },
    quantity: {
        type: Number
    },

    voucherTaken: { type: Number, default: 0 },

    voucherRedeemed: { type: Number, default: 0 },
    
    _provider: {
        type: Schema.ObjectId, ref: 'Provider'
    },

    startDate: {
        type: String
    },
    endDate: {
        type: String
    },

    shortDescription: { type: String },
    longDescription: { type: String },
    category: { type: String },

    _customer: [{
        type: Schema.ObjectId, ref: 'Customer'
    }],

    _redeemedBy: [{
        type: Schema.ObjectId, ref: 'Customer'
    }],

    _voucherTransaction: [{
        type: Schema.ObjectId, ref: 'Vouchertransaction'
    }],

    activeImage: {},
    
    inactiveImage: {},
    
    redemptionBarcode: {},

    deactivate: { type: Boolean, default: false },
    iswelcome: { type: Boolean, default: false },
})

const Voucher = mongoose.mongoose.model("Voucher", voucherSchema);

module.exports = Voucher;
