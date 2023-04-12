import { SlashCommandBuilder } from "@discordjs/builders";

const autoCloseThreadCommand = new SlashCommandBuilder()
  .setName("autoclosethread")
  .setDescription("Set an auto-close timer for a thread.")
  .addNumberOption((option) =>
    option
      .setName("hours")
      .setDescription("Number of hours before the thread is closed")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("reason")
      .setDescription("Reason for closing the thread")
      .setRequired(false)
  );

export default autoCloseThreadCommand;
