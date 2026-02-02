import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    modules: ['@nuxt/ui', '@nuxt/fonts'],
    css: ['./app/assets/main.css'],
    ui: {
        prefix: 'Nuxt'
    },
    vite: { plugins: [tailwindcss()] },
    devtools: { enabled: true }
})
