const mongoose = require('mongoose');

class Data {
    constructor({
        id=null,
        facebook=null,
        twitter=null,
        telegram=null,
        wallet=null,
        invitedUser=[],
        isDone=false,
    }){
        this.id = id;
        this.facebook = facebook;
        this.twitter =  twitter;
        this.telegram = telegram;
        this.wallet = wallet;
        this.invitedUser=invitedUser;
        this.isDone = isDone;
    }
}

const DataSchema = new mongoose.Schema({
    id: String,
    facebook: String,
    twitter: String,
    telegram: String,
    wallet: String,
    invitedUser: Array,
    isDone: Boolean,
})

const dataModel = mongoose.model('AIRDROP', DataSchema);

module.exports = {
    dataModel,
    Data
}