const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const settingsService = require('../../services/settingsService');
const { infoEmbed } = require('../../utils/embedBuilder');
const { formatIDR, getDLPrice } = require('../../utils/currency');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('View deposit information')
    .addSubcommand(sub =>
      sub.setName('world')
        .setDescription('View deposit world (Growtopia)')
    )
    .addSubcommand(sub =>
      sub.setName('saweria')
        .setDescription('View Saweria info')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'world') {
      const worldName = settingsService.getSetting('world_name') || 'Not set';
      const worldOwner = settingsService.getSetting('world_owner') || 'Not set';
      const dlPrice = getDLPrice();

      return interaction.reply({
        embeds: [infoEmbed('Deposit World', `Drop DL to the following world:\n\n🔸 **World:** \`${worldName}\`\n🔸 **Owner:** \`${worldOwner}\`\n\n**Rate:** ${formatIDR(dlPrice)} per DL\n\nAfter dropping, balance will be added automatically.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === 'saweria') {
      const saweriaLink = settingsService.getSetting('saweria_link') || 'Not set';

      return interaction.reply({
        embeds: [infoEmbed('Saweria Deposit', `Deposit via Saweria:\n\n🔸 **Link:** ${saweriaLink}\n\n**Message format:** \`YourGrowID\`\n\nMake sure your GrowID is registered in the system.`)],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
