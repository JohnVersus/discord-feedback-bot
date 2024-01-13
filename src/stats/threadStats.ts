import { Guild, ChannelType, ThreadChannel, ForumChannel } from "discord.js";

async function fetchThreads(guild: Guild, timeframe: "week" | "month") {
  let timeLimit: Date;
  const now = new Date();

  if (timeframe === "week") {
    timeLimit = new Date(now.setDate(now.getDate() - 7)); // 7 days ago
  } else if (timeframe === "month") {
    timeLimit = new Date(now.setMonth(now.getMonth() - 1)); // 1 month ago
  }

  // Filter only TextChannels
  const channels = guild.channels.cache.filter(
    (c): c is ForumChannel => c.type === ChannelType.GuildForum
  );

  // Define threads as an array of ThreadChannel
  let threads: ThreadChannel[] = [];

  channels.forEach((channel) => {
    console.log({ threads: channel.name });
    channel.threads.cache.forEach((thread) => {
      if (thread.createdAt && thread.createdAt > timeLimit) {
        threads.push(thread);
      }
    });
  });

  return threads;
}

export { fetchThreads };
