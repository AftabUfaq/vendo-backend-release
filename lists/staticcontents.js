const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
// mongoose.connect((rej, res) => {
//     console.log(rej, res)
// });

const staticContentSchema = new Schema({
    howItWorks: { type: String },
    contact: { type: String },
    termAndConditions: { type: String },
    imprint: { type: String },
    explanation: { type: String }
})

const StaticContent = mongoose.mongoose.model("Staticcontent", staticContentSchema);

module.exports = StaticContent;
