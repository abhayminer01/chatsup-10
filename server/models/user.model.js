const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name  : {
        type  : String
    },
    google_id : {
        type : String
    },
    email : {
        type : String,
        unique : true,
        required : true
    },
    is_guest : Boolean
}, { timestamps : true });


const User = mongoose.model('User', userSchema);
module.exports = User;