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
import { on } from "@primeuix/themes/aura/floatlabel";

    const baseNodes = ref<Node[]>([
        {
            id: "1",
            type: "input",
            data: { label: "Node 1" },
            position: { x: 250, y: 5 }
        },
        {
            id: "2",
            data: { label: "Node 2" },
            position: { x: 100, y: 100 },
            sourcePosition: Position.Left,
            targetPosition: Position.Right,
        },
        {
            id: "3",
            data: { label: "Node 3" },
            position: { x: 400, y: 100 },
        },
        {
            id: "4",
            type: "output",
            data: { label: "Node 4" },
            position: { x: 400, y: 200 },
        },
    ]);
    const baseEdges = ref<Edge[]>([
        { id: "e1-2", source: "1", target: "2", selectable: false },
        { id: "e1-3", source: "1", target: "3", type: "smoothstep" },
        { id: "e3-4", source: "3", target: "4", animated: true },
    ]);
    const { screenToFlowCoordinate, addNodes, addEdges, nodes, edges, onNodeClick, onEdgeClick, onNodeDrag } = useVueFlow()
    const nodeEdit = ref(false)
    const nodeEditId = ref("")
    const unsaved = ref(false);
    const confirm = useConfirm();
    const toast = useToast();

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
                id: (nodes.value.length > 0 ? nodes.value[nodes.value.length-1].id : "0") + 1,
                data: { label: node.name, typ: type, save: {} },
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
    onMounted(async () => {
        if (!await utils.checkAuth()) {
            window.location.href = "/login";
        }
    })
</script>

<template>
    <Toast />
    <ConfirmPopup></ConfirmPopup>
    <EditorMenuBar editing="Example module" @exit="exit" />
    <EditorMenu @place="placeNode" />
    <Dialog v-model:visible="nodeEdit" modal :header="getNodeInfo(nodeEditId)?.data.label" class="w-full sm:w-96">
        <div class="flex flex-col gap-2">
            <p class="text-xl">{{ DBLNodes[getNodeInfo(nodeEditId)?.data.typ].description }}</p>
            <EditorMessageEdit v-if="DBLNodes[getNodeInfo(nodeEditId)?.data.typ].editor == 'message'" :node-data="getNodeInfo(nodeEditId)?.data" />
            <EditorCommandEdit v-if="DBLNodes[getNodeInfo(nodeEditId)?.data.typ].editor == 'command'" :node-data="getNodeInfo(nodeEditId)?.data" />
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
