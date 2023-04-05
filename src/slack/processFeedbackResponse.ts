import { Message, Client, Embed } from "discord.js";
import sendToSlack from "./sendToSlack";

async function processFeedbackResponse(message: Message, client: Client) {
  const feedbackResponseRegex =
    /^Response from <@(\d+)>\n```json\n([\s\S]+?)\n```$/;

  const match = message.content.match(feedbackResponseRegex);
  if (!match) return;

  const userId = match[1];
  const feedbackResponse = match[2];

  try {
    const user = await client.users.fetch(userId);
    const userName = user
      ? `${user.username}#${user.discriminator}`
      : "unknown";

    const feedbackEmbed = {
      title: `Feedback from ${userName}`,
      thumbnail: {
        url: "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
      },
      description: `\`\`\`json\n${feedbackResponse}\n\`\`\``,
      color: 0x16d195,
    };

    sendToSlack(
      message,
      feedbackEmbed as Embed,
      feedbackResponse,
      "Feedback Response"
    );
  } catch (error) {
    console.error("Error fetching user:", error);
  }
}

export default processFeedbackResponse;
