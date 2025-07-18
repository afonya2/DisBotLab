import express from 'express'
import fs from 'fs'
import sqlite from 'sqlite3'
import { Client } from 'discord.js'
import api from './api'
import bot from './bot'

const app = express()
let config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const db = new sqlite.Database('./database.db')
const client = new Client({ intents: [] })
let commands = {}

app.use(express.json())

client.once('ready', () => {
    console.log(`Bot logged in as ${client.user?.tag}`);
})

api(app, db, config, client)
bot(db, config, client)

app.listen(config.backendPort, () => {
    console.log(`Backend running at http://localhost:${config.backendPort}`)
})
client.login(config.token)