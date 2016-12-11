var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = new mongoose.Schema({
    username  : String,
    local     : {
        email           : String,
        password        : String   
    },
    name      : {
        first           : String,
        last            : String,
        public          : Boolean // whether or not name is publicly visible
    },
    address   : {
        // homeNumber      : Number,
        // street          : String,
        city            : String,
        province        : String,
        // country         : String,
        // postalCode      : String,
        public          : Boolean // whether or not location is publicly visible
    }
});

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', userSchema);