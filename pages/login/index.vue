<script setup lang="ts">
    import utils from '../utils';
    import { ref } from 'vue';

    useHead({
        title: 'DBL - Login',
    })
    let mode = ref("")
    let atext = ref("Waiting for authentication...")
    let ptext = ref("Processing authentication...")

    async function beginAuth(backup: boolean) {
        const state = utils.generateRandomString(32)
        localStorage.setItem("backup", backup ? "true" : "false");
        localStorage.setItem("state", state);
        let authReq = await utils.apiGet('/api/info');
        if (!authReq.ok) {
            console.error("Failed to get auth link:", authReq.error);
            atext.value = "Failed to get authentication link. Please try again later.";
            return;
        }
        let authLink = authReq.body.authLink;
        if (backup) {
            window.location.href = authLink + "&state=" + encodeURIComponent(state);
        } else {
            let win = window.open(authLink + "&state=" + encodeURIComponent(state), "_blank", "width=700,height=1000");
            setInterval(() => {
                if (win?.closed) {
                    if (localStorage.getItem("token")) {
                        window.location.href = "/";
                    } else {
                        atext.value = "Authentication window closed before completing the process. Please try again.";
                    }
                }
            }, 1000);
        }
    }
    async function processAuth() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = decodeURIComponent(urlParams.get('code') || '');
        const state = decodeURIComponent(urlParams.get('state') || '');
        const storedState = localStorage.getItem("state");
        const backup = localStorage.getItem("backup") === "true";
        if (state !== storedState) {
            ptext.value = "Failed to verify the authentication request. Please try again.";
            return
        }
        if (!code) {
            ptext.value = "No authentication code provided. Please try again.";
            return
        }
        let req: any = await fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({
                code: code
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        let res = await req.json();
        if (!res.ok) {
            console.error("Authentication failed:", res.error);
            if (res.error == 'User not trusted') {
                ptext.value = "You are not trusted to use this application.";
            } else {
                ptext.value = "Failed to authenticate. Please try again.";
            }
            return
        }
        localStorage.setItem("token", res.body.token);
        localStorage.setItem("expires", (Number(res.body.expires)*1000+Date.now()).toString());
        localStorage.setItem("refreshToken", res.body.refreshToken);
        localStorage.removeItem("state");
        localStorage.removeItem("backup");
        ptext.value = "Authentication successful!";
        if (backup) {
            window.location.href = "/";
        } else {
            window.close();
        }
    }
    function checkMode() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('code')) {
            mode.value = "process";
            processAuth()
        } else {
            mode.value = "auth";
            beginAuth(false)
        }
    }
    async function signout() {
        localStorage.removeItem("token");
        localStorage.removeItem("expires");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("state");
        localStorage.removeItem("backup");
        window.location.href = "";
    }
    onMounted(async () => {
        if (!await utils.checkSetup()) {
            window.location.href = "/setup";
        }
        if (await utils.checkAuth()) {
            window.location.href = "/";
        }
        checkMode()
    })
</script>

<template>
    <div class="bg">
        <main>
            <img src="/logo.svg" alt="logo" class="block mx-auto" />
            <div class="card">
                <h1 class="text-4xl text-center">Log in</h1>
                <ClientOnly>
                    <p class="text-xl text-center" v-if="mode == 'auth'">{{ atext }}</p>
                    <p class="text-center" v-if="mode == 'auth'">If the window didn't open <a href="#" @click="beginAuth(true)">click me!</a></p>
                    <p class="text-xl text-center" v-if="mode == 'process'">{{ ptext }}</p>
                    <p class="text-center">Wrong account? <a href="#" @click="signout()">Sign out!</a></p>
                </ClientOnly>
            </div>
        </main>
    </div>
</template>

<style scoped>
.bg {
    background-image: url('/login-background.jpg');
    background-size: cover;
    background-position: center;
    height: 100vh;
    width: 100vw;
}
main {
    width: 100%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, .7);
    backdrop-filter: blur(10px) saturate(150%);
    padding: 20px;
}
.card {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
img {
    width: 400px;
}
a {
    color: rgb(50, 100, 200);
    text-decoration: underline;
}
@media (width >= 48rem) {
    main {
        margin-left: 25px;
        border-radius: 10px;
        width: 400px;
    }
}
</style>