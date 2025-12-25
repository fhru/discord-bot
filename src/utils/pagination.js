const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require('discord.js');
const { infoEmbed } = require('./embedBuilder');

const ITEMS_PER_PAGE = 10;

function createPaginationButtons(currentPage, totalPages, uniqueId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`page_prev_${uniqueId}`)
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 0),
    new ButtonBuilder()
      .setCustomId(`page_info_${uniqueId}`)
      .setLabel(`${currentPage + 1}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`page_next_${uniqueId}`)
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages - 1)
  );
}

function createDisabledButtons(currentPage, totalPages, uniqueId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`page_prev_${uniqueId}`)
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`page_info_${uniqueId}`)
      .setLabel(`${currentPage + 1}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`page_next_${uniqueId}`)
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );
}

async function paginatedReply(interaction, { title, items, formatItem, emptyMessage = 'No data found.' }) {
  const replyMethod = interaction.deferred ? 'editReply' : 'reply';
  
  if (items.length === 0) {
    return interaction[replyMethod]({
      embeds: [infoEmbed(title, emptyMessage)],
      flags: MessageFlags.Ephemeral
    });
  }

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  let currentPage = 0;
  const uniqueId = `${interaction.user.id}_${Date.now()}`;

  const getPageContent = (page) => {
    const start = page * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = items.slice(start, end);
    const list = pageItems.map((item, index) => formatItem(item, start + index)).join('\n');
    return `Total: ${items.length}\n\n${list}`;
  };

  const replyOptions = {
    embeds: [infoEmbed(title, getPageContent(currentPage))],
    components: totalPages > 1 ? [createPaginationButtons(currentPage, totalPages, uniqueId)] : [],
    flags: MessageFlags.Ephemeral
  };
  
  if (!interaction.deferred) {
    replyOptions.fetchReply = true;
  }
  
  const message = await interaction[replyMethod](replyOptions);

  if (totalPages <= 1) return;

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000
  });

  collector.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: 'This is not your menu.', flags: MessageFlags.Ephemeral });
    }

    if (i.customId === `page_prev_${uniqueId}` && currentPage > 0) {
      currentPage--;
    } else if (i.customId === `page_next_${uniqueId}` && currentPage < totalPages - 1) {
      currentPage++;
    }

    await i.update({
      embeds: [infoEmbed(title, getPageContent(currentPage))],
      components: [createPaginationButtons(currentPage, totalPages, uniqueId)]
    });
  });

  collector.on('end', async () => {
    try {
      await interaction.editReply({
        components: [createDisabledButtons(currentPage, totalPages, uniqueId)]
      });
    } catch (e) {
      // Message might be deleted
    }
  });
}

module.exports = { paginatedReply, ITEMS_PER_PAGE };
