const { EmbedBuilder } = require('discord.js');

const NEON_GREEN = 0x39FF14;

function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || NEON_GREEN)
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.footer) embed.setFooter({ text: options.footer });
  if (options.fields) embed.addFields(options.fields);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);

  return embed;
}

function successEmbed(title, description) {
  return createEmbed({
    title: `🔸 ${title}`,
    description,
    footer: 'Rubot'
  });
}

function errorEmbed(title, description) {
  return createEmbed({
    title: `◽ ${title}`,
    description,
    color: 0xFF0000,
    footer: 'Rubot'
  });
}

function infoEmbed(title, description, fields = []) {
  return createEmbed({
    title: `🔹 ${title}`,
    description,
    fields,
    footer: 'Rubot'
  });
}

module.exports = {
  NEON_GREEN,
  createEmbed,
  successEmbed,
  errorEmbed,
  infoEmbed
};
