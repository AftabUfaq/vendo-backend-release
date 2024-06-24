const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
mongoose.connect((rej, res) => {
    console.log(rej, res)
});

const userSchema = new Schema({
    name: { type: String },
    email: {
        type: String,
        unique: true,
    },
    isAdmin: {
        type: Boolean
    },
    password: {
        type: String,
    },
    deactivate: {
        type: Boolean,
        default: false
    }
})

const User = mongoose.mongoose.model("User", userSchema);

module.exports = User;

