const { MessageFlags } = require('discord.js');
const { errorEmbed } = require('../utils/embedBuilder');
const { handleButton } = require('../handlers/buttonHandler');
const { handleModal } = require('../handlers/modalHandler');
const { handleSelect } = require('../handlers/selectHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`Command ${interaction.commandName} not found.`);
        return;
      }

      // Block DM commands
      if (!interaction.guild) {
        return interaction.reply({ 
          embeds: [errorEmbed('Error', 'Commands cannot be used in DMs.')], 
          flags: MessageFlags.Ephemeral 
        });
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        
        const reply = { 
          embeds: [errorEmbed('Error', 'An error occurred while executing this command.')], 
          flags: MessageFlags.Ephemeral 
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }

    // Buttons
    if (interaction.isButton()) {
      try {
        await handleButton(interaction);
      } catch (error) {
        console.error('Button error:', error);
        
        const reply = { 
          embeds: [errorEmbed('Error', 'An error occurred.')], 
          flags: MessageFlags.Ephemeral 
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }

    // Select Menus
    if (interaction.isStringSelectMenu()) {
      try {
        await handleSelect(interaction);
      } catch (error) {
        console.error('Select error:', error);
        
        const reply = { 
          embeds: [errorEmbed('Error', 'An error occurred.')], 
          flags: MessageFlags.Ephemeral 
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }

    // Modals
    if (interaction.isModalSubmit()) {
      try {
        await handleModal(interaction);
      } catch (error) {
        console.error('Modal error:', error);
        
        const reply = { 
          embeds: [errorEmbed('Error', 'An error occurred.')], 
          flags: MessageFlags.Ephemeral 
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    }
  }
};
