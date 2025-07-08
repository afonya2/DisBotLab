<script setup lang="ts">
    import { Badge } from 'primevue';
    const props = defineProps(["title", "value", "icon", "warn"]);
</script>

<template>
    <div class="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(25%-1rem)] 2xl:w-fit">
        <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
                <i :class="props.icon"></i>
                <h2 class="text-xl">{{ props.title }}</h2>
                <Badge severity="warn" value="Warning!" v-if="props.warn" />
            </div>
            <p class="text-lg font-bold">{{ props.value }}</p>
        </div>
    </div>
</template>

<style scoped>
.card {
    background: rgba(50, 50, 50, .1);
    border-radius: 10px;
    box-shadow: 0 0 5px rgba(0, 0, 0, .5);
    padding: 20px;
}
</style>