<script setup lang="ts">
    import { ref } from "vue";
    import { Position, useVueFlow, VueFlow, type Connection, type Edge, type EdgeMouseEvent, type Node, type NodeMouseEvent } from "@vue-flow/core";
    import { Background } from '@vue-flow/background'
    import "./index.css";
    import utils from '../utils';
    import { MiniMap } from "@vue-flow/minimap";
    import EditorMenuBar from "~/components/EditorMenuBar.vue";
    import EditorMenu from "~/components/EditorMenu.vue";
    import { DBLNodes, CategoryIcons } from "./NodeTypes";
    import { Dialog, Button, ConfirmPopup, Toast, useConfirm, useToast } from "primevue";

    const baseNodes = ref<Node[]>([]);
    const baseEdges = ref<Edge[]>([]);
    const { screenToFlowCoordinate, addNodes, addEdges, nodes, edges, onNodeClick, onEdgeClick, onNodeDrag } = useVueFlow()
    const nodeEdit = ref(false)
    const nodeEditId = ref("")
    const unsaved = ref(false);
    const confirm = useConfirm();
    const toast = useToast();
    const moduleId = ref(0);
    const moduleName = ref("Loading...");

    function onConnect(params: Connection) {
        let alreadyExists = edges.value.findIndex(edge => edge.target === params.target);
        if (alreadyExists != -1) {
            edges.value.splice(alreadyExists, 1);
        }
        addEdges([
            {
                id: `e${params.source}-${params.target}`,
                source: params.source,
                target: params.target
            }
        ])
        unsaved.value = true;
    }
    function placeNode(type: string) {
        const centerX = (window.innerWidth - 250)/2
        const centerY = (window.innerHeight - 50)/2
        const node = DBLNodes[type];
        if (!node) {
            console.error(`Node type ${type} not found`);
            return;
        }
        addNodes([
            {
                id: String(Number(nodes.value.length > 0 ? nodes.value[nodes.value.length-1].id : "0") + 1),
                data: { label: node.name, typ: type, save: utils.copy(node.defaultSave, true) || {} },
                position: screenToFlowCoordinate({ x: centerX, y: centerY }),
                type: node.variant,
            }
        ])
        unsaved.value = true;
    }
    onNodeClick((event: NodeMouseEvent) => {
        nodeEdit.value = true;
        nodeEditId.value = event.node.id;
        unsaved.value = true;
    });
    onEdgeClick((event: EdgeMouseEvent) => {
        let edgeIndex = edges.value.findIndex(edge => edge.id === event.edge.id);
        if (edgeIndex != -1) {
            edges.value.splice(edgeIndex, 1);
        }
        unsaved.value = true;
    });
    onNodeDrag((event: NodeMouseEvent) => {
        unsaved.value = true;
    });
    function deleteNode() {
        const index = nodes.value.findIndex(n => n.id === nodeEditId.value);
        if (index !== -1) {
            nodes.value.splice(index, 1);
            edges.value = edges.value.filter(edge => edge.source !== nodeEditId.value && edge.target !== nodeEditId.value);
            nodeEdit.value = false;
            nodeEditId.value = "";
        }
        unsaved.value = true;
    }
    function getNodeInfo(id: string): Node | undefined {
        return nodes.value.find(node => node.id === id);
    }
    function exit(event: MouseEvent) {
        if (unsaved.value) {
            confirm.require({
                message: 'You have unsaved changes. Are you sure you want to exit?',
                icon: 'pi pi-exclamation-triangle',
                target: event.currentTarget as HTMLElement,
                acceptProps: {
                    label: 'Yes',
                    severity: 'danger'
                },
                rejectProps: {
                    label: 'No',
                    severity: 'secondary',
                    outlined: true
                },
                accept: () => {
                    window.location.href = "/modules";
                },
                reject: () => {
                    
                }
            });
        } else {
            window.location.href = "/modules";
        }
    }

    async function save() {
        const nodesData = nodes.value.map(node => ({
            id: node.id,
            x: node.position.x,
            y: node.position.y,
            type: node.data.typ,
            data: node.data.save
        }));
        const edgesData = edges.value.map(edge => ({
            id: edge.id,
            from: edge.source,
            to: edge.target
        }));
        let req = await utils.apiPost(`/api/module/${moduleId.value}/save`, JSON.stringify({
            nodes: nodesData,
            edges: edgesData
        }));
        if (req.ok) {
            unsaved.value = false;
            toast.add({ severity: 'success', summary: 'Success', detail: 'Changes saved successfully.' });
        } else {
            console.error("Failed to save changes:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to save changes: ${req.error}` });
        }
    }
    async function load() {
        let modReq = await utils.apiGet(`/api/module/${moduleId.value}`);
        if (!modReq.ok) {
            console.error("Failed to load module:", modReq.error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to load module: ${modReq.error}` });
            return;
        }
        moduleName.value = modReq.body.name;
        useHead({
            title: `Editing ${moduleName.value} - DisBotLab Editor`
        });
        let req = await utils.apiGet(`/api/module/${moduleId.value}/load`);
        if (!req.ok) {
            console.error("Failed to load module:", req.error);
            toast.add({ severity: 'error', summary: 'Error', detail: `Failed to load module: ${req.error}` });
            return;
        }
        const data = req.body;
        for (let i = 0; i < data.nodes.length; i++) {
            const nde = data.nodes[i];
            const preNode = DBLNodes[nde.type];
            if (!preNode) {
                console.error(`Node type ${nde.type} not found`);
                continue;
            }
            baseNodes.value.push({
                id: nde.id,
                position: { x: nde.x, y: nde.y },
                data: { label: preNode.name, typ: nde.type, save: nde.data },
                type: preNode.variant
            });
        }
        baseEdges.value = data.edges.map((edge: any) => ({
            id: edge.id,
            source: String(edge.from),
            target: String(edge.to)
        }));
    }

    onMounted(async () => {
        if (!await utils.checkAuth()) {
            window.location.href = "/login";
        }
        const splittedPath = window.location.pathname.split('/');
        if (splittedPath.length < 3) {
            window.location.href = "/modules";
            return;
        }
        moduleId.value = Number(splittedPath[2]);
        load()
    })
</script>

<template>
    <Toast />
    <ConfirmPopup></ConfirmPopup>
    <EditorMenuBar :editing="moduleName" @exit="exit" @save="save" />
    <EditorMenu @place="placeNode" />
    <Dialog v-model:visible="nodeEdit" modal :header="getNodeInfo(nodeEditId)?.data.label" class="w-full sm:w-96">
        <div class="flex flex-col gap-2">
            <p class="text-xl">{{ DBLNodes[getNodeInfo(nodeEditId)?.data.typ].description }}</p>
            <EditorMessageEdit v-if="DBLNodes[getNodeInfo(nodeEditId)?.data.typ].editor == 'message'" :node-data="getNodeInfo(nodeEditId)?.data" />
            <EditorCommandEdit v-if="DBLNodes[getNodeInfo(nodeEditId)?.data.typ].editor == 'command'" :node-data="getNodeInfo(nodeEditId)?.data" />
            <EditorReplyEdit v-if="DBLNodes[getNodeInfo(nodeEditId)?.data.typ].editor == 'reply'" :node-data="getNodeInfo(nodeEditId)?.data" />
            <div class="flex">
                <Button class="ml-auto" severity="danger" @click="deleteNode()"><i class="pi pi-trash"></i>Delete</Button>
                <Button class="ml-2" @click="nodeEdit = false"><i class="pi pi-save"></i>Save</Button>
            </div>
        </div>
    </Dialog>
    <VueFlow :nodes="baseNodes" :edges="baseEdges" class="flow" fit-view-on-init @connect="onConnect">
        <Background />
        <MiniMap />
    </VueFlow>
</template>
