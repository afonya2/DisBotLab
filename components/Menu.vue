<script setup lang="ts">
    import { Menu, Divider } from 'primevue';
    import type { MenuItem } from 'primevue/menuitem';
    import { ref } from 'vue';
    import 'primeicons/primeicons.css'
    import utils from '../pages/utils';
    
    const menuItems = ref<MenuItem[]>([
        {
            label: 'Dashboard',
            items: [
                { label: 'Home', icon: 'pi pi-home', url: '/' },
                { label: 'Modules', icon: 'pi pi-file', url: '/modules' },
                { label: 'Databases', icon: 'pi pi-database', url: '/databases' }
            ]
        },
        {
            label: 'Administration',
            items: [
                { label: 'Users', icon: 'pi pi-users', url: '/users' },
                { label: 'Logs', icon: 'pi pi-list', url: '/logs' },
                { label: 'Settings And Status', icon: 'pi pi-server', url: '/settings' }
            ]
        },
        {
            label: 'DBL',
            items: [
                { label: 'Github', icon: 'pi pi-github', url: 'https://github.com/afonya2/DisBotLab', target: '_blank' },
                { label: 'Issues', icon: 'pi pi-exclamation-triangle', url: 'https://github.com/afonya2/DisBotLab/issues', target: '_blank' }
            ]
        },
        {
            label: 'User',
            items: [
                { label: 'Loading...', icon: 'pi pi-user' },
                { label: 'Sign out', icon: 'pi pi-sign-out', command: () => logout() }
            ]
        }
    ])

    async function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("expires");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("state");
        localStorage.removeItem("backup");
        window.location.href = "/login";
    }

    onMounted(async () => {
        let mereq = await fetch("https://discord.com/api/users/@me", {
            headers: {
                'Authorization': `Bearer ${await utils.getToken()}`
            },
        })
        let meres = await mereq.json();
        if (meres.username) {
            if (!menuItems.value[3].items) return
            menuItems.value[3].items[0].label = meres.username;
        }
    });
</script>

<template>
    <Menu :model="menuItems" style="width: 250px;" class="h-screen">
        <template #start>
            <img src="/logo.svg" alt="logo">
            <Divider />
        </template>
    </Menu>
</template>

<style scoped>
img {
    width: 200px;
}
</style>