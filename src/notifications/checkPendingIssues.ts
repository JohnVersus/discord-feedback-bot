import { Client, TextChannel, Message } from "discord.js";
import { config } from "dotenv";
config();
export const BUFFER_TIME = process.env.BUFFER_TIME;

/**
 * Check for pending issues and send notifications if required.
 * @param client - The Discord client.
 * @param startDate - The start date from which to consider messages.
 */
export async function checkPendingIssues(client: Client, startDate: Date) {
  const internalNotesChannel = client.channels.cache.get(
    "1106078218781474816"
  ) as TextChannel;
  const internalRemindersChannel = client.channels.cache.get(
    "1222416262794182776"
  ) as TextChannel;

  if (!internalRemindersChannel) {
    console.log("Internal reminders channel not found");
    return;
  }
  if (!internalNotesChannel) {
    console.log("Internal notes channel not found");
    return;
  }

  console.log("Fetching pending issues...");
  let before: string | undefined;
  let totalMessagesFetched = 0;

  // Change to a Map to group messages by authorId
  const messagesToNotify = new Map<string, string[]>();

  while (true) {
    const messages = await internalNotesChannel.messages.fetch({
      limit: 100,
      before,
    });

    const fetchedCount = messages.size;
    totalMessagesFetched += fetchedCount;
    console.log(
      `Fetched ${fetchedCount} messages. Total fetched: ${totalMessagesFetched}`
    );

    if (fetchedCount === 0) {
      console.log("No more messages to fetch");
      break;
    }

    messages.forEach((message) => {
      if (message.author.bot) {
        // console.log(`Ignoring bot message ID ${message.id}`);
        return; // Skip processing if the message is from a bot
      }

      const messageDate = new Date(message.createdTimestamp);

      // Only process messages on or after startDate
      if (messageDate >= startDate) {
        const hasLinkOrMention = message.content.match(
          /https?:\/\/\S+|<#\d+>|\/archives\/\S+/
        );
        const daysSinceMessage = Math.floor(
          (new Date().getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isMultipleOfThreeDays = daysSinceMessage
          ? daysSinceMessage % (BUFFER_TIME as unknown as number) === 0
          : false;
        const hasCheckMark = message.reactions.cache.some(
          (reaction) => reaction.emoji.name === "✅"
        );

        if (hasLinkOrMention && isMultipleOfThreeDays && !hasCheckMark) {
          if (!messagesToNotify.has(message.author.id)) {
            messagesToNotify.set(message.author.id, []);
          }
          (messagesToNotify as any).get(message.author.id).push(message.url);
        }
      }
    });

    before = messages.lastKey();
  }

  if (messagesToNotify.size > 0) {
    // Send a separate message for each user
    for (const [authorId, links] of messagesToNotify) {
      let userNotificationMessage = `Pending issues to recheck for <@${authorId}>:\n`;
      links.forEach((link) => {
        userNotificationMessage += `${link}\n`;
      });

      // console.log(`Sending notification message for user ${authorId}.`);
      // console.log({ userNotificationMessage });
      // Uncomment the next line to send the message
      await internalRemindersChannel.send(userNotificationMessage);
    }
  } else {
    console.log("No notifications to send.");
  }
}

// Scheduling the function to run at 6 AM UTC every 24 hours
export function scheduleDailyNotifications(client: Client, startDate: string) {
  const startDateTime = new Date(startDate).getTime();

  // comment only for test
  // checkPendingIssues(client, new Date(startDateTime));

  const checkAndSchedule = () => {
    const now = new Date();
    const utcNow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
      )
    );

    if (utcNow.getTime() - startDateTime >= 0 && utcNow.getUTCHours() === 6) {
      // Checks if the current UTC time is past the start date and if it's 6 AM
      checkPendingIssues(client, new Date(startDateTime));
    }

    const nextCheck = new Date(utcNow);
    nextCheck.setUTCDate(utcNow.getUTCDate() + 1);
    nextCheck.setUTCHours(6, 0, 0, 0); // Sets the next check to be at 6 AM UTC the next day

    const delay = nextCheck.getTime() - utcNow.getTime();
    setTimeout(checkAndSchedule, delay);
  };

  const now = new Date();
  const firstCheck = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      6,
      0,
      0,
      0
    )
  );

  // If it's already past 6 AM UTC, set the first check for the next day
  if (now.getTime() - firstCheck.getTime() > 0) {
    firstCheck.setUTCDate(firstCheck.getUTCDate() + 1);
  }

  const initialDelay = firstCheck.getTime() - now.getTime();
  setTimeout(checkAndSchedule, initialDelay);
}
