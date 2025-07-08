import fs from 'fs'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'))
    const discordReq: any = await $fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: config.clientId,
			client_secret: config.clientSecret,
			code: body.code,
			grant_type: 'authorization_code',
			redirect_uri: config.redirectUri,
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    return {
        token: discordReq.access_token,
        expires: discordReq.expires_in,
        refreshToken: discordReq.refresh_token
    }
})