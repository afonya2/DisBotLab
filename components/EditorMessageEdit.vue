<script setup lang="ts">
    import { InputText, FloatLabel } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <FloatLabel variant="on">
        <InputText class="w-full" id="content" v-model="props.nodeData.save.content" type="text" />
        <label for="content">Content</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText class="w-full" id="channel" v-model="props.nodeData.save.channel" type="text" />
        <label for="channel">Channel</label>
    </FloatLabel>
</template>

<style scoped>

</style>