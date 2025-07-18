<script setup lang="ts">
    import { InputText, FloatLabel, ToggleSwitch } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <FloatLabel variant="on">
        <InputText class="w-full" id="content" v-model="props.nodeData.save.content" type="text" />
        <label for="content">Content</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText class="w-full" id="interaction" v-model="props.nodeData.save.interaction" type="text" />
        <label for="interaction">Interaction</label>
    </FloatLabel>
    <div class="flex items-center gap-2">
        <label for="ephemeral">Ephemeral</label>
        <ToggleSwitch v-model="props.nodeData.save.ephemeral" id="ephemeral" />
    </div>
</template>

<style scoped>

</style>