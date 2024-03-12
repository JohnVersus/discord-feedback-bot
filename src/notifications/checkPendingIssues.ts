import { Client, TextChannel, Message } from "discord.js";

/**
 * Check for pending issues and send notifications if required.
 * @param client - The Discord client.
 * @param startDate - The start date from which to consider messages.
 */
export async function checkPendingIssues(client: Client, startDate: Date) {
  const internalNotesChannel = client.channels.cache.get(
    "1106078218781474816"
  ) as TextChannel;
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
      const messageDate = new Date(message.createdTimestamp);

      // Only process messages on or after startDate
      if (messageDate >= startDate) {
        const hasLinkOrMention = message.content.match(
          /https?:\/\/\S+|<#\d+>|\/archives\/\S+/
        );
        const daysSinceMessage = Math.floor(
          (new Date().getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isMultipleOfThreeDays = daysSinceMessage % 3 === 0;
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
    let notificationMessage = "Pending issues to recheck:\n";
    messagesToNotify.forEach((links, authorId) => {
      notificationMessage += `<@${authorId}>:\n`;
      links.forEach((link) => {
        notificationMessage += `${link}\n`;
      });
      notificationMessage += "\n"; // Extra newline for spacing between users
    });

    console.log("Sending notification message.");
    // console.log({ notificationMessage });
    await internalNotesChannel.send(notificationMessage);
  } else {
    console.log("No notifications to send.");
  }
}

// Scheduling the function to run at 5 AM UTC every 24 hours
export function scheduleDailyNotifications(client: Client, startDate: string) {
  const startDateTime = new Date(startDate).getTime();

  // only for test
  checkPendingIssues(client, new Date(startDateTime));

  const checkAndSchedule = () => {
    const now = new Date();
    const utcNow = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()
    );

    if (utcNow.getTime() - startDateTime >= 0 && utcNow.getUTCHours() === 5) {
      // checks if the current UTC time is past the start date and if it's 5 AM
      checkPendingIssues(client, new Date(startDateTime));
    }

    const nextCheck = new Date(utcNow);
    nextCheck.setUTCDate(utcNow.getUTCDate() + 1);
    nextCheck.setUTCHours(5, 0, 0, 0); // sets the next check to be at 5 AM UTC the next day

    const delay = nextCheck.getTime() - utcNow.getTime();
    setTimeout(checkAndSchedule, delay);
  };

  const now = new Date();
  const firstCheck = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    5,
    0,
    0,
    0
  );
  // if it's already past 5 AM UTC, set the first check for the next day
  if (now.getTime() - firstCheck.getTime() > 0) {
    firstCheck.setUTCDate(firstCheck.getUTCDate() + 1);
  }

  const initialDelay = firstCheck.getTime() - now.getTime();
  setTimeout(checkAndSchedule, initialDelay);
}
