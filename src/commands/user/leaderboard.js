const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userService = require('../../services/userService');
const { infoEmbed } = require('../../utils/embedBuilder');
const { formatIDR } = require('../../utils/currency');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View leaderboards')
    .addSubcommand(sub =>
      sub.setName('balance')
        .setDescription('Top balance holders')
    )
    .addSubcommand(sub =>
      sub.setName('spending')
        .setDescription('Top spenders')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'balance') {
      const users = userService.getTopBalances(10);

      if (users.length === 0) {
        return interaction.reply({ embeds: [infoEmbed('Top Balance', 'No data.')], flags: MessageFlags.Ephemeral });
      }

      const list = users.map((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} <@${u.discord_id}> - ${formatIDR(u.balance)}`;
      }).join('\n');

      return interaction.reply({ 
        embeds: [infoEmbed('Top Balance', list)], 
        ephemeral: false 
      });
    }

    if (subcommand === 'spending') {
      const users = userService.getTopSpenders(10);

      if (users.length === 0) {
        return interaction.reply({ embeds: [infoEmbed('Top Spenders', 'No data.')], flags: MessageFlags.Ephemeral });
      }

      const list = users.map((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} <@${u.discord_id}> - ${formatIDR(u.total_spent)}`;
      }).join('\n');

      return interaction.reply({ 
        embeds: [infoEmbed('Top Spenders', list)], 
        ephemeral: false 
      });
    }
  }
};
