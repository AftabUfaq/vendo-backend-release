const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
mongoose.connect((rej, res) => {
    console.log(rej, res)
});

const ProviderLikeRootSchema = new Schema({
    user_id: { type: String, default: null },
    provider_id: { type: String, default: null },
})

const ProviderLikeRoot = mongoose.mongoose.model("ProviderLikeRoot", ProviderLikeRootSchema);
module.exports = ProviderLikeRoot