import { CommandInteraction } from "discord.js";
import { db } from "../index";

async function handleAutoCloseThread(interaction: CommandInteraction) {
  const hours = interaction.options.get("hours")?.value;
  const reason =
    interaction.options.get("reason")?.value ||
    "Auto-closed by due to inactivity.";
  const threadChannel = interaction.channel;

  if (!threadChannel?.isThread()) {
    await interaction.reply({
      content: "This command can only be used in a thread.",
      ephemeral: true,
    });
    return;
  }

  const closeTimestamp =
    Date.now() + Number(hours ? hours : 0) * 60 * 60 * 1000;

  const autoCloseData = (await db.get("autoClose")) || [];
  autoCloseData.push({ channelId: threadChannel.id, closeTimestamp, reason });
  await db.set("autoClose", autoCloseData);

  await interaction.reply({
    content: `This thread will be closed in ${hours} hour(s) for the following reason: ${reason}`,
    ephemeral: true,
  });
}

export default handleAutoCloseThread;
