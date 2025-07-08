import express, { type Request, type Response } from 'express'
const app = express()
const config = require('../config.json')

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})

app.listen(config.backendPort, () => {
    console.log(`Example app listening on port ${config.backendPort}`)
})