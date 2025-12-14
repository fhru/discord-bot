const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation tools (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('purge')
        .setDescription('Delete messages in current channel')
        .addIntegerOption(opt => 
          opt.setName('amount')
            .setDescription('Number of messages (1-100)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
    )
    .addSubcommand(sub =>
      sub.setName('purgefrom')
        .setDescription('Delete messages from a user')
        .addUserOption(opt => opt.setName('target').setDescription('Target user').setRequired(true))
        .addIntegerOption(opt => 
          opt.setName('amount')
            .setDescription('Number to search (1-100)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
    )
    .addSubcommand(sub =>
      sub.setName('delchannels')
        .setDescription('Delete channels with prefix')
        .addStringOption(opt => opt.setName('prefix').setDescription('Channel prefix').setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'purge') {
      const amount = interaction.options.getInteger('amount');

      try {
        const deleted = await interaction.channel.bulkDelete(amount, true);
        return interaction.reply({ 
          embeds: [successEmbed('Purge', `Deleted ${deleted.size} messages.`)], 
          flags: MessageFlags.Ephemeral 
        });
      } catch (error) {
        return interaction.reply({ 
          embeds: [errorEmbed('Error', 'Failed to delete messages. Messages older than 14 days cannot be bulk deleted.')], 
          flags: MessageFlags.Ephemeral 
        });
      }
    }

    if (subcommand === 'purgefrom') {
      const target = interaction.options.getUser('target');
      const amount = interaction.options.getInteger('amount');

      try {
        const messages = await interaction.channel.messages.fetch({ limit: amount });
        const userMessages = messages.filter(m => m.author.id === target.id);
        
        const deleted = await interaction.channel.bulkDelete(userMessages, true);
        return interaction.reply({ 
          embeds: [successEmbed('Purge', `Deleted ${deleted.size} messages from <@${target.id}>.`)], 
          flags: MessageFlags.Ephemeral 
        });
      } catch (error) {
        return interaction.reply({ 
          embeds: [errorEmbed('Error', 'Failed to delete messages.')], 
          flags: MessageFlags.Ephemeral 
        });
      }
    }

    if (subcommand === 'delchannels') {
      const prefix = interaction.options.getString('prefix').toLowerCase();
      
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const channels = interaction.guild.channels.cache.filter(
        c => c.name.toLowerCase().startsWith(prefix)
      );

      if (channels.size === 0) {
        return interaction.editReply({ 
          embeds: [errorEmbed('Error', `No channels found with prefix \`${prefix}\`.`)] 
        });
      }

      let deleted = 0;
      for (const [, channel] of channels) {
        try {
          await channel.delete();
          deleted++;
        } catch (e) {
          // Skip if can't delete
        }
      }

      return interaction.editReply({ 
        embeds: [successEmbed('Delete Channels', `Deleted ${deleted} channels with prefix \`${prefix}\`.`)] 
      });
    }
  }
};
