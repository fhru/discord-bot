const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userService = require('../../services/userService');
const luciferKeyService = require('../../services/luciferKeyService');
const transactionService = require('../../services/transactionService');
const { errorEmbed, infoEmbed } = require('../../utils/embedBuilder');
const { formatIDR } = require('../../utils/currency');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('myinfo')
    .setDescription('View your account information'),

  async execute(interaction) {
    const user = userService.getUserByDiscordId(interaction.user.id);

    if (!user) {
      return interaction.reply({ 
        embeds: [errorEmbed('Not Registered', 'You need to register first using the Register button.')], 
        flags: MessageFlags.Ephemeral 
      });
    }

    const keyCount = await luciferKeyService.countKeysByUser(interaction.user.id);
    const totalSpent = transactionService.getTotalSpentByUser(interaction.user.id);

    return interaction.reply({
      embeds: [infoEmbed('My Info', null, [
        { name: '🔸 Discord', value: `<@${user.discord_id}>`, inline: true },
        { name: '🔸 GrowID', value: user.growid || 'N/A', inline: true },
        { name: '🔸 Balance', value: formatIDR(user.balance), inline: true },
        { name: '🔸 Lucifer Keys', value: `${keyCount} keys`, inline: true },
        { name: '🔸 Total Spent', value: formatIDR(totalSpent), inline: true },
        { name: '🔸 Registered', value: user.created_at, inline: true }
      ])],
      flags: MessageFlags.Ephemeral
    });
  }
};
