import type { Database } from "sqlite3"
import https from 'https'
import { SlashCommandBuilder, type Client } from "discord.js"

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
                description: nodeData.desc
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

export default {
    sendResponse,
    request,
    dbSelect,
    asyncDb,
    getUserIdFromToken,
    getCommands,
    reloadCommands
}

export { sendResponse, request, dbSelect, asyncDb, getUserIdFromToken, getCommands, reloadCommands }

export type { Command }