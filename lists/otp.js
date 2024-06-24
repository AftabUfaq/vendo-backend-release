const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
mongoose.connect((rej, res) => {
    
});

const otpSchema = new Schema({
    email: { type: String },
    otp: { type: Number },
    timestamp: { type: Number },
    uid: { type: String }

})

const Otp = mongoose.mongoose.model("Otp", otpSchema);

module.exports = Otp
