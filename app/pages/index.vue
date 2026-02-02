<script setup lang="ts">
    import Character from '~/components/Character.vue'
    import { useClipboard } from '@xlsft/nuxt'

    const microphone = useMicrophone()
    const route = useRoute()
    const edit = !route.query.stream

    const state = ref({
        colorHover: false,
        images: { inactive: [] as File[], active: [] as File[] }
    })

    const data = ref<Data>({
        images: { inactive: [], active: [] },
        settings: {
            scale: 1,
            color: '#000000',
            idle_tick: 3000,
            animation: 'bounce',
            voice_gain: 1,
        },
        microphone: {
            options: microphone.options.value,
            data: microphone.data.value
        }
    })

    onMounted(() => {
        const cached = localStorage.getItem('data')
        if (cached) {
            data.value = JSON.parse(cached)
            state.value.images = {
                active: data.value.images.active?.map(convert.file) || [],
                inactive: data.value.images.inactive?.map(convert.file) || []
            }
        }

        watch(
            () => data.value,
            () => localStorage.setItem('data', JSON.stringify(data.value)),
            { deep: true }
        )

        watch(
            () => state.value.images,
            async () => {
                data.value.images = {
                    active: await Promise.all(state.value.images.active.map(convert.string)),
                    inactive: await Promise.all(state.value.images.inactive.map(convert.string))
                }
            },
            { deep: true }
        )
    })

    const color = computed(() => {
        const v = microphone.data.value.volume
        if (!v) return 'primary'
        if (microphone.data.value.loud && v <= 50) return 'warning'
        if (v > 50) return 'error'
    })

    const convert = {
        string: (file: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
        }),
        file: (string: string) => {
            const [meta, data] = string.split(',')
            const bin = atob(data!)
            const arr = new Uint8Array(bin.length)
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
            return new File([arr], 'image', { type: meta!.match(/:(.*?);/)?.[1] })
        }
    }

    const actions = {
        stream: () => location.replace('/?stream=true'),
        reload: () => location.reload()
    }
</script>


<template>
    <div 
        class="w-full h-full flex items-center justify-center" 
        :class="[
            ...edit ? ['p-12'] : []
        ]"
    >
        <div 
            class="grow h-full w-full flex items-center justify-center relative transition-all"
            :style="{ background: edit ? state.colorHover ? data.settings.color : `color-mix(in oklab, ${data.settings.color} 20%, transparent)` : data.settings.color }"
            :class="[
                ...edit ? ['p-12 rounded-xl border border-default'] : []
            ]"
        >
            <Character entity="data"/>
            <NuxtPopover :content="{ align: 'start' }" v-if="edit">
                <NuxtButton icon="lucide:image" class="absolute left-12 top-12"></NuxtButton>                
                <template #content>
                    <div class="p-4 flex flex-col gap-4">
                        <span class="text-lg font-bold text-white">Character options</span>
                        <NuxtFormField label="Character scale" :hint="`x${data.settings.scale}`" :ui="{ container: 'flex flex-col gap-2' }">
                            <NuxtSlider 
                                :min="0"
                                :max="5"
                                :step=".1"
                                v-model="data.settings.scale"
                            />
                        </NuxtFormField>
                        <NuxtFormField label="Color" :ui="{ container: 'flex flex-col gap-2' }" @mouseenter="() => state.colorHover = true" @mouseleave="() => state.colorHover = false">
                            <NuxtColorPicker v-model="data.settings.color" class="w-[300px]"/>
                            <NuxtInput v-model="data.settings.color" readonly>
                                <template v-if="data.settings.color.length" #trailing>
                                    <NuxtTooltip text="Copy to clipboard" :content="{ side: 'right' }">
                                        <NuxtButton
                                            color="neutral"
                                            variant="link"
                                            size="sm"
                                            icon="lucide:copy"
                                            aria-label="Copy to clipboard"
                                            @click="() => {
                                                useClipboard(data.settings.color)
                                                useToast().add({ title: 'Color copied!', icon: 'lucide:check', color: 'success' })
                                            }"
                                        />
                                    </NuxtTooltip>
                                </template>
                            </NuxtInput>
                        </NuxtFormField>
                        <NuxtFormField label="IDLE state" :ui="{ container: 'flex flex-col gap-2' }">
                            <NuxtFileUpload 
                                class="w-[300px]" 
                                accept="image/*" 
                                multiple
                                v-model="state.images.inactive"
                            />
                            <NuxtInputNumber :step="100" v-model="data.settings.idle_tick" placeholder="IDLE timer for image change" class="w-full"/>
                        </NuxtFormField>
                        <NuxtFormField label="Active state" :ui="{ container: 'flex flex-col gap-2' }">
                            <NuxtFileUpload 
                                class="w-[300px]" 
                                accept="image/*" 
                                multiple
                                v-model="state.images.active"
                            />
                            <NuxtSelectMenu  v-model="data.settings.animation" :items="['bounce', 'none']" placeholder="IDLE timer for image change" class="w-full"/>
                        </NuxtFormField>
                    </div>
                </template>
            </NuxtPopover>
            <NuxtPopover :content="{ align: 'end' }" v-if="edit">
                <NuxtButton icon="lucide:mic" class="absolute right-12 top-12"></NuxtButton>                
                <template #content>
                    <div class="p-4 flex flex-col gap-4">
                        <span class="text-lg font-bold text-white">Voice options</span>
                        <NuxtFormField label="Voice gain" :hint="`x${microphone.options.value.volumeGainMultiplier}`">
                            <NuxtSlider
                                class="w-[300px]"
                                :max="3" 
                                :min="0"
                                :step=".1"
                                :class="microphone.data.value.volume === undefined ? 'opacity-0' : ''"
                                :model-value="microphone.options.value.volumeGainMultiplier"
                                @update:model-value="(v) => microphone.actions.options.set({ volumeGainMultiplier: v })"
                                :color="(microphone.options.value.volumeGainMultiplier || 1) > 1 ? 'warning' : 'primary'"
                            />
                        </NuxtFormField>
                    </div>
                </template>
            </NuxtPopover>
            <NuxtFormField v-if="edit"
                :label="microphone.data.value.volume ? `Microphone threshold (${microphone.options.value.volumeThreshold}%)` : `Awaiting microphone`"
                :hint="microphone.data.value.name"
                class="absolute bottom-12 left-1/2 -translate-x-1/2 min-w-[300px] max-w-[500px] w-full"
            >
                <NuxtProgress
                    v-model="microphone.data.value.volume" 
                    :max="100"
                    :color
                />
                <NuxtSlider 
                    :max="100" 
                    :step="1"
                    class="absolute top-0" 
                    :class="microphone.data.value.volume === undefined ? 'opacity-0' : ''"
                    :model-value="microphone.options.value.volumeThreshold"
                    @update:model-value="(v) => microphone.actions.options.set({ volumeThreshold: v })"
                    :color
                    :ui="{
                        range: 'opacity-0', track: 'opacity-0'
                    }"
                />
            </NuxtFormField>
            <NuxtTooltip text="Enter a stream mode">
                <NuxtButton @click="actions.stream" class="bottom-12 left-12 absolute">Stream Mode</NuxtButton>
            </NuxtTooltip>
        </div>
    </div>
</template>