export type MicrophoneOptions = Partial<{
    fftSize: number
    tickTime: number
    volumeThreshold: number
    volumeGainMultiplier: number
}>

export type MicrophoneData = Partial<{
    name: string
    loud: boolean
    volume: number
    frame: number
}>
