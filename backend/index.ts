import express, { type Request, type Response } from 'express'
import fs from 'fs'
import sqlite from 'sqlite3'
import https from 'https'
import { Client } from 'discord.js'
import { version } from 'os'

const app = express()
let config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const db = new sqlite.Database('./database.db')
const client = new Client({ intents: [] })

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

function dbSelect(command: string, ...args: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all(command, ...args, (err: any, rows: any) => {
            if (err) {
                reject(err)
            }
            resolve(rows)
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

app.use(express.json())

app.get('/info', (req: Request, res: Response) => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {
        version: `DisBotLab v${config.version}`,
        authLink: config.authLink
    }))
})

app.post('/login', async (req: Request, res: Response) => {
    if (req.body.code == undefined || typeof req.body.code !== 'string' || req.body.code.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid code'))
        return
    }
    let dcreq = await request('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    }, new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: req.body.code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
    }).toString())
    let discordReq = JSON.parse(dcreq)
    if (discordReq.error) {
        console.error("Discord request failed:", discordReq)
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, discordReq.error))
        return
    }
    
    let userId = await getUserIdFromToken(discordReq.access_token)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {
        token: discordReq.access_token,
        expires: discordReq.expires_in,
        refreshToken: discordReq.refresh_token
    }))
})

app.get('/checkAuth', async (req: Request, res: Response) => {
    if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let userId = await getUserIdFromToken(req.headers.authorization)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {}))
})

app.post('/refreshToken', async (req: Request, res: Response) => {
    if (req.body.refreshToken == undefined || typeof req.body.refreshToken !== 'string' || req.body.refreshToken.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid refresh token'))
        return
    }
    let dcreq = await request('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    }, new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: req.body.refreshToken,
        grant_type: 'refresh_token',
    }).toString())
    let discordReq = JSON.parse(dcreq)
    if (discordReq.error) {
        console.error("Discord request failed:", discordReq)
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, discordReq.error))
        return
    }
    
    let userId = await getUserIdFromToken(discordReq.access_token)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {
        token: discordReq.access_token,
        expires: discordReq.expires_in,
        refreshToken: discordReq.refresh_token
    }))
})

app.get('/status', async (req: Request, res: Response) => {
    if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let userId = await getUserIdFromToken(req.headers.authorization)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }

    let memoryUsage = process.memoryUsage()
    let interactions = await dbSelect('SELECT COUNT(*) as count FROM interactions')
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {
        uptime: process.uptime(),
        memoryUsage: Math.floor(memoryUsage.heapUsed / 1024 / 1024 * 100)/100,
        interactions: interactions[0].count,
        servers: client.guilds.cache.size,
        modules: 0,
        errors: 0
    }))
})

app.get('/users', async (req: Request, res: Response) => {
    if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let userId = await getUserIdFromToken(req.headers.authorization)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }
    
    let users = await dbSelect('SELECT * FROM users')
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, users))
})

app.delete('/user', async (req: Request, res: Response) => {
    if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let userId = await getUserIdFromToken(req.headers.authorization)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }
    
    if (req.body.id == undefined || typeof req.body.id !== 'string' || req.body.id.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid user ID'))
        return
    }
    let userExists = await dbSelect('SELECT * FROM users WHERE id = ?', req.body.id)
    if (userExists.length == 0) {
        res.writeHead(404, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not found'))
        return
    }
    db.run('DELETE FROM users WHERE id = ?', req.body.id)
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {
        id: req.body.id
    }))
})

app.post('/user', async (req: Request, res: Response) => {
    if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let userId = await getUserIdFromToken(req.headers.authorization)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }
    
    if (req.body.id == undefined || typeof req.body.id !== 'string' || req.body.id.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid user ID'))
        return
    }
    let userExists = await dbSelect('SELECT * FROM users WHERE id = ?', req.body.id)
    if (userExists.length > 0) {
        res.writeHead(409, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User already exists'))
        return
    }
    db.run('INSERT INTO users(id) VALUES(?)', req.body.id)
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {
        id: req.body.id
    }))
})

app.get('/botinfo', async (req: Request, res: Response) => {
    if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let userId = await getUserIdFromToken(req.headers.authorization)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }
    
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {
        id: client.user?.id,
        tag: client.user?.tag,
        avatar: client.user?.avatarURL()
    }))
})

app.get('/settings', async (req: Request, res: Response) => {
    if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let userId = await getUserIdFromToken(req.headers.authorization)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }

    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {
        backendPort: config.backendPort,
        frontendPort: config.frontendPort,
        clientId: config.clientId,
        clientSecret: "__NOT_CHANGED__",
        redirectUri: config.redirectUri,
        authLink: config.authLink,
        token: "__NOT_CHANGED__",
    }))
})

app.post('/settings', async (req: Request, res: Response) => {
    if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let userId = await getUserIdFromToken(req.headers.authorization)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }

    if (req.body.backendPort == undefined || typeof req.body.backendPort !== 'number' || req.body.backendPort.length === 0 || isNaN(req.body.backendPort) || req.body.backendPort < 1 || req.body.backendPort > 65535) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid backend port'))
        return
    }
    if (req.body.frontendPort == undefined || typeof req.body.frontendPort !== 'number' || req.body.frontendPort.length === 0 || isNaN(req.body.backendPort) || req.body.backendPort < 1 || req.body.backendPort > 65535) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid frontend port'))
        return
    }
    if (req.body.clientId == undefined || typeof req.body.clientId !== 'string' || req.body.clientId.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid client ID'))
        return
    }
    if (req.body.clientSecret == undefined || typeof req.body.clientSecret !== 'string' || req.body.clientSecret.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid client secret'))
        return
    }
    if (req.body.redirectUri == undefined || typeof req.body.redirectUri !== 'string' || req.body.redirectUri.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid redirect URI'))
        return
    }
    if (req.body.authLink == undefined || typeof req.body.authLink !== 'string' || req.body.authLink.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid auth link'))
        return
    }
    if (req.body.token == undefined || typeof req.body.token !== 'string' || req.body.token.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let newSettings = {
        backendPort: req.body.backendPort,
        frontendPort: req.body.frontendPort,
        clientId: req.body.clientId,
        clientSecret: req.body.clientSecret,
        redirectUri: req.body.redirectUri,
        authLink: req.body.authLink,
        token: req.body.token,
        version: config.version
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, newSettings))
    if (newSettings.clientSecret === "__NOT_CHANGED__") {
        newSettings.clientSecret = config.clientSecret
    }
    if (newSettings.token === "__NOT_CHANGED__") {
        newSettings.token = config.token
    }
    fs.writeFileSync('../config.json', JSON.stringify(newSettings, null, 4), 'utf-8')
    config = newSettings
})

app.post('/reload', async (req: Request, res: Response) => {
    if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let userId = await getUserIdFromToken(req.headers.authorization)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }

    config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {}))
})

app.post('/restart', async (req: Request, res: Response) => {
    if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
        res.writeHead(400, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let userId = await getUserIdFromToken(req.headers.authorization)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userId)
    if (trusted.length == 0) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'User not trusted'))
        return
    }

    await client.destroy()
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(sendResponse(true, {}))
    setTimeout(() => {
        process.exit(69)
    }, 1000)
})

client.once('ready', () => {
    console.log(`Bot logged in as ${client.user?.tag}`);
})

app.listen(config.backendPort, () => {
    console.log(`Backend running at http://localhost:${config.backendPort}`)
})
client.login(config.token)