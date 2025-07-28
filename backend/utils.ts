import type { Database } from "sqlite3"
import https from 'https'
import { Message, MessageFlagsBitField, SlashCommandBuilder, TextChannel, type Client } from "discord.js"

function sendResponse(ok: boolean, data: any, error?: string) {
    let res: any = {
        ok: ok,
        body: data
    }
    if (!ok) {
        res.error = error
    }
    return JSON.stringify(res)
}

function request(url: string, options: https.RequestOptions, body?: String): Promise<string> {
    return new Promise((resolve, reject) => {
        let req = https.request(url, options, (res) => {
            let data = ''
            res.on('data', (chunk) => {
                data += chunk
            })
            res.on('end', () => {
                resolve(data)
            })
            res.on('error', (err) => {
                console.log(err);
                reject(err)
            })
        })
        if (body != undefined) {
            req.write(body)
        }
        req.on('error', (err) => {
            console.log(err);
            reject(err)
        })
        req.end()
    })
}

function dbSelect(db: Database, command: string, ...args: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all(command, ...args, (err: any, rows: any) => {
            if (err) {
                reject(err)
            }
            resolve(rows)
        })
    })
}

function asyncDb(db: Database, command: string, ...args: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(command, ...args, (err: any) => {
            if (err) {
                reject(err)
            }
            resolve()
        })
    })
}

let userIdCache: { [key: string]: { id: string, expires: number } } = {}
async function getUserIdFromToken(token: string): Promise<string> {
    if (userIdCache[token] && userIdCache[token].expires > Date.now()) {
        return userIdCache[token].id
    }
    let userReq = await request('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    try {
        let userReqP = JSON.parse(userReq)
        if (userReqP.id == undefined) {
            return '0'
        }
        userIdCache[token] = {
            id: userReqP.id,
            expires: Date.now() + 60 * 60 * 1000
        }
        return userReqP.id
    } catch (e) {
        console.error("Failed to parse user request:", e);
        return '0'
    }
}

interface Command {
    name: string;
    description: string;
    module: string;
    nodeId: string;
}

async function getCommands(db: Database): Promise<{ [key: string]: Command }> {
    let modules = await dbSelect(db, "SELECT * FROM modules")
    let enabledModules = modules.map(m => {
        if (m.enabled) {
            return m.id
        }
        return null
    }).filter(m => m !== null)
    let nodes = await dbSelect(db, "SELECT * FROM nodes")
    let commands: { [key: string]: Command } = {}
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        const nodeData = JSON.parse(node.data)
        if (node.type == "command" && enabledModules.includes(node.module)) {
            commands[nodeData.command] = {
                name: nodeData.command,
                description: nodeData.desc,
                module: node.module,
                nodeId: node.id
            }
        }
    }
    return commands
}

async function reloadCommands(client: Client, commands: { [key: string]: Command }) {
    let commandBuilders = []
    for (let commandName in commands) {
        const command = commands[commandName];
        commandBuilders.push(new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description)
        );
    }
    client.application?.commands.set(commandBuilders)
    console.log("Commands reloaded!");
}

function completeVariables(input: string, variables: { [key: string]: any }, globalVariables: { [key: string]: any }): string {
    let completions: { [key: string]: any } = {};
    function recAddCompletions(vars: { [key: string]: any }, prefix: string) {
        for (let key in vars) {
            if (typeof vars[key] === 'object') {
                recAddCompletions(vars[key], prefix + key + '.');
            } else if (typeof vars[key] === 'function') {
                continue
            } else {
                completions[prefix + key] = vars[key];
            }
        }
    }
    recAddCompletions(globalVariables, '');
    recAddCompletions(variables, '');
    for (let c in completions) {
        const value = completions[c];
        input = input.replace(new RegExp(`\\{${c}\\}`, 'g'), value.toString().replace(/{/g, '&#opnvar'));
        input = input.replace(new RegExp(`\\{insecure:${c}\\}`, 'g'), value.toString());
    }
    input = input.replace(/&#opnvar/g, '{');
    return input;
}

interface FlowNode {
    module: number;
    id: number;
    type: string;
    data: any;
}

class Flow {
    module: number;
    startId: number;
    public flow: FlowNode[] = [];
    public flowVariables: { [key: string]: any } = {};
    public privateVariables: { [key: string]: any } = {};
    database: Database;

    constructor(db: Database, module: number, startId: number) {
        this.module = module;
        this.startId = startId;
        this.database = db;
    }

    async load() {
        let module = await dbSelect(this.database, 'SELECT * FROM modules WHERE id = ?', this.module);
        if (module.length === 0) {
            console.error(`Module with ID ${this.module} not found`);
            return;
        }
        if (module[0].enabled === 0) {
            return;
        }
        let nodes = await dbSelect(this.database, 'SELECT * FROM nodes WHERE module = ?', this.module);
        let edges = await dbSelect(this.database, 'SELECT * FROM edges WHERE module = ?', this.module);
        let currentNode = nodes.find(n => n.id === this.startId);
        while (true) {
            this.flow.push({
                module: currentNode.module,
                id: currentNode.id,
                type: currentNode.type,
                data: JSON.parse(currentNode.data)
            });
            let nextEdge = edges.find(e => e.from === currentNode.id);
            if (!nextEdge) break;
            currentNode = nodes.find(n => n.id === nextEdge.to);
        }
    }

    async run(client: Client, beginEvent: any = {}, beginPrivate: any = {}) {
        for (let i = 0; i < this.flow.length; i++) {
            const node = this.flow[i];
            let dbVars = await dbSelect(this.database, "SELECT * FROM moduleVariables WHERE module = ?", this.module);
            let globalVariables: { [key: string]: any } = {};
            for (let j = 0; j < dbVars.length; j++) {
                const dbVar = dbVars[j];
                globalVariables[dbVar.name] = dbVar.value;
            }
            if (node.type == "command") {
                this.flowVariables[node.data.variable] = beginEvent
                this.privateVariables[node.data.variable] = beginPrivate
            } else if (node.type == "sendMessage") {
                let channel = completeVariables(node.data.channel, this.flowVariables, globalVariables);
                let content = completeVariables(node.data.content, this.flowVariables, globalVariables);
                let channelObj = await client.channels.fetch(channel);
                if (channelObj instanceof TextChannel) {
                    await channelObj.send({
                        content: content
                    });
                }
            } else if (node.type == "reply") {
                let content = completeVariables(node.data.content, this.flowVariables, globalVariables);
                let interaction = this.privateVariables[node.data.interaction]
                if (interaction && interaction.isRepliable()) {
                    if (node.data.ephemeral) {
                        await interaction.reply({
                            content: content,
                            flags: MessageFlagsBitField.Flags.Ephemeral
                        });
                    } else {
                        await interaction.reply({
                            content: content
                        });
                    }
                }
            } else if (node.type == "setVariable") {
                if (!node.data.global) {
                    this.flowVariables[node.data.variable] = completeVariables(node.data.value, this.flowVariables, globalVariables);
                } else {
                    let varExists = await dbSelect(this.database, "SELECT * FROM moduleVariables WHERE name = ? AND module = ?", node.data.variable, this.module);
                    if (varExists.length === 0) {
                        await asyncDb(this.database, "INSERT INTO moduleVariables (name, value, module) VALUES (?, ?, ?)", node.data.variable, completeVariables(node.data.value, this.flowVariables, globalVariables), this.module);
                    } else {
                        await asyncDb(this.database, "UPDATE moduleVariables SET value = ? WHERE name = ? AND module = ?", completeVariables(node.data.value, this.flowVariables, globalVariables), node.data.variable, this.module);
                    }
                }
            } else if (node.type == "error") {
                let errorMessage = completeVariables(node.data.message, this.flowVariables, globalVariables);
                throw new Error(errorMessage);
            } else if (node.type == "if" || node.type == "while") {
                let left = completeVariables(node.data.left, this.flowVariables, globalVariables);
                let right = completeVariables(node.data.right, this.flowVariables, globalVariables);
                let condition: boolean;
                switch (node.data.operator) {
                    case "==":
                        condition = left == right;
                        break;
                    case "!=":
                        condition = left != right;
                        break;
                    case ">":
                        condition = Number(left) > Number(right);
                        break;
                    case "<":
                        condition = Number(left) < Number(right);
                        break;
                    case ">=":
                        condition = Number(left) >= Number(right);
                        break;
                    case "<=":
                        condition = Number(left) <= Number(right);
                        break;
                    default:
                        throw new Error("Unknown condition: " + node.data.condition);
                }
                if (condition) {
                    let depth = 1;
                    let preV = i
                    while (i + 1 < this.flow.length) {
                        i++;
                        const nextNode = this.flow[i];
                        if (nextNode.type == "if") {
                            depth++;
                        } else if (nextNode.type == "while") {
                            depth++;
                        } else if (nextNode.type == "end") {
                            depth--;
                            if (depth == 0) {
                                break;
                            }
                        }
                    }
                    if (depth > 0) {
                        throw new Error("Unmatched if/while in flow");
                    }
                    i = preV;
                } else {
                    let depth = 1;
                    while (i + 1 < this.flow.length) {
                        i++;
                        const nextNode = this.flow[i];
                        if (nextNode.type == "if") {
                            depth++;
                        } else if (nextNode.type == "while") {
                            depth++;
                        } else if (nextNode.type == "end") {
                            depth--;
                            if (depth == 0) {
                                break;
                            }
                        }
                    }
                    if (depth > 0) {
                        throw new Error("Unmatched if/while in flow");
                    }
                }
            } else if (node.type == "sendMessageUser") {
                let userId = completeVariables(node.data.user, this.flowVariables, globalVariables);
                let content = completeVariables(node.data.content, this.flowVariables, globalVariables);
                let user = await client.users.fetch(userId);
                user.send({
                    content: content
                })
            } else if (node.type == "onMessage") {
                this.flowVariables[node.data.variable] = beginEvent
                this.privateVariables[node.data.variable] = beginPrivate
            } else if (node.type == "replyMessage") {
                let content = completeVariables(node.data.content, this.flowVariables, globalVariables);
                let message = this.privateVariables[node.data.message];
                if (message && message instanceof Message) {
                    await message.reply({
                        content: content
                    });
                }
            } else if (node.type == "math") {
                let left = Number(completeVariables(node.data.left, this.flowVariables, globalVariables));
                let right = Number(completeVariables(node.data.right, this.flowVariables, globalVariables));
                if (Number.isNaN(left) || Number.isNaN(right)) {
                    throw new Error("Left or right operand is not a number!");
                }
                let result: number;
                switch (node.data.operator) {
                    case "+":
                        result = left + right;
                        break;
                    case "-":
                        result = left - right;
                        break;
                    case "*":
                        result = left * right;
                        break;
                    case "/":
                        result = left / right;
                        break;
                    case "%":
                        result = left % right;
                        break;
                    default:
                        throw new Error("Unknown operator: " + node.data.operator);
                }
                this.flowVariables[node.data.variable] = result;
            } else if (node.type == "stop") {
                return
            } else if (node.type == "end") {
                let depth = 1;
                let preV = i
                let jumpback = -1
                while (i - 1 >= 0) {
                    i--;
                    const nextNode = this.flow[i];
                    if (nextNode.type == "if") {
                        depth--;
                        if (depth == 0) {
                            break;
                        }
                    } else if (nextNode.type == "while") {
                        depth--;
                        if (depth == 0) {
                            jumpback = i;
                            break;
                        }
                    } else if (nextNode.type == "end") {
                        depth++;
                    }
                }
                if (depth > 0) {
                    throw new Error("Unmatched end in flow");
                }
                if (jumpback >= 0) {
                    i = jumpback-1;
                } else {
                    i = preV;
                }
            } else if (node.type == "log") {
                let message = completeVariables(node.data.message, this.flowVariables, globalVariables);
                console.log(message);
            } else if (node.type == "onError") {
                this.flowVariables[node.data.variable] = beginEvent
                this.privateVariables[node.data.variable] = beginPrivate
            }
        }
    }
}

export default {
    sendResponse,
    request,
    dbSelect,
    asyncDb,
    getUserIdFromToken,
    getCommands,
    reloadCommands,
    Flow
}

export { sendResponse, request, dbSelect, asyncDb, getUserIdFromToken, getCommands, reloadCommands, Flow }

export type { Command, FlowNode }