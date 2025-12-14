const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { infoEmbed } = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display all available commands and features'),

  async execute(interaction) {
    const userCommands = `
\`/help\` - Display this help menu
\`/myinfo\` - View your profile information
\`/balance\` - Check your balance
\`/mykeys\` - View your Lucifer keys
\`/leaderboard balance\` - Top users by balance
\`/leaderboard spending\` - Top users by spending
\`/deposit world\` - View deposit world info
\`/deposit saweria\` - View Saweria info`;

    const panelFeatures = `
**Set GrowID** - Register or update your GrowID
**Buy Script** - Purchase available scripts
**How To Buy** - Step-by-step purchase guide
**My Info** - Quick view of your profile
**Add Key** - Add extra Lucifer key to owned script`;

    const quickStart = `
1️⃣ Click **Set GrowID** and enter your Growtopia GrowID
2️⃣ Top up balance via Growtopia (drop DL) or Saweria
3️⃣ Click **Buy Script** and select a script
4️⃣ Enter your Lucifer Executor username
5️⃣ Confirm your purchase`;

    return interaction.reply({
      embeds: [infoEmbed('Help', null, [
        { name: '📋 User Commands', value: userCommands, inline: false },
        { name: '🖱️ Panel Features', value: panelFeatures, inline: false },
        { name: '🚀 Quick Start', value: quickStart, inline: false }
      ])],
      flags: MessageFlags.Ephemeral
    });
  }
};
