import {
  Guild,
  ChannelType,
  ThreadChannel,
  ForumChannel,
  Message,
  GuildForumTag,
} from "discord.js";

async function isModeratorMessage(
  message: Message,
  modRoles: string[]
): Promise<boolean> {
  let member = message.member;

  // If message.member is null, try fetching the member manually
  if (!member && message.guild) {
    try {
      member = await message.guild.members.fetch(message.author.id);
    } catch (error) {
      console.error("Error fetching member:", error);
      return false;
    }
  }

  // If member is still null, return false
  if (!member) {
    return false;
  }

  // Check if the member has any of the moderator roles
  return member.roles.cache.some((role) => modRoles.includes(role.name));
}

async function calculateResponseTime(
  thread: ThreadChannel,
  modRoles: string[]
): Promise<number> {
  const messages = await thread.messages.fetch({ limit: 50 }); // Adjust limit as needed
  const sortedMessages = Array.from(messages.values()).sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp
  );

  for (const message of sortedMessages) {
    const isMod = await isModeratorMessage(message, modRoles);
    if (isMod && thread.createdTimestamp) {
      return message.createdTimestamp - thread.createdTimestamp;
    }
  }
  return -1; // Indicate no mod response was found
}

async function fetchThreads(guild: Guild, timeframe: "week" | "month") {
  let timeLimit: Date;
  const now = new Date();

  // Define moderator roles
  const modRoles = ["mod", "staff", "Moralis Team"];

  if (timeframe === "week") {
    timeLimit = new Date(now.setDate(now.getDate() - 7)); // 7 days ago
  } else if (timeframe === "month") {
    timeLimit = new Date(now.setMonth(now.getMonth() - 1)); // 1 month ago
  }

  // Filter only ForumChannels
  const channels = guild.channels.cache.filter(
    (c): c is ForumChannel => c.type === ChannelType.GuildForum
  );

  let threads: ThreadChannel[] = [];

  for (const channel of channels.values()) {
    const channelThreads = channel.threads.cache.filter(
      (thread) => thread.createdAt && thread.createdAt > timeLimit
    );
    threads.push(...channelThreads.values());
  }

  // Collect all available tags from forum channels
  let allAvailableTags: GuildForumTag[] = [];
  for (const channel of channels.values()) {
    allAvailableTags.push(...channel.availableTags);
  }

  // Find the ID of the 'Solved' tag
  const solvedTag = allAvailableTags.find((tag) => tag.name.includes("Solved"));
  const solvedTagId = solvedTag ? solvedTag.id : null;
  if (!solvedTagId) {
    console.error("Couldn't find the 'Solved' tag.");
    return null;
  }

  let solvedCount = 0;
  const responseTimes = [];

  for (const thread of threads) {
    // Check if the thread is marked as solved
    if (thread.appliedTags.includes(solvedTagId)) {
      solvedCount++;
    }

    // Calculate response time
    const responseTime = await calculateResponseTime(thread, modRoles);
    if (responseTime !== -1) {
      responseTimes.push(responseTime);
    }
  }

  // Calculate average response time in minutes
  const averageResponseTimeMinutes =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 60000
      : 0;

  const stats = {
    numberOfThreads: threads.length,
    averageResponseTimeMinutes,
    numberOfSolvedThreads: solvedCount,
  };
  return stats;
}

export { fetchThreads };
