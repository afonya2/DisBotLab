<script setup lang="ts">
    import Menu from '~/components/Menu.vue';
    import ContentCard from '~/components/ContentCard.vue';
    import utils from '../utils';
    import { DataTable, Button, useConfirm, useToast } from 'primevue';

    useHead({
        title: 'DBL - Logs',
    });
    const confirm = useConfirm()
    const toast = useToast()
    let logs: Ref<{ date: string, type: string, message: string }[]> = ref([]);

    async function getLogs() {
        let req = await utils.apiGet('/api/logs');
        if (req.ok) {
            logs.value = req.body.map((lg: any) => ({
                date: new Date(lg.date).toLocaleString(),
                type: lg.type,
                message: lg.message
            }));
        } else {
            console.error("Failed to load logs:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to load logs, check console for more information.` });
        }
    }
    async function deleteLogs(event: MouseEvent) {
        confirm.require({
            message: `Are you sure you want to delete all logs?`,
            target: event.currentTarget as HTMLElement,
            icon: 'pi pi-exclamation-triangle',
            rejectProps: {
                label: 'No',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Yes',
                severity: 'danger'
            },
            accept: async () => {
                let req = await utils.apiPost(`/api/logs`, JSON.stringify({}), "DELETE");
                if (req.ok) {
                    logs.value = [];
                    toast.add({ severity: 'success', summary: 'Success', detail: `Logs deleted successfully.` });
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: `Failed to delete logs: ${req.error}` });
                }
            }
        });
    }
    onMounted(async () => {
        if (!await utils.checkAuth()) {
            window.location.href = "/login";
        }
        getLogs()
    })
</script>

<template>
    <Toast />
    <ConfirmPopup></ConfirmPopup>
    <Menu />
    <main>
        <div class="flex flex-col gap-4">
            <h1 class="text-4xl">Logs</h1>
            <ContentCard class="flex flex-wrap gap-4">
                <Button severity="secondary" @click="getLogs()"><i class="pi pi-refresh"></i>Refresh</Button>
                <Button severity="danger" @click="deleteLogs($event)"><i class="pi pi-trash"></i>Delete the logs</Button>
                <DataTable :value="logs" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]" class="w-full">
                    <Column field="date" header="Date" style="width: 25%"></Column>
                    <Column field="type" header="Type" style="width: 25%"></Column>
                    <Column field="message" header="Message" style="width: 50%"></Column>
                </DataTable>
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