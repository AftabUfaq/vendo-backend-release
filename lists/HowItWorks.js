const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

const HowItWorksSchema = new Schema({
    dealsAndBonusCards: { type: String }, 
    feedAndStories: { type: String },
    shopping: { type: String },
    delivery: { type: String },
    provider: { type: String },
    flyer: { type: String }
});

const HowItWorks = mongoose.mongoose.model("HowItWorks", HowItWorksSchema);

module.exports = HowItWorks;
