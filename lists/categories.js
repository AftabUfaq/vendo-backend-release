const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
// mongoose.connect((rej, res) => {
//     console.log(rej, res)
// });

const categorySchema = new Schema({
    categoryName: [ { type: String } ]
})

const Category = mongoose.mongoose.model("Category", categorySchema);

module.exports = Category;

