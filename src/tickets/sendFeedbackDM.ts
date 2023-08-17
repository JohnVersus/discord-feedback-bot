import {
  ThreadChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  APIActionRowComponent,
  APIMessageActionRowComponent,
  TextChannel,
} from "discord.js";

export const sendFeedbackDM = async (thread: ThreadChannel): Promise<void> => {
  // Extract the thread owner (original poster)
  if (thread.ownerId) {
    const threadOwner = await thread.client.users.fetch(thread.ownerId);

    // Create the feedback embed
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
        `Your question "${thread.name}" has been marked as solved. Please share your feedback in the feedback channel.\n\nThank you for your time and feedback.`
      );

    const feedbackChannel = thread.guild.channels.cache.find(
      (channel) => channel.name === "🛠-feedback"
    ) as TextChannel;

    const feedbackLinkButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Add Feedback ⭐️")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/channels/${thread.guild.id}/${feedbackChannel.id}`
        )
    );
    // Send the embed to the thread owner via DM
    try {
      await threadOwner.send({
        embeds: [feedbackEmbed],
        components: [
          feedbackLinkButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
        ],
      });
    } catch (error) {
      console.error("Error sending DM:", error);
    }
  }
};
