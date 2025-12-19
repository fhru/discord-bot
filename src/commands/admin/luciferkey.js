const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const luciferKeyService = require('../../services/luciferKeyService');
const userService = require('../../services/userService');
const scriptService = require('../../services/scriptService');
const { successEmbed, errorEmbed } = require('../../utils/embedBuilder');
const { paginatedReply } = require('../../utils/pagination');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('luciferkey')
    .setDescription('Manage Lucifer Keys (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all Lucifer Keys')
    )
    .addSubcommand(sub =>
      sub.setName('listuser')
        .setDescription('List keys by user')
        .addUserOption(opt => opt.setName('target').setDescription('Target user').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('listscript')
        .setDescription('List keys by script')
        .addStringOption(opt => opt.setName('code').setDescription('Script code').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a Lucifer Key')
        .addIntegerOption(opt => opt.setName('id').setDescription('Key ID').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a Lucifer Key to user')
        .addUserOption(opt => opt.setName('target').setDescription('Target user').setRequired(true))
        .addStringOption(opt => opt.setName('code').setDescription('Script code').setRequired(true))
        .addStringOption(opt => opt.setName('username').setDescription('Lucifer username').setRequired(true))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const keys = await luciferKeyService.getAllLuciferKeys();
      
      return paginatedReply(interaction, {
        title: 'Lucifer Keys',
        items: keys,
        formatItem: (k) => `#${k.id} | <@${k.discord_id}> | ${k.script_name} | \`${k.lucifer_username}\``,
        emptyMessage: 'No keys found.'
      });
    }

    if (subcommand === 'listuser') {
      const target = interaction.options.getUser('target');
      const keys = await luciferKeyService.getLuciferKeysByUser(target.id);

      return paginatedReply(interaction, {
        title: `Lucifer Keys - ${target.username}`,
        items: keys,
        formatItem: (k) => `#${k.id} | ${k.script_name || k.script_code} | \`${k.lucifer_username}\``,
        emptyMessage: `<@${target.id}> has no keys.`
      });
    }

    if (subcommand === 'listscript') {
      const code = interaction.options.getString('code');
      const keys = await luciferKeyService.getLuciferKeysByScript(code);

      return paginatedReply(interaction, {
        title: `Lucifer Keys - Script: ${code}`,
        items: keys,
        formatItem: (k) => `#${k.id} | ${k.username || 'Unknown'} | \`${k.lucifer_username}\``,
        emptyMessage: `No keys for script \`${code}\`.`
      });
    }

    if (subcommand === 'delete') {
      const id = interaction.options.getInteger('id');
      const result = await luciferKeyService.deleteLuciferKey(id);

      if (result.changes === 0) {
        return interaction.reply({ embeds: [errorEmbed('Error', `Key #${id} not found.`)], flags: MessageFlags.Ephemeral });
      }

      return interaction.reply({ embeds: [successEmbed('Success', `Key #${id} deleted.`)], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'add') {
      const target = interaction.options.getUser('target');
      const code = interaction.options.getString('code');
      const luciferUsername = interaction.options.getString('username');

      // Validasi user terdaftar
      if (!userService.isRegistered(target.id)) {
        return interaction.reply({ embeds: [errorEmbed('Error', `<@${target.id}> is not registered.`)], flags: MessageFlags.Ephemeral });
      }

      // Validasi script ada
      const script = scriptService.getScriptByCode(code);
      if (!script) {
        return interaction.reply({ embeds: [errorEmbed('Error', `Script \`${code}\` not found.`)], flags: MessageFlags.Ephemeral });
      }

      // Check if username is already used for this script
      if (await luciferKeyService.isUsernameUsedForScript(code, luciferUsername)) {
        return interaction.reply({ embeds: [errorEmbed('Error', `Lucifer username \`${luciferUsername}\` is already used for this script.`)], flags: MessageFlags.Ephemeral });
      }

      // Create lucifer key
      await luciferKeyService.createLuciferKey(target.id, code, luciferUsername);

      return interaction.reply({ 
        embeds: [successEmbed('Success', `Lucifer Key added!\n\n🔸 **User:** <@${target.id}>\n🔸 **Script:** ${script.name}\n🔸 **Username:** \`${luciferUsername}\``)], 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
