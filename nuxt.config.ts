// https://nuxt.com/docs/api/configuration/nuxt-configű
import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

const customTheme = definePreset(Aura, {
    semantic: {
        primary: {
            50: "#99b2e4",
            100: "#84a2de",
            200: "#7093d9",
            300: "#5b83d3",
            400: "#4774ce",
            500: "#3264c8",
            600: "#2850a0",
            700: "#23468c",
            800: "#193264",
            900: "#0f1e3c",
            950: "#0a1428",
        },
    },
});

export default defineNuxtConfig({
    compatibilityDate: "2025-05-15",
    devtools: { enabled: true },
    modules: ["@nuxtjs/tailwindcss", "@primevue/nuxt-module"],
    app: {
        head: {
            link: [ { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' } ]
        }
    },
    primevue: {
        options: {
            theme: {
                preset: customTheme,
            },
        },
        components: {
            exclude: ["Form", "FormField"],
        },
    }
});
