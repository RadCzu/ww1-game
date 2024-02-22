const Army = require("../../models/Army");
const landCombat = require("../../utils/landCombat");

module.exports = async (client) => {

  const army1query = {
    name: "first Schnitzel army",
    guildId: "344783146065199115",
  }; 
  const army2query = {
    name: "first French HONHON",
    guildId: "344783146065199115",
    _id:"64ebb0673e046ed5ceeaf8ef",
  }; 

  const attacker = await Army.findOne(army1query);
  const defender = await Army.findOne(army2query);

  landCombat(attacker, defender);
}