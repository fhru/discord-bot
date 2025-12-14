const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const settingsService = require('../../services/settingsService');
const { successEmbed, infoEmbed } = require('../../utils/embedBuilder');
const { formatIDR } = require('../../utils/currency');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rate')
    .setDescription('Manage DL rate (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('get')
        .setDescription('Get current DL rate')
    )
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set DL rate')
        .addIntegerOption(opt => opt.setName('price').setDescription('Price per DL in IDR').setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'get') {
      const rate = settingsService.getSetting('dl_price') || '15000';
      return interaction.reply({ 
        embeds: [infoEmbed('DL Rate', `Current rate: ${formatIDR(parseInt(rate))} per DL`)], 
        flags: MessageFlags.Ephemeral 
      });
    }

    if (subcommand === 'set') {
      const price = interaction.options.getInteger('price');
      settingsService.setSetting('dl_price', price.toString());
      return interaction.reply({ 
        embeds: [successEmbed('Success', `DL rate set to ${formatIDR(price)} per DL`)], 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
