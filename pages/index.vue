<script setup lang="ts">
    import Menu from '~/components/Menu.vue';
    import StatCard from '~/components/StatCard.vue';
    import ContentCard from '~/components/ContentCard.vue';
    import utils from './utils';

    useHead({
        title: 'DBL - Home',
    });

    onMounted(async () => {
        if (!await utils.checkAuth()) {
            window.location.href = "/login";
        }
    })
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
                <StatCard title="Errors" value="999" icon="pi pi-exclamation-circle" warn="true" />
                <StatCard title="Uptime" value="-1 minutes" icon="pi pi-clock" />
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
}
a {
    color: rgb(50, 100, 200);
    text-decoration: underline;
}
</style>