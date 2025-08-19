import express, { type Application, type Request, type Response } from "express"
import { sendResponse, request, getUserIdFromToken, dbSelect, asyncDb, getCommands, type Command, reloadCommands } from "./utils"
import type { Database } from "sqlite3"
import type { Client } from "discord.js"
import fs from "fs"

export default function (app: Application, db: Database, config: any, client: Client, getVar: (name: string) => any, setVar: (name: string, value: any) => void) {
    app.get('/info', (req: Request, res: Response) => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {
            version: `DisBotLab v${getVar("version")}`,
            authLink: config.authLink,
            setup: getVar("setup")
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        let memoryUsage = process.memoryUsage()
        let interactions = await dbSelect(db, 'SELECT COUNT(*) as count FROM interactions')
        let modules = await dbSelect(db, 'SELECT COUNT(*) as count FROM modules')
        let errors = await dbSelect(db, 'SELECT COUNT(*) as count FROM interactions WHERE success = 0')
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {
            uptime: process.uptime(),
            memoryUsage: Math.floor(memoryUsage.heapUsed / 1024 / 1024 * 100)/100,
            interactions: interactions[0].count,
            servers: client.guilds.cache.size,
            modules: modules[0].count,
            errors: errors[0].count,
        }))
    })

    app.get('/users', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }
        
        let users = await dbSelect(db, 'SELECT * FROM users')
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
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
        let userExists = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', req.body.id)
        if (userExists.length == 0) {
            res.writeHead(404, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not found'))
            return
        }
        await asyncDb(db, 'DELETE FROM users WHERE id = ?', req.body.id)
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
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
        let userExists = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', req.body.id)
        if (userExists.length > 0) {
            res.writeHead(409, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User already exists'))
            return
        }
        await asyncDb(db, 'INSERT INTO users(id) VALUES(?)', req.body.id)
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        if (req.body.backendPort == undefined || (typeof req.body.backendPort !== 'number' && typeof req.body.backendPort !== 'string') || isNaN(Number(req.body.backendPort)) || Number(req.body.backendPort) < 1 || Number(req.body.backendPort) > 65535) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid backend port'))
            return
        }
        if (req.body.frontendPort == undefined || (typeof req.body.frontendPort !== 'number' && typeof req.body.frontendPort !== 'string') || isNaN(Number(req.body.frontendPort)) || Number(req.body.frontendPort) < 1 || Number(req.body.frontendPort) > 65535) {
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
            backendPort: Number(req.body.backendPort),
            frontendPort: Number(req.body.frontendPort),
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
        if (newSettings.backendPort != config.backendPort || newSettings.frontendPort != config.frontendPort) {
            setTimeout(() => {
                process.exit(69)
            }, 1000)
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
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
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
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

    app.post('/reloadCommands', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        setVar("commands", await getCommands(db))
        await reloadCommands(client, getVar("commands"))
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {}))
    })

    app.get('/modules', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        let modules = await dbSelect(db, 'SELECT * FROM modules')
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, modules))
    })

    app.post('/module', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        if (req.body.name == undefined || typeof req.body.name !== 'string' || req.body.name.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module name'))
            return
        }
        if (req.body.description == undefined || typeof req.body.description !== 'string' || req.body.description.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module description'))
            return
        }
        await asyncDb(db, 'INSERT INTO modules(name, description, enabled) VALUES(?, ?, ?)', req.body.name, req.body.description, 1)
        let newId = await dbSelect(db, 'SELECT MAX(id) FROM modules WHERE name = ? AND description = ?', req.body.name, req.body.description)
        if (newId.length === 0) {
            res.writeHead(500, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Failed to create module'))
            return
        }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {
            name: req.body.name,
            description: req.body.description,
            enabled: true,
            id: newId[0]['MAX(id)']
        }))
    })

    app.get('/module/:id', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        if (req.params.id == undefined || typeof req.params.id !== 'string' || req.params.id.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module ID'))
            return
        }
        let moduleExists = await dbSelect(db, 'SELECT * FROM modules WHERE id = ?', req.params.id)
        if (moduleExists.length == 0) {
            res.writeHead(404, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Module not found'))
            return
        }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {
            id: req.params.id,
            name: moduleExists[0].name,
            description: moduleExists[0].description,
            enabled: moduleExists[0].enabled
        }))
    })

    app.patch('/module/:id', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        if (req.body.name == undefined || typeof req.body.name !== 'string' || req.body.name.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module name'))
            return
        }
        if (req.body.description == undefined || typeof req.body.description !== 'string' || req.body.description.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module description'))
            return
        }
        if (req.body.enabled == undefined || typeof req.body.enabled !== 'boolean') {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module enabled status'))
            return
        }
        if (req.params.id == undefined || typeof req.params.id !== 'string' || req.params.id.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module ID'))
            return
        }
        let moduleExists = await dbSelect(db, 'SELECT * FROM modules WHERE id = ?', req.params.id)
        if (moduleExists.length == 0) {
            res.writeHead(404, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Module not found'))
            return
        }
        await asyncDb(db, 'UPDATE modules SET name = ?, description = ?, enabled = ? WHERE id = ?', req.body.name, req.body.description, req.body.enabled, req.params.id)
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {
            id: req.params.id,
            name: req.body.name,
            description: req.body.description,
            enabled: moduleExists[0].enabled
        }))
    })

    app.delete('/module/:id', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        if (req.params.id == undefined || typeof req.params.id !== 'string' || req.params.id.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module ID'))
            return
        }
        let moduleExists = await dbSelect(db, 'SELECT * FROM modules WHERE id = ?', req.params.id)
        if (moduleExists.length == 0) {
            res.writeHead(404, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Module not found'))
            return
        }
        await asyncDb(db, 'DELETE FROM modules WHERE id = ?', req.params.id)
        await asyncDb(db, 'DELETE FROM nodes WHERE module = ?', req.params.id)
        await asyncDb(db, 'DELETE FROM edges WHERE module = ?', req.params.id)
        await asyncDb(db, 'DELETE FROM moduleVariables WHERE module = ?', req.params.id)
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {
            id: req.params.id,
            name: moduleExists[0].name,
            description: moduleExists[0].description,
            enabled: moduleExists[0].enabled
        }))
    })

    app.post('/module/:id/save', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        if (req.params.id == undefined || typeof req.params.id !== 'string' || req.params.id.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module ID'))
            return
        }
        if (req.body.nodes == undefined || !Array.isArray(req.body.nodes)) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid nodes'))
            return
        }
        if (req.body.edges == undefined || !Array.isArray(req.body.edges)) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid edges'))
            return
        }
        let moduleExists = await dbSelect(db, 'SELECT * FROM modules WHERE id = ?', req.params.id)
        if (moduleExists.length == 0) {
            res.writeHead(404, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Module not found'))
            return
        }
        await asyncDb(db, 'DELETE FROM nodes WHERE module = ?', req.params.id)
        await asyncDb(db, 'DELETE FROM edges WHERE module = ?', req.params.id)
        for (let i = 0; i < req.body.nodes.length; i++) {
            const node = req.body.nodes[i];
            await asyncDb(db, 'INSERT INTO nodes (module, id, type, x, y, data) VALUES (?, ?, ?, ?, ?, ?)', req.params.id, node.id, node.type, node.x, node.y, JSON.stringify(node.data))
        }
        for (let i = 0; i < req.body.edges.length; i++) {
            const edge = req.body.edges[i];
            await asyncDb(db, 'INSERT INTO edges (module, id, "from", "to") VALUES (?, ?, ?, ?)', req.params.id, edge.id, edge.from, edge.to)
        }
        let newCommands = await getCommands(db)
        let changed = false
        for (let i in newCommands) {
            const command = newCommands[i];
            if (getVar("commands")[command.name] === undefined) {
                changed = true
                break
            } else if (getVar("commands")[command.name].name !== command.name || getVar("commands")[command.name].description !== command.description || getVar("commands")[command.name].module !== command.module || getVar("commands")[command.name].nodeId !== command.nodeId) {
                changed = true
                break
            }
        }
        if (!changed) {
            for (let i in getVar("commands")) {
                const command = getVar("commands")[i];
                if (newCommands[command.name] === undefined) {
                    changed = true
                    break
                } else if (newCommands[command.name].name !== command.name || newCommands[command.name].description !== command.description || getVar("commands")[command.name].module !== command.module || getVar("commands")[command.name].nodeId !== command.nodeId) {
                    changed = true
                    break
                }
            }
        }
        if (changed) {
            setVar("commands", newCommands)
            console.warn("Commands have been changed, reloading commands...")
            setTimeout(() => {
                reloadCommands(client, getVar("commands"))
            }, 5000)
        }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {}))
    })

    app.get('/module/:id/load', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        if (req.params.id == undefined || typeof req.params.id !== 'string' || req.params.id.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module ID'))
            return
        }
        let moduleExists = await dbSelect(db, 'SELECT * FROM modules WHERE id = ?', req.params.id)
        if (moduleExists.length == 0) {
            res.writeHead(404, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Module not found'))
            return
        }
        let nodes = await dbSelect(db, 'SELECT * FROM nodes WHERE module = ?', req.params.id)
        nodes = nodes.map((node) => ({
            id: node.id,
            x: node.x,
            y: node.y,
            type: node.type,
            data: JSON.parse(node.data || '{}')
        }))
        let edges = await dbSelect(db, 'SELECT * FROM edges WHERE module = ?', req.params.id)
        edges = edges.map((edge) => ({
            id: edge.id,
            from: edge.from,
            to: edge.to
        }))
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, { nodes, edges }))
    })

    app.get('/module/:id/export', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        if (req.params.id == undefined || typeof req.params.id !== 'string' || req.params.id.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module ID'))
            return
        }
        let moduleExists = await dbSelect(db, 'SELECT * FROM modules WHERE id = ?', req.params.id)
        if (moduleExists.length == 0) {
            res.writeHead(404, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Module not found'))
            return
        }
        let nodes = await dbSelect(db, 'SELECT * FROM nodes WHERE module = ?', req.params.id)
        nodes = nodes.map((node) => ({
            id: node.id,
            x: node.x,
            y: node.y,
            type: node.type,
            data: JSON.parse(node.data || '{}')
        }))
        let edges = await dbSelect(db, 'SELECT * FROM edges WHERE module = ?', req.params.id)
        edges = edges.map((edge) => ({
            id: edge.id,
            from: edge.from,
            to: edge.to
        }))
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {
            version: "0.2.0",
            type: "DBL_MODULE",
            name: moduleExists[0].name,
            description: moduleExists[0].description,
            nodes,
            edges
        }))
    })

    app.post('/modules/import', async (req: Request, res: Response) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        if (req.body.type == undefined || typeof req.body.type !== 'string' || req.body.type !== 'DBL_MODULE') {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module type'))
            return
        }
        if (req.body.version == undefined || typeof req.body.version !== 'string' || req.body.version !== config.version) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module version'))
            return
        }
        if (req.body.name == undefined || typeof req.body.name !== 'string' || req.body.name.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module name'))
            return
        }
        if (req.body.description == undefined || typeof req.body.description !== 'string' || req.body.description.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid module description'))
            return
        }
        if (req.body.nodes == undefined || !Array.isArray(req.body.nodes)) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid nodes'))
            return
        }
        if (req.body.edges == undefined || !Array.isArray(req.body.edges)) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid edges'))
            return
        }
        await asyncDb(db, 'INSERT INTO modules(name, description, enabled) VALUES(?, ?, ?)', req.body.name, req.body.description, 1)
        let newId = await dbSelect(db, 'SELECT MAX(id) FROM modules WHERE name = ? AND description = ?', req.body.name, req.body.description)
        if (newId.length === 0) {
            res.writeHead(500, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Failed to create module'))
            return
        }
        for (let i = 0; i < req.body.nodes.length; i++) {
            const node = req.body.nodes[i];
            await asyncDb(db, 'INSERT INTO nodes (module, id, type, x, y, data) VALUES (?, ?, ?, ?, ?, ?)', newId[0]['MAX(id)'], node.id, node.type, node.x, node.y, JSON.stringify(node.data))
        }
        for (let i = 0; i < req.body.edges.length; i++) {
            const edge = req.body.edges[i];
            await asyncDb(db, 'INSERT INTO edges (module, id, "from", "to") VALUES (?, ?, ?, ?)', newId[0]['MAX(id)'], edge.id, edge.from, edge.to)
        }
        let newCommands = await getCommands(db)
        let changed = false
        for (let i in newCommands) {
            const command = newCommands[i];
            if (getVar("commands")[command.name] === undefined) {
                changed = true
                break
            } else if (getVar("commands")[command.name].name !== command.name || getVar("commands")[command.name].description !== command.description || getVar("commands")[command.name].module !== command.module || getVar("commands")[command.name].nodeId !== command.nodeId) {
                changed = true
                break
            }
        }
        if (!changed) {
            for (let i in getVar("commands")) {
                const command = getVar("commands")[i];
                if (newCommands[command.name] === undefined) {
                    changed = true
                    break
                } else if (newCommands[command.name].name !== command.name || newCommands[command.name].description !== command.description || getVar("commands")[command.name].module !== command.module || getVar("commands")[command.name].nodeId !== command.nodeId) {
                    changed = true
                    break
                }
            }
        }
        if (changed) {
            setVar("commands", newCommands)
            console.warn("Commands have been changed, reloading commands...")
            setTimeout(() => {
                reloadCommands(client, getVar("commands"))
            }, 5000)
        }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {
            name: req.body.name,
            description: req.body.description,
            enabled: true,
            id: newId[0]['MAX(id)']
        }))
    })

    app.get('/logs', async (req, res) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        const logs = await dbSelect(db, 'SELECT * FROM logs ORDER BY date DESC LIMIT 100')
        const logsOut = logs.map(log => ({
            date: log.date,
            type: log.type,
            message: log.message
        }))
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, logsOut))
    })

    app.delete('/logs', async (req, res) => {
        if (req.headers.authorization == undefined || typeof req.headers.authorization !== 'string' || req.headers.authorization.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid token'))
            return
        }
        let userId = await getUserIdFromToken(req.headers.authorization)
        let trusted = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', userId)
        if (trusted.length == 0) {
            res.writeHead(403, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User not trusted'))
            return
        }

        await asyncDb(db, 'DELETE FROM logs')
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, {}))
    })

    app.post('/install', async (req, res) => {
        if (getVar("setup")) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Setup already completed'))
            return
        }

        if (req.body.backendPort == undefined || (typeof req.body.backendPort !== 'number' && typeof req.body.backendPort !== 'string') || isNaN(Number(req.body.backendPort)) || Number(req.body.backendPort) < 1 || Number(req.body.backendPort) > 65535) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid backend port'))
            return
        }
        if (req.body.frontendPort == undefined || (typeof req.body.frontendPort !== 'number' && typeof req.body.frontendPort !== 'string') || isNaN(Number(req.body.frontendPort)) || Number(req.body.frontendPort) < 1 || Number(req.body.frontendPort) > 65535) {
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
        if (req.body.userId == undefined || typeof req.body.userId !== 'string' || req.body.userId.length === 0) {
            res.writeHead(400, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'Invalid user ID'))
            return
        }
        let newSettings = {
            backendPort: Number(req.body.backendPort),
            frontendPort: Number(req.body.frontendPort),
            clientId: req.body.clientId,
            clientSecret: req.body.clientSecret,
            redirectUri: req.body.redirectUri,
            authLink: req.body.authLink,
            token: req.body.token,
            version: getVar("cfg_version")
        }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(sendResponse(true, newSettings))
        fs.writeFileSync('../config.json', JSON.stringify(newSettings, null, 4), 'utf-8')
        config = newSettings
        await asyncDb(db, `CREATE TABLE \`users\` (\`id\` VARCHAR(64) not null, primary key (\`id\`))`)
        await asyncDb(db, `CREATE TABLE
            \`modules\` (
                \`id\` integer not null primary key autoincrement,
                \`name\` VARCHAR(255) not null,
                \`description\` varchar(255) not null,
                \`enabled\` BOOLEAN not null,
                unique (\`id\`)
            )`)
        await asyncDb(db, `CREATE TABLE
            \`nodes\` (
                \`dbId\` integer not null primary key autoincrement,
                \`module\` INT not null,
                \`id\` INT not null,
                \`type\` VARCHAR(255) not null,
                \`x\` INT not null,
                \`y\` INT not null,
                \`data\` VARCHAR(255) not null,
                unique (\`dbId\`)
            )`)
        await asyncDb(db, `CREATE TABLE
            \`edges\` (
                \`dbId\` integer not null primary key autoincrement,
                \`module\` INT not null,
                \`id\` varchar(255) not null,
                \`from\` int not null,
                \`to\` int not null,
                unique (\`dbId\`)
            )`)
        await asyncDb(db, `CREATE TABLE
            \`moduleVariables\` (
                \`id\` integer not null primary key autoincrement,
                \`module\` INT not null,
                \`name\` varchar(255) not null,
                \`value\` varchar(255) not null,
                unique (\`id\`)
            )`)
        await asyncDb(db, `CREATE TABLE
            \`interactions\` (
                \`id\` VARCHAR(64) not null,
                \`date\` datetime not null default CURRENT_TIMESTAMP,
                \`success\` BOOLEAN not null,
                \`error\` VARCHAR(255) null,
                \`userId\` varchar(64) not null,
                primary key (\`id\`)
            )`)
        await asyncDb(db, `CREATE TABLE
            \`logs\` (
                \`id\` integer not null primary key autoincrement,
                \`date\` DATETIME not null,
                \`type\` varchar(255) not null,
                \`message\` varchar(1024) not null,
                unique (\`id\`)
            )`)
        let userExists = await dbSelect(db, 'SELECT * FROM users WHERE id = ?', req.body.userId)
        if (userExists.length > 0) {
            res.writeHead(409, { 'content-type': 'application/json' })
            res.end(sendResponse(false, {}, 'User already exists'))
            return
        }
        await asyncDb(db, 'INSERT INTO users(id) VALUES(?)', req.body.userId)
        setTimeout(() => {
            process.exit(69)
        }, 1000)
    })
}