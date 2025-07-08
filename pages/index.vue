<script setup lang="ts">
    import Menu from '~/components/Menu.vue';
    import StatCard from '~/components/StatCard.vue';
    import ContentCard from '~/components/ContentCard.vue';
</script>

<template>
    <Menu />
    <main>
        <div class="flex flex-col gap-4">
            <h1 class="text-4xl">Home</h1>
            <div class="flex flex-wrap mx-auto gap-4">
                <StatCard title="Interactions" value="11" icon="pi pi-play" />
                <StatCard title="Servers" value="1" icon="pi pi-server" />
                <StatCard title="Modules" value="0" icon="pi pi-file" />
                <StatCard title="Cpu Usage" value="1%" icon="pi pi-microchip" />
                <StatCard title="Memory Usage" value="100mb" icon="pi pi-microchip" />
                <StatCard title="Errors" value="-1" icon="pi pi-exclamation-circle" />
                <StatCard title="Uptime" value="-1 minutes" icon="pi pi-clock" />
            </div>
            <ContentCard>
                
            </ContentCard>
        </div>
    </main>
</template>

<style scoped>
main {
    position: absolute;
    top: 0;
    left: 250px;
    width: calc(100% - 250px);
    height: 100%;
    padding: 20px;
}
</style>