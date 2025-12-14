const { ActivityType } = require('discord.js');
const panelService = require('../services/panelService');
const { backupDatabase } = require('../utils/backup');

const statuses = [
  { name: '/help', type: ActivityType.Listening },
  { name: 'Depo via saweria.co/rubot', type: ActivityType.Playing },
  { name: '{users} Members', type: ActivityType.Watching },
];

let statusIndex = 0;

function updateStatus(client) {
  const status = statuses[statusIndex];
  let name = status.name;

  if (name.includes('{users}')) {
    const userCount = client.guilds.cache.reduce(
      (a, g) => a + g.memberCount,
      0
    );
    name = name.replace('{users}', userCount);
  }

  client.user.setActivity(name, { type: status.type });
  statusIndex = (statusIndex + 1) % statuses.length;
}

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`🔸 Logged in as ${client.user.tag}`);

    // Set initial status and rotate every 30 seconds
    updateStatus(client);
    setInterval(() => updateStatus(client), 30000);

    // Backup database on start
    backupDatabase();

    // Auto backup every 6 hours
    setInterval(() => {
      backupDatabase();
    }, 6 * 60 * 60 * 1000);

    // Start panel auto-update (every 60 seconds)
    setInterval(async () => {
      await updateAllPanels(client);
    }, 60000);

    // Initial update
    updateAllPanels(client);
  },
};

async function updateAllPanels(client) {
  const panels = panelService.getAllPanels();

  for (const panel of panels) {
    try {
      const channel = await client.channels
        .fetch(panel.channel_id)
        .catch(() => null);
      if (!channel) {
        panelService.deletePanel(panel.id);
        continue;
      }

      const message = await channel.messages
        .fetch(panel.message_id)
        .catch(() => null);
      if (!message) {
        panelService.deletePanel(panel.id);
        continue;
      }

      const embed = panelService.buildPanelEmbed();
      const buttons = panelService.buildPanelButtons();

      await message.edit({ embeds: [embed], components: buttons });
    } catch (error) {
      console.error(`Failed to update panel ${panel.id}:`, error.message);
      panelService.deletePanel(panel.id);
    }
  }
}
