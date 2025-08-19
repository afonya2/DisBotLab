<script setup lang="ts">
    import Menu from '~/components/Menu.vue';
    import ContentCard from '~/components/ContentCard.vue';
    import utils from '../utils';
    import { useToast, Button, InputText, Divider } from 'primevue';

    useHead({
        title: 'DBL - Settings',
    });
    const toast = useToast()
    let dblVersion: Ref<string> = ref('Loading...');
    let updateAvailable: Ref<boolean> = ref(false);
    let settings: Ref<{ clientId: string, clientSecret: string, redirectUri: string, authLink: string, token: string, backendPort: string, frontendPort: string, userId: string }> = ref({
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        authLink: '',
        token: '',
        backendPort: '1025',
        frontendPort: '3000',
        userId: ''
    });

    async function getInfo() {
        let req = await utils.apiGet('/api/info');
        if (req.ok) {
            dblVersion.value = req.body.version;
            if (req.body.setup) {
                window.location.href = "/";
            }
        } else {
            console.error("Failed to get info:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load info, check console for more information.' });
        }
    }
    async function saveSettings() {
        let req = await utils.apiPost('/api/install', JSON.stringify(settings.value));
        if (req.ok) {
            toast.add({ severity: 'success', summary: 'Success', detail: 'Settings saved successfully. Please refresh the page in a few seconds.' });
        } else {
            console.error("Failed to save settings:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save settings: ' + req.error });
        }
    }
    onMounted(async () => {
        getInfo()
    })
</script>

<template>
    <Toast />
    <main>
        <div class="flex flex-col gap-4">
            <h1 class="text-4xl">Welcome to DisBotLab!</h1>
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
                <div class="flex flex-wrap items-center">
                    <p class="text-lg">Owner userID:</p>
                    <InputText class="ml-auto max-w-full w-96" type="number" placeholder="Owner userID" v-model="settings.userId" />
                </div>
                <Divider />
                <div class="ml-auto w-fit">
                    <Button @click="saveSettings()"><i class="pi pi-save"></i>Install</Button>
                </div>
            </ContentCard>
        </div>
    </main>
</template>

<style scoped>
main {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
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