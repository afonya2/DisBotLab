<script setup lang="ts">
    import Menu from '~/components/Menu.vue';
    import ContentCard from '~/components/ContentCard.vue';
    import utils from '../utils';
    import { DataTable, Button, useConfirm, useToast, Dialog, InputText } from 'primevue';

    useHead({
        title: 'DBL - Users',
    });
    const confirm = useConfirm()
    const toast = useToast()
    const createNew = ref(false);
    const newId = ref("");
    let users: Ref<{ id: string }[]> = ref([]);

    async function loadUsers() {
        let req = await utils.apiGet('/api/users')
        if (req.ok) {
            users.value = req.body.map((user: any) => ({ id: user.id }));
        } else {
            console.error("Failed to load users:", req);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to load users, check console for more information.` });
        }
    }
    function removeUser(event: MouseEvent, id: string) {
        confirm.require({
            message: `Are you sure you want to remove user ${id}?`,
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
                let req = await utils.apiPost(`/api/user`, JSON.stringify({ id: id }), "DELETE")
                if (req.ok) {
                    users.value = users.value.filter(user => user.id !== id);
                    toast.add({ severity: 'success', summary: 'Success', detail: `User ${id} removed successfully.` });
                } else {
                    toast.add({ severity: 'error', summary: 'Error', detail: `Failed to remove user ${id}: ${req.error}` });
                }
            }
        })
    }
    async function addUser() {
        newId.value = newId.value.trim();
        if (newId.value.length < 1) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'User ID cannot be empty.' });
            return;
        }
        let req = await utils.apiPost('/api/user', JSON.stringify({ id: newId.value }));
        if (req.ok) {
            users.value.push({ id: newId.value });
            toast.add({ severity: 'success', summary: 'Success', detail: `User ${newId.value} added successfully.` });
            createNew.value = false;
            newId.value = '';
        } else {
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to add user ${newId.value}: ${req.error}` });
        }
    }
    onMounted(async () => {
        if (!await utils.checkAuth()) {
            window.location.href = "/login";
        }
        loadUsers()
    })
</script>

<template>
    <Toast />
    <ConfirmPopup></ConfirmPopup>
    <Menu />
    <Dialog v-model:visible="createNew" modal header="Add new user" class="w-full sm:w-96">
        <InputText placeholder="User ID" v-model="newId" class="w-full" />
        <div class="mt-2">
            <Button class="ml-auto block" @click="addUser()">Add user</Button>
        </div>
    </Dialog>
    <main>
        <div class="flex flex-col gap-4">
            <h1 class="text-4xl">Users</h1>
            <ContentCard class="flex flex-wrap gap-4">
                <Button severity="secondary" @click="newId = '';createNew = true"><i class="pi pi-plus"></i>Add new user</Button>
                <Button severity="secondary" @click="loadUsers()"><i class="pi pi-refresh"></i>Refresh</Button>
                <DataTable :value="users" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]" class="w-full">
                    <Column field="id" header="Id" style="width: 75%"></Column>
                    <Column header="Actions" style="width: 25%">
                        <template #body="{ index, data }">
                            <Button severity="danger" @click="removeUser($event, data.id)"><i class="pi pi-trash"></i></Button>
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