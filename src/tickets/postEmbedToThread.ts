import {
  AnyThreadChannel,
  Client,
  EmbedBuilder,
  ThreadChannel,
} from "discord.js";

// Utility function to build the embed
const THREAD_CHANNEL = "1033636954673266738";
const buildFeedbackEmbed = new EmbedBuilder()
  .setColor(0x16d195)
  .setTitle(":warning: Notice")
  .setDescription(
    `Thanks for posting your question here. To enhance our server experience, we are transitioning to making all new posts public. This not only benefits you but also helps other users easily find answers. Therefore, please post your future question in the <#${THREAD_CHANNEL}> channel. 
    \nMoving forward tickets channel should be used only when there's private information that needs to be shared with us.
    \nThank You.🙏
    `
  )
  .setTimestamp();

// Function to post the embed to the thread channel
export const postFeedbackEmbedToThread = async (
  client: Client,
  threadId: string
): Promise<void> => {
  const channel = await client.channels.fetch(threadId);

  // Assert the channel type as ThreadChannel
  const threadChannel = channel as ThreadChannel;

  if (threadChannel && threadChannel.isThread()) {
    const embed = buildFeedbackEmbed;
    await threadChannel.send({ embeds: [embed] });
  } else {
    console.error("The provided ID does not belong to a thread channel.");
  }
};

export const buildNonTicketEmbed = new EmbedBuilder()
  .setColor(0x16d195)
  .setTitle(":information_source: Helpful Tip")
  .setDescription(
    "To help others find answers, you can mark your question as solved via `Options` -> `Edit Tags` -> `✅ Solved`"
  )
  .setTimestamp();
