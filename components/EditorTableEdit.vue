<script setup lang="ts">
    import { InputText, FloatLabel } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <FloatLabel variant="on" v-if="props.nodeData.save.table !== undefined">
        <InputText class="w-full" v-model="props.nodeData.save.table" type="text" />
        <label for="table">Table</label>
    </FloatLabel>
    <FloatLabel variant="on" v-if="props.nodeData.save.key !== undefined">
        <InputText class="w-full" v-model="props.nodeData.save.key" type="text" />
        <label for="key">Key</label>
    </FloatLabel>
    <FloatLabel variant="on" v-if="props.nodeData.save.variable !== undefined">
        <InputText class="w-full" v-model="props.nodeData.save.variable" type="text" />
        <label for="variable">Variable</label>
    </FloatLabel>
    <FloatLabel variant="on" v-if="props.nodeData.save.value !== undefined">
        <InputText class="w-full" v-model="props.nodeData.save.value" type="text" />
        <label for="value">Value</label>
    </FloatLabel>
    <FloatLabel variant="on" v-if="props.nodeData.save.separator !== undefined">
        <InputText class="w-full" v-model="props.nodeData.save.separator" type="text" />
        <label for="separator">Separator</label>
    </FloatLabel>
    <div class="flex items-center gap-2" v-if="props.nodeData.save.kvmode !== undefined">
        <label for="kvmode">Key-Value mode</label>
        <ToggleSwitch v-model="props.nodeData.save.kvmode" id="kvmode" />
    </div>
</template>

<style scoped>

</style>