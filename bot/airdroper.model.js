const mongoose = require('mongoose');

class Data {
  constructor({
    id = null,
    facebook = null,
    twitter = null,
    telegram = null,
    verse = null,
    wallet = null,
    invitedUser = [],
    isDone = false,
  }) {
    this.id = id;
    this.facebook = facebook;
    this.twitter = twitter;
    this.telegram = telegram;
    this.verse = verse;
    this.wallet = wallet;
    this.invitedUser = invitedUser;
    this.isDone = isDone;
  }
}

const DataSchema = new mongoose.Schema({
  id: String,
  facebook: String,
  twitter: String,
  telegram: String,
  verse: String,
  wallet: String,
  invitedUser: Array,
  isDone: Boolean,
});

const dataModel = mongoose.model('AIRDROP', DataSchema);

module.exports = {
  dataModel,
  Data,
};
