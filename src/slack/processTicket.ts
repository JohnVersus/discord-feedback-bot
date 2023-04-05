import { Message } from "discord.js";
import sendToSlack from "./sendToSlack";

async function processTicket(message: Message) {
  const ticket_Types = [
    "Web3 API ticket",
    "Streams API ticket",
    "Auth API ticket",
  ];
  const web3ApiTicketEmbed = message.embeds.find((embed) => {
    return ticket_Types.includes(embed.data.title ? embed.data.title : "");
  });

  if (web3ApiTicketEmbed) {
    const secondEmbed = message.embeds[1];
    if (secondEmbed && secondEmbed.data.fields) {
      const fields = secondEmbed.data.fields;

      const description = fields
        .map((field) => `*${field.name}:*\n${field.value}`)
        .join("\n\n");

      sendToSlack(message, web3ApiTicketEmbed, description);
    }
  }
}

export default processTicket;
