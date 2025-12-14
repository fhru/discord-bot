const { db } = require('../database/db');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const scriptService = require('./scriptService');
const { NEON_GREEN } = require('../utils/embedBuilder');
const { formatIDR, idrToDL } = require('../utils/currency');

function createPanel(guildId, channelId, messageId) {
  const stmt = db.prepare(`
    INSERT INTO active_panels (guild_id, channel_id, message_id)
    VALUES (?, ?, ?)
  `);
  return stmt.run(guildId, channelId, messageId);
}

function getAllPanels() {
  return db.prepare('SELECT * FROM active_panels').all();
}

function deletePanel(id) {
  return db.prepare('DELETE FROM active_panels WHERE id = ?').run(id);
}

function deletePanelByMessage(messageId) {
  return db
    .prepare('DELETE FROM active_panels WHERE message_id = ?')
    .run(messageId);
}

function buildPanelEmbed() {
  const scripts = scriptService.getAllScripts();

  const embed = new EmbedBuilder()
    .setColor(NEON_GREEN)
    .setTitle('SCRIPT CATALOG')
    .setImage(
      'https://cdn.discordapp.com/attachments/1146148490867650601/1155230994429907014/rubotfix.gif'
    )
    .setTimestamp()
    .setFooter({ text: 'Updated' });

  if (scripts.length > 0) {
    const fields = [];
    for (let i = 0; i < scripts.length; i += 3) {
      const row = scripts.slice(i, i + 3);
      row.forEach((script) => {
        const dlPrice = idrToDL(script.price);
        const status = script.is_available ? '🟢 Available' : '🔴 Unavailable';
        const features = script.link ? `[Features](${script.link})` : '-';

        fields.push({
          name: `🔹 ${script.name}`,
          value: `- ${features}\n- Code: \`${script.code.toUpperCase()}\`\n- ${formatIDR(
            script.price
          )} [<:DL:1156779207767117944> ${dlPrice}]\n- ${status}`,
          inline: true,
        });
      });
      if (row.length < 3) {
        for (let j = 0; j < 3 - row.length; j++) {
          fields.push({ name: '\u200B', value: '\u200B', inline: true });
        }
      }
    }
    embed.addFields(fields);
  } else {
    embed.addFields({ name: '◽ Info', value: 'No scripts available.' });
  }

  return embed;
}

function buildPanelButtons() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('panel_setgrowid')
      .setLabel('Set GrowID')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('panel_buy')
      .setLabel('Buy Script')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('panel_howtobuy')
      .setLabel('How To Buy')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('panel_myinfo')
      .setLabel('My Info')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('panel_addkey')
      .setLabel('Add Key')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1];
}

module.exports = {
  createPanel,
  getAllPanels,
  deletePanel,
  deletePanelByMessage,
  buildPanelEmbed,
  buildPanelButtons,
};
