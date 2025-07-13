<script setup lang="ts">
    import { InputText } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <InputText v-model="props.nodeData.save.content" type="text" placeholder="Content" />
</template>

<style scoped>

</style>