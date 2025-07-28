import express from 'express'
import fs from 'fs'
import sqlite from 'sqlite3'
import { Client, GatewayIntentBits } from 'discord.js'
import api from './api'
import bot from './bot'
import type { Command } from './utils'
import utils from './utils'

const app = express()
let config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const db = new sqlite.Database('./database.db')
const client = new Client({ intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.Guilds] })
let commands: { [key: string]: Command } = {}

app.use(express.json())

client.once('ready', () => {
    console.log(`Bot logged in as ${client.user?.tag}`);
})

async function loadBaseCommands() {
    commands = await utils.getCommands(db)
}
loadBaseCommands()

function getVar(name: string): any {
    if (name == "commands") {
        return commands
    }
}
function setVar(name: string, value: any): void {
    if (name == "commands") {
        commands = value
    }
}

api(app, db, config, client, getVar, setVar)
bot(db, config, client, getVar, setVar)

app.listen(config.backendPort, () => {
    console.log(`Backend running at http://localhost:${config.backendPort}`)
})
client.login(config.token)