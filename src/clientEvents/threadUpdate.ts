import { AnyThreadChannel, ForumChannel } from "discord.js";
import handleThreadClose from "../tickets/handleThreadClose";
import { client } from "..";
import { sendFeedbackDM } from "../tickets/sendFeedbackDM";

export const ThreadUpdateEvent = async (
  oldThread: AnyThreadChannel,
  newThread: AnyThreadChannel
) => {
  if (oldThread.parentId) {
    const channel = await client.channels.fetch(oldThread.parentId);
    const availableTags = (channel as ForumChannel).availableTags;

    // Find the ID of the tag with the name "Solved"
    const solvedTag = availableTags?.find((tag) => tag.name.includes("Solved"));
    const solvedTagId = solvedTag ? solvedTag.id : null;
    if (!solvedTagId) {
      console.error("Couldn't find the 'Solved' tag.");
      return;
    }

    // Determine which tags have been added
    const addedTags = newThread.appliedTags.filter(
      (tagId) => !oldThread.appliedTags.includes(tagId)
    );

    // Check if the "Solved" tag has been added
    if (addedTags.includes(solvedTagId)) {
      console.log(`'Solved' tag has been added to the thread.`);
      // Send feedback DM to the thread owner
      await sendFeedbackDM(newThread);
    }
  }
  if (newThread.archived) {
    console.log("thread closed");
    handleThreadClose(newThread);
  }
};
