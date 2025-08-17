<script setup lang="ts">
    import { InputText, FloatLabel } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <FloatLabel variant="on">
        <InputText class="w-full" v-model="props.nodeData.save.input" type="text" />
        <label for="input">Input</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText class="w-full" v-model="props.nodeData.save.splitter" type="text" />
        <label for="splitter">Splitter</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText class="w-full" v-model="props.nodeData.save.variable" type="text" />
        <label for="variable">Variable</label>
    </FloatLabel>
</template>

<style scoped>

</style>