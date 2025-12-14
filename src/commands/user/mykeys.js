const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userService = require('../../services/userService');
const luciferKeyService = require('../../services/luciferKeyService');
const { errorEmbed } = require('../../utils/embedBuilder');
const { paginatedReply } = require('../../utils/pagination');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mykeys')
    .setDescription('View your Lucifer Keys'),

  async execute(interaction) {
    const user = userService.getUserByDiscordId(interaction.user.id);

    if (!user) {
      return interaction.reply({ 
        embeds: [errorEmbed('Not Registered', 'You need to register first.')], 
        flags: MessageFlags.Ephemeral 
      });
    }

    const keys = luciferKeyService.getLuciferKeysByUser(interaction.user.id);

    return paginatedReply(interaction, {
      title: 'My Lucifer Keys',
      items: keys,
      formatItem: (k, i) => `${i + 1}. **${k.script_name || k.script_code}**\n   Username: \`${k.lucifer_username}\``,
      emptyMessage: 'You have no Lucifer Keys yet.'
    });
  }
};
