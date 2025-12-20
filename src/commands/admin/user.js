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

    // Defer reply for balance-related subcommands to avoid 3-second timeout
    if (['setbalance', 'addbalance', 'adddl', 'info', 'delete'].includes(subcommand)) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    }

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
        return interaction.editReply({ embeds: [errorEmbed('Error', 'User not registered.')] });
      }

      return interaction.editReply({
        embeds: [infoEmbed('User Info', null, [
          { name: '🔸 Discord', value: `<@${user.discord_id}>`, inline: true },
          { name: '🔸 GrowID', value: user.growid || 'N/A', inline: true },
          { name: '🔸 Balance', value: formatIDR(user.balance), inline: true },
          { name: '🔸 Registered', value: user.created_at, inline: false }
        ])]
      });
    }

    if (subcommand === 'delete') {
      const target = interaction.options.getUser('target');
      const user = userService.getUserByDiscordId(target.id);

      if (!user) {
        return interaction.editReply({ embeds: [errorEmbed('Error', 'User not registered.')] });
      }

      userService.deleteUser(target.id);
      return interaction.editReply({ embeds: [successEmbed('Success', `User <@${target.id}> has been deleted.`)] });
    }

    if (subcommand === 'setbalance') {
      const target = interaction.options.getUser('target');
      const amount = interaction.options.getInteger('amount');

      if (!userService.isRegistered(target.id)) {
        return interaction.editReply({ embeds: [errorEmbed('Error', 'User not registered.')] });
      }

      balanceService.setBalance(target.id, amount);

      // DM user and send log in parallel
      const logChannelId = settingsService.getSetting('balance_log_channel');
      const dmPromise = target.send({
        embeds: [successEmbed('Balance Updated', `Your balance has been set!\n\n🔸 **New Balance:** ${formatIDR(amount)}\n🔸 **By:** Admin`)]
      }).catch(() => {});

      const logPromise = (async () => {
        if (logChannelId) {
          const logChannel = await interaction.client.channels.fetch(logChannelId);
          const censoredName = censorUsername(target.username);
          const embed = new EmbedBuilder()
            .setColor(NEON_GREEN)
            .setDescription(`${formatIDR(amount)} has been set to ${censoredName}`);
          await logChannel.send({ embeds: [embed] });
        }
      })().catch(() => {});

      await Promise.allSettled([dmPromise, logPromise]);

      return interaction.editReply({ 
        embeds: [successEmbed('Success', `Balance <@${target.id}> set to ${formatIDR(amount)}`)]
      });
    }

    if (subcommand === 'addbalance') {
      const target = interaction.options.getUser('target');
      const amount = interaction.options.getInteger('amount');

      if (!userService.isRegistered(target.id)) {
        return interaction.editReply({ embeds: [errorEmbed('Error', 'User not registered.')] });
      }

      const newBalance = balanceService.addBalance(target.id, amount);

      // DM user and send log in parallel
      const logChannelId2 = settingsService.getSetting('balance_log_channel');
      const dmPromise = target.send({
        embeds: [successEmbed('Balance Added', `Your balance has been updated!\n\n🔸 **Amount:** +${formatIDR(amount)}\n🔸 **New Balance:** ${formatIDR(newBalance)}\n🔸 **By:** Admin`)]
      }).catch(() => {});

      const logPromise = (async () => {
        if (logChannelId2) {
          const logChannel = await interaction.client.channels.fetch(logChannelId2);
          const censoredName = censorUsername(target.username);
          const embed = new EmbedBuilder()
            .setColor(NEON_GREEN)
            .setDescription(`${formatIDR(amount)} has been added to ${censoredName}`);
          await logChannel.send({ embeds: [embed] });
        }
      })().catch(() => {});

      await Promise.allSettled([dmPromise, logPromise]);

      return interaction.editReply({ 
        embeds: [successEmbed('Success', `Added ${formatIDR(amount)} to <@${target.id}>.\nNew balance: ${formatIDR(newBalance)}`)]
      });
    }

    if (subcommand === 'adddl') {
      const target = interaction.options.getUser('target');
      const dl = interaction.options.getInteger('dl');
      const idr = dlToIDR(dl);

      if (!userService.isRegistered(target.id)) {
        return interaction.editReply({ embeds: [errorEmbed('Error', 'User not registered.')] });
      }

      const newBalance = balanceService.addBalance(target.id, idr);

      // DM user and send log in parallel
      const logChannelId3 = settingsService.getSetting('balance_log_channel');
      const dmPromise = target.send({
        embeds: [successEmbed('Balance Added', `Your balance has been updated!\n\n🔸 **Amount:** +${dl} DL (${formatIDR(idr)})\n🔸 **New Balance:** ${formatIDR(newBalance)}\n🔸 **By:** Admin`)]
      }).catch(() => {});

      const logPromise = (async () => {
        if (logChannelId3) {
          const logChannel = await interaction.client.channels.fetch(logChannelId3);
          const censoredName = censorUsername(target.username);
          const embed = new EmbedBuilder()
            .setColor(NEON_GREEN)
            .setDescription(`${formatIDR(idr)} has been added to ${censoredName}`);
          await logChannel.send({ embeds: [embed] });
        }
      })().catch(() => {});

      await Promise.allSettled([dmPromise, logPromise]);

      return interaction.editReply({ 
        embeds: [successEmbed('Success', `Added ${dl} DL (${formatIDR(idr)}) to <@${target.id}>.\nNew balance: ${formatIDR(newBalance)}`)]
      });
    }
  }
};
