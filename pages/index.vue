<script setup lang="ts">
    import { Menu, Divider } from 'primevue';
    import type { MenuItem } from 'primevue/menuitem';
    import { ref } from 'vue';
    import 'primeicons/primeicons.css'

    useHead({
        title: 'DisBotLab',
    })
    const menuItems = ref<MenuItem[]>([
        {
            label: 'Dashboard',
            items: [
                { label: 'Home', icon: 'pi pi-home' },
                { label: 'Modules', icon: 'pi pi-file' }
            ]
        },
        {
            label: 'Administration',
            items: [
                { label: 'Users', icon: 'pi pi-users' },
                { label: 'Updates', icon: 'pi pi-refresh' },
                { label: 'Logs', icon: 'pi pi-list' },
                { label: 'Settings', icon: 'pi pi-cog' },
            ]
        },
        {
            label: 'DBL',
            items: [
                { label: 'Github', icon: 'pi pi-github', url: 'https://github.com/afonya2/DisBotLab', target: '_blank' },
                { label: 'Issues', icon: 'pi pi-exclamation-triangle', url: 'https://github.com/afonya2/DisBotLab/Issues', target: '_blank' }
            ]
        },
        {
            label: 'User',
            items: [
                { label: 'Example User', icon: 'pi pi-user' },
                { label: 'Sign out', icon: 'pi pi-sign-out' }
            ]
        }
    ])
</script>

<template>
    <Menu :model="menuItems" class="w-fit h-screen">
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