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
  let totalMessagesProcessed = 0;

  const messagesToNotify = [];

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

    for (const [, message] of messages) {
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

        // console.log(`Evaluating message ID ${message.id}:`, {
        //   hasLinkOrMention,
        //   daysSinceMessage,
        //   isMultipleOfThreeDays,
        // });

        if (hasLinkOrMention && isMultipleOfThreeDays) {
          const hasCheckMark = message.reactions.cache.some(
            (reaction) => reaction.emoji.name === "✅"
          );
          console.log({ hasCheckMark });
          if (!hasCheckMark) {
            messagesToNotify.push({
              authorId: message.author.id,
              link: message.url,
            });
            totalMessagesProcessed++;
            console.log(
              `Processed message ID ${message.id} for notifications.`
            );
          } else {
            console.log(`Message ID ${message.id} has a check mark. Skipping.`);
          }
        }
      }
    }

    before = messages.lastKey();
  }

  console.log(`Total messages to notify: ${messagesToNotify.length}`);
  console.log(`Total messages processed: ${totalMessagesProcessed}`);

  if (messagesToNotify.length > 0) {
    const notificationMessage = messagesToNotify
      .map((m) => `<@${m.authorId}> - [Message Link](${m.link})`)
      .join("\n");
    console.log("Sending notification message.");
    console.log({ notificationMessage });
    // await internalNotesChannel.send(notificationMessage);
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
