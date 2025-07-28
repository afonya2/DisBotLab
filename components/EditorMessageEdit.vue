<script setup lang="ts">
    import { InputText, FloatLabel } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <FloatLabel variant="on">
        <InputText class="w-full" id="content" v-model="props.nodeData.save.content" type="text" />
        <label for="content">Content</label>
    </FloatLabel>
    <FloatLabel variant="on" v-if="props.nodeData.save.channel !== undefined">
        <InputText class="w-full" id="channel" v-model="props.nodeData.save.channel" type="text" />
        <label for="channel">Channel</label>
    </FloatLabel>
    <FloatLabel variant="on" v-if="props.nodeData.save.user !== undefined">
        <InputText class="w-full" id="user" v-model="props.nodeData.save.user" type="text" />
        <label for="user">User</label>
    </FloatLabel>
</template>

<style scoped>

</style>