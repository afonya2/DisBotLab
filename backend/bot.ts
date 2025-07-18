import type { Database } from "sqlite3";
import utils, { Flow, type Command } from "./utils";
import { MessageFlagsBitField, type Client } from "discord.js";

export default function (db: Database, config: any, client: Client, getVar: (name: string) => any, setVar: (name: string, value: any) => void) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        let commands = getVar("commands");
        if (commands[interaction.commandName] === undefined) {
            await interaction.reply({ content: "Command not found", ephemeral: true });
            return;
        }
        let command = commands[interaction.commandName];
        let flow = new Flow(command.module, command.nodeId);
        await flow.load(db)
        await flow.run(client, {
            channel: interaction.channelId
        }, interaction);
    });
}