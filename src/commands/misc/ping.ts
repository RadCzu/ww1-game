import { CommandTemplate } from "../../models/Command";


const ping: CommandTemplate = {
  name: "ping",
  description: "Pong!",
  testOnly: true,
  callback: async (client, interaction) => {
    await interaction.deferReply();

    const reply = await interaction.fetchReply();

    const ping = reply.createdTimestamp - interaction.createdTimestamp;

    interaction.editReply(
      `Pong! Client ping is ${ping}ms | Websocket: ${client.ws.ping}ms`
    );
  },
};

export default ping;