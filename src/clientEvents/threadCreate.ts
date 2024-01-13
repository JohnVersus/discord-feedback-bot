import {
  AnyThreadChannel,
  ChannelType,
  Embed,
  EmbedData,
  Message,
} from "discord.js";
import {
  buildNonTicketEmbed,
  postFeedbackEmbedToThread,
} from "../tickets/postEmbedToThread";
import { client } from "..";
import sendToSlack2 from "../slack/sendToSlack2";
import { sendToSlack } from "../slack";

export const ThreadCreateEvent = async (thread: AnyThreadChannel) => {
  // Check if the thread is a text-based thread (like GUILD_TEXT or GUILD_PUBLIC_THREAD)
  if (
    thread.type === ChannelType.PublicThread ||
    thread.type === ChannelType.PrivateThread
  ) {
    // Check if the thread name starts with 'ticket-'
    if (thread.name.startsWith("ticket-")) {
      handleTicketThread(thread);
    } else {
      handleNonTicketThread(thread);
    }
  }
};

const handleTicketThread = async (thread: AnyThreadChannel) => {
  // Fetch the first message from the thread
  const messages = await thread.messages.fetch({ limit: 1 });
  const firstMessage = messages.first();
  const threadId = thread.id;
  postFeedbackEmbedToThread(client, threadId);
  if (firstMessage && firstMessage.embeds.length > 1) {
    const secondEmbed = firstMessage.embeds[1];

    // Log the fields of the second embed
    if (secondEmbed.fields && secondEmbed.fields.length > 0) {
      secondEmbed.fields.forEach((field, index) => {
        console.log(`Field ${index + 1} Name: ${field.name}`);
        console.log(`Field ${index + 1} Value: ${field.value}`);
      });
    } else {
      console.log("No fields found in the second embed.");
    }
  } else {
    console.log(
      "No messages found in the thread or the message doesn't have the expected embeds."
    );
  }
};

// Function to handle non-ticket threads
export const handleNonTicketThread = async (thread: AnyThreadChannel) => {
  // Fetch the first message from the thread
  const messages = await thread.messages.fetch({ limit: 1 });
  const firstMessage = messages.first();

  // Check if the first message exists
  if (firstMessage) {
    // Extract necessary data from the first message
    const Embed = {
      title: thread.name,
      author: {
        name: `From ${thread.client.user.id}#${thread.client.user.discriminator}`,
        iconURL: thread.client.user.avatarURL() || undefined,
      },
      description: firstMessage.content,
      color: 0x16d195,
    };

    // Send the embed to the non-ticket thread channel
    const embed = buildNonTicketEmbed;
    await thread.send({ embeds: [embed] });

    await sendToSlack2(firstMessage, Embed as Embed, firstMessage.content);
    // Check if the parent channel's name contains "moralis"

    const parentChannel = thread.parent;
    if (parentChannel && parentChannel.name.includes("moralis")) {
      // Send the message to Slack
      await sendToSlack(firstMessage, Embed as Embed, firstMessage.content);
    }
  } else {
    console.log("No messages found in the thread.");
  }
};

export default ThreadCreateEvent;
