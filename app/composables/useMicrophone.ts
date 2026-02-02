import { useDebouncer } from '@xlsft/nuxt'

export const useMicrophone = (_options: MicrophoneOptions = {}) => {
    const options = useState<MicrophoneOptions>('microphone:options', () => ({
        fftSize: 256,
        tickTime: 25,
        volumeThreshold: 10,
        volumeGainMultiplier: 1,
        ..._options
    }))

    const data = useState<MicrophoneData>('microphone:data', () => ({
        volume: 0,
        loud: false
    }))

    const started = useState<boolean>('microphone:started', () => false)
    const debouncer = useDebouncer(options.value.tickTime || 25)

    const actions = {
        options: {
            set: (_options: MicrophoneOptions = {}) =>
                options.value = { ...options.value, ..._options }
        }
    }

    onMounted(async () => {
        if (started.value) return
        started.value = true

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const ctx = new AudioContext()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()

        analyser.fftSize = options.value.fftSize || 256
        source.connect(analyser)

        const bytes = new Uint8Array(analyser.frequencyBinCount)
        const track = stream.getAudioTracks()[0]!

        data.value.name = track.label

        const tick = () => {
            analyser.getByteFrequencyData(bytes)

            const avg = bytes.reduce((a, b) => a + b, 0) / bytes.length
            data.value.volume = Math.round((avg / 255) * 100 * (options.value.volumeGainMultiplier || 1))

            data.value.frame = requestAnimationFrame(tick)
        }

        tick()

        watch(() => data.value.volume, () => debouncer.use(() => {
            if (data.value.volume === undefined) return
            data.value.loud = data.value.volume > (options.value.volumeThreshold || 10)
        }))

        onBeforeUnmount(() => {
            if (data.value.frame) cancelAnimationFrame(data.value.frame)
            stream.getTracks().forEach(t => t.stop())
            ctx.close()
            started.value = false
        })
    })

    return {
        options,
        data,
        actions
    }
}
