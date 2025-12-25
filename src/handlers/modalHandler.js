const { MessageFlags } = require('discord.js');
const userService = require('../services/userService');
const settingsService = require('../services/settingsService');
const { successEmbed, errorEmbed } = require('../utils/embedBuilder');

async function handleModal(interaction) {
  const customId = interaction.customId;

  if (customId === 'modal_setgrowid') {
    return handleSetGrowIdModal(interaction);
  }

  if (customId.startsWith('modal_lucifer_')) {
    return handleLuciferModal(interaction);
  }

  if (customId.startsWith('modal_addkey_')) {
    return handleAddKeyModal(interaction);
  }
}

async function handleSetGrowIdModal(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  
  const growid = interaction.fields.getTextInputValue('growid');
  const isRegistered = userService.isRegistered(interaction.user.id);

  // Check if GrowID already used by another user
  const existingUser = userService.getUserByGrowId(growid);
  if (existingUser && existingUser.discord_id !== interaction.user.id) {
    return interaction.editReply({ 
      embeds: [errorEmbed('Error', `GrowID \`${growid}\` is already registered by another user.`)]
    });
  }

  try {
    if (isRegistered) {
      // Update GrowID
      userService.updateUser(interaction.user.id, { growid });

      return interaction.editReply({ 
        embeds: [successEmbed('GrowID Updated', `Your GrowID has been updated!\n\n🔸 **New GrowID:** \`${growid}\``)]
      });
    } else {
      // Create new user
      userService.createUser(interaction.user.id, interaction.user.username, growid);

      // Send system log
      const logChannelId = settingsService.getSetting('system_log_channel');
      if (logChannelId) {
        try {
          const logChannel = await interaction.client.channels.fetch(logChannelId);
          await logChannel.send({
            embeds: [successEmbed('New Registration', `**User:** <@${interaction.user.id}>\n**GrowID:** \`${growid}\``)]
          });
        } catch (e) {
          console.error('Failed to send reg log:', e);
        }
      }

      return interaction.editReply({ 
        embeds: [successEmbed('Registration Successful', `Welcome!\n\n🔸 **GrowID:** \`${growid}\`\n\nYou can now top up balance and purchase scripts.`)]
      });
    }
  } catch (error) {
    console.error('SetGrowId error:', error);
    return interaction.editReply({ 
      embeds: [errorEmbed('Error', 'Operation failed. Please try again.')]
    });
  }
}

async function handleLuciferModal(interaction) {
  const scriptCode = interaction.customId.replace('modal_lucifer_', '');
  const luciferUsername = interaction.fields.getTextInputValue('lucifer_username');

  const scriptService = require('../services/scriptService');
  const balanceService = require('../services/balanceService');
  const { formatIDR } = require('../utils/currency');
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

  const script = scriptService.getScriptByCode(scriptCode);
  const user = userService.getUserByDiscordId(interaction.user.id);

  if (!script) {
    return interaction.reply({ 
      embeds: [errorEmbed('Error', 'Script not found.')], 
      flags: MessageFlags.Ephemeral 
    });
  }

  if (!user) {
    return interaction.reply({ 
      embeds: [errorEmbed('Error', 'You are not registered.')], 
      flags: MessageFlags.Ephemeral 
    });
  }

  if (!balanceService.hasEnoughBalance(interaction.user.id, script.price)) {
    return interaction.reply({ 
      embeds: [errorEmbed('Insufficient Balance', `You need ${formatIDR(script.price)} but only have ${formatIDR(user.balance)}`)], 
      flags: MessageFlags.Ephemeral 
    });
  }

  // Confirmation buttons (using : as separator to avoid conflict with usernames containing _)
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`confirm_buy:${scriptCode}:${luciferUsername}`)
        .setLabel('Confirm Purchase')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`cancel_buy:${scriptCode}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
    );

  return interaction.reply({
    embeds: [require('../utils/embedBuilder').infoEmbed('Confirm Purchase', `**Script:** ${script.name}\n**Price:** ${formatIDR(script.price)}\n**Lucifer Username:** \`${luciferUsername}\`\n**Your Balance:** ${formatIDR(user.balance)}\n\nClick Confirm to proceed.`)],
    components: [row],
    flags: MessageFlags.Ephemeral
  });
}

async function handleAddKeyModal(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  
  const scriptCode = interaction.customId.replace('modal_addkey_', '');
  const luciferUsername = interaction.fields.getTextInputValue('lucifer_username');

  const scriptService = require('../services/scriptService');
  const luciferKeyService = require('../services/luciferKeyService');
  const { formatIDR } = require('../utils/currency');
  const { db } = require('../database/db');

  const script = scriptService.getScriptByCode(scriptCode);
  const addKeyPrice = parseInt(settingsService.getSetting('add_key_price') || '5000');

  if (!script) {
    return interaction.editReply({ 
      embeds: [errorEmbed('Error', 'Script not found.')]
    });
  }

  // Check if user has purchased this script
  if (!await luciferKeyService.hasKeyForScript(interaction.user.id, scriptCode)) {
    return interaction.editReply({ 
      embeds: [errorEmbed('Error', 'You need to purchase this script first before adding extra keys.')]
    });
  }

  // Check if lucifer username already used for this script
  if (await luciferKeyService.isUsernameUsedForScript(scriptCode, luciferUsername)) {
    return interaction.editReply({ 
      embeds: [errorEmbed('Error', `Lucifer username \`${luciferUsername}\` is already used for this script.`)]
    });
  }

  // Atomic balance deduction with race condition prevention
  const result = db.prepare(
    'UPDATE users SET balance = balance - ? WHERE discord_id = ? AND balance >= ?'
  ).run(addKeyPrice, interaction.user.id, addKeyPrice);

  if (result.changes === 0) {
    return interaction.editReply({ 
      embeds: [errorEmbed('Insufficient Balance', `You don't have enough balance.`)]
    });
  }

  // Create new key
  await luciferKeyService.createLuciferKey(interaction.user.id, scriptCode, luciferUsername);

  return interaction.editReply({
    embeds: [successEmbed('Key Added', `New Lucifer key added!\n\n🔸 **Script:** ${script.name}\n🔸 **Username:** \`${luciferUsername}\`\n🔸 **Cost:** ${formatIDR(addKeyPrice)}`)]
  });
}

module.exports = { handleModal };
