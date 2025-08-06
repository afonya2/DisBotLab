<script setup lang="ts">
    import Menu from '~/components/Menu.vue';
    import ContentCard from '~/components/ContentCard.vue';
    import utils from '../utils';
    import { DataTable, Button, useConfirm, useToast, Dialog, InputText, Textarea } from 'primevue';

    useHead({
        title: 'DBL - Modules',
    });
    const confirm = useConfirm()
    const toast = useToast()
    const createNew = ref(false)
    const edit = ref(false)
    const newName = ref("")
    const newDescription = ref("")
    const editId = ref("")
    let importon = ref(false);
    let importData = ref("");
    let modules: Ref<{ id: string, name: string, description: string, enabled: boolean }[]> = ref([]);

    async function getModules() {
        let req = await utils.apiGet('/api/modules');
        if (req.ok) {
            modules.value = req.body.map((mod: any) => ({
                id: mod.id,
                name: mod.name,
                description: mod.description,
                enabled: mod.enabled == 1 ? true : false
            }));
        } else {
            console.error("Failed to load modules:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to load modules, check console for more information.` });
        }
    }
    async function createModule() {
        newName.value = newName.value.trim();
        newDescription.value = newDescription.value.trim();
        if (newName.value.length < 1 || newDescription.value.length < 1) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Module name and description cannot be empty.' });
            return;
        }
        let req = await utils.apiPost('/api/module', JSON.stringify({
            name: newName.value,
            description: newDescription.value
        }));
        if (req.ok) {
            modules.value.push({
                id: req.body.id,
                name: newName.value,
                description: newDescription.value,
                enabled: true
            });
            toast.add({ severity: 'success', summary: 'Success', detail: `Module ${newName.value} created successfully.` });
            createNew.value = false;
            newName.value = "";
            newDescription.value = "";
        } else {
            console.error("Failed to create module:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to create module: ${req.error}` });
        }
    }
    async function editModule() {
        newName.value = newName.value.trim();
        newDescription.value = newDescription.value.trim();
        if (newName.value.length < 1 || newDescription.value.length < 1) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Module name and description cannot be empty.' });
            return;
        }
        let index = modules.value.findIndex(mod => mod.id === editId.value);
        if (index == -1) {
            return
        }
        let req = await utils.apiPost(`/api/module/${editId.value}`, JSON.stringify({
            name: newName.value,
            description: newDescription.value,
            enabled: modules.value[index].enabled
        }), "PATCH");
        if (req.ok) {
            modules.value[index].name = newName.value;
            modules.value[index].description = newDescription.value;
            toast.add({ severity: 'success', summary: 'Success', detail: `Module ${newName.value} updated successfully.` });
            edit.value = false;
            newName.value = "";
            newDescription.value = "";
        } else {
            console.error("Failed to edit module:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to edit module: ${req.error}` });
        }
    }
    async function deleteModule(event: MouseEvent, id: string) {
        confirm.require({
            message: `Are you sure you want to delete this module?`,
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
                let req = await utils.apiPost(`/api/module/${id}`, JSON.stringify({}), "DELETE");
                if (req.ok) {
                    modules.value = modules.value.filter(mod => mod.id !== id);
                    toast.add({ severity: 'success', summary: 'Success', detail: `Module deleted successfully.` });
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: `Failed to delete module: ${req.error}` });
                }
            }
        });
    }
    async function toggleModule(id: string) {
        let index = modules.value.findIndex(mod => mod.id === id);
        if (index == -1) {
            return
        }
        let req = await utils.apiPost(`/api/module/${id}`, JSON.stringify({
            name: modules.value[index].name,
            description: modules.value[index].description,
            enabled: !modules.value[index].enabled
        }), "PATCH");
        if (req.ok) {
            modules.value[index].enabled = !modules.value[index].enabled;
            toast.add({ severity: 'success', summary: 'Success', detail: `Module ${modules.value[index].enabled ? 'enabled' : 'disabled'} successfully.` });
        } else {
            console.error("Failed to toggle module:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to toggle module: ${req.error}` });
        }
    }
    async function openEditor(id: string) {
        window.location.href = `/editor/${id}`;
    }
    async function exportModule(id: string) {
        let req = await utils.apiGet(`/api/module/${id}/export`);
        if (req.ok) {
            toast.add({ severity: 'success', summary: 'Success', detail: `Module ${req.body.name} exported successfully.` });
            let link = document.createElement('a');
            link.href = URL.createObjectURL(new Blob([JSON.stringify(req.body, null, 4)], { type: 'application/json' }));
            link.download = `${req.body.name}.json`;
            link.click();
        } else {
            console.error("Failed to export module:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to export module: ${req.error}` });
        }
    }
    async function importModule() {
        let data: any;
        try {
            data = JSON.parse(importData.value);
        } catch (e) {
            console.error("Invalid JSON format:", e);
            toast.add({ severity: 'error', summary: 'Error', detail: 'Invalid JSON format.' });
            return;
        }
        let req = await utils.apiPost('/api/modules/import', JSON.stringify(data));
        if (req.ok) {
            modules.value.push({
                id: req.body.id,
                name: req.body.name,
                description: req.body.description,
                enabled: true
            });
            toast.add({ severity: 'success', summary: 'Success', detail: `Module ${req.body.name} imported successfully.` });
            importon.value = false;
            importData.value = "";
        } else {
            console.error("Failed to import module:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to import module: ${req.error}` });
        }
    }
    onMounted(async () => {
        if (!await utils.checkAuth()) {
            window.location.href = "/login";
        }
        getModules()
    })
</script>

<template>
    <Toast />
    <ConfirmPopup></ConfirmPopup>
    <Menu />
    <Dialog v-model:visible="createNew" modal header="Create new module" class="w-full sm:w-96">
        <InputText v-model="newName" placeholder="Module Name" class="w-full" />
        <Textarea class="mt-2 w-full" v-model="newDescription" placeholder="Module description" />
        <div class="mt-2">
            <Button class="ml-auto block" @click="createModule()">Create</Button>
        </div>
    </Dialog>
    <Dialog v-model:visible="edit" modal header="Edit module" class="w-full sm:w-96">
        <InputText v-model="newName" placeholder="Module Name" class="w-full" />
        <Textarea class="mt-2 w-full" v-model="newDescription" placeholder="Module description" />
        <div class="mt-2">
            <Button class="ml-auto block" @click="editModule()">Save</Button>
        </div>
    </Dialog>
    <Dialog v-model:visible="importon" modal header="Import module" class="w-full sm:w-96">
        <Textarea class="mt-2 w-full" v-model="importData" placeholder="Paste your module JSON here" />
        <div class="mt-2">
            <Button class="ml-auto block" @click="importModule()">Import</Button>
        </div>
    </Dialog>
    <main>
        <div class="flex flex-col gap-4">
            <h1 class="text-4xl">Modules</h1>
            <ContentCard class="flex flex-wrap gap-4">
                <Button severity="secondary" @click="newName = '';newDescription = '';createNew = true"><i class="pi pi-plus"></i>Create new</Button>
                <Button severity="secondary" @click="importon = true"><i class="pi pi-file-import"></i>Import</Button>
                <Button severity="secondary" @click="getModules()"><i class="pi pi-refresh"></i>Refresh</Button>
                <DataTable :value="modules" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]" class="w-full">
                    <Column field="name" header="Name" style="width: 25%"></Column>
                    <Column field="description" header="Description" style="width: 50%"></Column>
                    <Column header="Actions" style="width: 25%">
                        <template #body="{ index, data }">
                            <Button :class="data.enabled ? 'p-button-success' : 'p-button-secondary'" @click="toggleModule(data.id)"><i class="pi" :class="data.enabled ? 'pi-check' : 'pi-times'"></i></Button>
                            <Button class="ml-2" @click="openEditor(data.id)"><i class="pi pi-file-edit"></i></Button>
                            <Button class="ml-2" @click="newName = data.name;newDescription = data.description;editId = data.id;edit = true"><i class="pi pi-pencil"></i></Button>
                            <Button class="ml-2" @click="exportModule(data.id)"><i class="pi pi-file-export"></i></Button>
                            <Button class="ml-2" severity="danger" @click="deleteModule($event, data.id)"><i class="pi pi-trash"></i></Button>
                        </template>
                    </Column>
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