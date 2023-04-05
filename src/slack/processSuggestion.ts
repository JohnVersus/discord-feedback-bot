import { Message } from "discord.js";
import sendToSlack from "./sendToSlack";

async function processSuggestion(message: Message) {
  const suggestionEmbed = message.embeds[0];

  if (!suggestionEmbed || !suggestionEmbed.data.description) return;

  const description = suggestionEmbed.data.description;

  const submitterMatch = description.match(/\*\*Submitter\*\*\n(.+?)\n/);
  const suggestionMatch = description.match(
    /\*\*Suggestion\*\*\n([\s\S]+?)\n\n\*\*Results/
  );

  if (!submitterMatch || !suggestionMatch) return;

  const submitter = submitterMatch[1];
  const suggestion = suggestionMatch[1];

  const slackDescription = `*Submitter:*\n${submitter}\n\n*Suggestion:*\n${suggestion}`;

  sendToSlack(message, suggestionEmbed, slackDescription, "Suggestions");
}

export default processSuggestion;
