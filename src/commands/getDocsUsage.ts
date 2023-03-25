import { SlashCommandBuilder } from "@discordjs/builders";

const getDocsUsage = new SlashCommandBuilder()
  .setName("getdocsusage")
  .setDescription("Add a feedback message in the feedback channel.");

export default getDocsUsage;
