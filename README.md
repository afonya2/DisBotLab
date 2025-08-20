# DisBotLabs
A simple, no-code Discord bot creator

[Demo](https://dbldemo.afonyanet.hu) | [Docs](https://dbl.afonyanet.hu) | [Source Code](https://github.com/afonya2/DisBotLab)

## Requirements
- Node.js with npm installed
- An SQLite database set up [more info](https://dbl.afonyanet.hu/docs/database)

## How to set up?
- Download the repository and unpack it. (or use `git clone`)
- Open the folder in terminal
- Run `npm install` to install the dependencies
- Run `npm run build`
- Then go to the folder named backend `cd backend`
- Run `npm install` there too
- Now go back to the main folder `cd ..` and run `npm run prod`
- (Alternatively run `tsx starter.ts`)
- Do the setup process on: `http://localhost:3000/setup`

## Found a Bug?
- Report it by creating an issue.
- Pull requests are welcome!