import {
  Client,
  CommandInteraction,
  Embed,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import sendToSlack from "./sendToSlack";
import processSuggestion from "./processSuggestion";
import processFeedbackResponse from "./processFeedbackResponse";
import processTicket from "./processTicket";

async function collectFeedback(
  interaction: MessageContextMenuCommandInteraction,
  client: Client
) {
  const targetMessage = interaction.targetMessage;
  if (!targetMessage) {
    await interaction.reply({
      content: "Unable to find the target message.",
      ephemeral: true,
    });
    return;
  }

  if (targetMessage.author.bot) {
    // Check for bot types and call appropriate functions
    const userName = targetMessage.author.username;
    if (userName === "Suggestions") {
      processSuggestion(targetMessage);
    } else if (userName === "Community Bot") {
      processFeedbackResponse(targetMessage, client);
    } else if (userName === "Tickets") {
      processTicket(targetMessage);
    } else return;
  } else {
    // The rest of the collectFeedback function
    let content = targetMessage.content || "";

    if (targetMessage.embeds.length > 0) {
      targetMessage.embeds.forEach((embed) => {
        if (embed.description) {
          content += `\n${embed.description}`;
        }

        if (embed.fields) {
          embed.fields.forEach((field) => {
            content += `\n${field.name}: ${field.value}`;
          });
        }
      });
    }

    if (!content) {
      await interaction.reply({
        content: "No content found in the target message.",
        ephemeral: true,
      });
      return;
    }

    const feedbackEmbed = {
      title: "Collected Feedback",
      author: {
        name: `From ${interaction.user.username}#${interaction.user.discriminator}`,
        iconURL: interaction.user.avatarURL() || undefined,
      },
      description: content,
      color: 0x16d195,
    };

    sendToSlack(
      targetMessage,
      feedbackEmbed as Embed,
      content,
      "Collected Feedback"
    );
  }
  await interaction.reply({
    content: "Feedback collected and sent to Slack.",
    ephemeral: true,
  });
}
export default collectFeedback;
