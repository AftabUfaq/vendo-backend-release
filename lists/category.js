const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
// mongoose.connect((rej, res) => {
//     console.log(rej, res)
// });

const CategorynSchema = new Schema({
    Name: {
        type: String
    },
    type: {
        type: String
    },
    timestamp: {
        type: String
    }
})

const Categoryn = mongoose.mongoose.model("Categoryn", CategorynSchema);

module.exports = Categoryn;
