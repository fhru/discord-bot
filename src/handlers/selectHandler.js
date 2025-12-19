const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const scriptService = require("../services/scriptService");
const userService = require("../services/userService");
const luciferKeyService = require("../services/luciferKeyService");
const { errorEmbed } = require("../utils/embedBuilder");
const { formatIDR } = require("../utils/currency");

async function handleSelect(interaction) {
  const customId = interaction.customId;

  if (customId === "select_script") {
    return handleScriptSelect(interaction);
  }

  if (customId === "select_script_addkey") {
    return handleAddKeySelect(interaction);
  }
}

async function handleScriptSelect(interaction) {
  const scriptCode = interaction.values[0];
  const script = scriptService.getScriptByCode(scriptCode);
  const user = userService.getUserByDiscordId(interaction.user.id);

  if (!script) {
    return interaction.update({
      embeds: [errorEmbed("Error", "Script not found.")],
      components: [],
    });
  }

  if (!user) {
    return interaction.update({
      embeds: [errorEmbed("Error", "You are not registered.")],
      components: [],
    });
  }

  if (user.balance < script.price) {
    return interaction.update({
      embeds: [
        errorEmbed(
          "Insufficient Balance",
          `You need ${formatIDR(script.price)} but only have ${formatIDR(
            user.balance,
          )}.\n\nPlease top up your balance first.`,
        ),
      ],
      components: [],
    });
  }

  // Show modal for lucifer username
  const modal = new ModalBuilder()
    .setCustomId(`modal_lucifer_${scriptCode}`)
    .setTitle(`Buy ${script.name}`);

  const luciferInput = new TextInputBuilder()
    .setCustomId("lucifer_username")
    .setLabel("Lucifer Username")
    .setPlaceholder("Enter your Lucifer username")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(50);

  const row = new ActionRowBuilder().addComponents(luciferInput);
  modal.addComponents(row);

  return interaction.showModal(modal);
}

async function handleAddKeySelect(interaction) {
  const scriptCode = interaction.values[0];
  const script = scriptService.getScriptByCode(scriptCode);

  if (!script) {
    return interaction.update({
      embeds: [errorEmbed("Error", "Script not found.")],
      components: [],
    });
  }

  // Check if user has purchased this script
  if (
    !(await luciferKeyService.hasKeyForScript(interaction.user.id, scriptCode))
  ) {
    return interaction.update({
      embeds: [errorEmbed("Error", "You need to purchase this script first.")],
      components: [],
    });
  }

  // Show modal for new lucifer username
  const modal = new ModalBuilder()
    .setCustomId(`modal_addkey_${scriptCode}`)
    .setTitle(`Add Key - ${script.name}`);

  const luciferInput = new TextInputBuilder()
    .setCustomId("lucifer_username")
    .setLabel("New Lucifer Username")
    .setPlaceholder("Enter new Lucifer username")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(50);

  const row = new ActionRowBuilder().addComponents(luciferInput);
  modal.addComponents(row);

  return interaction.showModal(modal);
}

module.exports = { handleSelect };
