<template>
  <div class="guide-page" :style="pageBackground">
    <header class="top-bar">
      <h1 class="logo">HelioSafe</h1>
      <div class="top-actions">
        <router-link to="/home" class="menu-btn nav-link-btn">Back Home</router-link>
        <button class="menu-btn signout-btn" @click="handleSignOut">Sign Out</button>
      </div>
    </header>

    <main class="guide-layout">
      <section class="hero-card">
        <p class="eyebrow">SUN-SMART STYLE</p>
        <h2>Dress for today’s UV.</h2>
        <p class="hero-copy">Quick picks based on your current UV.</p>

        <div class="hero-stats">
          <div class="stat-pill">
            <span class="stat-label">Location</span>
            <strong>{{ displayLocation }}</strong>
          </div>
          <div class="stat-pill">
            <span class="stat-label">Current UV</span>
            <strong>{{ uvValue }}</strong>
          </div>
          <div class="stat-pill">
            <span class="stat-label">Risk</span>
            <strong>{{ clothingGuide.level }}</strong>
          </div>
        </div>
      </section>

      <section class="guide-card">
        <div class="guide-header">
          <div>
            <p class="card-kicker">CLOTHING GUIDE</p>
            <h3>{{ clothingGuide.title }}</h3>
          </div>
          <span class="badge">{{ clothingGuide.level }}</span>
        </div>

        <div class="guide-grid">
          <article class="guide-item">
            <span class="item-label">Top</span>
            <p>{{ clothingGuide.top }}</p>
          </article>
          <article class="guide-item">
            <span class="item-label">Bottom</span>
            <p>{{ clothingGuide.bottom }}</p>
          </article>
          <article class="guide-item">
            <span class="item-label">Accessories</span>
            <p>{{ clothingGuide.accessories }}</p>
          </article>
          <article class="guide-item">
            <span class="item-label">Fabric Tip</span>
            <p>{{ clothingGuide.fabric }}</p>
          </article>
        </div>

        <p class="guide-note">{{ clothingGuide.note }}</p>
        <p v-if="apiError" class="api-error">{{ apiError }}</p>
      </section>

      <section class="tips-card">
        <p class="card-kicker">QUICK CHECK</p>
        <ul class="tips-list">
          <li>More cover blocks more UV.</li>
          <li>Tighter fabrics protect better.</li>
          <li>High UV means hat, sunnies, and SPF.</li>
        </ul>
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
const apiError = ref('')

const fetchDefaultUv = async () => {
  if (Number(route.query.uv)) {
    return
  }

  try {
    const params = new URLSearchParams({
      latitude: String(MELBOURNE_COORDS.latitude),
      longitude: String(MELBOURNE_COORDS.longitude),
      current: 'uv_index',
      timezone: 'Australia/Melbourne',
      forecast_days: '1',
    })

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Unable to fetch UV right now.')
    }

    const data = await response.json()
    const currentUv = Number(data.current?.uv_index)

    if (!Number.isNaN(currentUv)) {
      uvIndex.value = Math.round(currentUv)
    }
  } catch (error) {
    console.error('Failed to fetch fallback UV data', error)
    apiError.value = 'Could not refresh UV right now. Showing the current guide view.'
  }
}

onMounted(() => {
  fetchDefaultUv()
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

const uvValue = computed(() => Math.max(0, Number(uvIndex.value) || 0))

const clothingGuide = computed(() => {
  const uv = uvValue.value

  if (uv <= 2) {
    return {
      level: 'Low',
      title: 'Keep it light.',
      top: 'Tee or light long-sleeve.',
      bottom: 'Shorts, jeans, or easy pants.',
      accessories: 'Sunnies and a little SPF.',
      fabric: 'Cotton or linen blends.',
      note: 'Low UV still is not zero UV.',
    }
  }

  if (uv <= 5) {
    return {
      level: 'Moderate',
      title: 'Add a bit more cover.',
      top: 'Sleeved tee or light overshirt.',
      bottom: 'Longer shorts or relaxed pants.',
      accessories: 'Cap, sunnies, SPF.',
      fabric: 'Tighter weaves work better.',
      note: 'This is where smart cover starts to help.',
    }
  }

  if (uv <= 7) {
    return {
      level: 'High',
      title: 'Cover up now.',
      top: 'Light long-sleeve shirt.',
      bottom: 'Loose pants or longer shorts.',
      accessories: 'Wide-brim hat, sunnies, SPF.',
      fabric: 'Breathable but dense fabrics.',
      note: 'Stay cool, but do not go too light.',
    }
  }

  if (uv <= 10) {
    return {
      level: 'Very High',
      title: 'Dress for strong sun.',
      top: 'Long sleeves or UPF wear.',
      bottom: 'Full pants or long shorts.',
      accessories: 'Hat, sunnies, SPF.',
      fabric: 'UPF or tight sports fabrics.',
      note: 'Protection comes first here.',
    }
  }

  return {
    level: 'Extreme',
    title: 'Full protection mode.',
    top: 'Long sleeves with strong cover.',
    bottom: 'Full-length bottoms.',
    accessories: 'Hat, sunnies, reapply SPF.',
    fabric: 'Dense, dark, UPF fabrics.',
    note: 'Cover as much skin as you can.',
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

.guide-page {
  min-height: 100vh;
  padding: 1.1rem 1.6rem 1.4rem;
  font-family: 'Inter', sans-serif;
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

.menu-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.82);
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
}

.guide-layout {
  display: grid;
  grid-template-columns: minmax(280px, 420px) minmax(0, 1fr);
  gap: 1.2rem;
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
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.hero-card h2,
.guide-header h3 {
  margin: 0.4rem 0 0;
  color: #0f172a;
  font-size: clamp(1.8rem, 2.5vw, 2.6rem);
  line-height: 1.08;
}

.hero-copy,
.guide-note,
.guide-item p,
.tips-list li {
  color: #334155;
  line-height: 1.55;
}

.hero-copy {
  margin: 0.8rem 0 0;
  font-size: 1.03rem;
}

.hero-stats {
  display: grid;
  gap: 0.7rem;
  margin-top: 1rem;
}

.stat-pill {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.6);
}

.stat-pill strong {
  color: #111827;
  font-size: 1rem;
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
  background: rgba(9, 0, 94, 0.88);
  color: white;
  font-size: 0.82rem;
  font-weight: 700;
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
}

.guide-item p {
  margin: 0.45rem 0 0;
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

.tips-list {
  margin: 0.8rem 0 0;
  padding-left: 1.2rem;
}

.tips-list li + li {
  margin-top: 0.5rem;
}

@media (max-width: 900px) {
  .guide-layout {
    grid-template-columns: 1fr;
  }

  .guide-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .guide-page {
    padding: 0.85rem;
  }

  .top-actions {
    gap: 0.45rem;
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
}
</style>
