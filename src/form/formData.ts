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
} from "discord.js";

const apiRatingSelect = new ActionRowBuilder().setComponents(
  new StringSelectMenuBuilder().setCustomId("api_rating").setOptions([
    { label: "⭐️", value: "1" },
    { label: "⭐️⭐️", value: "2" },
    { label: "⭐️⭐️⭐️", value: "3" },
    { label: "⭐️⭐️⭐️⭐️", value: "4" },
    { label: "⭐️⭐️⭐️⭐️⭐️", value: "5" },
  ])
);
const supportRatingSelect = new ActionRowBuilder().setComponents(
  new StringSelectMenuBuilder().setCustomId("support_rating").setOptions([
    { label: "⭐️", value: "1" },
    { label: "⭐️⭐️", value: "2" },
    { label: "⭐️⭐️⭐️", value: "3" },
    { label: "⭐️⭐️⭐️⭐️", value: "4" },
    { label: "⭐️⭐️⭐️⭐️⭐️", value: "5" },
  ])
);

const moreFeedbackRequest = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("more_feedback")
    .setLabel("Yes")
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId("skip_feedback")
    .setLabel("Skip")
    .setStyle(ButtonStyle.Secondary)
);

const feedbackModal = new ModalBuilder()
  .setTitle("Detailed feedback")
  .setCustomId("feedback_modal")
  .setComponents(
    // @ts-ignore
    new ActionRowBuilder().setComponents(
      new TextInputBuilder()
        .setLabel("feedback")
        .setCustomId("feedback")
        .setStyle(TextInputStyle.Paragraph)
    )
  );

const trustpilotEmbed = new EmbedBuilder()
  .setColor(0x16d195)
  .setTitle("Trustpilot Review Request")
  .setAuthor({
    name: "Moralis Feedback",
    iconURL: "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
    url: "https://moralis.io",
  })
  .setThumbnail(
    "https://cdn.trustpilot.net/brand-assets/1.5.0/favicons/apple-touch-icon.png"
  )
  .setDescription(
    "Could you please leave a review on our Trustpilot about the Moralis services and the support you have received from us? It will mean a lot for us to spread the positive word; as you can see, we don't have many reviews as of yet.\n\nYou can find our Trustpilot here - https://www.trustpilot.com/review/moralis.io\n\nThank you for your time😃"
  );

const startFeedbackEmbed = new EmbedBuilder()
  .setColor(0x16d195)
  .setTitle("Steps")
  .setAuthor({
    name: "Moralis Feedback Form",
    iconURL: "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
    url: "https://moralis.io",
  })
  .setThumbnail("https://avatars.githubusercontent.com/u/80474746?s=200&v=4")
  .setDescription(
    "Click on the below **Start** button to start the feedback process!!\n\nThank You for your time and feedback."
  )
  .setTimestamp();

const startFeedbackButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("start_feedback")
    .setLabel("Start")
    .setStyle(ButtonStyle.Success)
);
const endFeedbackButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("end_feedback")
    .setLabel("Mark as done!!")
    .setStyle(ButtonStyle.Success)
);

const endFeedbackWithLinkButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("end_feedback")
    .setLabel("Mark as done!!")
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setLabel("Visit")
    .setStyle(ButtonStyle.Link)
    .setURL("https://www.trustpilot.com/review/moralis.io")
);

const deleteFeedbackButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("delete_feedback")
    .setLabel("Delete")
    .setStyle(ButtonStyle.Danger)
);

const withTrustpilotEnd: InteractionReplyOptions = {
  content: "**Thank You for rating us 5 ⭐️ **",
  embeds: [trustpilotEmbed],
  ephemeral: true,
  components: [
    endFeedbackWithLinkButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
  ],
};

const withoutTrustpilotEnd: InteractionReplyOptions = {
  content: "**Thank You for your feedback ⭐️ **",
  ephemeral: true,
  components: [
    endFeedbackButton as unknown as APIActionRowComponent<APIMessageActionRowComponent>,
  ],
};

const getInitFeedbackReq = (user: GuildMember): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor(0x16d195)
    .setAuthor({
      name: "Feedback Request",
      iconURL: "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
      url: "https://moralis.io",
    })
    .setDescription(
      `Hi ${user}, this feedback request is triggered based on recent experience in the Moralis discord. \n\n Please click on the above start button to provide feedback and help us improve. \n \n Thank You!!`
    )
    .setTimestamp();
};

const getInitFeedbackReqOnLevelUp = (user: GuildMember): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor(0x16d195)
    .setAuthor({
      name: "Feedback Request",
      iconURL: "https://avatars.githubusercontent.com/u/80474746?s=200&v=4",
      url: "https://moralis.io",
    })
    .setDescription(
      `Hi ${user}, this feedback request is triggered on reaching a new level on our discord server. \n\n Please click on the above start button to provide feedback and help us improve. \n \n Thank You!!`
    )
    .setTimestamp();
};

const postInThreadEmbed = new EmbedBuilder()
  .setColor(0x16d195)
  .setTitle("Channels to Ask for Help")
  .setThumbnail("https://avatars.githubusercontent.com/u/80474746?s=200&v=4")
  .setDescription(
    "Please post your technical questions in <#1033636954673266738> or <#1139406658557198366> or <#1139836255820066846> channel. This will help other community members easily search for similar answers and will also improve the server experience."
  );

const helpChannelsButton = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel("🔧 Moralis API Help")
    .setStyle(ButtonStyle.Link)
    .setURL(
      "https://discord.com/channels/819584798443569182/1033636954673266738"
    ),
  new ButtonBuilder()
    .setLabel("🔧 Moralis SDK Help")
    .setStyle(ButtonStyle.Link)
    .setURL(
      "https://discord.com/channels/819584798443569182/1139406658557198366"
    ),
  new ButtonBuilder()
    .setLabel("🔧 General Questions")
    .setStyle(ButtonStyle.Link)
    .setURL(
      "https://discord.com/channels/819584798443569182/1139836255820066846"
    )
);

export {
  startFeedbackEmbed,
  startFeedbackButton,
  apiRatingSelect,
  supportRatingSelect,
  moreFeedbackRequest,
  feedbackModal,
  trustpilotEmbed,
  endFeedbackButton,
  deleteFeedbackButton,
  withTrustpilotEnd,
  withoutTrustpilotEnd,
  getInitFeedbackReq,
  getInitFeedbackReqOnLevelUp,
  postInThreadEmbed,
  helpChannelsButton,
};
