function generateRandomString(length: number): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

async function getToken(): Promise<string> {
    const token = localStorage.getItem("token");
    const expires = localStorage.getItem("expires");
    const refreshToken = localStorage.getItem("refreshToken");
    if (Number(expires) < Date.now()) {
        let req = await fetch("/api/refreshToken", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refreshToken: refreshToken,
            }),
        });
        let res = await req.json();
        if (!res.ok) {
            console.error("Token refresh failed:", res.error);
            return ""
        }
        localStorage.setItem("token", res.body.token);
        localStorage.setItem("expires", (Number(res.body.expires) * 1000 + Date.now()).toString());
        localStorage.setItem("refreshToken", res.body.refreshToken);
        return res.body.token;
    } else {
        return token || "";
    }
}

async function checkAuth(): Promise<boolean> {
    const token = await getToken();
    if (!token) {
        console.error("No valid token found");
        return false;
    }
    let req = await fetch("/api/checkAuth", {
        method: "GET",
        headers: {
            "Authorization": token,
        },
    });
    let res = await req.json();
    if (!res.ok) {
        console.error("Authentication check:", res);
        return false;
    } else {
        return true;
    }
}

async function apiGet(url: string, headers = {}): Promise<{ok: boolean, body: any, error?: string}> {
    const token = await getToken();
    headers = {
        ...headers,
        "Authorization": token || "",
    };
    let req = await fetch(url, {
        method: "GET",
        headers: headers,
    });
    let res = await req.json();
    if (!res.ok) {
        console.error("API GET request failed:", res.error);
        return { ok: false, body: res, error: res.error };
    }
    return { ok: true, body: res.body };
}

async function apiPost(url: string, data: string, method = "POST", headers = {}): Promise<{ok: boolean, body: any, error?: string}> {
    const token = await getToken();
    if (!token) {
        console.error("No valid token found for API request");
        return { ok: false, body: {}, error: "No valid token" };
    }
    headers = {
        ...headers,
        "Authorization": token,
        "Content-Type": "application/json",
    };
    let req = await fetch(url, {
        method: method,
        headers: headers,
        body: data
    });
    let res = await req.json();
    if (!res.ok) {
        console.error(`API ${method} request failed:`, res.error);
        return { ok: false, body: res, error: res.error };
    }
    return { ok: true, body: res.body };
}

function copy(obj: any, deep = false): any {
    let out: any = Array.isArray(obj) ? [] : {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (deep && typeof obj[key] === 'object' && obj[key] !== null) {
                out[key] = copy(obj[key], true);
            } else {
                out[key] = obj[key];
            }
        }
    }
    return out;
}

export default {
    generateRandomString,
    getToken,
    checkAuth,
    apiGet,
    apiPost,
    copy
}