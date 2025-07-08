<script setup lang="ts">
import { ref } from "vue";
import { Position, VueFlow, type Connection, type Edge, type Node } from "@vue-flow/core";
import { Background } from '@vue-flow/background'
import "./index.css";
import { MiniMap } from "@vue-flow/minimap";

const nodes = ref<Node[]>([
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

let edges = ref<Edge[]>([
    { id: "e1-2", source: "1", target: "2", selectable: false },
    { id: "e1-3", source: "1", target: "3", type: "smoothstep" },
    { id: "e3-4", source: "3", target: "4", animated: true },
]);

function onConnect(params: Connection) {
    edges.value.push({
        id: `e${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        type: "smoothstep",
    });
}
</script>

<template>
    <VueFlow :nodes="nodes" :edges="edges" class="flow" fit-view-on-init @connect="onConnect">
        <Background />
        <MiniMap />
    </VueFlow>
</template>
