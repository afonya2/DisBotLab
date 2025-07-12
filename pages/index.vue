<script setup lang="ts">
    import Menu from '~/components/Menu.vue';
    import StatCard from '~/components/StatCard.vue';
    import ContentCard from '~/components/ContentCard.vue';
    import utils from './utils';

    useHead({
        title: 'DBL - Home',
    });
    let status = ref({
        interactions: 0,
        servers: 0,
        modules: 0,
        memoryUsage: 0,
        errors: 0,
        uptime: 0
    })

    function uptimeToStr(uptime: number): string {
        if (uptime < 60) {
            return `${Math.floor(uptime)} seconds`;
        } else if (uptime < 3600) {
            return `${Math.floor(uptime / 60)} minutes`;
        } else if (uptime < 86400) {
            return `${Math.floor(uptime / 3600)} hours`;
        } else {
            return `${Math.floor(uptime / 86400)} days`;
        }
    }

    async function getStatus() {
        let info = await utils.apiGet('/api/status');
        if (info.ok) {
            status.value = {
                interactions: info.body.interactions,
                servers: info.body.servers,
                modules: info.body.modules,
                memoryUsage: info.body.memoryUsage,
                errors: info.body.errors,
                uptime: info.body.uptime
            };
        } else {
            console.error("Failed to get info:", info.error);
        }
    }
    onMounted(async () => {
        if (!await utils.checkAuth()) {
            window.location.href = "/login";
        }
        getStatus()
    })
</script>

<template>
    <Menu />
    <main>
        <div class="flex flex-col gap-4">
            <h1 class="text-4xl">Home</h1>
            <div class="flex flex-wrap mx-auto gap-4">
                <ClientOnly>
                    <StatCard title="Interactions" :value="`${status.interactions}`" icon="pi pi-play" />
                    <StatCard title="Servers" :value="`${status.servers}`" icon="pi pi-server" :warn="status.servers > 1500" />
                    <StatCard title="Modules" :value="`${status.modules}`" icon="pi pi-file" />
                    <StatCard title="Memory Usage" :value="`${status.memoryUsage} MB`" icon="pi pi-microchip" :warn="status.memoryUsage > 512" />
                    <StatCard title="Errors" :value="`${status.errors}`" icon="pi pi-exclamation-circle" :warn="status.errors > 10" />
                    <StatCard title="Uptime" :value="uptimeToStr(status.uptime)" icon="pi pi-clock" />
                </ClientOnly>
            </div>
            <ContentCard class="flex flex-wrap gap-4">
                <ContentCard class="w-full lg:w-[calc(50%-1rem)] flex items-center gap-4">
                    <i class="pi pi-plus text-4xl"></i>
                    <div>
                        <h2 class="text-2xl">Make some modules!</h2>
                        <p class="text-lg">Create some modules for your Discord bot.</p>
                        <a href="">Click me!</a>
                    </div>
                </ContentCard>
                <ContentCard class="w-full lg:w-[calc(50%-1rem)] flex items-center gap-4">
                    <i class="pi pi-database text-4xl"></i>
                    <div>
                        <h2 class="text-2xl">Make some databases!</h2>
                        <p class="text-lg">Databases let you easily store your data.</p>
                        <a href="">Click me!</a>
                    </div>
                </ContentCard>
                <ContentCard class="w-full lg:w-[calc(50%-1rem)] flex items-center gap-4">
                    <i class="pi pi-server text-4xl"></i>
                    <div>
                        <h2 class="text-2xl">Modify some settings!</h2>
                        <p class="text-lg">Don't like something you configured? Change it here. You can also see some system information here too!</p>
                        <a href="">Click me!</a>
                    </div>
                </ContentCard>
                <ContentCard class="w-full lg:w-[calc(50%-1rem)] flex items-center gap-4">
                    <i class="pi pi-file-pdf text-4xl"></i>
                    <div>
                        <h2 class="text-2xl">Documentation</h2>
                        <p class="text-lg">Don't know how stuff works? Check this out!</p>
                        <a href="">Click me!</a>
                    </div>
                </ContentCard>
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
    overflow: auto;
}
a {
    color: rgb(50, 100, 200);
    text-decoration: underline;
}
</style>