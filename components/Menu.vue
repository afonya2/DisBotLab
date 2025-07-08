<script setup lang="ts">
    import { Menu, Divider } from 'primevue';
    import type { MenuItem } from 'primevue/menuitem';
    import { ref } from 'vue';
    import 'primeicons/primeicons.css'
    
    const menuItems = ref<MenuItem[]>([
        {
            label: 'Dashboard',
            items: [
                { label: 'Home', icon: 'pi pi-home' },
                { label: 'Modules', icon: 'pi pi-file' },
                { label: 'Databases', icon: 'pi pi-database' }
            ]
        },
        {
            label: 'Administration',
            items: [
                { label: 'Users', icon: 'pi pi-users' },
                { label: 'Logs', icon: 'pi pi-list' },
                { label: 'Settings And Status', icon: 'pi pi-server' },
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
                { label: 'Example User', icon: 'pi pi-user' },
                { label: 'Sign out', icon: 'pi pi-sign-out' }
            ]
        }
    ])
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