var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    firstname           : String,
    lastname            : String,
    local : {
        email           : String,
        password        : String,    
    },
    address : {
        homeNumber      : Number,
        street          : String,
        city            : String,
        province        : String,
        country         : String,
        postalCode      : String,
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