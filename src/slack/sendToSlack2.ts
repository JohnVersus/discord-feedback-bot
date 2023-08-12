import { IncomingWebhook } from "@slack/webhook";
import { Message, Embed, PublicThreadChannel } from "discord.js";

async function sendToSlack2(
  message: Message,
  embedData: Embed,
  description: string,
  title: string = "Suggestion"
) {
  if (!process.env.SLACK_WEBHOOK2) {
    throw new Error("Missing slack webhook");
  }
  const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK2);
  const channelId = message.thread
    ? message.thread.parentId
    : message.channelId;

  const messageUrl = message.url;

  const slackMessage = {
    attachments: [
      {
        color: "#3066993",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*<${messageUrl}|${embedData.title || title}>*`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `\n${description}`, // Use the new description parameter
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `*Message: * <${messageUrl}|${
                  (message.channel as PublicThreadChannel).name
                }>`,
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    await webhook.send(slackMessage);
  } catch (error) {
    console.error("Error sending to Slack:", error);
  }
}

export default sendToSlack2;
