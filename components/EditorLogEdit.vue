<script setup lang="ts">
    import { InputText, FloatLabel } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <FloatLabel variant="on">
        <InputText class="w-full" v-model="props.nodeData.save.message" type="text" />
        <label for="message">Message</label>
    </FloatLabel>
</template>

<style scoped>

</style>