import express from 'express'
import fs from 'fs'
import sqlite from 'sqlite3'
import { Client, GatewayIntentBits } from 'discord.js'
import api from './api'
import bot from './bot'
import type { Command } from './utils'
import utils from './utils'

const version = "1.0.0"
const cfg_version = "1.0.0"
let setup = true

const app = express()
let config: any;
if (fs.existsSync('../config.json')) {
    config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
    if (config.version != cfg_version) {
        console.error(`Config version mismatch: ${config.version} != ${cfg_version}`)
        console.error("Please update your configuration! https://dbl.afonyanet.hu/docs/config");
        process.exit(1);
    }
} else {
    config = {
        "backendPort": 1025,
        "frontendPort": 3000,
        "clientId": "",
        "clientSecret": "",
        "redirectUri": "",
        "authLink": "",
        "token": "",
        "version": cfg_version
    }
    setup = false
}
if (!fs.existsSync("./database.db")) {
    setup = false
}
const db = new sqlite.Database('./database.db')
const client = new Client({ intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds] })
let commands: { [key: string]: Command } = {}

let olog = console.log
console.log = (...args: any[]) => {
    olog(...args)
    if (!setup) {
        return
    }
    db.run("INSERT INTO logs (date, type, message) VALUES (?, ?, ?)", new Date(), "log", args.join(' '))
}
let owarn = console.warn
console.warn = (...args: any[]) => {
    owarn(...args)
    if (!setup) {
        return
    }
    db.run("INSERT INTO logs (date, type, message) VALUES (?, ?, ?)", new Date(), "warn", args.join(' '))
}
let oerr = console.error
console.error = (...args: any[]) => {
    oerr(...args)
    if (!setup) {
        return
    }
    db.run("INSERT INTO logs (date, type, message) VALUES (?, ?, ?)", new Date(), "error", args.join(' '))
}

app.use(express.json())

client.once('ready', () => {
    console.log(`Bot logged in as ${client.user?.tag}`);
})

async function loadBaseCommands() {
    commands = await utils.getCommands(db)
}
if (setup) {
    loadBaseCommands()
}

function getVar(name: string): any {
    if (name == "commands") {
        return commands
    } else if (name == "version") {
        return version
    } else if (name == "cfg_version") {
        return cfg_version
    } else if (name == "setup") {
        return setup
    }
}
function setVar(name: string, value: any): void {
    if (name == "commands") {
        commands = value
    }
}

api(app, db, config, client, getVar, setVar)
if (setup) {
    bot(db, config, client, getVar, setVar)
}

app.listen(config.backendPort, () => {
    console.log(`Backend running at http://localhost:${config.backendPort}`)
})
if (setup) {
    client.login(config.token)    
} else {
    console.log("First start, detected... Please complete the setup. http://localhost:3000/setup");
}