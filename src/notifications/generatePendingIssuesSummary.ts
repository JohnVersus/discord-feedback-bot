// src/notifications/generatePendingIssuesSummary.ts
import {
  Client,
  TextChannel,
  EmbedBuilder,
  AttachmentBuilder,
} from "discord.js";
import { config } from "dotenv";
config();

/**
 * Generate a summary of pending issues from the last 3 years and send it to a Discord channel.
 * @param client - The Discord client.
 */
export async function generatePendingIssuesSummary(client: Client) {
  const internalNotesChannel = client.channels.cache.get(
    "1106078218781474816"
  ) as TextChannel;

  const summaryChannel = client.channels.cache.get(
    "876016403751247892"
  ) as TextChannel; // Your summary channel ID

  if (!internalNotesChannel) {
    console.log("Internal notes channel not found");
    return;
  }

  if (!summaryChannel) {
    console.log("Summary channel not found");
    return;
  }

  console.log("Fetching pending issues for summary...");
  let before: string | undefined;
  let totalMessagesFetched = 0;

  const pendingIssues: {
    date: string;
    moderator: string;
    messageLink: string;
    originalMessageLink: string;
    internalTeamMessageLink: string;
  }[] = [];

  // Calculate the timestamp for 3 years ago
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const threeYearsAgoTimestamp = threeYearsAgo.getTime();

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

    for (const message of messages.values()) {
      if (message.author.bot) {
        continue; // Skip processing if the message is from a bot
      }

      const messageDate = new Date(message.createdTimestamp);

      // Only process messages within the last 3 years
      if (messageDate.getTime() >= threeYearsAgoTimestamp) {
        const hasLinkOrMention = message.content.match(
          /https?:\/\/\S+|<#\d+>|\/archives\/\S+/
        );
        const hasCheckMark = message.reactions.cache.some(
          (reaction) => reaction.emoji.name === "✅"
        );

        // Consider messages that are pending
        if (hasLinkOrMention && !hasCheckMark) {
          // Get the relative time
          const timeAgo = getRelativeTime(messageDate);

          // Extract links mentioned in the message content
          const linkMatches = extractLinks(message.content);

          // Extract channel mentions
          const channelMentions = extractChannelMentions(message.content);

          // Log the message content and extracted links for debugging
          console.log(`\nProcessing message ID: ${message.id}`);
          console.log(`Message Content: ${message.content}`);
          console.log(`Extracted Links:`, linkMatches);
          console.log(`Extracted Channel Mentions:`, channelMentions);

          // Identify the original message link (Discord message or thread)
          let originalMessageLink =
            linkMatches.find((link) => isDiscordLink(link)) || "No link found";

          if (
            originalMessageLink === "No link found" &&
            channelMentions.length > 0 &&
            message.guild?.id
          ) {
            // Reconstruct the channel link using guild ID and channel ID
            originalMessageLink = `https://discord.com/channels/${message.guild.id}/${channelMentions[0]}`;
          }

          // Identify the internal team message link (from your internal domains)
          const internalTeamMessageLink =
            linkMatches.find(
              (link) =>
                link.includes("gabronickwontdiefromcovid.com") ||
                link.includes("moralisweb3.slack.com")
            ) || "No link found";

          // Log the identified links for debugging
          console.log(`Original Message Link: ${originalMessageLink}`);
          console.log(`Internal Team Message Link: ${internalTeamMessageLink}`);

          pendingIssues.push({
            date: timeAgo,
            moderator: message.author.username, // Use username instead of tagging
            messageLink: message.url,
            originalMessageLink: originalMessageLink,
            internalTeamMessageLink: internalTeamMessageLink,
          });
        }
      }
    }

    before = messages.lastKey();
  }

  if (pendingIssues.length > 0) {
    // Create the embeds
    const embeds = [];
    const maxFieldsPerEmbed = 25; // Discord allows up to 25 fields per embed

    let currentEmbed = new EmbedBuilder()
      .setTitle(`Pending Issues Summary`)
      .setColor("#FF0000");
    let currentEmbedFieldCount = 0;
    let currentEmbedCharCount =
      (currentEmbed.data.title?.length || 0) +
      (currentEmbed.data.description?.length || 0);

    for (let i = 0; i < pendingIssues.length; i++) {
      const issue = pendingIssues[i];
      const fieldName = `Issue #${i + 1}`;
      const fieldValue = `**Date:** ${issue.date}\n**Moderator:** ${issue.moderator}\n[Issue Message](${issue.messageLink})\n[Original Message](${issue.originalMessageLink})\n[Internal Team Message](${issue.internalTeamMessageLink})`;

      const fieldCharCount = fieldName.length + fieldValue.length;

      // Check if adding this field exceeds the embed or field limit
      if (
        currentEmbedFieldCount + 1 > maxFieldsPerEmbed ||
        currentEmbedCharCount + fieldCharCount > 6000
      ) {
        // Push current embed and start a new one
        embeds.push(currentEmbed);
        currentEmbed = new EmbedBuilder().setColor("#FF0000");
        currentEmbedFieldCount = 0;
        currentEmbedCharCount = 0;
      }

      currentEmbed.addFields({
        name: fieldName,
        value: fieldValue,
      });
      currentEmbedFieldCount += 1;
      currentEmbedCharCount += fieldCharCount;
    }

    // Push the last embed if it has fields
    if (currentEmbedFieldCount > 0) {
      embeds.push(currentEmbed);
    }

    // Send the embeds first
    // for (const embed of embeds) {
    //   await summaryChannel.send({ embeds: [embed] });
    // }

    // Then send the CSV file so it's at the bottom
    // Create CSV content
    const csvRows = [
      [
        "Issue Number",
        "Date",
        "Moderator",
        "Issue Message Link",
        "Original Message Link",
        "Internal Team Message Link",
      ],
    ];

    pendingIssues.forEach((issue, index) => {
      csvRows.push([
        String(index + 1),
        issue.date,
        issue.moderator,
        issue.messageLink,
        issue.originalMessageLink,
        issue.internalTeamMessageLink,
      ]);
    });

    const csvContent = csvRows
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");

    // Create a buffer from the CSV content
    const buffer = Buffer.from(csvContent, "utf-8");

    // Create an attachment
    const attachment = new AttachmentBuilder(buffer, {
      name: "pending_issues.csv",
    });

    // Send the attachment
    // await summaryChannel.send({ files: [attachment] });

    console.log("Summary message and CSV file sent to the channel.");
  } else {
    console.log("No pending issues found.");
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const elapsedMs = now.getTime() - date.getTime(); // Time elapsed in milliseconds
  const elapsedMonths = Math.floor(elapsedMs / (1000 * 60 * 60 * 24 * 30)); // Approximate months

  if (elapsedMonths >= 1) {
    return `${elapsedMonths} month${elapsedMonths > 1 ? "s" : ""} ago`;
  } else {
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    if (elapsedDays >= 1) {
      return `${elapsedDays} day${elapsedDays > 1 ? "s" : ""} ago`;
    } else {
      const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
      if (elapsedHours >= 1) {
        return `${elapsedHours} hour${elapsedHours > 1 ? "s" : ""} ago`;
      } else {
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
        if (elapsedMinutes >= 1) {
          return `${elapsedMinutes} minute${elapsedMinutes > 1 ? "s" : ""} ago`;
        } else {
          return `just now`;
        }
      }
    }
  }
}

function extractLinks(text: string): string[] {
  const urlRegex = /(?:(?:https?|ftp):\/\/|www\.)[^\s<]+[^<.,:;"')\]\s]/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

function extractChannelMentions(text: string): string[] {
  const channelMentionRegex = /<#(\d+)>/g;
  const channelIds = [];
  let match;
  while ((match = channelMentionRegex.exec(text)) !== null) {
    channelIds.push(match[1]);
  }
  return channelIds;
}

function isDiscordLink(link: string): boolean {
  // Discord message links typically have the format:
  // https://discord.com/channels/{guild_id}/{channel_id}/{message_id}
  // Discord channel links have the format:
  // https://discord.com/channels/{guild_id}/{channel_id}
  const discordMessageLinkRegex =
    /^https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/\d+\/\d+\/\d+$/;
  const discordChannelLinkRegex =
    /^https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/\d+\/\d+$/;
  return (
    discordMessageLinkRegex.test(link) || discordChannelLinkRegex.test(link)
  );
}
