import { Client, TextChannel, ThreadChannel } from "discord.js";
import { db } from "../index";

async function checkAndCloseThreads(client: Client) {
  const autoCloseData: {
    channelId: string;
    closeTimestamp: number;
    reason: string;
  }[] = (await db.get("autoClose")) || [];
  const currentTime = Date.now();

  for (const data of autoCloseData) {
    const { channelId, closeTimestamp, reason } = data;
    const timeRemaining = closeTimestamp - currentTime;

    console.log(`Checking thread with ID: ${channelId}`);
    console.log(`Time remaining until close: ${timeRemaining} ms`);

    if (currentTime >= closeTimestamp) {
      const threadChannel = (await client.channels.fetch(
        channelId
      )) as ThreadChannel;

      if (threadChannel.isThread()) {
        const parentChannel = threadChannel.parent as TextChannel;

        // Find the first system message in the thread
        const messages = await threadChannel.messages.fetch({ limit: 100 });
        console.log(`Total messages: ${messages.size}`);
        const systemMessages = messages.filter(
          (message) => message.author.system
        );
        const firstSystemMessage = systemMessages.first();

        // Extract the user ID from the first system message
        if (firstSystemMessage) {
          const userId = firstSystemMessage.mentions.users.first()?.id;
          console.log(`Original poster ID: ${userId}`);
          if (userId) {
            const originalPoster = await client.users.fetch(userId);
            console.log({ originalPoster });
            await originalPoster.send(
              `Your thread "${threadChannel.name}" in ${parentChannel.name} has been closed for the following reason: ${reason}`
            );
          }
        }

        await threadChannel.send(
          `This thread is being closed for the following reason: ${reason}`
        );
        await threadChannel.setArchived(true, reason);

        const indexToRemove = autoCloseData.findIndex(
          (item) => item.channelId === channelId
        );
        if (indexToRemove !== -1) {
          autoCloseData.splice(indexToRemove, 1);
        }
        await db.set("autoClose", autoCloseData);
      }
    }
  }
}

export default checkAndCloseThreads;
