<script setup lang="ts">
import { ref } from "vue";
import { VueFlow, type Node } from "@vue-flow/core";
import "./index.css";

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

const edges = ref([
    { id: "e1-2", source: "1", target: "2" },
    { id: "e1-3", source: "1", target: "3" },
    { id: "e3-4", source: "3", target: "4" },
]);
</script>

<template>
    <VueFlow :nodes="nodes" :edges="edges" class="flow" fit-view-on-init>
    </VueFlow>
</template>
