<template>
  <div class="guide-page" :style="pageBackground">
    <header class="top-bar">
      <h1 class="logo">HelioSafe</h1>
      <div class="top-actions">
        <router-link to="/home" class="menu-btn nav-link-btn">Back Home</router-link>
        <button class="menu-btn location-btn" @click="refreshWithCurrentLocation" :disabled="isRefreshing">
          {{ isRefreshing ? 'Locating...' : 'Use My Location' }}
        </button>
        <button class="menu-btn signout-btn" @click="handleSignOut">Sign Out</button>
      </div>
    </header>

    <main class="guide-layout">
      <section class="hero-card">
        <p class="eyebrow">SUN-SMART STYLE</p>
        <h2>Dress for today’s UV.</h2>
        <p class="hero-copy">
          Live clothing and protection recommendations based on the current UV at your location.
        </p>

        <div class="hero-main">
          <div class="uv-meter">
            <div class="uv-ring" :style="uvRingStyle">
              <div class="uv-ring-inner">
                <span class="uv-ring-label">UV</span>
                <strong class="uv-ring-value">{{ uvDisplay }}</strong>
              </div>
            </div>
          </div>

          <div class="hero-summary">
            <div class="hero-stats">
              <div class="stat-pill">
                <span class="stat-label">Location</span>
                <strong>{{ displayLocation }}</strong>
              </div>
              <div class="stat-pill">
                <span class="stat-label">Current UV</span>
                <strong>{{ uvDisplay }}</strong>
              </div>
              <div class="stat-pill">
                <span class="stat-label">Risk</span>
                <strong>{{ clothingGuide.level }}</strong>
              </div>
              <div class="stat-pill">
                <span class="stat-label">Temperature</span>
                <strong>{{ temperatureDisplay }}</strong>
              </div>
            </div>

            <div class="risk-banner" :style="{ background: clothingGuide.bannerBg, color: clothingGuide.bannerText }">
              <span class="risk-emoji">{{ clothingGuide.emoji }}</span>
              <div>
                <p class="risk-title">{{ clothingGuide.bannerTitle }}</p>
                <p class="risk-copy">{{ clothingGuide.bannerCopy }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="guide-card">
        <div class="guide-header">
          <div>
            <p class="card-kicker">CLOTHING GUIDE</p>
            <h3>{{ clothingGuide.title }}</h3>
          </div>
          <span class="badge" :style="{ background: clothingGuide.badgeBg, color: clothingGuide.badgeText }">
            {{ clothingGuide.level }}
          </span>
        </div>

        <div class="guide-grid">
          <article class="guide-item">
            <div class="item-head">
              <span class="item-icon">👕</span>
              <span class="item-label">Top</span>
            </div>
            <p>{{ clothingGuide.top }}</p>
          </article>

          <article class="guide-item">
            <div class="item-head">
              <span class="item-icon">👖</span>
              <span class="item-label">Bottom</span>
            </div>
            <p>{{ clothingGuide.bottom }}</p>
          </article>

          <article class="guide-item">
            <div class="item-head">
              <span class="item-icon">🧢</span>
              <span class="item-label">Accessories</span>
            </div>
            <p>{{ clothingGuide.accessories }}</p>
          </article>

          <article class="guide-item">
            <div class="item-head">
              <span class="item-icon">🧵</span>
              <span class="item-label">Fabric Tip</span>
            </div>
            <p>{{ clothingGuide.fabric }}</p>
          </article>
        </div>

        <div class="extras-strip">
          <div v-for="extra in clothingGuide.extras" :key="extra.label" class="extra-pill">
            <span class="extra-icon">{{ extra.icon }}</span>
            <span>{{ extra.label }}</span>
          </div>
        </div>

        <p class="guide-note">{{ clothingGuide.note }}</p>
        <p v-if="apiError" class="api-error">{{ apiError }}</p>
      </section>

      <section class="tips-card">
        <div class="tips-header">
          <div>
            <p class="card-kicker">QUICK CHECK</p>
            <h3>What matters most right now</h3>
          </div>
        </div>

        <div class="tips-grid">
          <article class="tip-box">
            <span class="tip-icon">☀️</span>
            <p>{{ quickTips[0] }}</p>
          </article>
          <article class="tip-box">
            <span class="tip-icon">🕶️</span>
            <p>{{ quickTips[1] }}</p>
          </article>
          <article class="tip-box">
            <span class="tip-icon">🧴</span>
            <p>{{ quickTips[2] }}</p>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { signOut } from '@aws-amplify/auth'

const MELBOURNE_COORDS = {
  latitude: -37.8136,
  longitude: 144.9631,
  name: 'Melbourne',
}

const useCognito = import.meta.env.VITE_USE_COGNITO === 'true'
const route = useRoute()
const router = useRouter()

const uvIndex = ref(Number(route.query.uv) || 0)
const location = ref(route.query.location?.toString() || MELBOURNE_COORDS.name)
const temperature = ref(null)
const apiError = ref('')
const isRefreshing = ref(false)

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

const getNearestHourUv = (times = [], values = []) => {
  if (!times.length || !values.length) return 0

  const now = new Date()
  let closestIndex = 0
  let smallestDiff = Infinity

  times.forEach((time, index) => {
    const diff = Math.abs(new Date(time).getTime() - now.getTime())
    if (diff < smallestDiff) {
      smallestDiff = diff
      closestIndex = index
    }
  })

  return Number(values[closestIndex] ?? 0)
}

const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    )

    if (!response.ok) return

    const data = await response.json()
    const resolvedName =
      data.address?.suburb ||
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.state

    if (resolvedName) {
      location.value = resolvedName
    }
  } catch (error) {
    console.error('Reverse geocoding failed', error)
  }
}

const fetchUvByCoords = async (latitude, longitude, fallbackName = MELBOURNE_COORDS.name) => {
  isRefreshing.value = true
  apiError.value = ''
  location.value = fallbackName

  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      hourly: 'uv_index',
      current: 'temperature_2m',
      timezone: 'auto',
      forecast_days: '1',
    })

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Unable to fetch UV right now.')
    }

    const data = await response.json()
    const currentUv = getNearestHourUv(data.hourly?.time, data.hourly?.uv_index)

    if (!Number.isNaN(currentUv)) {
      uvIndex.value = Number(currentUv.toFixed(1))
    }

    const currentTemp = Number(data.current?.temperature_2m)
    if (!Number.isNaN(currentTemp)) {
      temperature.value = currentTemp
    }

    await reverseGeocode(latitude, longitude)
  } catch (error) {
    console.error('Failed to fetch UV data', error)
    apiError.value = 'Could not refresh UV right now. Showing the latest available guide.'
  } finally {
    isRefreshing.value = false
  }
}

const fetchDefaultUv = async () => {
  if (Number(route.query.uv)) {
    return
  }

  await fetchUvByCoords(
    MELBOURNE_COORDS.latitude,
    MELBOURNE_COORDS.longitude,
    MELBOURNE_COORDS.name
  )
}

const refreshWithCurrentLocation = async () => {
  if (!navigator.geolocation) {
    await fetchUvByCoords(
      MELBOURNE_COORDS.latitude,
      MELBOURNE_COORDS.longitude,
      MELBOURNE_COORDS.name
    )
    return
  }

  isRefreshing.value = true
  apiError.value = ''

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      await fetchUvByCoords(latitude, longitude, 'Your location')
    },
    async () => {
      apiError.value = 'Location access was unavailable, so Melbourne is being used.'
      await fetchUvByCoords(
        MELBOURNE_COORDS.latitude,
        MELBOURNE_COORDS.longitude,
        MELBOURNE_COORDS.name
      )
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    }
  )
}

onMounted(() => {
  fetchDefaultUv()
})

const uvValue = computed(() => Math.max(0, Number(uvIndex.value) || 0))

const uvDisplay = computed(() => {
  const uv = uvValue.value
  return Number.isInteger(uv) ? String(uv) : uv.toFixed(1)
})

const temperatureDisplay = computed(() => {
  if (temperature.value === null || Number.isNaN(temperature.value)) return '—'
  return `${Math.round(temperature.value)}°C`
})

const clothingGuide = computed(() => {
  const uv = uvValue.value

  if (uv <= 2) {
    return {
      level: 'Low',
      emoji: '🟢',
      title: 'Keep it easy, but do not ignore the sun.',
      top: 'T-shirt, polo, or a light long-sleeve if you want a little extra cover.',
      bottom: 'Shorts, jeans, skirts, or relaxed pants all work fine.',
      accessories: 'Sunglasses are still a good idea, and SPF helps if you are outdoors longer.',
      fabric: 'Cotton, linen blends, or other light fabrics are fine at this level.',
      note: 'Low UV is easier to manage, but repeated exposure still builds up over time.',
      bannerTitle: 'Low UV right now',
      bannerCopy: 'Normal clothing is usually okay, but basic protection is still smart for longer time outside.',
      bannerBg: 'rgba(34, 197, 94, 0.14)',
      bannerText: '#166534',
      badgeBg: 'rgba(34, 197, 94, 0.14)',
      badgeText: '#166534',
      extras: [
        { icon: '🕶️', label: 'Sunnies help' },
        { icon: '🧴', label: 'Light SPF if outside longer' },
        { icon: '🌤️', label: 'Still stay aware' },
      ],
    }
  }

  if (uv <= 5) {
    return {
      level: 'Moderate',
      emoji: '🟡',
      title: 'Add a bit more cover.',
      top: 'Sleeved tee, polo, or light overshirt for better shoulder and upper-arm cover.',
      bottom: 'Longer shorts, relaxed trousers, or anything with a bit more leg coverage.',
      accessories: 'Cap or hat, sunglasses, and SPF 30+ before heading out.',
      fabric: 'Tighter weaves protect better than very thin or see-through fabrics.',
      note: 'This is where smart cover starts making a proper difference.',
      bannerTitle: 'Moderate UV',
      bannerCopy: 'You do not need full protection mode yet, but sunscreen, sunglasses and a hat are a solid move.',
      bannerBg: 'rgba(245, 158, 11, 0.14)',
      bannerText: '#92400e',
      badgeBg: 'rgba(245, 158, 11, 0.16)',
      badgeText: '#92400e',
      extras: [
        { icon: '🧴', label: 'SPF 30+' },
        { icon: '🧢', label: 'Cap or hat' },
        { icon: '🌳', label: 'Use shade when you can' },
      ],
    }
  }

  if (uv <= 7) {
    return {
      level: 'High',
      emoji: '🟠',
      title: 'Cover up now.',
      top: 'Light long-sleeve shirt, airy overshirt, or breathable covered sportswear.',
      bottom: 'Loose pants, maxi skirt, or longer shorts with more skin coverage.',
      accessories: 'Wide-brim hat, sunnies, and SPF 50+ are the move here.',
      fabric: 'Breathable but denser fabrics work best so you stay cool without being too exposed.',
      note: 'Stay cool, but do not go too light. This UV can damage skin faster than it feels.',
      bannerTitle: 'High UV',
      bannerCopy: 'Now it makes sense to cover more skin and stop relying on just a T-shirt and vibes.',
      bannerBg: 'rgba(249, 115, 22, 0.14)',
      bannerText: '#9a3412',
      badgeBg: 'rgba(249, 115, 22, 0.16)',
      badgeText: '#9a3412',
      extras: [
        { icon: '👕', label: 'Long sleeves help' },
        { icon: '🧴', label: 'SPF 50+' },
        { icon: '👒', label: 'Wide-brim hat' },
      ],
    }
  }

  if (uv <= 10) {
    return {
      level: 'Very High',
      emoji: '🔴',
      title: 'Dress for strong sun.',
      top: 'Long sleeves, UPF shirt, or performance fabric that covers shoulders, chest and arms.',
      bottom: 'Full pants or long shorts are better than leaving lots of skin exposed.',
      accessories: 'Hat, sunglasses, SPF 50+, and shade breaks are all important now.',
      fabric: 'UPF fabrics or tighter sportswear fabrics are better than loose thin materials.',
      note: 'Protection comes first here. Cool weather does not mean safe UV.',
      bannerTitle: 'Very high UV',
      bannerCopy: 'Skin damage can happen quickly, so dress for strong sun and limit direct exposure where you can.',
      bannerBg: 'rgba(239, 68, 68, 0.14)',
      bannerText: '#991b1b',
      badgeBg: 'rgba(239, 68, 68, 0.16)',
      badgeText: '#991b1b',
      extras: [
        { icon: '⛱️', label: 'Seek shade' },
        { icon: '🧴', label: 'Reapply SPF' },
        { icon: '👖', label: 'More leg cover' },
      ],
    }
  }

  return {
    level: 'Extreme',
    emoji: '🟣',
    title: 'Full protection mode.',
    top: 'Full-cover long sleeves or UPF clothing with strong sun protection.',
    bottom: 'Full-length bottoms are the safest call at this level.',
    accessories: 'Wide-brim hat, sunglasses, SPF 50+, and avoid direct exposure as much as possible.',
    fabric: 'Dense, darker, tightly woven, or UPF-rated fabrics are the safest option.',
    note: 'Cover as much skin as you can and reduce your time in direct sun.',
    bannerTitle: 'Extreme UV',
    bannerCopy: 'This is serious exposure. Protection is urgent, and limiting time in direct sun is the best move.',
    bannerBg: 'rgba(124, 58, 237, 0.14)',
    bannerText: '#5b21b6',
    badgeBg: 'rgba(124, 58, 237, 0.16)',
    badgeText: '#5b21b6',
    extras: [
      { icon: '🏠', label: 'Avoid direct sun' },
      { icon: '🧴', label: 'Maximum SPF' },
      { icon: '👕', label: 'Full cover clothing' },
    ],
  }
})

const quickTips = computed(() => {
  const uv = uvValue.value

  if (uv <= 2) {
    return [
      'Low UV does not mean zero UV. Basic protection still helps if you are out for hours.',
      'Sunglasses are still worth wearing, especially when the sun feels bright.',
      'SPF is useful for longer outdoor time even on easier UV days.',
    ]
  }

  if (uv <= 5) {
    return [
      'A bit more coverage on shoulders, chest and face makes a visible difference now.',
      'Hat plus sunnies is better than either one alone.',
      'SPF 30+ should start being part of the routine before you head outside.',
    ]
  }

  if (uv <= 7) {
    return [
      'A lightweight long-sleeve is a smarter pick than very exposed clothing.',
      'Eye and face protection matter more once UV moves into the high range.',
      'Use SPF 50+ and reapply if you stay outside or get sweaty.',
    ]
  }

  if (uv <= 10) {
    return [
      'Even if the weather feels cool, UV this high can still damage skin quickly.',
      'Wide-brim hats protect more of your face, neck and ears than a basic cap.',
      'Sunscreen alone is not enough here. Shade and covered clothing matter too.',
    ]
  }

  return [
    'Try to avoid long time in direct sun when UV is extreme.',
    'Covered clothing is more reliable than relying only on sunscreen.',
    'Shade, full cover, and less exposure time are the best choices right now.',
  ]
})

const uvRingStyle = computed(() => {
  const uv = Math.min(uvValue.value, 12)
  const degrees = (uv / 12) * 360

  let color = '#22c55e'
  if (uv > 2 && uv <= 5) color = '#f59e0b'
  else if (uv > 5 && uv <= 7) color = '#f97316'
  else if (uv > 7 && uv <= 10) color = '#ef4444'
  else if (uv > 10) color = '#7c3aed'

  return {
    background: `conic-gradient(${color} ${degrees}deg, rgba(255,255,255,0.42) ${degrees}deg 360deg)`,
  }
})

const pageBackground = computed(() => {
  const uv = uvValue.value
  const tint =
    uv <= 2 ? '#d9f17a' :
    uv <= 5 ? '#ffd166' :
    uv <= 7 ? '#ff9b42' :
    uv <= 10 ? '#ff6b35' :
    '#c445ff'

  return {
    background: `linear-gradient(135deg, ${tint} 0%, rgba(255,255,255,0.84) 45%, rgba(255,255,255,0.94) 55%, ${tint} 100%)`,
  }
})

const displayLocation = computed(() => location.value || MELBOURNE_COORDS.name)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

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

.guide-page {
  min-height: 100vh;
  padding: 1.1rem 1.6rem 1.4rem;
  font-family: 'Inter', sans-serif;
  transition: background 0.35s ease;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
}

.top-actions {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.logo {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.2rem, 3vw, 3.2rem);
  line-height: 1;
  font-style: italic;
  font-weight: 700;
  color: #09005e;
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
  text-decoration: none;
}

.menu-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.82);
}

.menu-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.nav-link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.location-btn {
  background: rgba(255, 255, 255, 0.82);
}

.signout-btn {
  background: rgba(9, 0, 94, 0.86);
  color: white;
}

.guide-layout {
  display: grid;
  grid-template-columns: minmax(320px, 430px) minmax(0, 1fr);
  gap: 1.2rem;
  align-items: start;
}

.hero-card,
.guide-card,
.tips-card {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(16px);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
  border-radius: 1.7rem;
}

.hero-card {
  padding: 1.45rem 1.3rem;
}

.eyebrow,
.card-kicker,
.item-label,
.stat-label {
  margin: 0;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-card h2,
.guide-header h3,
.tips-header h3 {
  margin: 0.35rem 0 0;
  color: #0f172a;
  line-height: 1.08;
}

.hero-card h2 {
  font-size: clamp(1.9rem, 2.2vw, 2.7rem);
}

.guide-header h3,
.tips-header h3 {
  font-size: clamp(1.35rem, 1.7vw, 1.9rem);
}

.hero-copy,
.guide-note,
.guide-item p,
.tip-box p,
.risk-copy {
  color: #334155;
  line-height: 1.55;
}

.hero-copy {
  margin: 0.8rem 0 0;
  font-size: 1.02rem;
}

.hero-main {
  display: grid;
  gap: 1rem;
  margin-top: 1.1rem;
}

.uv-meter {
  display: flex;
  justify-content: center;
}

.uv-ring {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  padding: 12px;
  box-shadow: inset 0 0 18px rgba(255, 255, 255, 0.55);
}

.uv-ring-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.uv-ring-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.uv-ring-value {
  font-size: 3.1rem;
  line-height: 1;
  color: #111827;
}

.hero-summary {
  display: grid;
  gap: 0.9rem;
}

.hero-stats {
  display: grid;
  gap: 0.7rem;
}

.stat-pill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.6);
  gap: 1rem;
}

.stat-pill strong {
  color: #111827;
  font-size: 1rem;
  text-align: right;
}

.risk-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 1.15rem;
}

.risk-emoji {
  font-size: 1.25rem;
  line-height: 1;
}

.risk-title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 800;
}

.risk-copy {
  margin: 0.2rem 0 0;
  font-size: 0.92rem;
}

.guide-card {
  padding: 1.2rem 1.2rem 1rem;
}

.guide-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.badge {
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.guide-item {
  padding: 1rem;
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.56);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.item-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-icon {
  font-size: 1.05rem;
}

.guide-item p {
  margin: 0.5rem 0 0;
  font-size: 0.97rem;
}

.extras-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.extra-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.62);
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 700;
}

.extra-icon {
  font-size: 1rem;
}

.guide-note {
  margin: 1rem 0 0;
  font-size: 0.98rem;
  font-weight: 600;
}

.api-error {
  margin: 0.6rem 0 0;
  color: #b42318;
  font-size: 0.92rem;
  font-weight: 600;
}

.tips-card {
  grid-column: 1 / -1;
  padding: 1.15rem 1.2rem;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin-top: 0.9rem;
}

.tip-box {
  padding: 1rem;
  border-radius: 1.15rem;
  background: rgba(255, 255, 255, 0.58);
}

.tip-icon {
  display: inline-block;
  font-size: 1.2rem;
  margin-bottom: 0.45rem;
}

.tip-box p {
  margin: 0;
  font-size: 0.95rem;
}

@media (max-width: 980px) {
  .guide-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .guide-grid,
  .tips-grid {
    grid-template-columns: 1fr;
  }

  .uv-ring {
    width: 155px;
    height: 155px;
  }

  .uv-ring-value {
    font-size: 2.7rem;
  }
}

@media (max-width: 640px) {
  .guide-page {
    padding: 0.85rem;
  }

  .top-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .top-actions {
    gap: 0.45rem;
    width: 100%;
  }

  .menu-btn {
    min-width: 92px;
    height: 38px;
    font-size: 0.9rem;
  }

  .hero-card,
  .guide-card,
  .tips-card {
    border-radius: 1.35rem;
  }

  .stat-pill {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-pill strong {
    text-align: left;
  }
}
</style>