import type { Database } from "sqlite3";
import utils, { Flow, type Command } from "./utils";
import { MessageFlagsBitField, type Client } from "discord.js";

async function executeOnError(db: Database, client: Client, module: string, error: any) {
    let mod = await utils.dbSelect(db, "SELECT * FROM modules WHERE id = ?", module);
    if (mod.length === 0) {
        return;
    }
    if (!mod[0].enabled) {
        return;
    }
    let nodes = await utils.dbSelect(db, "SELECT * FROM nodes WHERE module = ? AND type = 'onError'", module);
    if (nodes.length > 0) {
        let flow = new Flow(db, Number(module), nodes[0].id);
        await flow.load();
        try {
            await flow.run(client, {
                message: error.message,
                stack: error.stack,
                name: error.name
            }, error);
        } catch (e: any) {
            console.error("Error running onError flow:", e);
        }
    }
}

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
        await flow.load()
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
            await executeOnError(db, client, command.module, e);
        }
    });
    client.on('messageCreate', async (message) => {
        let modules = await utils.dbSelect(db, "SELECT * FROM modules")
        let enabledModules = modules.map(m => {
            if (m.enabled) {
                return m.id
            }
            return null
        }).filter(m => m !== null)
        let nodes = await utils.dbSelect(db, "SELECT * FROM nodes")
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const nodeData = JSON.parse(node.data)
            if (node.type == "onMessage" && enabledModules.includes(node.module) && message.content.startsWith(nodeData.prefix)) {
                let flow = new Flow(db, node.module, node.id);
                await flow.load();
                try {
                    await flow.run(client, {
                        channel: message.channelId,
                        user: message.author.id,
                        guild: message.guildId,
                        content: message.content,
                        isBot: message.author.bot
                    }, message);
                } catch (e: any) {
                    console.error("Error running flow:", e);
                    await executeOnError(db, client, node.module, e);
                }
            }
        }
    });
}