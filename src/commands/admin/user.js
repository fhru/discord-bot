const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const userService = require('../../services/userService');
const balanceService = require('../../services/balanceService');
const settingsService = require('../../services/settingsService');
const { successEmbed, errorEmbed, infoEmbed, NEON_GREEN } = require('../../utils/embedBuilder');
const { formatIDR, dlToIDR, censorUsername } = require('../../utils/currency');
const { paginatedReply } = require('../../utils/pagination');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Manage users (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all users')
    )
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Get user info')
        .addUserOption(opt => opt.setName('target').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a user')
        .addUserOption(opt => opt.setName('target').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setbalance')
        .setDescription('Set user balance')
        .addUserOption(opt => opt.setName('target').setDescription('Target user').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Balance amount (IDR)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('addbalance')
        .setDescription('Add balance to user')
        .addUserOption(opt => opt.setName('target').setDescription('Target user').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount (IDR)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('adddl')
        .setDescription('Add balance using DL')
        .addUserOption(opt => opt.setName('target').setDescription('Target user').setRequired(true))
        .addIntegerOption(opt => opt.setName('dl').setDescription('DL amount').setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const users = userService.getAllUsers();
      
      return paginatedReply(interaction, {
        title: 'Users',
        items: users,
        formatItem: (u, i) => `${i + 1}. <@${u.discord_id}> | GrowID: \`${u.growid}\` | ${formatIDR(u.balance)}`,
        emptyMessage: 'No users registered.'
      });
    }

    if (subcommand === 'info') {
      const target = interaction.options.getUser('target');
      const user = userService.getUserByDiscordId(target.id);

      if (!user) {
        return interaction.reply({ embeds: [errorEmbed('Error', 'User not registered.')], flags: MessageFlags.Ephemeral });
      }

      return interaction.reply({
        embeds: [infoEmbed('User Info', null, [
          { name: '🔸 Discord', value: `<@${user.discord_id}>`, inline: true },
          { name: '🔸 GrowID', value: user.growid || 'N/A', inline: true },
          { name: '🔸 Balance', value: formatIDR(user.balance), inline: true },
          { name: '🔸 Registered', value: user.created_at, inline: false }
        ])],
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === 'delete') {
      const target = interaction.options.getUser('target');
      const user = userService.getUserByDiscordId(target.id);

      if (!user) {
        return interaction.reply({ embeds: [errorEmbed('Error', 'User not registered.')], flags: MessageFlags.Ephemeral });
      }

      userService.deleteUser(target.id);
      return interaction.reply({ embeds: [successEmbed('Success', `User <@${target.id}> has been deleted.`)], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'setbalance') {
      const target = interaction.options.getUser('target');
      const amount = interaction.options.getInteger('amount');

      if (!userService.isRegistered(target.id)) {
        return interaction.reply({ embeds: [errorEmbed('Error', 'User not registered.')], flags: MessageFlags.Ephemeral });
      }

      balanceService.setBalance(target.id, amount);

      // DM user
      try {
        await target.send({
          embeds: [successEmbed('Balance Updated', `Your balance has been set!\n\n🔸 **New Balance:** ${formatIDR(amount)}\n🔸 **By:** Admin`)]
        });
      } catch (e) {}

      // Balance log
      const logChannelId = settingsService.getSetting('balance_log_channel');
      if (logChannelId) {
        try {
          const logChannel = await interaction.client.channels.fetch(logChannelId);
          const censoredName = censorUsername(target.username);
          const embed = new EmbedBuilder()
            .setColor(NEON_GREEN)
            .setDescription(`${formatIDR(amount)} has been set to ${censoredName}`);
          await logChannel.send({ embeds: [embed] });
        } catch (e) {}
      }

      return interaction.reply({ 
        embeds: [successEmbed('Success', `Balance <@${target.id}> set to ${formatIDR(amount)}`)], 
        flags: MessageFlags.Ephemeral 
      });
    }

    if (subcommand === 'addbalance') {
      const target = interaction.options.getUser('target');
      const amount = interaction.options.getInteger('amount');

      if (!userService.isRegistered(target.id)) {
        return interaction.reply({ embeds: [errorEmbed('Error', 'User not registered.')], flags: MessageFlags.Ephemeral });
      }

      const newBalance = balanceService.addBalance(target.id, amount);

      // DM user
      try {
        await target.send({
          embeds: [successEmbed('Balance Added', `Your balance has been updated!\n\n🔸 **Amount:** +${formatIDR(amount)}\n🔸 **New Balance:** ${formatIDR(newBalance)}\n🔸 **By:** Admin`)]
        });
      } catch (e) {}

      // Balance log
      const logChannelId2 = settingsService.getSetting('balance_log_channel');
      if (logChannelId2) {
        try {
          const logChannel = await interaction.client.channels.fetch(logChannelId2);
          const censoredName = censorUsername(target.username);
          const embed = new EmbedBuilder()
            .setColor(NEON_GREEN)
            .setDescription(`${formatIDR(amount)} has been added to ${censoredName}`);
          await logChannel.send({ embeds: [embed] });
        } catch (e) {}
      }

      return interaction.reply({ 
        embeds: [successEmbed('Success', `Added ${formatIDR(amount)} to <@${target.id}>.\nNew balance: ${formatIDR(newBalance)}`)], 
        flags: MessageFlags.Ephemeral 
      });
    }

    if (subcommand === 'adddl') {
      const target = interaction.options.getUser('target');
      const dl = interaction.options.getInteger('dl');
      const idr = dlToIDR(dl);

      if (!userService.isRegistered(target.id)) {
        return interaction.reply({ embeds: [errorEmbed('Error', 'User not registered.')], flags: MessageFlags.Ephemeral });
      }

      const newBalance = balanceService.addBalance(target.id, idr);

      // DM user
      try {
        await target.send({
          embeds: [successEmbed('Balance Added', `Your balance has been updated!\n\n🔸 **Amount:** +${dl} DL (${formatIDR(idr)})\n🔸 **New Balance:** ${formatIDR(newBalance)}\n🔸 **By:** Admin`)]
        });
      } catch (e) {}

      // Balance log
      const logChannelId3 = settingsService.getSetting('balance_log_channel');
      if (logChannelId3) {
        try {
          const logChannel = await interaction.client.channels.fetch(logChannelId3);
          const censoredName = censorUsername(target.username);
          const embed = new EmbedBuilder()
            .setColor(NEON_GREEN)
            .setDescription(`${formatIDR(idr)} has been added to ${censoredName}`);
          await logChannel.send({ embeds: [embed] });
        } catch (e) {}
      }

      return interaction.reply({ 
        embeds: [successEmbed('Success', `Added ${dl} DL (${formatIDR(idr)}) to <@${target.id}>.\nNew balance: ${formatIDR(newBalance)}`)], 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
