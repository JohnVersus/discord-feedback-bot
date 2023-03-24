import {
  ActionRowBuilder,
  APIActionRowComponent,
  APIMessageActionRowComponent,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  InteractionReplyOptions,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  ColorResolvable,
} from "discord.js";

type ApiDocs = Record<string, Record<string, Record<string, string>>>;

const generateEmbedsAndButtons = (
  json: ApiDocs
): {
  embeds: EmbedBuilder[];
  rows: Array<Array<APIActionRowComponent<APIMessageActionRowComponent>>>;
} => {
  const embeds: EmbedBuilder[] = [];
  const rows: Array<
    Array<APIActionRowComponent<APIMessageActionRowComponent>>
  > = [];

  for (const [key, subkeys] of Object.entries(json)) {
    let i = 0;
    let thumburl;
    if (
      key.toLowerCase().includes("evm") &&
      !key.toLowerCase().includes("streams")
    ) {
      thumburl = "https://i.ibb.co/TwjFmXT/EVM.png";
    } else if (
      key.toLowerCase().includes("aptos") &&
      !key.toLowerCase().includes("streams")
    ) {
      thumburl = "https://i.ibb.co/xFswHkz/Aptos.png";
    } else if (key.toLowerCase().includes("solana")) {
      thumburl = "https://i.ibb.co/HHVdDPd/Solana.png";
    } else if (key.toLowerCase().includes("streams")) {
      thumburl = "https://i.ibb.co/K0Q2SkS/Stream.png";
    } else if (key.toLowerCase().includes("auth")) {
      thumburl = "https://i.ibb.co/HDZ9qYg/Auth.png";
    } else {
      thumburl = "https://avatars.githubusercontent.com/u/80474746?s=200&v=4";
    }

    for (const [subkey, subsubkeys] of Object.entries(subkeys)) {
      const addDocsEmbed =
        i === 0
          ? new EmbedBuilder()
              .setColor(0x16d195)
              .setTitle(`${key} API`)
              .setAuthor({
                name: "API reference docs",
                iconURL:
                  "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
                url: "https://docs.moralis.io",
              })
              .setThumbnail(thumburl)
              .setDescription(`${key} - ${subkey}`)
          : new EmbedBuilder()
              .setColor(0x16d195)
              // .setTitle(`${key} - ${subkey}`)
              // .setAuthor({
              //   name: "API reference docs",
              //   iconURL: "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
              //   url: "https://docs.moralis.io",
              // })
              // .setThumbnail(
              //   "https://avatars.githubusercontent.com/u/80474746?s=200&v=4"
              // )
              .setDescription(`${key} - ${subkey}`);
      // .setTimestamp();

      i++;
      const buttonComponents: ButtonBuilder[] = Object.entries(subsubkeys).map(
        ([subsubkey, url]) =>
          new ButtonBuilder()
            .setLabel(subsubkey)
            .setStyle(ButtonStyle.Link)
            .setURL(url)
      );

      const actionRows: Array<
        APIActionRowComponent<APIMessageActionRowComponent>
      > = [];
      for (let i = 0; i < buttonComponents.length; i += 5) {
        actionRows.push(
          new ActionRowBuilder().addComponents(
            buttonComponents.slice(i, i + 5)
          ) as unknown as APIActionRowComponent<APIMessageActionRowComponent>
        );
      }

      embeds.push(addDocsEmbed);
      rows.push(actionRows);
    }
  }

  return { embeds, rows };
};

// const addDocsEmbed = new EmbedBuilder()
//   .setColor(0x16d195)
//   .setTitle("Docs")
//   .setAuthor({
//     name: "Moralis API Docs",
//     iconURL: "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
//     url: "https://moralis.io",
//   })
//   .setThumbnail("https://avatars.githubusercontent.com/u/80474746?s=200&v=4")
//   .setDescription("Visit Moralis Docs by clicking on the below buttons.")
//   .setTimestamp();

// const docButtons = new ActionRowBuilder().addComponents(
//   new ButtonBuilder()
//     .setLabel("getBlock")
//     .setStyle(ButtonStyle.Link)
//     .setURL("URL")
// );

export { generateEmbedsAndButtons };
