const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userService = require('../../services/userService');
const settingsService = require('../../services/settingsService');
const { errorEmbed, infoEmbed } = require('../../utils/embedBuilder');
const { formatIDR, idrToDL } = require('../../utils/currency');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your balance'),

  async execute(interaction) {
    const user = userService.getUserByDiscordId(interaction.user.id);

    if (!user) {
      return interaction.reply({ 
        embeds: [errorEmbed('Not Registered', 'You need to register first.')], 
        flags: MessageFlags.Ephemeral 
      });
    }

    const dlEquiv = idrToDL(user.balance);

    return interaction.reply({
      embeds: [infoEmbed('Balance', `Your current balance:\n\n🔸 ${formatIDR(user.balance)}\n🔸 ~${dlEquiv} DL`)],
      flags: MessageFlags.Ephemeral
    });
  }
};
