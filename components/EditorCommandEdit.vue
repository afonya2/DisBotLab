<script setup lang="ts">
    import { InputText, FloatLabel } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <FloatLabel variant="on">
        <InputText v-model="props.nodeData.save.command" type="text" />
        <label for="command">Command</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText v-model="props.nodeData.save.desc" type="text" />
        <label for="desc">Description</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText v-model="props.nodeData.save.variable" type="text" />
        <label for="variable">Variable</label>
    </FloatLabel>
</template>

<style scoped>

</style>