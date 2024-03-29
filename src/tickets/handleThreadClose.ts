import {
  TextChannel,
  ThreadChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  APIActionRowComponent,
  APIMessageActionRowComponent,
} from "discord.js";

async function handleThreadClose(threadChannel: ThreadChannel) {
  const parentChannel = threadChannel.parent as TextChannel;
  const threadName = threadChannel.name;

  if (!threadName.startsWith("ticket-")) {
    return;
  }

  // Find the first system message in the thread
  const messages = await threadChannel.messages.fetch({ limit: 100 });
  console.log(`Total messages: ${messages.size}`);
  const systemMessages = messages.filter((message) => message.system);
  const firstSystemMessage = systemMessages.first();

  // Extract the user ID from the first system message
  if (firstSystemMessage) {
    console.log({ firstSystemMessage });
    const userId = firstSystemMessage.mentions.users.first()?.id;
    console.log(`Original poster ID: ${userId}`);
    if (userId) {
      const originalPoster = await threadChannel.guild.members.fetch(userId);

      const feedbackChannel = threadChannel.guild.channels.cache.find(
        (channel) => channel.name === "🛠-feedback"
      ) as TextChannel;

      // Create the embed message
      const feedbackEmbed = new EmbedBuilder()
        .setColor(0x16d195)
        .setAuthor({
          name: "Moralis Feedback Form",
          iconURL: "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
          url: "https://moralis.io",
        })
        .setThumbnail(
          "https://avatars.githubusercontent.com/u/80474746?s=200&v=4"
        )
        .setDescription(
          `Your "${threadName}" has been closed. Please provide your feedback in the feedback channel.\n\nThank you for your time and feedback.`
        );

      // Create the link button
      const feedbackLinkButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Add Feedback ⭐️")
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://discord.com/channels/${threadChannel.guild.id}/${feedbackChannel.id}`
          )
      );

      // Send the embed message

      await originalPoster.send({
        embeds: [feedbackEmbed],
        components: [
          feedbackLinkButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
        ],
      });
    }
  }
}

export default handleThreadClose;
