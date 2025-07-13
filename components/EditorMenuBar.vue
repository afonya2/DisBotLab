<script setup lang="ts">
    import { Menubar, Button } from 'primevue';
    import type { MenuItem } from 'primevue/menuitem';
    import { ref } from 'vue';
    import 'primeicons/primeicons.css'
    
    const props = defineProps(["editing"])
    const emits = defineEmits(['save', 'exit']);
    const menuItems = ref<MenuItem[]>([])
</script>

<template>
    <Menubar :model="menuItems" style="height: 50px;" class="w-screen">
        <template #start>
            <h1 class="text-xl">DisBotLab Editor</h1>
            <h2 class="text-lg ml-4">Editing: {{ props.editing }}</h2>
        </template>
        <template #end>
            <Button severity="secondary" @click="emits('exit', $event)"><i class="pi pi-times"></i>Exit</Button>
            <Button class="ml-2" @click="emits('save', $event)"><i class="pi pi-save"></i>Save</Button>
        </template>
    </Menubar>
</template>

<style scoped>
img {
    height: 50px;
}
</style>