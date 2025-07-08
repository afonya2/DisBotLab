<script setup lang="ts">
    const props = defineProps(["title", "value", "icon"]);
</script>

<template>
    <div class="card w-full md:w-[calc(50%-1rem)] lg:w-[calc(25%-1rem)] 2xl:w-fit">
        <div class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
                <i :class="icon"></i>
                <h2 class="text-xl">{{ title }}</h2>
            </div>
            <p class="text-lg font-bold">{{ value }}</p>
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