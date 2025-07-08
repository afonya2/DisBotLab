<script setup lang="ts">

</script>

<template>
    <div class="card">
        <slot />
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