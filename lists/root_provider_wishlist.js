const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;
// mongoose.connect("username", "password", "dbname");
mongoose.connect((rej, res) => {
    
});

const ProviderWishlistRootSchema = new Schema({
    user_id: { type: String, default: null },
    provider_id: { type: String, default: null },
})

const ProviderWishlistRoot = mongoose.mongoose.model("ProviderWishlistRoot", ProviderWishlistRootSchema);
module.exports = ProviderWishlistRoot