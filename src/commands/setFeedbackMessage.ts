import { SlashCommandBuilder } from "@discordjs/builders";

const setFeedbackCommand = new SlashCommandBuilder()
  .setName("setfeedbackmessage")
  .setDescription("Add a feedback message in the feedback channel.");

export default setFeedbackCommand;
