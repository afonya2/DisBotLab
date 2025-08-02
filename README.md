# DisBotLabs
A simple, no-code Discord bot creator

[Demo](https://dbldemo.afonyanet.hu) | [Docs](https://dbl.afonyanet.hu) | [Source Code](https://github.com/afonya2/DisBotLab)

## Requirements
- Node.js with npm installed

## How to set up?
- Download the repository. (or use `git clone`)
- open the folder in terminal
- run `npm install` to install the dependencies
- run `npm run build`
- then go to the backend folder
- run `npm install` there too
- create the config file [more info](#config)
- now go back to the main folder and run `npm run prod`
- (Alternatively run `tsx starter.ts`)

## Config
name: `config.json`
```json
{
    "backendPort": 1020, //The port for the backend
    "frontendPort": 3000, //The port for the frontend (you want this to be public)
    "clientId": "", //The clientID of your Discord app
    "clientSecret": "", //The client secret of your Discord app
    "redirectUri": "http://localhost:3000/login", //The redirect URI you use, must redirect to "http(s)://yourdomain:frontendport/login"
    "authLink": "", //Generate an authlink, make sure to give it identify permission
    "token": "", //The token of your Discord bot
    "version": "0.1.0" //Do not edit; currently there is no use for this
}
```

## Found a Bug?
- Report it by creating an issue.
- Pull requests are welcome!