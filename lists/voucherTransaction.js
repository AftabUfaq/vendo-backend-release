const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
// mongoose.connect((rej, res) => {
//     console.log(rej, res)
// });

const voucherTransactionSchema = new Schema({
    quantity: {
        type: Number
    },
    _provider: {
        type: Schema.ObjectId, ref: 'Provider'
    },
    _voucher: {
        type: Schema.ObjectId, ref: 'Voucher'
    },
    _customer: {
        type: Schema.ObjectId, ref: 'Customer'
    },
    timestamp: {
        type: String
    },
    redeemedTimestamp: {
        type: String
    },
    redeemed: {
        type: Boolean,
        default: false
    },
    status: { type: String }
})

const VoucherTransaction = mongoose.mongoose.model("Vouchertransaction", voucherTransactionSchema);

module.exports = VoucherTransaction;
