<script setup lang="ts">
    import { Textarea, FloatLabel } from 'primevue';
    const props = defineProps(["nodeData"])
</script>

<template>
    <FloatLabel variant="on">
        <Textarea class="w-full" v-model="props.nodeData.save.comment" type="text" rows="5" />
        <label for="comment">Comment</label>
    </FloatLabel>
</template>

<style scoped>

</style>