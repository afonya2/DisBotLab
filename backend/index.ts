import express, { type Request, type Response } from 'express'
import fs from 'fs'
import sqlite from 'sqlite3'
import https from 'https'

const app = express()
const config = JSON.parse(fs.readFileSync('../config.json', 'utf-8'))
const db = new sqlite.Database('./database.db')

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

app.use(express.json())

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
    
    let userReq = await request('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${discordReq.access_token}`
        }
    })
    let userReqP = JSON.parse(userReq)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userReqP.id)
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
    let userReq = await request('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${req.headers.authorization}`
        }
    })
    let userReqP = JSON.parse(userReq)
    if (userReqP.id == undefined) {
        res.writeHead(403, { 'content-type': 'application/json' })
        res.end(sendResponse(false, {}, 'Invalid token'))
        return
    }
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userReqP.id)
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
    
    let userReq = await request('https://discord.com/api/users/@me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${discordReq.access_token}`
        }
    })
    let userReqP = JSON.parse(userReq)
    let trusted = await dbSelect('SELECT * FROM users WHERE id = ?', userReqP.id)
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

app.listen(config.backendPort, () => {
    console.log(`Backend running at http://localhost:${config.backendPort}`)
})