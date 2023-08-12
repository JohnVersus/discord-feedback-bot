import { Message, TextChannel } from "discord.js";
import {
  processFeedbackResponse,
  processSuggestion,
  processTicket,
} from "../slack";
import { getInitFeedbackReqOnLevelUp } from "../form/formData";
import { cache, client, db } from "..";

export const MessageCreateEvent = async (message: Message) => {
  const message_str = message.content;
  // const regex = /<@(\d+)>\s*.*?\blevel\s+5\b/i;
  const regex = /<@(\d+)>\s*.*?\blevel\s+[345]\b/i;
  const match = message_str.match(regex);

  const channel = message.guild?.channels.cache.find(
    (channel) => channel.name === "feedback"
  );

  if (message.channelId === "900729896475709480" && match) {
    console.log({ match });
    const userId = match[1];

    const user = message.guild?.members.cache.get(match[1]);

    if (!user) {
      throw new Error("User Not Found");
    }

    const initFeedbackRequest = getInitFeedbackReqOnLevelUp(user);

    if (!user?.id) {
      throw new Error("Missing User Id on Message");
    }
    // if (!db[user.id]) {
    //   db[user.id] = {
    //     messageId: sentMessage.id,
    //     apiRating: "0",
    //     supportRating: "0",
    //     feedback: "none",
    //   };
    // }
    // const cacheData = await cache.has(user.id);
    const data = await db.has(user.id);
    if (!data) {
      const sentMessage = await (channel as TextChannel)?.send({
        embeds: [initFeedbackRequest],
        content: `||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|| _ _ _ _ _ _ ${user}`,
      });
      await cache.set(user.id, {
        messageId: sentMessage.id,
        apiRating: "0",
        supportRating: "0",
        feedback: "none",
      });
      await message.reply({
        content: `Feedback requeste sent to the user.`,
        // ephemeral: true,
      });
    } else {
      await message.reply({
        content: "Feedback already requested to this user.",
        // ephemeral: true,
        components: [
          // deleteFeedbackButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
        ],
      });
    }
  } else if (message.channelId === "900729896475709480") {
    console.log("No match found");
  }

  if (message.author.bot) {
    // console.log({ channelName: (message.channel as TextChannel).name });
    if ((message.channel as TextChannel).name === "💡-suggestions") {
      processSuggestion(message);
    } else if ((message.channel as TextChannel).name === "feedback_responses") {
      processFeedbackResponse(message, client);
    } else {
      // const ticket_Types = [
      //   "Web3 API ticket",
      //   "Streams API ticket",
      //   "Auth API ticket",
      // ];
      // const web3ApiTicketEmbed = message.embeds.find((embed) => {
      //   // return embed.data.title === "Web3 API ticket";
      //   return ticket_Types.includes(embed.data.title ? embed.data.title : "");
      //   // return embed.data.title === "Open a ticket!";
      // });

      // if (web3ApiTicketEmbed) {
      //   if (web3ApiTicketEmbed) {
      //     // If Web3 API ticket found in the first embed, extract the fields from the second embed
      //     const secondEmbed = message.embeds[1];
      //     if (secondEmbed && secondEmbed.data.fields) {
      //       const fields = secondEmbed.data.fields;

      //       // Join all field names and values with '\n'
      //       const description = fields
      //         .map((field) => `*${field.name}:*\n${field.value}`)
      //         .join("\n\n");

      //       // If found, send the embed and description to the Slack webhook
      //       sendToSlack(message, web3ApiTicketEmbed, description);
      //     }
      //   }
      // }
      processTicket(message);
    }
  }
};
