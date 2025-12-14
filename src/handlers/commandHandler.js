const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');

function loadCommands(client) {
  client.commands = new Collection();
  
  const commandsPath = path.join(__dirname, '../commands');
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const stat = fs.statSync(folderPath);
    
    if (stat.isDirectory()) {
      const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          console.log(`🔹 Loaded command: ${command.data.name}`);
        } else {
          console.log(`◽ Warning: ${filePath} missing "data" or "execute"`);
        }
      }
    }
  }

  return client.commands;
}

function getCommandsData(client) {
  return Array.from(client.commands.values()).map(cmd => cmd.data.toJSON());
}

module.exports = { loadCommands, getCommandsData };
