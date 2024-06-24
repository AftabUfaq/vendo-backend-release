const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");


const prfeedSchema = new Schema({
    subject_line: { type: String, default: null },
    input_text: { type: String, default: null },
    picture_1: {},
    picture_2: {},
    feed_show_status: { type: Boolean, default: false },
})

const Prfeed = mongoose.mongoose.model("Prfeed", prfeedSchema);

module.exports = Prfeed