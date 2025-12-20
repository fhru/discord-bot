const settingsService = require('../services/settingsService');
const userService = require('../services/userService');
const balanceService = require('../services/balanceService');
const { successEmbed, NEON_GREEN } = require('../utils/embedBuilder');
const { EmbedBuilder } = require('discord.js');
const { formatIDR, censorUsername } = require('../utils/currency');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Check if this is the Saweria channel
    const saweriaChannelId = settingsService.getSetting('saweria_channel');
    if (!saweriaChannelId || message.channel.id !== saweriaChannelId) return;

    // Parse Saweria embed messagess
    // Saweria sends embed with title: "{amount} From {donator}"
    if (!message.embeds || message.embeds.length === 0) return;

    const embed = message.embeds[0];
    if (!embed.title) return;

    const regex = /^(\d+(?:[.,]\d+)?)\s*From\s*(.+)$/i;
    const match = embed.title.match(regex);

    if (!match) return;

    let amount = match[1].replace(/[.,]/g, '');
    amount = parseInt(amount);
    const growid = match[2];

    if (isNaN(amount) || amount <= 0) return;

    // Find user by GrowID
    const user = userService.getUserByGrowId(growid);
    if (!user) {
      console.log(`Saweria: GrowID ${growid} not found`);
      return;
    }

    // Add balance
    const newBalance = balanceService.addBalance(user.discord_id, amount);

    // Send balance log
    const logChannelId = settingsService.getSetting('balance_log_channel');
    if (logChannelId) {
      try {
        const logChannel = await message.client.channels.fetch(logChannelId);
        const censoredName = censorUsername(user.username);
        const logEmbed = new EmbedBuilder()
          .setColor(NEON_GREEN)
          .setDescription(
            `${formatIDR(amount)} has been added to ${censoredName}`
          );
        await logChannel.send({ embeds: [logEmbed] });
      } catch (e) {
        console.error('Failed to send balance log:', e);
      }
    }

    // DM user
    try {
      const discordUser = await message.client.users.fetch(user.discord_id);
      await discordUser.send({
        embeds: [
          successEmbed(
            'Balance Added',
            `Your balance has been updated!\n\n🔸 **Amount:** +${formatIDR(
              amount
            )}\n🔸 **New Balance:** ${formatIDR(
              newBalance
            )}\n🔸 **Source:** Saweria`
          ),
        ],
      });
    } catch (e) {
      // User has DMs disabled
    }

    // React to confirm processing
    try {
      await message.react('✅');
    } catch (e) {
      // Can't react
    }

    console.log(
      `Saweria: Added ${formatIDR(amount)} to ${growid} (${user.discord_id})`
    );
  },
};
