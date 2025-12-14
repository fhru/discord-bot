const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const scriptService = require('../../services/scriptService');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embedBuilder');
const { formatIDR } = require('../../utils/currency');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('script')
    .setDescription('Manage scripts (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a new script')
        .addStringOption(opt => opt.setName('name').setDescription('Script name').setRequired(true))
        .addStringOption(opt => opt.setName('code').setDescription('Script code (unique)').setRequired(true))
        .addIntegerOption(opt => opt.setName('price').setDescription('Price in IDR').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role to give on purchase'))
        .addStringOption(opt => opt.setName('link').setDescription('Script info link'))
        .addStringOption(opt => opt.setName('download').setDescription('Download link'))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all scripts')
    )
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Get script info')
        .addStringOption(opt => opt.setName('code').setDescription('Script code').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a script')
        .addStringOption(opt => opt.setName('code').setDescription('Script code').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('toggle')
        .setDescription('Toggle script availability')
        .addStringOption(opt => opt.setName('code').setDescription('Script code').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('edit')
        .setDescription('Edit script')
        .addStringOption(opt => opt.setName('code').setDescription('Script code').setRequired(true))
        .addStringOption(opt => opt.setName('name').setDescription('New name'))
        .addIntegerOption(opt => opt.setName('price').setDescription('New price'))
        .addRoleOption(opt => opt.setName('role').setDescription('New role'))
        .addStringOption(opt => opt.setName('link').setDescription('New info link'))
        .addStringOption(opt => opt.setName('download').setDescription('New download link'))
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
      const name = interaction.options.getString('name');
      const code = interaction.options.getString('code');
      const price = interaction.options.getInteger('price');
      const role = interaction.options.getRole('role');
      const link = interaction.options.getString('link');
      const download = interaction.options.getString('download');

      const existing = scriptService.getScriptByCode(code);
      if (existing) {
        return interaction.reply({ embeds: [errorEmbed('Error', `Script code \`${code}\` already exists.`)], flags: MessageFlags.Ephemeral });
      }

      scriptService.createScript({
        name,
        code,
        price,
        role_id: role?.id || null,
        link,
        download_link: download
      });

      return interaction.reply({ 
        embeds: [successEmbed('Success', `Script \`${name}\` created with code \`${code}\` at ${formatIDR(price)}`)], 
        flags: MessageFlags.Ephemeral 
      });
    }

    if (subcommand === 'list') {
      const scripts = scriptService.getAllScripts();
      if (scripts.length === 0) {
        return interaction.reply({ embeds: [infoEmbed('Scripts', 'No scripts created.')], flags: MessageFlags.Ephemeral });
      }

      const list = scripts.map(s => 
        `${s.is_available ? '🟢' : '🔴'} **${s.name}** (\`${s.code}\`) - ${formatIDR(s.price)}`
      ).join('\n');

      return interaction.reply({ embeds: [infoEmbed('Scripts', list)], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'info') {
      const code = interaction.options.getString('code');
      const script = scriptService.getScriptByCode(code);

      if (!script) {
        return interaction.reply({ embeds: [errorEmbed('Error', `Script \`${code}\` not found.`)], flags: MessageFlags.Ephemeral });
      }

      return interaction.reply({
        embeds: [infoEmbed('Script Info', null, [
          { name: '🔸 Name', value: script.name, inline: true },
          { name: '🔸 Code', value: script.code, inline: true },
          { name: '🔸 Price', value: formatIDR(script.price), inline: true },
          { name: '🔸 Status', value: script.is_available ? 'Available' : 'Unavailable', inline: true },
          { name: '🔸 Role', value: script.role_id ? `<@&${script.role_id}>` : 'None', inline: true },
          { name: '🔸 Link', value: script.link || 'None', inline: true }
        ])],
        flags: MessageFlags.Ephemeral
      });
    }

    if (subcommand === 'delete') {
      const code = interaction.options.getString('code');
      const script = scriptService.getScriptByCode(code);

      if (!script) {
        return interaction.reply({ embeds: [errorEmbed('Error', `Script \`${code}\` not found.`)], flags: MessageFlags.Ephemeral });
      }

      scriptService.deleteScript(script.id);
      return interaction.reply({ embeds: [successEmbed('Success', `Script \`${script.name}\` deleted.`)], flags: MessageFlags.Ephemeral });
    }

    if (subcommand === 'toggle') {
      const code = interaction.options.getString('code');
      const script = scriptService.getScriptByCode(code);

      if (!script) {
        return interaction.reply({ embeds: [errorEmbed('Error', `Script \`${code}\` not found.`)], flags: MessageFlags.Ephemeral });
      }

      scriptService.toggleAvailability(script.id);
      const newStatus = script.is_available ? 'Unavailable' : 'Available';
      return interaction.reply({ 
        embeds: [successEmbed('Success', `Script \`${script.name}\` is now ${newStatus}`)], 
        flags: MessageFlags.Ephemeral 
      });
    }

    if (subcommand === 'edit') {
      const code = interaction.options.getString('code');
      const script = scriptService.getScriptByCode(code);

      if (!script) {
        return interaction.reply({ embeds: [errorEmbed('Error', `Script \`${code}\` not found.`)], flags: MessageFlags.Ephemeral });
      }

      const updates = {};
      const name = interaction.options.getString('name');
      const price = interaction.options.getInteger('price');
      const role = interaction.options.getRole('role');
      const link = interaction.options.getString('link');
      const download = interaction.options.getString('download');

      if (name) updates.name = name;
      if (price) updates.price = price;
      if (role) updates.role_id = role.id;
      if (link) updates.link = link;
      if (download) updates.download_link = download;

      if (Object.keys(updates).length === 0) {
        return interaction.reply({ embeds: [errorEmbed('Error', 'No changes provided.')], flags: MessageFlags.Ephemeral });
      }

      scriptService.updateScript(script.id, updates);
      return interaction.reply({ embeds: [successEmbed('Success', `Script \`${code}\` updated.`)], flags: MessageFlags.Ephemeral });
    }
  }
};
