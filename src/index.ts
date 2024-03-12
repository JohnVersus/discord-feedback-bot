import { config } from "dotenv";
import { Client, GatewayIntentBits, Routes } from "discord.js";
import { REST } from "@discordjs/rest";
import Keyv from "keyv";
import KeyvFile from "keyv-file";

import setFeedbackMessage from "./commands/setFeedbackMessage";
import setHelpChannelsMessage from "./commands/setHelpChannelsMessage";

import getdocs from "./commands/getDocs";
import getDocsUsage from "./commands/getDocsUsage";

import { InteractionCreateEvent } from "./clientEvents/interactionCreate";
import { MessageCreateEvent } from "./clientEvents/messageCreate";
import { ThreadUpdateEvent } from "./clientEvents/threadUpdate";
import { ThreadCreateEvent } from "./clientEvents/threadCreate";
import getThreadStats from "./commands/getThreadStats";
import { scheduleDailyNotifications } from "./notifications/checkPendingIssues";

export const DOCS_CHANNEL_NAME = "📚-documentation";

export const db = new Keyv({ store: new KeyvFile({ filename: "db.json" }) });
db.on("error", (err) => console.error("Keyv connection error:", err));

export const cache = new Keyv({ store: new KeyvFile() });
cache.on("error", (err) => console.error("Keyv connection error:", err));

export interface DbValue {
  messageId?: string;
  apiRating?: string;
  supportRating?: string;
  feedback?: string;
}

config();

export const TOKEN = process.env.TUTORIAL_BOT_TOKEN;
export const CLIENT_ID = process.env.CLIENT_ID;
export const GUILD_ID = process.env.GUILD_ID;

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
if (!TOKEN) {
  throw new Error("Missing TOKEN env variables ");
}
const rest = new REST({ version: "10" }).setToken(TOKEN);
export const wait = require("node:timers/promises").setTimeout;

client.on("interactionCreate", InteractionCreateEvent);

client.on("messageCreate", MessageCreateEvent);

client.on("threadUpdate", ThreadUpdateEvent);

client.on("threadCreate", ThreadCreateEvent);

client.once("ready", () => {
  if (client.user) {
    console.log(`Logged in as ${client.user.tag}!`);
    scheduleDailyNotifications(client, "2022-03-07T00:00:00Z"); // Set the start date in ISO format
  } else {
    console.error("Login failed: client.user is null");
  }
});
async function main() {
  const commands = [
    setFeedbackMessage,
    setHelpChannelsMessage,
    getdocs,
    getDocsUsage,
    getThreadStats,
    {
      name: "Get Feedback",
      type: 3,
    },
    {
      name: "Update Docs",
      type: 3,
    },
    {
      name: "Feedback to slack",
      type: 3,
    },
  ];
  try {
    console.log("Started refreshing application (/) commands.");
    if (!CLIENT_ID || !GUILD_ID) {
      throw new Error("Missing CLIENT_ID or GUILD_ID under env variables ");
    }
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    client.login(TOKEN);
  } catch (err) {
    console.log(err);
  }
}

// client.on("ready", () => {
//   CLIENT_ID = client.application.id;

//   console.log(`${client.user.tag} has logged in!`);

//   // const Guilds = client.guilds.cache.map((guild) => guild.id);
//   // console.log(Guilds);
// });
main();
