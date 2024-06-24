const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
mongoose.connect((rej, res) => {
    console.log(rej, res)
});

const notificationSchema = new Schema({
    cid: { type: String },
    pid: { type: String },
    create_date: { type: String },
    subject: { type: String },
    message: { type: String },
    type: { type: String },
    pname: { type: String },

})

const Notification = mongoose.mongoose.model("Notification", notificationSchema);

module.exports = Notification
