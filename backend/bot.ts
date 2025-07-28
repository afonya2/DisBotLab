import type { Database } from "sqlite3";
import utils, { Flow, type Command } from "./utils";
import { MessageFlagsBitField, type Client } from "discord.js";

export default function (db: Database, config: any, client: Client, getVar: (name: string) => any, setVar: (name: string, value: any) => void) {
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        let commands = getVar("commands");
        if (commands[interaction.commandName] === undefined) {
            await interaction.reply({ content: "Command not found", flags: MessageFlagsBitField.Flags.Ephemeral });
            return;
        }
        let command = commands[interaction.commandName];
        let flow = new Flow(db, command.module, command.nodeId);
        await flow.load(db)
        try {
            await flow.run(client, {
                channel: interaction.channelId,
                user: interaction.user.id,
                guild: interaction.guildId
            }, interaction);
            await utils.asyncDb(db, "INSERT INTO interactions (id, date, success, userId) VALUES (?, ?, ?, ?)", interaction.id, new Date(), true, interaction.user.id);
        } catch (e: any) {
            console.error("Error running flow:", e);
            if (!interaction.replied) {
                await interaction.reply({ content: "An error occurred while executing the command.", flags: MessageFlagsBitField.Flags.Ephemeral });
            }
            await utils.asyncDb(db, "INSERT INTO interactions (id, date, success, userId, error) VALUES (?, ?, ?, ?, ?)", interaction.id, new Date(), false, interaction.user.id, e.message);
        }
    });
}