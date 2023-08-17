import { SlashCommandBuilder } from "@discordjs/builders";

const setHelpChannelsMessage = new SlashCommandBuilder()
  .setName("sethelpchannelsmessage")
  .setDescription("Add a help channel message in the channel.");

export default setHelpChannelsMessage;
