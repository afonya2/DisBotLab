<script setup lang="ts">
    import { InputText } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <InputText v-model="props.nodeData.save.command" type="text" placeholder="Command" />
    <InputText v-model="props.nodeData.save.desc" type="text" placeholder="Description" />
</template>

<style scoped>

</style>