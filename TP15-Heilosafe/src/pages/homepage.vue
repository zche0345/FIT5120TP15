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

      <section class="content-grid">
        <section class="hero-card">
          <div class="hero-copy">
            <p class="hero-label">Live UV Update</p>
            <h2 class="hero-title">Your skin has entered the chat.</h2>
            <p class="uv-message">{{ uvMessage }}</p>

            <div class="hero-alert-banner">
              <span class="alert-icon">⚠</span>
              <p>{{ damageAlert }}</p>
            </div>

            <p v-if="apiError" class="api-error">{{ apiError }}</p>
          </div>

          <div class="controls-card">
            <p class="input-hint">Want to test a different UV level?</p>

            <input
              v-model.number="uvIndex"
              type="number"
              min="0"
              max="20"
              placeholder="Enter UV Index"
              class="uv-input"
            />

            <div class="button-grid">
              <button class="action-btn primary-btn" @click="getLocation">
                Check UV at My Location
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
          </div>
        </section>

        <section class="forecast-card">
          <div class="forecast-header">
            <div>
              <p class="section-label">Forecast</p>
              <h3>Weekly UV Trend</h3>
              <p>Your next 7 days, sun-wise</p>
            </div>
            <div class="mini-badge">7 Days</div>
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

        <section class="myth-card">
          <div class="myth-header">
            <div>
              <p class="section-label">UV Myth Check</p>
              <h3>Things people get wrong about the sun</h3>
            </div>
            <div class="mini-badge">Myths</div>
          </div>

          <div class="myth-list">
            <div class="myth-item">
              <h4>If it is not hot, the UV is probably low.</h4>
              <p>
                Nope. UV can still be high even when the weather feels cool, cloudy, or breezy.
              </p>
            </div>

            <div class="myth-item">
              <h4>Sunscreen is just for beach days.</h4>
              <p>
                Not really. Walking to class, sitting outside, or just being out and about still
                adds up.
              </p>
            </div>

            <div class="myth-item">
              <h4>One little sunburn is not that serious.</h4>
              <p>
                Sun damage builds over time, so protecting your skin now really does matter later.
              </p>
            </div>
          </div>
        </section>
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

const UV_COLORS = {
  low: '#9CC600',
  moderate: '#FFC82F',
  high: '#FE7200',
  veryHigh: '#C43108',
  extreme: '#8C1CC7',
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
    apiError.value = 'Could not load live UV data right now, so we are showing the default view.'
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
      color: UV_COLORS.low,
      message:
        'Pretty chill right now. Risk is lower, but SPF is still a smart move.',
    }
  } else if (uv <= 5) {
    return {
      category: 'Moderate',
      color: UV_COLORS.moderate,
      message:
        'The sun is picking up. A little protection now will save you later.',
    }
  } else if (uv <= 7) {
    return {
      category: 'High',
      color: UV_COLORS.high,
      message:
        'UV is high, so your skin is definitely clocking in. SPF, sunnies, and shade would be a good idea.',
    }
  } else if (uv <= 10) {
    return {
      category: 'Very High',
      color: UV_COLORS.veryHigh,
      message:
        'This is strong sun territory. Staying out too long without protection is asking for trouble.',
    }
  } else {
    return {
      category: 'Extreme',
      color: UV_COLORS.extreme,
      message:
        'UV is intense right now. If you are heading out, this is full-protection mode.',
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

const damageAlert = computed(() => {
  const uv = Number(uvIndex.value)
  const minutes = estimateDamageMinutes(uv)

  if (!minutes) {
    return 'UV is low right now. Damage risk is lower, but daily sunscreen is still a smart move.'
  }

  if (uv <= 5) {
    return `Your skin could start taking damage in about ${minutes} minutes, so sunscreen up before heading out.`
  }

  if (uv <= 7) {
    return `Your skin could start taking damage in around ${minutes} minutes. SPF, sunnies, and shade would be a very good idea.`
  }

  if (uv <= 10) {
    return `Your skin could start taking damage in about ${minutes} minutes. Find shade now and limit direct sun exposure.`
  }

  return `Your skin could start taking damage in as little as ${minutes} minutes. Avoid direct sun and go full protection mode.`
})

const uvMessage = computed(() => {
  const uv = Number(uvIndex.value)

  if (uv <= 2) {
    return 'The UV is fairly low right now, but daily sun protection is still a good habit.'
  }

  if (uv <= 5) {
    return 'The sun is getting stronger, so this is where protection starts to matter more.'
  }

  if (uv <= 7) {
    return 'UV is high right now, and unprotected exposure can add up faster than you think.'
  }

  if (uv <= 10) {
    return 'This is strong sun territory, so staying out too long without protection is risky.'
  }

  return 'The UV is extreme right now, so full protection and limited exposure are the safest move.'
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
  if (uv <= 2) return UV_COLORS.low
  if (uv <= 5) return UV_COLORS.moderate
  if (uv <= 7) return UV_COLORS.high
  if (uv <= 10) return UV_COLORS.veryHigh
  return UV_COLORS.extreme
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
  padding: 1.2rem 1.5rem 1.4rem;
  font-family: 'Inter', sans-serif;
  transition: background 0.35s ease;
  overflow-x: hidden;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
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
  background: rgba(255, 255, 255, 0.7);
  color: #1e1b4b;
  font-family: 'Inter', sans-serif;
  font-size: 0.96rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.signout-btn {
  background: rgba(9, 0, 94, 0.88);
  color: white;
  border-color: rgba(9, 0, 94, 0.14);
}

.menu-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.82);
}

.main-content {
  display: grid;
  grid-template-columns: minmax(290px, 390px) minmax(0, 1fr);
  gap: 1.2rem;
  align-items: start;
}

.content-grid {
  display: grid;
  gap: 1rem;
}

.uv-card,
.hero-card,
.forecast-card,
.myth-card,
.controls-card {
  background: rgba(255, 255, 255, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(16px);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.uv-card {
  border-radius: 1.8rem;
  min-height: 520px;
  padding: 1.6rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: sticky;
  top: 1.2rem;
}

.sun-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.4);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
  margin-bottom: 0.55rem;
}

.sun-icon {
  font-size: 3rem;
  line-height: 1;
}

.uv-label {
  margin: 0.5rem 0 0.18rem;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.55rem, 2.2vw, 2.2rem);
  font-weight: 600;
  color: #111827;
}

.uv-number {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(4.2rem, 7vw, 6.4rem);
  line-height: 0.92;
  font-weight: 700;
  color: #02022a;
}

.location {
  margin: 1rem 0 0.2rem;
  font-size: clamp(1.05rem, 1.6vw, 1.35rem);
  font-weight: 600;
  color: #111827;
}

.suburb-label {
  margin: 0 0 0.35rem;
  font-size: 0.94rem;
  font-weight: 500;
  color: #64748b;
}

.temp {
  margin: 0;
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  color: #334155;
}

.uv-chip {
  margin-top: 1.2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.62rem 0.95rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.56);
  color: #111827;
  font-size: 0.92rem;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.chip-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.hero-card {
  border-radius: 1.6rem;
  padding: 1.2rem;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 360px);
  gap: 1rem;
  align-items: stretch;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.hero-label,
.section-label {
  margin: 0 0 0.18rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.hero-title {
  margin: 0 0 0.55rem;
  font-size: clamp(1.55rem, 2.2vw, 2.3rem);
  line-height: 1.05;
  color: #111827;
}

.uv-message {
  margin: 0;
  font-size: clamp(1.05rem, 1.45vw, 1.32rem);
  line-height: 1.45;
  font-weight: 500;
  color: #0f172a;
  max-width: 680px;
}

.hero-alert-banner {
  margin-top: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.95rem 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.42);
}

.hero-alert-banner p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  font-weight: 700;
  color: #111827;
}

.alert-icon {
  font-size: 1.1rem;
  line-height: 1;
  margin-top: 0.05rem;
}

.api-error {
  margin: 0.75rem 0 0;
  font-size: 0.94rem;
  font-weight: 600;
  color: #b42318;
}

.controls-card {
  border-radius: 1.35rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.input-hint {
  margin: 0 0 0.55rem;
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
  background: rgba(255, 255, 255, 0.84);
  color: #0f172a;
  outline: none;
  margin-bottom: 0.8rem;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.03);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.uv-input::placeholder {
  color: #64748b;
}

.uv-input:focus {
  border-color: rgba(31, 29, 240, 0.4);
  box-shadow: 0 0 0 4px rgba(31, 29, 240, 0.08);
  background: rgba(255, 255, 255, 0.94);
}

.button-grid {
  display: grid;
  gap: 0.65rem;
}

.action-btn {
  width: 100%;
  min-height: 48px;
  border-radius: 999px;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.96rem;
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
  background: rgba(255, 255, 255, 0.82);
  color: #111827;
  border: 1px solid rgba(255, 255, 255, 0.42);
}

.awareness-btn {
  background: rgba(9, 0, 94, 0.88);
  color: white;
}

.guide-link,
.awareness-btn {
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.forecast-card {
  border-radius: 1.55rem;
  padding: 1.05rem 1.1rem 1rem;
}

.forecast-header,
.myth-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.forecast-header h3,
.myth-header h3 {
  margin: 0;
  font-size: 1.18rem;
  font-weight: 700;
  color: #111827;
}

.forecast-header p {
  margin: 0.22rem 0 0;
  font-size: 0.88rem;
  color: #64748b;
}

.mini-badge {
  padding: 0.45rem 0.78rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  color: #1e1b4b;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.trend-chart {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.y-axis {
  width: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.12rem 0 1.55rem;
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
  height: 200px;
  display: block;
  border-radius: 1rem;
  background:
    linear-gradient(to top, rgba(148, 163, 184, 0.16) 1px, transparent 1px);
  background-size: 100% 25%;
}

.x-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.15rem;
  margin-top: 0.42rem;
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

.myth-card {
  border-radius: 1.55rem;
  padding: 1.05rem 1.1rem;
}

.myth-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.myth-item {
  padding: 1rem;
  border-radius: 1.1rem;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(255, 255, 255, 0.35);
  min-height: 100%;
}

.myth-item h4 {
  margin: 0 0 0.42rem;
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.35;
  color: #111827;
}

.myth-item p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: #334155;
}

@media (max-width: 1180px) {
  .hero-card {
    grid-template-columns: 1fr;
  }

  .uv-card {
    position: static;
    min-height: 470px;
  }
}

@media (max-width: 960px) {
  .home-page {
    padding: 1rem;
  }

  .main-content {
    grid-template-columns: 1fr;
  }

  .uv-card {
    min-height: auto;
  }

  .myth-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .home-page {
    padding: 0.85rem;
  }

  .top-bar {
    margin-bottom: 0.9rem;
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

  .uv-card,
  .hero-card,
  .forecast-card,
  .myth-card,
  .controls-card {
    border-radius: 1.3rem;
  }

  .uv-card {
    padding: 1.25rem 1rem;
  }

  .hero-card,
  .forecast-card,
  .myth-card {
    padding: 0.9rem;
  }

  .sun-icon-wrap {
    width: 64px;
    height: 64px;
  }

  .sun-icon {
    font-size: 2.4rem;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .forecast-header h3,
  .myth-header h3 {
    font-size: 1.02rem;
  }

  .forecast-header p {
    font-size: 0.8rem;
  }

  .line-svg {
    height: 170px;
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
    min-height: 46px;
    font-size: 0.93rem;
  }

  .hero-alert-banner p {
    font-size: 0.95rem;
  }
}
</style>