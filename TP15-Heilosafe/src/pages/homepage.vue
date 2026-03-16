<template>
  <div class="home-page" :style="pageBackground">
    <header class="top-bar">
      <h1 class="logo">HelioSafe</h1>
      <div class="top-actions">
        <button class="menu-btn signout-btn" @click="handleSignOut">Sign Out</button>
      </div>
    </header>

    <main class="main-content">
      <section class="uv-card">
        <div class="sun-icon-wrap">
          <div class="sun-icon">☀</div>
        </div>

        <p class="uv-label">{{ uvCategory }} UV Index</p>
        <h2 class="uv-number">{{ uvIndex }}</h2>

        <p class="location">{{ suburb || location }}</p>
        <p v-if="suburb" class="suburb-label">{{ location }}</p>
        <p class="temp">{{ temperature }}°C</p>

        <div class="uv-chip">
          <span class="chip-dot" :style="{ backgroundColor: uvData.color }"></span>
          <span>{{ uvCategory }} risk level</span>
        </div>
      </section>

      <section class="info-panel">
        <p class="uv-message">{{ uvMessage }}</p>
        <p v-if="apiError" class="api-error">{{ apiError }}</p>

        <section class="forecast-card">
          <div class="forecast-header">
            <div>
              <h3>Weekly UV Trend</h3>
              <p>Predicted UV levels for the next 7 days</p>
            </div>
            <div class="mini-badge">Forecast</div>
          </div>

          <div class="trend-chart">
            <div class="y-axis">
              <span>12</span>
              <span>9</span>
              <span>6</span>
              <span>3</span>
              <span>0</span>
            </div>

            <div class="chart-area">
              <svg
                viewBox="0 0 700 210"
                class="line-svg"
                preserveAspectRatio="none"
              >
                <polyline
                  :points="areaPoints"
                  fill="rgba(31, 29, 240, 0.08)"
                  stroke="none"
                />

                <polyline
                  :points="polylinePoints"
                  fill="none"
                  stroke="#1f1df0"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <circle
                  v-for="(point, index) in chartPoints"
                  :key="index"
                  :cx="point.x"
                  :cy="point.y"
                  r="5.5"
                  :fill="getUvColor(weeklyForecast[index].value)"
                  stroke="white"
                  stroke-width="2"
                />
              </svg>

              <div class="x-labels">
                <div
                  v-for="day in weeklyForecast"
                  :key="day.day"
                  class="x-label-item"
                >
                  <span class="day-name">{{ day.day }}</span>
                  <span class="day-value">{{ day.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="controls">
          <p class="input-hint">Want to see how different UV levels change things?</p>

          <input
            v-model.number="uvIndex"
            type="number"
            min="0"
            max="20"
            placeholder="Enter UV Index"
            class="uv-input"
          />

          <button class="action-btn primary-btn" @click="getLocation">
            Check UV at my location
          </button>

          <router-link
            :to="{
              path: '/clothing-guide',
              query: {
                uv: String(uvIndex),
                location: suburb || location,
              },
            }"
            class="action-btn secondary-btn guide-link"
          >
            Clothing Guide
          </router-link>

          <router-link to="/awareness" class="action-btn awareness-btn">
            Explore UV Impact
          </router-link>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@aws-amplify/auth'

const MELBOURNE_COORDS = {
  latitude: -37.8136,
  longitude: 144.9631,
  name: 'Melbourne',
}

const useCognito = import.meta.env.VITE_USE_COGNITO === 'true'
const router = useRouter()

const uvIndex = ref(2)
const location = ref(MELBOURNE_COORDS.name)
const suburb = ref('')
const temperature = ref(16)
const apiError = ref('')

const weeklyForecast = ref([
  { day: 'Mon', value: 3 },
  { day: 'Tue', value: 5 },
  { day: 'Wed', value: 7 },
  { day: 'Thu', value: 6 },
  { day: 'Fri', value: 8 },
  { day: 'Sat', value: 9 },
  { day: 'Sun', value: 4 },
])

watch(uvIndex, (value) => {
  if (value === '' || value === null || Number.isNaN(Number(value))) {
    uvIndex.value = 0
    return
  }

  if (Number(value) < 0) uvIndex.value = 0
  if (Number(value) > 20) uvIndex.value = 20
})

const getReadableLocation = async (latitude, longitude, fallbackName = 'Current location') => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Reverse geocoding failed')
    }

    const data = await response.json()
    const address = data.address || {}

    const detectedSuburb =
      address.suburb ||
      address.neighbourhood ||
      address.city_district ||
      address.borough ||
      ''

    const detectedCity =
      address.city ||
      address.town ||
      address.municipality ||
      address.county ||
      fallbackName

    suburb.value = detectedSuburb
    location.value = detectedCity
  } catch (error) {
    console.error('Failed to reverse geocode location', error)
    suburb.value = ''
    location.value = fallbackName
  }
}

const fetchUvData = async ({ latitude, longitude, name }) => {
  apiError.value = ''
  location.value = name
  suburb.value = ''

  try {
    await getReadableLocation(latitude, longitude, name)

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,uv_index',
      daily: 'uv_index_max',
      timezone: 'Australia/Melbourne',
      forecast_days: '7',
    })

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Unable to fetch UV data right now.')
    }

    const data = await response.json()
    const currentUv = Number(data.current?.uv_index)
    const currentTemperature = Number(data.current?.temperature_2m)
    const dailyTimes = data.daily?.time ?? []
    const dailyUv = data.daily?.uv_index_max ?? []

    if (!Number.isNaN(currentUv)) {
      uvIndex.value = Math.round(currentUv)
    }

    if (!Number.isNaN(currentTemperature)) {
      temperature.value = Math.round(currentTemperature)
    }

    if (dailyTimes.length && dailyUv.length) {
      weeklyForecast.value = dailyTimes.map((date, index) => ({
        day: new Date(date).toLocaleDateString('en-AU', { weekday: 'short' }),
        value: Math.round(Number(dailyUv[index]) || 0),
      }))
    }
  } catch (error) {
    console.error('Failed to fetch UV data', error)
    apiError.value = 'Unable to load live UV data. Showing the current default view.'
  }
}

const getLocation = () => {
  if (!navigator.geolocation) {
    location.value = 'Location not supported'
    suburb.value = ''
    return
  }

  location.value = 'Detecting location...'
  suburb.value = ''

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      await fetchUvData({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        name: 'Current location',
      })
    },
    () => {
      location.value = 'Location permission denied'
      suburb.value = ''
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    }
  )
}

onMounted(() => {
  fetchUvData(MELBOURNE_COORDS)
})

const handleSignOut = async () => {
  try {
    if (useCognito) {
      await signOut()
    }
  } catch (error) {
    console.error('Failed to sign out cleanly', error)
  } finally {
    router.push('/login')
  }
}

const uvData = computed(() => {
  const uv = Number(uvIndex.value)

  if (uv <= 2) {
    return {
      category: 'Low',
      color: '#A8CF16',
      message:
        'UV is pretty chill right now. You are likely fine for the moment, but SPF is still a good call.',
    }
  } else if (uv <= 5) {
    return {
      category: 'Moderate',
      color: '#FFBC01',
      message:
        'The sun is starting to mean business. A little sunscreen now will save you later.',
    }
  } else if (uv <= 7) {
    return {
      category: 'High',
      color: '#FE7200',
      message:
        'UV is high, so your skin is definitely on the clock. Shade, SPF, and sunnies are your best friends.',
    }
  } else if (uv <= 10) {
    return {
      category: 'Very High',
      color: '#C43108',
      message:
        'This is strong sun territory. Staying out too long without protection is a fast track to a burn.',
    }
  } else {
    return {
      category: 'Extreme',
      color: '#8C1CC7',
      message:
        'UV is absolutely intense right now. If you are heading out, go full protection mode.',
    }
  }
})

const uvCategory = computed(() => uvData.value.category)

const estimateDamageMinutes = (uv) => {
  if (uv <= 2) return null
  if (uv <= 5) return 45
  if (uv <= 7) return 25
  if (uv <= 10) return 15
  return 10
}

const uvMessage = computed(() => {
  const uv = Number(uvIndex.value)
  const minutes = estimateDamageMinutes(uv)

  if (!minutes) {
    return 'UV is low right now. You are not in instant-burn mode, but daily SPF is still the smart move.'
  }

  if (uv <= 5) {
    return `UV is climbing. Your skin could start taking damage in about ${minutes} minutes, so throw on sunscreen before you settle in outside.`
  }

  if (uv <= 7) {
    return `Your skin could start taking damage in around ${minutes} minutes. SPF up, grab your sunnies, and look for shade soon.`
  }

  if (uv <= 10) {
    return `Your skin could start taking damage in about ${minutes} minutes. Find shade now and do not let the sun cook you.`
  }

  return `Your skin could start taking damage in as little as ${minutes} minutes. This is your cue to avoid direct sun and go full SPF mode.`
})

const pageBackground = computed(() => ({
  background: `linear-gradient(
    135deg,
    ${uvData.value.color} 0%,
    rgba(255,255,255,0.72) 46%,
    rgba(255,255,255,0.90) 54%,
    ${uvData.value.color} 100%
  )`,
}))

const getUvColor = (uv) => {
  if (uv <= 2) return '#A8CF16'
  if (uv <= 5) return '#FFBC01'
  if (uv <= 7) return '#FE7200'
  if (uv <= 10) return '#C43108'
  return '#8C1CC7'
}

const chartPoints = computed(() => {
  const maxValue = 12
  const width = 700
  const height = 210
  const paddingX = 42
  const paddingY = 18
  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingY * 2

  return weeklyForecast.value.map((item, index) => {
    const x =
      weeklyForecast.value.length > 1
        ? paddingX + (index * usableWidth) / (weeklyForecast.value.length - 1)
        : width / 2

    const y = height - paddingY - (item.value / maxValue) * usableHeight
    return { x, y }
  })
})

const polylinePoints = computed(() => {
  return chartPoints.value.map((point) => `${point.x},${point.y}`).join(' ')
})

const areaPoints = computed(() => {
  if (!chartPoints.value.length) return ''

  const first = chartPoints.value[0]
  const last = chartPoints.value[chartPoints.value.length - 1]

  return [
    `${first.x},192`,
    ...chartPoints.value.map((point) => `${point.x},${point.y}`),
    `${last.x},192`,
  ].join(' ')
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
}

:global(html),
:global(body),
:global(#app) {
  margin: 0;
  width: 100%;
  min-height: 100%;
  overflow-x: hidden;
}

.home-page {
  min-height: 100vh;
  width: 100%;
  padding: 1.1rem 1.6rem 1.25rem;
  font-family: 'Inter', sans-serif;
  transition: background 0.35s ease;
  overflow-x: hidden;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.top-actions {
  display: flex;
  gap: 0.7rem;
}

.logo {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.2rem, 3vw, 3.2rem);
  line-height: 1;
  font-style: italic;
  font-weight: 700;
  color: #09005e;
  letter-spacing: -0.02em;
}

.menu-btn {
  min-width: 108px;
  height: 42px;
  border: 1px solid rgba(9, 0, 94, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  color: #1e1b4b;
  font-family: 'Inter', sans-serif;
  font-size: 0.96rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.nav-link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.signout-btn {
  background: rgba(9, 0, 94, 0.86);
  color: white;
  border-color: rgba(9, 0, 94, 0.14);
}

.menu-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.82);
}

.main-content {
  display: grid;
  grid-template-columns: minmax(280px, 410px) minmax(0, 1fr);
  gap: 1.2rem;
  align-items: start;
}

.uv-card,
.forecast-card {
  background: rgba(255, 255, 255, 0.26);
  border: 1px solid rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(16px);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.uv-card {
  border-radius: 1.8rem;
  min-height: 450px;
  padding: 1.45rem 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.sun-icon-wrap {
  width: 74px;
  height: 74px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.38);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  margin-bottom: 0.45rem;
}

.sun-icon {
  font-size: 2.8rem;
  line-height: 1;
}

.uv-label {
  margin: 0.45rem 0 0.15rem;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.5rem, 2.1vw, 2.1rem);
  font-weight: 600;
  color: #111827;
}

.uv-number {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(3.8rem, 7vw, 6.1rem);
  line-height: 0.95;
  font-weight: 700;
  color: #02022a;
}

.location {
  margin: 0.95rem 0 0.2rem;
  font-size: clamp(1.05rem, 1.6vw, 1.35rem);
  font-weight: 600;
  color: #111827;
}

.suburb-label {
  margin: 0 0 0.3rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #475569;
}

.temp {
  margin: 0;
  font-size: clamp(1rem, 1.4vw, 1.25rem);
  color: #334155;
}

.uv-chip {
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.54);
  color: #111827;
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.chip-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.info-panel {
  padding-top: 0.1rem;
}

.uv-message {
  max-width: 700px;
  margin: 0 0 0.8rem;
  font-size: clamp(1.12rem, 1.65vw, 1.55rem);
  line-height: 1.35;
  font-weight: 500;
  color: #0f172a;
}

.api-error {
  margin: -0.2rem 0 0.8rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #b42318;
}

.forecast-card {
  max-width: 760px;
  border-radius: 1.55rem;
  padding: 0.95rem 1.05rem 0.9rem;
  margin-bottom: 0.8rem;
}

.forecast-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.7rem;
}

.forecast-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #111827;
}

.forecast-header p {
  margin: 0.2rem 0 0;
  font-size: 0.88rem;
  color: #475569;
}

.mini-badge {
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  color: #1e1b4b;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.trend-chart {
  display: flex;
  gap: 0.7rem;
  align-items: stretch;
}

.y-axis {
  width: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.15rem 0 1.55rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
}

.chart-area {
  flex: 1;
  min-width: 0;
}

.line-svg {
  width: 100%;
  height: 195px;
  display: block;
  border-radius: 0.95rem;
  background:
    linear-gradient(to top, rgba(148, 163, 184, 0.16) 1px, transparent 1px);
  background-size: 100% 25%;
}

.x-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.15rem;
  margin-top: 0.35rem;
}

.x-label-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.08rem;
}

.day-name {
  font-size: 0.76rem;
  color: #334155;
  font-weight: 700;
}

.day-value {
  font-size: 0.72rem;
  color: #64748b;
}

.controls {
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.input-hint {
  margin: 0 0 0.05rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: #475569;
}

.uv-input {
  width: 100%;
  height: 48px;
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 0.95rem;
  padding: 0 0.95rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.98rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.82);
  color: #0f172a;
  outline: none;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.uv-input::placeholder {
  color: #64748b;
}

.uv-input:focus {
  border-color: rgba(31, 29, 240, 0.4);
  box-shadow: 0 0 0 4px rgba(31, 29, 240, 0.08);
  background: rgba(255, 255, 255, 0.92);
}

.action-btn {
  width: 100%;
  min-height: 50px;
  border-radius: 999px;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.action-btn:hover {
  transform: translateY(-1px);
}

.primary-btn {
  background: linear-gradient(135deg, #1d4ed8, #4338ca);
  color: white;
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.78);
  color: #111827;
  border: 1px solid rgba(255, 255, 255, 0.42);
}

.guide-link {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.awareness-btn {
  background: rgba(9, 0, 94, 0.88);
  color: white;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1100px) {
  .home-page {
    padding: 1rem 1.1rem 1.1rem;
  }

  .main-content {
    grid-template-columns: 340px 1fr;
    gap: 1rem;
  }

  .uv-card {
    min-height: 420px;
  }
}

@media (max-width: 900px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .uv-card {
    min-height: auto;
  }

  .forecast-card,
  .controls {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .home-page {
    padding: 0.85rem;
  }

  .top-bar {
    margin-bottom: 0.85rem;
  }

  .logo {
    font-size: 2rem;
  }

  .menu-btn {
    min-width: 92px;
    height: 38px;
    font-size: 0.9rem;
  }

  .top-actions {
    gap: 0.45rem;
  }

  .uv-card {
    border-radius: 1.4rem;
    padding: 1.2rem 1rem;
  }

  .sun-icon-wrap {
    width: 62px;
    height: 62px;
  }

  .sun-icon {
    font-size: 2.35rem;
  }

  .forecast-card {
    border-radius: 1.3rem;
    padding: 0.85rem;
  }

  .forecast-header {
    align-items: flex-start;
  }

  .forecast-header h3 {
    font-size: 1.05rem;
  }

  .forecast-header p {
    font-size: 0.8rem;
  }

  .line-svg {
    height: 165px;
  }

  .day-name,
  .day-value,
  .y-axis {
    font-size: 0.68rem;
  }

  .uv-input {
    height: 46px;
    font-size: 0.95rem;
  }

  .action-btn {
    min-height: 48px;
    font-size: 0.94rem;
  }
}
</style>