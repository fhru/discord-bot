const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const settingsService = require('../../services/settingsService');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Manage bot settings (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all settings')
    )
    .addSubcommand(sub =>
      sub.setName('get')
        .setDescription('Get a setting value')
        .addStringOption(opt => opt.setName('key').setDescription('Setting key').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set a setting value')
        .addStringOption(opt => opt.setName('key').setDescription('Setting key').setRequired(true))
        .addStringOption(opt => opt.setName('value').setDescription('Setting value').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a setting')
        .addStringOption(opt => opt.setName('key').setDescription('Setting key').setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const settings = settingsService.getAllSettings();
      if (settings.length === 0) {
        return interaction.reply({ embeds: [infoEmbed('Settings', 'No settings configured.')], flags: MessageFlags.Ephemeral });
      }

      const list = settings.map(s => `🔹 \`${s.key}\`: ${s.value}`).join('\n');
      return interaction.reply({ embeds: [infoEmbed('Settings', list)], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'get') {
      const key = interaction.options.getString('key');
      const value = settingsService.getSetting(key);

      if (!value) {
        return interaction.reply({ embeds: [errorEmbed('Error', `Setting \`${key}\` not found.`)], flags: MessageFlags.Ephemeral });
      }

      return interaction.reply({ embeds: [infoEmbed('Setting', `🔹 \`${key}\`: ${value}`)], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'set') {
      const key = interaction.options.getString('key');
      const value = interaction.options.getString('value');

      settingsService.setSetting(key, value);
      return interaction.reply({ embeds: [successEmbed('Success', `Setting \`${key}\` set to \`${value}\``)], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'delete') {
      const key = interaction.options.getString('key');
      settingsService.deleteSetting(key);
      return interaction.reply({ embeds: [successEmbed('Success', `Setting \`${key}\` deleted.`)], flags: MessageFlags.Ephemeral });
    }
  }
};
