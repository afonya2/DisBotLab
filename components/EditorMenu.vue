<script setup lang="ts">
    import { Menu, Divider } from 'primevue';
    import type { MenuItem } from 'primevue/menuitem';
    import { ref } from 'vue';
    import 'primeicons/primeicons.css'
    import { DBLNodes, CategoryIcons } from '~/pages/editor/NodeTypes';
    
    const emits = defineEmits(['place']);
    let menuItems = ref<MenuItem[]>([])
    for (let i in DBLNodes) {
        let catIndex = menuItems.value.findIndex(item => item.label === DBLNodes[i].category);
        if (catIndex === -1) {
            menuItems.value.push({
                label: DBLNodes[i].category,
                items: []
            });
            catIndex = menuItems.value.length - 1;
        }
        let category = menuItems.value[catIndex];
        if (category.items != undefined) {
            category.items.push({
                label: DBLNodes[i].name,
                icon: CategoryIcons[DBLNodes[i].category] || 'pi pi-file',
                command: () => emits('place', i)
            });
        }
    }
</script>

<template>
    <Menu :model="menuItems" style="width: 250px;height: calc(100vh - 50px);overflow: auto;"></Menu>
</template>

<style scoped>
img {
    width: 200px;
}
</style>