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
        localStorage.setItem("expires", (Number(res.body.expires) + Date.now()).toString());
        localStorage.setItem("refreshToken", res.body.refreshToken);
        return res.body.token;
    } else {
        return token || "";
    }
}

export default {
    generateRandomString,
    getToken
}