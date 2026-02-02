import type { MicrophoneData, MicrophoneOptions } from "./microphone.types"

export type Data = {
    settings: {
        scale: number
        color: string,
        idle_tick: number,
        animation: 'none' | 'bounce',
        voice_gain: number
    }
    images: { inactive?: string[], active?: string[] }
    microphone: {
        options?: MicrophoneOptions,
        data?: MicrophoneData
    }
}