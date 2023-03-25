import { config } from "dotenv";
import {
  Client,
  GatewayIntentBits,
  Routes,
  TextChannel,
  APIActionRowComponent,
  APIMessageActionRowComponent,
  EmbedBuilder,
  codeBlock,
  MessageResolvable,
  ActionRowBuilder,
} from "discord.js";
import { REST } from "@discordjs/rest";
import Keyv from "keyv";
import KeyvFile from "keyv-file";

import setFeedbackMessage from "./commands/setFeedbackMessage";
import { generateEmbedsAndButtons, searchDocs } from "./docs/docs";

import {
  startFeedbackEmbed,
  startFeedbackButton,
  apiRatingSelect,
  supportRatingSelect,
  moreFeedbackRequest,
  feedbackModal,
  trustpilotEmbed,
  endFeedbackButton,
  deleteFeedbackButton,
  withoutTrustpilotEnd,
  withTrustpilotEnd,
  getInitFeedbackReq,
  getInitFeedbackReqOnLevelUp,
} from "./form/formData";
import getdocs, { autocomplete, execute } from "./commands/getDocs";

const DOCS_CHANNEL_NAME = "📚-documentation";

const db = new Keyv({ store: new KeyvFile({ filename: "db.json" }) });
db.on("error", (err) => console.error("Keyv connection error:", err));

const cache = new Keyv({ store: new KeyvFile() });
cache.on("error", (err) => console.error("Keyv connection error:", err));

interface DbValue {
  messageId?: string;
  apiRating?: string;
  supportRating?: string;
  feedback?: string;
}

config();

const TOKEN = process.env.TUTORIAL_BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
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
const wait = require("node:timers/promises").setTimeout;

client.on("interactionCreate", async (interaction) => {
  // const db: DB = readDb();
  if (interaction.isMessageContextMenuCommand()) {
    console.log(interaction.commandName);
    if (interaction.commandName === "Get Feedback") {
      const member = await interaction.guild?.members.fetch(
        interaction.targetMessage.author.id
      );
      const role = interaction.guild?.roles.cache.find(
        (role) => role.name === "Feedbacker"
      );
      if (!role) {
        throw new Error("Missing Role");
      }
      await member?.roles.add(role);

      const channel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === "feedback"
      );

      const user = interaction.guild?.members.cache.get(
        interaction.targetMessage.author.id
      );

      if (!user?.id) {
        throw new Error("Missing User Id on Message");
      }

      const initFeedbackRequest = getInitFeedbackReq(user);
      // if (!db[user.id]) {
      //   db[user.id] = {
      //     messageId: sentMessage.id,
      //     apiRating: "0",
      //     supportRating: "0",
      //     feedback: "none",
      //   };
      // }
      const cacheData = await cache.has(user.id);
      const data = await db.has(user.id);
      if (!data && !cacheData) {
        const sentMessage = await (channel as TextChannel)?.send({
          embeds: [initFeedbackRequest],
          content: `||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|| _ _ _ _ _ _ ${user}`,
        });
        await cache.set(user.id, {
          messageId: sentMessage.id,
          apiRating: "0",
          supportRating: "0",
          feedback: "none",
        });
        await interaction.reply({
          content: `Feedback request sent to the ${user}`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "Feedback already requested to this user.",
          ephemeral: true,
          components: [
            // deleteFeedbackButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
          ],
        });
      }
    } else if (interaction.commandName === "Update Docs") {
      const channel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === DOCS_CHANNEL_NAME
      );

      if (channel) {
        try {
          const docs_messages = interaction.targetMessage.attachments.toJSON();
          const jsonContent = await fetch(docs_messages[0].url); // only reads once attachemnt
          const jsonData: Record<
            string,
            Record<string, Record<string, string>>
          > = await jsonContent.json();
          db.set("docReference", jsonData);
          console.log(jsonData);
          const { embeds, rows } = generateEmbedsAndButtons(jsonData);

          for (let i = 0; i < embeds.length; i++) {
            console.log(i);
            (channel as TextChannel)?.send({
              embeds: [embeds[i]],
              components: rows[i],
            });
          }
          (channel as TextChannel)?.send({
            embeds: [searchDocs],
          });

          interaction.reply({
            content: `Updated docs in ${DOCS_CHANNEL_NAME}`,
            // ephemeral: true,
          });
        } catch (e) {
          if (e instanceof Error) {
            console.error("Error:", e);
            interaction.reply({
              content: `Error: ${e.message}.`,
              ephemeral: true,
            });
          }
        }
      } else {
        interaction.reply({
          content: `${DOCS_CHANNEL_NAME} channel is missing`,
          ephemeral: true,
        });
      }
    }
    // writeDb(db);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "setfeedbackmessage") {
      const channel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === "feedback"
      );

      (channel as TextChannel)?.send({
        embeds: [startFeedbackEmbed],
        components: [
          startFeedbackButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
        ],
      });

      await interaction.reply({
        content: "Message added in #feedback channel!!",
        ephemeral: true,
      });
    } else if (interaction.commandName === "getdocs") {
      execute(interaction);
    }
  }
});

// Interaction with feedback form
client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === "start_feedback") {
      const userId = interaction.user.id;

      const existingUser = await db.has(userId);

      if (!existingUser) {
        interaction.reply({
          content: "How would you rate the Moralis API products?",
          ephemeral: true,
          components: [
            apiRatingSelect as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
          ],
        });

        // initial message to be deleted here
        try {
          const data: DbValue | undefined = await cache.get(userId);
          if (!data) {
            const dataCache = await cache.set(userId, {
              apiRating: "0",
              supportRating: "0",
              feedback: "none",
            });
          } else if (data) {
            if (data.messageId) {
              interaction.channel?.messages
                .delete(data.messageId as MessageResolvable)
                .catch(() => {});
            }
            delete data.messageId;
            cache.set(userId, data);
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        interaction.reply({
          content: "Feedback already submitted!!",
          embeds: [],
          ephemeral: true,
          components: [],
        });
      }
    } else if (interaction.customId === "more_feedback") {
      interaction.showModal(feedbackModal);
    } else if (interaction.customId === "skip_feedback") {
      const data: DbValue | undefined = await cache.get(interaction.user.id);
      await interaction.update({
        content: "Skipped",
        embeds: [],
        components: [],
      });
      await wait(500);
      await interaction.deleteReply();
      if (!data) {
        const data: DbValue = await db.get(interaction.user.id);
        if (Number(data.apiRating) === 5 || Number(data.supportRating) === 5) {
          interaction.followUp(withTrustpilotEnd);
        } else {
          interaction.followUp(withoutTrustpilotEnd);
        }
      } else {
        if (Number(data.apiRating) === 5 || Number(data.supportRating) === 5) {
          interaction.followUp(withTrustpilotEnd);
        } else {
          interaction.followUp(withoutTrustpilotEnd);
        }
      }
    } else if (interaction.customId === "end_feedback") {
      await interaction.update({
        content: "You can close the channel now. 👋",
        embeds: [],
        components: [],
      });
      await wait(1000);

      interaction.deleteReply();
      const member = await interaction.guild?.members.fetch(
        interaction.user.id
      );
      const role = interaction.guild?.roles.cache.find(
        (role) => role.name === "Feedbacker"
      );
      if (!role) {
        throw new Error("Missing Role");
      }
      member?.roles.remove(role);
      const finalData: DbValue = await cache.get(interaction.user.id);

      db.set(interaction.user.id, finalData);
      console.log(finalData);
      const responseChannel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === "feedback_responses"
      );
      (responseChannel as TextChannel).send({
        content:
          `Response from ${interaction.user}\n` +
          codeBlock("json", JSON.stringify(finalData, null, 2)),
      });
    } else if (interaction.customId === "delete_feedback") {
      // not useful as cannot find user Id here.
      await interaction.deferUpdate();
      const userId = interaction.message.author.id;
      console.log(userId);
      const data = await cache.has(userId);
      if (data) {
        await cache.delete(userId);
        await interaction.update({
          content: `${interaction.user} feedback is deleted.`,
          embeds: [],
          components: [],
        });
      } else {
        await interaction.update({
          content: `Error finding ${interaction.user} feedback`,
          embeds: [],
          components: [],
        });
      }
    }
  }
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "api_rating") {
      // const db: DB = readDb();
      console.log({ api_rating: interaction.values });

      // db[interaction.user.id].apiRating = interaction.values[0];
      // writeDb(db);
      interaction.update({
        content:
          "How would you rate the Moralis Support you receive in discord?",
        // ephemeral: true,
        components: [
          supportRatingSelect as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
        ],
      });
      const userId = interaction.user.id;
      const data: DbValue | undefined = await cache.get(userId);
      if (!data) throw new Error("Missing Data");
      data.apiRating = interaction.values[0];
      cache.set(userId, data);
    }
    if (interaction.customId === "support_rating") {
      console.log({ support_rating: interaction.values });

      // const db: DB = readDb();
      // db[interaction.user.id].supportRating = interaction.values[0];
      // writeDb(db);
      interaction.update({
        content:
          "Would you like to provide any detailed feedback or suggestions to the team?",
        // ephemeral: true,
        components: [
          moreFeedbackRequest as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
        ],
      });
      const userId = interaction.user.id;
      const data: DbValue | undefined = await cache.get(userId);
      if (!data) throw new Error("Missing Data");
      data.supportRating = interaction.values[0];
      cache.set(userId, data);
    }
  }
  if (interaction.isModalSubmit()) {
    // const db: DB = readDb();
    if (interaction.customId === "feedback_modal") {
      console.log(interaction.fields.getTextInputValue("feedback"));
      const userId = interaction.user.id;
      // db[interaction.user.id].feedback =
      //   interaction.fields.getTextInputValue("feedback");
      // writeDb(db);
      await interaction.deferUpdate();
      await interaction.editReply({
        content: "You have successfully submitted your feedback!",
        components: [],
      });
      await wait(500);
      await interaction.deleteReply();
      const data: DbValue | undefined = await cache.get(userId);
      if (!data) {
        const data: DbValue = await db.get(userId);
        if (Number(data.apiRating) === 5 || Number(data.supportRating) === 5) {
          interaction.followUp(withTrustpilotEnd);
        } else {
          interaction.followUp(withoutTrustpilotEnd);
        }
        data.feedback = interaction.fields.getTextInputValue("feedback");
        cache.set(userId, data);
      } else {
        if (Number(data.apiRating) === 5 || Number(data.supportRating) === 5) {
          interaction.followUp(withTrustpilotEnd);
        } else {
          interaction.followUp(withoutTrustpilotEnd);
        }
        data.feedback = interaction.fields.getTextInputValue("feedback");
        cache.set(userId, data);
      }
    }
  }
  if (interaction.isAutocomplete()) {
    try {
      await autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  }
});

client.on("messageCreate", async (message) => {
  console.log(message.content);
  const message_str = message.content;
  const regex = /<@(\d+)>\s+.*?\blevel\s+5\b/i;
  const match = message_str.match(regex);

  if (match) {
    console.log(match);
    const userId = match[1];

    const channel = message.guild?.channels.cache.find(
      (channel) => channel.name === "feedback"
    );

    const user = message.guild?.members.cache.get(match[1]);

    if (!user) {
      throw new Error("User Not Found");
    }

    const initFeedbackRequest = getInitFeedbackReqOnLevelUp(user);

    if (!user?.id) {
      throw new Error("Missing User Id on Message");
    }
    // if (!db[user.id]) {
    //   db[user.id] = {
    //     messageId: sentMessage.id,
    //     apiRating: "0",
    //     supportRating: "0",
    //     feedback: "none",
    //   };
    // }
    const cacheData = await cache.has(user.id);
    const data = await db.has(user.id);
    if (!data && !cacheData) {
      const sentMessage = await (channel as TextChannel)?.send({
        embeds: [initFeedbackRequest],
        content: `||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​|| _ _ _ _ _ _ ${user}`,
      });
      await cache.set(user.id, {
        messageId: sentMessage.id,
        apiRating: "0",
        supportRating: "0",
        feedback: "none",
      });
      await message.reply({
        content: `Feedback request sent to the ${user} .`,
        // ephemeral: true,
      });
    } else {
      await message.reply({
        content: "Feedback already requested to this user.",
        // ephemeral: true,
        components: [
          // deleteFeedbackButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
        ],
      });
    }
  } else {
    console.log("No match found");
  }
});

async function main() {
  const commands = [
    setFeedbackMessage,
    getdocs,
    {
      name: "Get Feedback",
      type: 3,
    },
    {
      name: "Update Docs",
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
