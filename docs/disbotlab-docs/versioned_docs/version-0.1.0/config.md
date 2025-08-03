---
sidebar_position: 3
description: Configuration
---

# Configuration

## Main config file (`config.json`)
|key|description|default value|
|---|---|---|
|`backendPort`|The port for the backend|`1020`|
|`frontendPort`|The port for the frontend (currently doesn't change anything)|`3000`|
|`clientId`|The clientID of your Discord app||
|`clientSecret`|The client secret of your Discord app||
|`redirectUri`|The redirect URI you use, must redirect to "http(s)://yourdomain:frontendport/login"|`"http://localhost:3000/login"`|
|`authLink`|Generate an authlink, make sure to give it identify permission||
|`token`|The token of your Discord bot||
|`version`|Do not edit; currently there is no use for this, make sure it is in the config.|`"0.1.0"`|

### Example file:
```json title="config.json"
{
    "backendPort": 1020,
    "frontendPort": 3000,
    "clientId": "",
    "clientSecret": "",
    "redirectUri": "http://localhost:3000/login",
    "authLink": "",
    "token": "",
    "version": "0.1.0"
}
```