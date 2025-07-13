<script setup lang="ts">
    import Menu from '~/components/Menu.vue';
    import ContentCard from '~/components/ContentCard.vue';
    import utils from '../utils';
    import { useToast, Button, InputText, Divider } from 'primevue';

    useHead({
        title: 'DBL - Settings',
    });
    const toast = useToast()
    let botinfo: Ref<{ id: string, tag: string, avatar: string }> = ref({ id: '', tag: '', avatar: '' });
    let dblVersion: Ref<string> = ref('Loading...');
    let updateAvailable: Ref<boolean> = ref(false);
    let settings: Ref<{ clientId: string, clientSecret: string, redirectUri: string, authLink: string, token: string, backendPort: string, frontendPort: string }> = ref({
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        authLink: '',
        token: '',
        backendPort: '',
        frontendPort: ''
    });

    async function getbotinfo() {
        let req = await utils.apiGet('/api/botinfo');
        if (req.ok) {
            botinfo.value = {
                id: req.body.id,
                tag: req.body.tag,
                avatar: req.body.avatar
            };
        } else {
            console.error("Failed to get bot info:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load bot info, check console for more information.' });
        }
    }
    async function getInfo() {
        let req = await utils.apiGet('/api/info');
        if (req.ok) {
            dblVersion.value = req.body.version;
        } else {
            console.error("Failed to get info:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load info, check console for more information.' });
        }
    }
    async function getSettings() {
        let req = await utils.apiGet('/api/settings');
        if (req.ok) {
            settings.value = req.body;
        } else {
            console.error("Failed to get settings:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load settings, check console for more information.' });
        }
    }
    async function saveSettings() {
        let req = await utils.apiPost('/api/settings', JSON.stringify(settings.value));
        if (req.ok) {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Settings saved successfully.' });
        } else {
            console.error("Failed to save settings:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save settings: ' + req.error });
        }
    }
    async function reloadConfig() {
        let req = await utils.apiPost('/api/reload', JSON.stringify({}));
        if (req.ok) {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Configuration reloaded successfully.' });
            getSettings();
        } else {
            console.error("Failed to reload config:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to reload configuration: ' + req.error });
        }
    }
    async function restart() {
        let req = await utils.apiPost('/api/restart', JSON.stringify({}));
        if (req.ok) {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Bot restarted successfully.' });
        } else {
            console.error("Failed to restart bot:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to restart bot: ' + req.error });
        }
    }
    onMounted(async () => {
        if (!await utils.checkAuth()) {
            window.location.href = "/login";
        }
        getbotinfo()
        getInfo()
        getSettings()
    })
</script>

<template>
    <Toast />
    <Menu />
    <main>
        <div class="flex flex-col gap-4">
            <h1 class="text-4xl">Settings</h1>
            <ContentCard class="flex flex-wrap gap-4 items-center">
                <img :src="botinfo.avatar" :alt="botinfo.tag" style="width: 128px;border-radius: 50%;">
                <div class="flex flex-col gap-2">
                    <h2 class="text-2xl">{{ botinfo.tag }}</h2>
                    <p class="text-gray-500">{{ botinfo.id }}</p>
                    <div class="flex items-center gap-2 online-online">
                        <div></div>
                        <p>Online</p>
                    </div>
                </div>
            </ContentCard>

            <ContentCard class="flex flex-col gap-2" v-if="!updateAvailable">
                <h2 class="text-2xl">DisBotLab</h2>
                <div class="flex items-center gap-2 online-online">
                    <p>Up to date! <span class="text-white">({{ dblVersion }})</span></p>
                </div>
                <p>Copyright (c) Afonya 2025</p>
            </ContentCard>

            <ContentCard class="flex flex-col gap-2" v-if="updateAvailable">
                <h2 class="text-2xl">DisBotLab</h2>
                <div class="flex items-center gap-2 online-far">
                    <p>Update required! <span class="text-white">({{ dblVersion }})</span></p>
                </div>
                <p>Copyright (c) Afonya 2025</p>
                <Button class="w-fit">Update now!</Button>
            </ContentCard>

            <ContentCard class="flex flex-col gap-2">
                <h2 class="text-2xl">System</h2>
                <div class="flex items-center gap-2">
                    <Button class="w-fit" severity="danger" @click="restart()"><i class="pi pi-refresh"></i>Restart</Button>
                    <Button class="w-fit" severity="warn" @click="reloadConfig()"><i class="pi pi-refresh"></i>Reload config</Button>
                </div>
            </ContentCard>

            <ContentCard class="flex flex-col gap-2">
                <h2 class="text-2xl mb-4">Settings</h2>
                <div class="flex flex-wrap items-center">
                    <p class="text-lg">Client ID:</p>
                    <InputText class="ml-auto max-w-full w-96" type="text" placeholder="Client ID" v-model="settings.clientId" />
                </div>
                <Divider />
                <div class="flex flex-wrap items-center">
                    <p class="text-lg">Client Secret:</p>
                    <InputText class="ml-auto max-w-full w-96" type="password" placeholder="Client Secret" v-model="settings.clientSecret" />
                </div>
                <Divider />
                <div class="flex flex-wrap items-center">
                    <p class="text-lg">Redirect URI:</p>
                    <InputText class="ml-auto max-w-full w-96" type="text" placeholder="Redirect URI" v-model="settings.redirectUri" />
                </div>
                <Divider />
                <div class="flex flex-wrap items-center">
                    <p class="text-lg">Auth Link:</p>
                    <InputText class="ml-auto max-w-full w-96" type="text" placeholder="Auth Link" v-model="settings.authLink" />
                </div>
                <Divider />
                <div class="flex flex-wrap items-center">
                    <p class="text-lg">Token:</p>
                    <InputText class="ml-auto max-w-full w-96" type="password" placeholder="Token" v-model="settings.token" />
                </div>
                <Divider />
                <div class="flex flex-wrap items-center">
                    <p class="text-lg">Backend port:</p>
                    <InputText class="ml-auto max-w-full w-96" type="number" placeholder="Backend port" v-model="settings.backendPort" />
                </div>
                <Divider />
                <div class="flex flex-wrap items-center">
                    <p class="text-lg">Frontend port:</p>
                    <InputText class="ml-auto max-w-full w-96" type="number" placeholder="Frontend port" v-model="settings.frontendPort" />
                </div>
                <Divider />
                <div class="ml-auto w-fit">
                    <Button severity="warn" @click="getSettings()"><i class="pi pi-undo"></i>Cancel changes</Button>
                    <Button class="ml-2" @click="saveSettings()"><i class="pi pi-save"></i>Save</Button>
                </div>
            </ContentCard>
        </div>
    </main>
</template>

<style scoped>
main {
    position: absolute;
    top: 0;
    left: 250px;
    width: calc(100% - 250px);
    height: 100%;
    padding: 20px;
    overflow: auto;
}
a {
    color: rgb(50, 100, 200);
    text-decoration: underline;
}
.online-online {
    color: var(--p-green-500);
}
.online-online > div {
    background-color: var(--p-green-500);
    width: 10px;
    height: 10px;
    border-radius: 50%;
}
.online-far {
    color: var(--p-orange-500);
}
.online-far > div {
    background-color: var(--p-orange-500);
    width: 10px;
    height: 10px;
    border-radius: 50%;
}
.online-dnd {
    color: var(--p-red-500);
}
.online-dnd > div {
    background-color: var(--p-red-500);
    width: 10px;
    height: 10px;
    border-radius: 50%;
}
.online-offline {
    color: var(--p-gray-500);
}
.online-offline > div {
    background-color: var(--p-gray-500);
    width: 10px;
    height: 10px;
    border-radius: 50%;
}
</style>