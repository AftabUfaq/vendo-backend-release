const mongoose = require('../database/mongoose');
const { Schema } = mongoose.mongoose;

mongoose.connect((rej, res) => {
    console.log(rej, res)
});

const settingSchema = new Schema({
	title: { type: String, default: null },
	description: { type: String, default: null },
})

const Setting = mongoose.mongoose.model("Setting", settingSchema);
module.exports = Setting