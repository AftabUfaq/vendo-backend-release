const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

// mongoose.connect("username", "password", "dbname");
mongoose.connect((rej, res) => {
    console.log(rej, res)
});

const ProviderLikeSchema = new Schema({
    user_id: { type: String, default: null },
    provider_id: { type: String, default: null },
    type:{
        type: String,
        enum:['feed','company_presentation','job_advertisement','flyer','advertisement','menu','info','event','advertising_video'],
    },
    PRFeedId:{
        type:String,
        default: null
    }
})

const ProviderLike = mongoose.mongoose.model("ProviderLike", ProviderLikeSchema);
module.exports = ProviderLike
