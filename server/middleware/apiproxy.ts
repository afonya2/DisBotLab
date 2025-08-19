import http from "http"
import fs from "fs"

function request(
    url: string,
    options: http.RequestOptions,
    body?: String
): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
        let req = http.request(url, options, (res) => {
            let data = ""
            res.on("data", (chunk) => {
                data += chunk
            })
            res.on("end", () => {
                resolve({
                    statusCode: res.statusCode || 200,
                    headers: res.headers,
                    body: data,
                })
            })
            res.on("error", (err) => {
                console.log(err)
                reject(err)
            })
        })
        if (body != undefined) {
            req.write(body)
        }
        req.on("error", (err) => {
            console.log(err)
            reject(err)
        })
        req.end()
    })
}

export default defineEventHandler(async (event) => {
    const req = event.node.req
    const res = event.node.res
    if (!req.url?.startsWith("/api/")) {
        return
    }
    let config: any
    if (fs.existsSync("./config.json")) {
        config = JSON.parse(fs.readFileSync("./config.json", "utf-8"))
    } else {
        config = {
            "backendPort": 1025,
            "frontendPort": 3000
        }
    }
    const url = `http://localhost:${config.backendPort}${req.url.replace(/\/api\//, "/")}`
    const body = await new Promise<string>((resolve, reject) => {
        let body = ""
        req.on("data", (chunk) => {
            body += chunk.toString()
        })
        req.on("end", async () => {
            resolve(body)
        })
    })
    const response = await request(
        url,
        {
            method: req.method,
            headers: req.headers,
        },
        body ? body : undefined
    )
    res.writeHead(response.statusCode, response.headers)
    res.end(response.body)
})
