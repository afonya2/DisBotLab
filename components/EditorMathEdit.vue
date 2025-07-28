<script setup lang="ts">
    import { InputText, FloatLabel } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <FloatLabel variant="on">
        <InputText class="w-full" v-model="props.nodeData.save.left" type="text" />
        <label for="left">Left</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText class="w-full" v-model="props.nodeData.save.operator" type="text" />
        <label for="operator">Operator</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText class="w-full" v-model="props.nodeData.save.right" type="text" />
        <label for="right">Right</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText class="w-full" v-model="props.nodeData.save.variable" type="text" />
        <label for="variable">Variable</label>
    </FloatLabel>
</template>

<style scoped>

</style>