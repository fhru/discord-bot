const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');
const userService = require('../services/userService');
const scriptService = require('../services/scriptService');
const settingsService = require('../services/settingsService');
const luciferKeyService = require('../services/luciferKeyService');
const transactionService = require('../services/transactionService');
const {
  successEmbed,
  errorEmbed,
  infoEmbed,
  createEmbed,
} = require('../utils/embedBuilder');
const { formatIDR, getDLPrice, idrToDL } = require('../utils/currency');

async function handleButton(interaction) {
  const customId = interaction.customId;

  if (customId === 'panel_setgrowid') {
    return handleSetGrowId(interaction);
  }

  if (customId === 'panel_buy') {
    return handleBuy(interaction);
  }

  if (customId === 'panel_howtobuy') {
    return handleHowToBuy(interaction);
  }

  if (customId === 'panel_myinfo') {
    return handleMyInfo(interaction);
  }

  if (customId === 'panel_addkey') {
    return handleAddKey(interaction);
  }

  if (customId.startsWith('confirm_buy:')) {
    return handleConfirmBuy(interaction);
  }

  if (customId.startsWith('cancel_buy:')) {
    return interaction.update({
      embeds: [infoEmbed('Cancelled', 'Purchase cancelled.')],
      components: [],
    });
  }
}

async function handleSetGrowId(interaction) {
  const isRegistered = userService.isRegistered(interaction.user.id);

  const modal = new ModalBuilder()
    .setCustomId('modal_setgrowid')
    .setTitle(isRegistered ? 'Update GrowID' : 'Register');

  const growIdInput = new TextInputBuilder()
    .setCustomId('growid')
    .setLabel('GrowID')
    .setPlaceholder('Enter your Growtopia GrowID')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(20);

  const row = new ActionRowBuilder().addComponents(growIdInput);
  modal.addComponents(row);

  return interaction.showModal(modal);
}

async function handleBuy(interaction) {
  if (!userService.isRegistered(interaction.user.id)) {
    return interaction.reply({
      embeds: [errorEmbed('Not Registered', 'Please register first.')],
      flags: MessageFlags.Ephemeral,
    });
  }

  const scripts = scriptService.getAvailableScripts();
  if (scripts.length === 0) {
    return interaction.reply({
      embeds: [infoEmbed('No Scripts', 'No scripts available for purchase.')],
      flags: MessageFlags.Ephemeral,
    });
  }

  const options = scripts.map((s) => ({
    label: s.name,
    description: `${formatIDR(s.price)} - Code: ${s.code}`,
    value: s.code,
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_script')
    .setPlaceholder('Select a script to buy')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(select);

  return interaction.reply({
    embeds: [
      infoEmbed('Buy Script', 'Select the script you want to purchase:'),
    ],
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleHowToBuy(interaction) {
  const worldName = settingsService.getSetting('world_name') || 'Not set';
  const worldOwner = settingsService.getSetting('world_owner') || 'Not set';
  const dlPrice = getDLPrice();

  const steps = `**How To Buy Script:**

1️⃣ **Set GrowID** - Click Set GrowID button and enter your GrowID

2️⃣ **Top Up Balance**
   🔸 Via Growtopia: Drop DL to world \`${worldName}\` (Owner: \`${worldOwner}\`)
   🔸 Via Saweria: Use format \`YourGrowID\` in the message

3️⃣ **Buy Script** - Click Buy Script button and select a script

4️⃣ **Input Lucifer Username** - Enter your Lucifer Executor username

5️⃣ **Confirm** - Check details and confirm your purchase

**Rate:** ${formatIDR(dlPrice)} per DL`;

  return interaction.reply({
    embeds: [infoEmbed('How To Buy', steps)],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleMyInfo(interaction) {
  const user = userService.getUserByDiscordId(interaction.user.id);

  if (!user) {
    return interaction.reply({
      embeds: [errorEmbed('Not Registered', 'Please register first.')],
      flags: MessageFlags.Ephemeral,
    });
  }

  const keyCount = luciferKeyService.countKeysByUser(interaction.user.id);
  const totalSpent = transactionService.getTotalSpentByUser(
    interaction.user.id
  );

  return interaction.reply({
    embeds: [
      infoEmbed('My Info', null, [
        { name: '🔸 Discord', value: `<@${user.discord_id}>`, inline: true },
        { name: '🔸 GrowID', value: user.growid || 'N/A', inline: true },
        { name: '🔸 Balance', value: formatIDR(user.balance), inline: true },
        { name: '🔸 Lucifer Keys', value: `${keyCount} keys`, inline: true },
        { name: '🔸 Total Spent', value: formatIDR(totalSpent), inline: true },
        { name: '🔸 Registered', value: user.created_at, inline: true },
      ]),
    ],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleAddKey(interaction) {
  if (!userService.isRegistered(interaction.user.id)) {
    return interaction.reply({
      embeds: [errorEmbed('Not Registered', 'Please register first.')],
      flags: MessageFlags.Ephemeral,
    });
  }

  const scripts = scriptService.getAvailableScripts();
  if (scripts.length === 0) {
    return interaction.reply({
      embeds: [infoEmbed('No Scripts', 'No scripts available.')],
      flags: MessageFlags.Ephemeral,
    });
  }

  const options = scripts.map((s) => ({
    label: s.name,
    description: `Code: ${s.code}`,
    value: s.code,
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_script_addkey')
    .setPlaceholder('Select script for new key')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(select);

  const addKeyPrice = settingsService.getSetting('add_key_price') || '5000';

  return interaction.reply({
    embeds: [
      infoEmbed(
        'Add Lucifer Key',
        `Add another Lucifer key to your purchased script.\n\n**Cost:** ${formatIDR(
          parseInt(addKeyPrice)
        )} per key`
      ),
    ],
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleConfirmBuy(interaction) {
  // Parse with : separator
  const data = interaction.customId.replace('confirm_buy:', '').split(':');
  const scriptCode = data[0];
  const luciferUsername = data.slice(1).join(':');

  const script = scriptService.getScriptByCode(scriptCode);
  const user = userService.getUserByDiscordId(interaction.user.id);

  if (!script || !user) {
    return interaction.update({
      embeds: [errorEmbed('Error', 'Invalid data.')],
      components: [],
    });
  }

  // Re-check script availability
  if (!script.is_available) {
    return interaction.update({
      embeds: [errorEmbed('Error', 'Script is no longer available.')],
      components: [],
    });
  }

  // Check if lucifer username already used for this script
  if (luciferKeyService.isUsernameUsedForScript(script.code, luciferUsername)) {
    return interaction.update({
      embeds: [
        errorEmbed(
          'Error',
          `Lucifer username \`${luciferUsername}\` is already used for this script.`
        ),
      ],
      components: [],
    });
  }

  // Atomic balance deduction with race condition prevention
  const { db } = require('../database/db');
  const result = db.prepare(
    'UPDATE users SET balance = balance - ? WHERE discord_id = ? AND balance >= ?'
  ).run(script.price, user.discord_id, script.price);

  // Check if update was successful (balance was sufficient)
  if (result.changes === 0) {
    return interaction.update({
      embeds: [
        errorEmbed(
          'Insufficient Balance',
          `You don't have enough balance to complete this purchase.`
        ),
      ],
      components: [],
    });
  }

  // Create transaction
  const txResult = transactionService.createTransaction({
    script_id: script.id,
    discord_id: user.discord_id,
    total_amount: script.price,
    status: 'completed',
  });
  const orderId = txResult.lastInsertRowid;

  // Create lucifer key
  luciferKeyService.createLuciferKey(
    user.discord_id,
    script.code,
    luciferUsername
  );

  // Add role if configured
  if (script.role_id) {
    try {
      await interaction.member.roles.add(script.role_id);
    } catch (e) {
      console.error('Failed to add role:', e);
    }
  }

  // Send transaction log
  const logChannelId = settingsService.getSetting('transaction_log_channel');
  if (logChannelId) {
    try {
      const logChannel = await interaction.client.channels.fetch(logChannelId);
      const logEmbed = createEmbed({
        title: `Order #${orderId}`,
        description: `**Details:**\n<:oldarrow:1155818329005637682> User: <@${
          user.discord_id
        }>\n<:oldarrow:1155818329005637682> Script: **${
          script.name
        }**\n<:oldarrow:1155818329005637682> Price: **${formatIDR(
          script.price
        )}**`,
      });
      logEmbed.setImage(
        'https://cdn.discordapp.com/attachments/1146148490867650601/1155230994429907014/rubotfix.gif'
      );
      await logChannel.send({ embeds: [logEmbed] });
    } catch (e) {
      console.error('Failed to send log:', e);
    }
  }

  // DM user
  try {
    await interaction.user.send({
      embeds: [
        successEmbed(
          'Purchase Successful',
          `Thank you for purchasing **${
            script.name
          }**!\n\n🔸 **Price:** ${formatIDR(
            script.price
          )}\n🔸 **Lucifer Username:** \`${luciferUsername}\`\n${
            script.download_link
              ? `🔸 **Download:** ${script.download_link}`
              : ''
          }`
        ),
      ],
    });
  } catch (e) {
    // User has DMs disabled
  }

  return interaction.update({
    embeds: [
      successEmbed(
        'Purchase Complete',
        `You have purchased **${
          script.name
        }**!\n\n🔸 **Lucifer Username:** \`${luciferUsername}\`\n${
          script.role_id ? `🔸 **Role:** <@&${script.role_id}>` : ''
        }`
      ),
    ],
    components: [],
  });
}

module.exports = { handleButton };
