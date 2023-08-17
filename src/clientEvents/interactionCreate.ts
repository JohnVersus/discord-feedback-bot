import {
  APIActionRowComponent,
  APIMessageActionRowComponent,
  Interaction,
  MessageResolvable,
  TextChannel,
  codeBlock,
} from "discord.js";
import {
  apiRatingSelect,
  feedbackModal,
  getInitFeedbackReq,
  helpChannelsButton,
  moreFeedbackRequest,
  postInThreadEmbed,
  startFeedbackButton,
  startFeedbackEmbed,
  supportRatingSelect,
  withTrustpilotEnd,
  withoutTrustpilotEnd,
} from "../form/formData";
import { DOCS_CHANNEL_NAME, cache, client, db, wait } from "..";
import { autocomplete, execute } from "../commands/getDocs";
import { generateEmbedsAndButtons, searchDocs } from "../docs/docs";
import { collectFeedback } from "../slack";

interface DbValue {
  messageId?: string;
  apiRating?: string;
  supportRating?: string;
  feedback?: string;
}
export const InteractionCreateEvent = async (interaction: Interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === "start_feedback") {
      const userId = interaction.user.id;

      // const existingUser = await db.has(userId);
      const existingUser = false; // uncomment to accept muptiple feedbacks

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
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "setfeedbackmessage") {
      const channel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === "🛠-feedback"
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
      let count = await db.get("getdocsusage");
      if (count === null || count === undefined) {
        count = 0;
      }
      db.set("getdocsusage", Number(count) + 1);
    } else if (interaction.commandName === "getdocsusage") {
      const count = await db.get("getdocsusage");
      interaction.reply({
        content: `Docs command was used ${count} times.`,
      });
    } else if (interaction.commandName === "sethelpchannelsmessage") {
      const channel = interaction.guild?.channels.cache.find(
        (channel) => channel.name === "🎟-open-a-ticket"
      );

      (channel as TextChannel)?.send({
        embeds: [postInThreadEmbed],
        components: [
          helpChannelsButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
        ],
      });

      await interaction.reply({
        content: "Message added in #feedback channel!!",
        ephemeral: true,
      });
    }
  }
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
        (channel) => channel.name === "🛠-feedback"
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
          const { embeds, rows } = generateEmbedsAndButtons(jsonData);

          for (let i = 0; i < embeds.length; i++) {
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
    } else if (interaction.commandName === "Feedback to slack") {
      collectFeedback(interaction, client);
    }
    // writeDb(db);
  }
};
