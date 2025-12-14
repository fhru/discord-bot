const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const panelService = require('../../services/panelService');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Manage script panel (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a script panel in current channel')
    )
    .addSubcommand(sub =>
      sub.setName('refresh')
        .setDescription('Manually refresh all panels')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      try {
        const embed = panelService.buildPanelEmbed();
        const buttons = panelService.buildPanelButtons();

        const message = await interaction.channel.send({
          embeds: [embed],
          components: buttons
        });

        panelService.createPanel(interaction.guild.id, interaction.channel.id, message.id);

        return interaction.reply({ 
          embeds: [successEmbed('Success', 'Panel created! It will auto-update every minute.')], 
          flags: MessageFlags.Ephemeral 
        });
      } catch (error) {
        console.error('Panel create error:', error);
        return interaction.reply({ 
          embeds: [errorEmbed('Error', 'Failed to create panel.')], 
          flags: MessageFlags.Ephemeral 
        });
      }
    }

    if (subcommand === 'refresh') {
      const panels = panelService.getAllPanels();
      let updated = 0;
      let failed = 0;

      for (const panel of panels) {
        try {
          const channel = await interaction.client.channels.fetch(panel.channel_id);
          const message = await channel.messages.fetch(panel.message_id);
          
          const embed = panelService.buildPanelEmbed();
          const buttons = panelService.buildPanelButtons();
          
          await message.edit({ embeds: [embed], components: buttons });
          updated++;
        } catch (error) {
          panelService.deletePanel(panel.id);
          failed++;
        }
      }

      return interaction.reply({ 
        embeds: [successEmbed('Refresh Complete', `Updated: ${updated}\nRemoved (invalid): ${failed}`)], 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
