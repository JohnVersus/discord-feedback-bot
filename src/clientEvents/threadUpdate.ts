import { AnyThreadChannel } from "discord.js";
import handleThreadClose from "../tickets/handleThreadClose";

export const ThreadUpdateEvent = async (
  oldThread: AnyThreadChannel,
  newThread: AnyThreadChannel
) => {
  // console.log({ newThread });
  if (newThread.archived) {
    console.log("thread closed");
    handleThreadClose(newThread);
  }
};
