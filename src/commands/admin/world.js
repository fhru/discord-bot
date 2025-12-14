const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const settingsService = require('../../services/settingsService');
const { successEmbed, infoEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('world')
    .setDescription('Manage deposit world (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('get')
        .setDescription('Get deposit world info')
    )
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Set deposit world')
        .addStringOption(opt => opt.setName('name').setDescription('World name').setRequired(true))
        .addStringOption(opt => opt.setName('owner').setDescription('World owner').setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'get') {
      const worldName = settingsService.getSetting('world_name') || 'Not set';
      const worldOwner = settingsService.getSetting('world_owner') || 'Not set';

      return interaction.reply({ 
        embeds: [infoEmbed('Deposit World', null, [
          { name: '🔸 World Name', value: worldName, inline: true },
          { name: '🔸 Owner', value: worldOwner, inline: true }
        ])], 
        flags: MessageFlags.Ephemeral 
      });
    }

    if (subcommand === 'set') {
      const name = interaction.options.getString('name');
      const owner = interaction.options.getString('owner');

      settingsService.setSetting('world_name', name);
      settingsService.setSetting('world_owner', owner);

      return interaction.reply({ 
        embeds: [successEmbed('Success', `Deposit world set to \`${name}\` (Owner: \`${owner}\`)`)], 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
