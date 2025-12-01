<script setup lang="ts">
import { useDebouncer } from '@xlsft/nuxt';

  const route = useRoute();
  const color = route.query.color as string || '#00ff00';
  const volume = ref(0)
  const debouncer = useDebouncer(25)
  let raf: number | null = null
  let analyser: AnalyserNode | null = null

  onMounted(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const ctx = new AudioContext()
    const source = ctx.createMediaStreamSource(stream)

    analyser = ctx.createAnalyser()
    analyser.fftSize = 256

    source.connect(analyser)

    const data = new Uint8Array(analyser.frequencyBinCount)

    const loop = () => {
      if (!analyser) return
      analyser.getByteFrequencyData(data)
      
      // Берём среднее значение энергии
      const avg = data.reduce((a, b) => a + b, 0) / data.length

      // Нормируем 0–255 → 0–100
      volume.value = Math.round((avg / 255) * 100)
      

      raf = requestAnimationFrame(loop)
    }

    loop()
  })
  const active = ref(false)
  watch(volume, (v) => debouncer.use(() => {
    if (v > 10) {
      active.value = true
    } else {
      active.value = false
    }
  }))

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
  })
</script>

<template>
  <div 
    :style="`
      height: 100vh;
      width: 100vw;
      background-color: ${color};
      display: flex;
      justify-content: center;
      align-items: center;
    `"
  >
    <img 
      :style="`
        transition: all 0.3s ease;
        filter: grayscale(${active ? '0' : '0.5'});
        animation: ${active ? 'bounce 0.5s' : 'none'};
      `"
      :src="active ? `/active.png` : `/default.png`"
    >
  </div>
</template>

<style>
  body {
    margin: 0;
  }
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0)
    }
    50% {
      transform: translateY(-20px)
    }
  }
</style>