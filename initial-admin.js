require('dotenv').config()
const crypto = require('crypto');

const AdminModel = require('./lists/users')
const db = require('./database/mongooseCrud')

const createInitialUser = async () => {
    let admins = await db.getData(AdminModel, {}, { _id: 1 })

    if (admins.error === null && admins.data.length > 0) {
        console.log("User already exists.")
    } else {
        const password = process.env.INITIAL_PASSWORD;

        // ENCRYPTED PASSWORD
        const pass = crypto.createHash('sha256').update(password).digest('base64');

        let { data, error } = await db.insertOneData(AdminModel, {
            email: process.env.INITIAL_USER,
            password: pass
        })

        if(error === null){
            console.log("Inital user created")
        }else{
            console.log("Problem creating the initial user")
        }
    }
}

module.exports = createInitialUser