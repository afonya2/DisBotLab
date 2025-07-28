<script setup lang="ts">
    import { InputText, FloatLabel } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <FloatLabel variant="on">
        <InputText class="w-full" v-model="props.nodeData.save.variable" type="text" />
        <label for="variable">Variable</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText class="w-full" v-model="props.nodeData.save.value" type="text" />
        <label for="value">Value</label>
    </FloatLabel>
    <div class="flex items-center gap-2">
        <label for="global">Global</label>
        <ToggleSwitch v-model="props.nodeData.save.global" id="global" />
    </div>
</template>

<style scoped>

</style>