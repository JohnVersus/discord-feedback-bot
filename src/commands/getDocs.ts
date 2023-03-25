import {
  AutocompleteInteraction,
  Client,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import Keyv from "keyv";
import KeyvFile from "keyv-file";

const db = new Keyv({ store: new KeyvFile({ filename: "db.json" }) });
db.on("error", (err) => console.error("Keyv connection error:", err));

async function fetchJson(): Promise<
  Record<string, Record<string, Record<string, string>>>
> {
  const messageJsom: Record<
    string,
    Record<string, Record<string, string>>
  > = await db.get("docReference");

  return messageJsom;
}

async function autocomplete(interaction: AutocompleteInteraction) {
  const json = await fetchJson();

  const focusedOption = interaction.options.getFocused(true);
  let choices: string[] = [];

  if (focusedOption.name === "ref") {
    choices = Object.keys(json);
  } else if (
    focusedOption.name === "type" &&
    interaction.options.getString("ref")
  ) {
    const refValue = interaction.options.getString("ref");
    if (refValue && json[refValue]) {
      choices = Object.keys(json[refValue]);
    }
  } else if (
    focusedOption.name === "name" &&
    interaction.options.getString("ref") &&
    interaction.options.getString("type")
  ) {
    const refValue = interaction.options.getString("ref");
    const typeValue = interaction.options.getString("type");
    if (refValue && typeValue && json[refValue] && json[refValue][typeValue]) {
      choices = Object.keys(json[refValue][typeValue]);
    }
  }

  const filtered = choices.filter((choice) =>
    choice.toLowerCase().startsWith(focusedOption.value.toLowerCase())
  );
  await interaction.respond(
    filtered.map((choice) => ({ name: choice, value: choice }))
  );
}

async function execute(interaction: CommandInteraction) {
  const json = await fetchJson();

  const ref = interaction.options.get("ref")?.value;
  const type = interaction.options.get("type")?.value;
  const name = interaction.options.get("name")?.value;

  if (
    typeof ref === "string" &&
    typeof type === "string" &&
    typeof name === "string"
  ) {
    const url = json[ref]?.[type]?.[name];

    if (url) {
      await interaction.reply({
        content: `Here's the documentation URL: ${url}`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          "I couldn't find the requested documentation. Please try again.",
        ephemeral: true,
      });
    }
  } else {
    await interaction.reply({
      content:
        "Something went wrong. Please make sure to select valid options.",
      ephemeral: true,
    });
  }
}

const getdocs = new SlashCommandBuilder()
  .setName("getdocs")
  .setDescription("Get documentation!")
  .addStringOption((option) =>
    option
      .setName("ref")
      .setDescription("API reference")
      .setAutocomplete(true)
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("API type")
      .setAutocomplete(true)
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("API Name")
      .setAutocomplete(true)
      .setRequired(true)
  );

export default getdocs;

export { autocomplete, execute };
