import { SlashCommandBuilder } from "@discordjs/builders";

const getThreadStats = new SlashCommandBuilder()
  .setName("getthreadstats")
  .setDescription("Get the thread stats.")
  .addStringOption((option) =>
    option
      .setName("interval")
      .setDescription("Choose the time interval")
      .setRequired(true)
      .addChoices(
        { name: "Week", value: "week" },
        { name: "Month", value: "month" }
      )
  );

export default getThreadStats;
