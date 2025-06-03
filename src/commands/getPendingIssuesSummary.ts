import { SlashCommandBuilder } from "@discordjs/builders";

const getPendingIssuesSummary = new SlashCommandBuilder()
  .setName("getpendingissuessummary")
  .setDescription("Get a summary of all pending issues.");

export default getPendingIssuesSummary;
