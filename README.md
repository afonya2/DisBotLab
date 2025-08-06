# DisBotLabs
A simple, no-code Discord bot creator

[Demo](https://dbldemo.afonyanet.hu) | [Docs](https://dbl.afonyanet.hu) | [Source Code](https://github.com/afonya2/DisBotLab)

## Requirements
- Node.js with npm installed
- An SQLite database set up [more info](https://dbl.afonyanet.hu/docs/database)

## How to set up?
- Download the repository. (or use `git clone`)
- open the folder in terminal
- run `npm install` to install the dependencies
- run `npm run build`
- then go to the backend folder
- run `npm install` there too
- Create the database in `backend/database.db` [based on this](https://dbl.afonyanet.hu/docs/database)
- create the config file [more info](https://dbl.afonyanet.hu/docs/config)
- now go back to the main folder and run `npm run prod`
- (Alternatively run `tsx starter.ts`)
- Access it on: `http://localhost:3000`

## Found a Bug?
- Report it by creating an issue.
- Pull requests are welcome!