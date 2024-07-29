const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
mongoose.connect((rej, res) => {
    console.log(rej, res)
});

const NottificationsTrack = new Schema({
    notificationType: { type: String },
    lastNotification: { type: String },
}, { timestamps: true });

const NotificationsTrack = mongoose.mongoose.model("NotificationsTrack", NottificationsTrack);

module.exports = NotificationsTrack
