<script setup lang="ts">
    const props = defineProps<{ entity: string }>()

    const microphone = useMicrophone()
    const data = ref<Data>()

    const idle = ref({
        i: 0,
        timer: 0 as any
    })

    onMounted(() => {
        const raw = localStorage.getItem(props.entity)
        if (raw) data.value = JSON.parse(raw)

        window.addEventListener('storage', sync)
        setup_idle()
    })

    onBeforeUnmount(() => {
        clearInterval(idle.value.timer)
        window.removeEventListener('storage', sync)
    })

    const sync = (e: StorageEvent) => {
        if (e.key === props.entity && e.newValue)
            data.value = JSON.parse(e.newValue)
    }

    const setup_idle = () => {
        watch(
            () => data.value?.settings.idle_tick,
            (tick) => {
                clearInterval(idle.value.timer)
                if (!tick) return

                idle.value.timer = setInterval(() => {
                    const images = data.value?.images.inactive
                    if (!images?.length) return
                    idle.value.i = (idle.value.i + 1) % images.length
                }, tick)
            },
            { immediate: true }
        )
    }

    const image = computed(() => {
        const images = data.value?.images
        if (!images) return ''

        if (microphone.data.value.loud) {
            const active = images.active
            if (!active?.length) return ''
            return active[Math.floor(Math.random() * active.length)]
        }

        const inactive = images.inactive
        if (!inactive?.length) return ''
        return inactive[idle.value.i]
    })
</script>

<template>
    <div
        :style="`transform: scale(${data?.settings.scale})`"
    >
        <img
            :src="image"
            class="pixelated"
            :style="`
                transition: all .3s ease;
                filter: grayscale(${microphone.data.value.loud ? '0' : '0.5'});
                animation: ${
                    microphone.data.value.loud &&
                    data?.settings.animation !== 'none'
                        ? `st-${data?.settings.animation} .5s`
                        : 'none'
                };
            `"
        >
    </div>

</template>

<style scoped>
    @keyframes st-bounce {
        0%, 100% { transform: translateY(0) }
        50% { transform: translateY(-10px) }
    }

    .pixelated {
        image-rendering: pixelated;
    }
</style>
