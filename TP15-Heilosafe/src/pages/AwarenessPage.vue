<template>
  <div class="awareness-page" :style="pageBackground">
    <header class="top-bar">
      <h1 class="logo">HelioSafe</h1>
      <div class="top-actions">
        <router-link to="/home" class="nav-btn">Back Home</router-link>
        <button class="nav-btn signout-btn" @click="handleSignOut">Sign Out</button>
      </div>
    </header>

    <main class="main-content">
      <section class="intro-card glass-card">
        <p class="eyebrow">UV Awareness</p>
        <h2>The sun is not always harmless. Your skin knows.</h2>
        <p class="intro-copy">
          Real melanoma data, made easier to understand so the risk feels real, not just like
          another number on a screen.
        </p>

        <div class="tab-row">
          <button
            class="tab-btn"
            :class="{ active: activeView === 'impact' }"
            @click="activeView = 'impact'"
          >
            By State
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeView === 'age' }"
            @click="activeView = 'age'"
          >
            By Age Group
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeView === 'uv' }"
            @click="activeView = 'uv'"
          >
            UV Trends
          </button>
        </div>
      </section>

      <section class="visual-panel">
        <section v-if="loading" class="glass-card chart-card">
          <p class="loading-copy">Loading awareness data...</p>
        </section>

        <section v-else-if="apiError" class="glass-card chart-card">
          <p class="error-copy">{{ apiError }}</p>
        </section>

        <section v-else-if="activeView === 'impact'" class="glass-card chart-card">
          <div class="card-header">
            <div>
              <p class="section-label">Australia by state</p>
              <h3>Melanoma cases by state</h3>
            </div>
            <div class="mini-badge">Awareness</div>
          </div>

          <div class="bar-chart">
            <div
              v-for="item in skinCancerImpact"
              :key="item.label"
              class="bar-item"
            >
              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ height: `${(item.value / maxImpactValue) * 100}%` }"
                ></div>
              </div>
              <span class="bar-value">{{ item.value }}</span>
              <span class="bar-label">{{ item.label }}</span>
            </div>
          </div>

          <p class="chart-explainer">
            UV exposure does not hit the same everywhere. The damage builds over time, which is
            why protecting your skin is an everyday thing, not just a summer thing.
          </p>
        </section>

        <section v-else-if="activeView === 'age'" class="glass-card chart-card">
          <div class="card-header">
            <div>
              <p class="section-label">Australia by age</p>
              <h3>Melanoma cases by age group</h3>
            </div>
            <div class="mini-badge">Age view</div>
          </div>

          <div class="bar-chart age-chart">
            <div
              v-for="item in ageImpact"
              :key="item.label"
              class="bar-item"
            >
              <div class="bar-track">
                <div
                  class="bar-fill age-fill"
                  :style="{ height: `${(item.value / maxAgeValue) * 100}%` }"
                ></div>
              </div>
              <span class="bar-value">{{ item.value }}</span>
              <span class="bar-label">{{ item.label }}</span>
            </div>
          </div>

          <p class="chart-explainer">
            Skin damage is sneaky. It builds up bit by bit, so the habits you have now actually
            matter way more than you think.
          </p>
        </section>

        <section v-else class="glass-card chart-card">
          <div class="card-header">
            <div>
              <p class="section-label">Australia over time</p>
              <h3>Average UV index by year</h3>
            </div>
            <div class="mini-badge">Trend view</div>
          </div>

          <div class="trend-chart-shell">
            <div class="trend-scale">
              <span>{{ maxUvValue.toFixed(2) }}</span>
              <span>{{ midpointUvValue.toFixed(2) }}</span>
              <span>{{ minUvValue.toFixed(2) }}</span>
            </div>

            <div class="trend-chart">
              <svg
                class="trend-svg"
                viewBox="0 0 760 320"
                preserveAspectRatio="none"
                role="img"
                aria-label="Line chart showing average UV index in Australia by year"
              >
                <line
                  v-for="gridLine in trendGridLines"
                  :key="gridLine"
                  x1="56"
                  :y1="gridLine"
                  x2="720"
                  :y2="gridLine"
                  class="trend-grid-line"
                />
                <polyline
                  :points="uvTrendAreaPoints"
                  class="trend-area"
                />
                <polyline
                  :points="uvTrendLinePoints"
                  class="trend-line"
                />
                <circle
                  v-for="point in uvTrendPoints"
                  :key="point.label"
                  :cx="point.x"
                  :cy="point.y"
                  r="5"
                  class="trend-point"
                />
              </svg>

              <div class="trend-x-axis">
                <div
                  v-for="item in uvTrend"
                  :key="item.label"
                  class="trend-x-label"
                >
                  {{ item.label }}
                </div>
              </div>
            </div>
          </div>

          <div class="trend-summary-row">
            <div
              v-for="item in uvTrend"
              :key="`${item.label}-${item.value}`"
              class="trend-stat-chip"
            >
              <span class="trend-stat-year">{{ item.label }}</span>
              <strong class="trend-stat-value">{{ item.value.toFixed(2) }}</strong>
            </div>
          </div>

          <p class="chart-explainer">
            This trend view shows how average UV levels in Australia have changed over time.
          </p>
        </section>

        <section class="glass-card share-card">
          <div class="share-copy">
            <p class="section-label">Spread the message</p>
            <h3>Share HelioSafe with your friends</h3>
            <p class="share-description">
              Help your friends stay sun-smart too. Follow HelioSafe on Instagram and share the page
              so more people can stay aware, protected, and safe in the sun.
            </p>
            <p class="share-line">
              Because good skin habits are better when everyone’s doing them.
            </p>
          </div>

          <div class="share-actions">
            <a
              href="https://www.instagram.com/heliosafe_ig?igsh=MTBhejVwcXM5YmlyMw=="
              target="_blank"
              rel="noopener noreferrer"
              class="share-btn insta-btn"
            >
              Follow Instagram Page
            </a>

            <a
              href="https://www.instagram.com/heliosafe.channel"
              target="_blank"
              rel="noopener noreferrer"
              class="share-btn channel-btn"
            >
              Visit Instagram Channel
            </a>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from '@aws-amplify/auth'

const activeView = ref('impact')
const useCognito = import.meta.env.VITE_USE_COGNITO === 'true'
const router = useRouter()
const API_BASE_URL = 'https://hr8e7q7pg6.execute-api.ap-southeast-2.amazonaws.com'
const loading = ref(true)
const apiError = ref('')

const skinCancerImpact = ref([])
const ageImpact = ref([])
const uvTrend = ref([])

const maxImpactValue = computed(() =>
  Math.max(...skinCancerImpact.value.map((item) => item.value), 1)
)

const maxAgeValue = computed(() =>
  Math.max(...ageImpact.value.map((item) => item.value), 1)
)

const maxUvValue = computed(() =>
  Math.max(...uvTrend.value.map((item) => item.value), 1)
)

const minUvValue = computed(() =>
  uvTrend.value.length ? Math.min(...uvTrend.value.map((item) => item.value)) : 0
)

const midpointUvValue = computed(() => (maxUvValue.value + minUvValue.value) / 2)
const trendGridLines = [36, 150, 264]

const uvTrendPoints = computed(() => {
  if (!uvTrend.value.length) return []

  const chartWidth = 664
  const chartHeight = 228
  const startX = 56
  const startY = 36
  const denominator = Math.max(uvTrend.value.length - 1, 1)
  const valueRange = Math.max(maxUvValue.value - minUvValue.value, 0.01)

  return uvTrend.value.map((item, index) => {
    const x = startX + (index / denominator) * chartWidth
    const y = startY + ((maxUvValue.value - item.value) / valueRange) * chartHeight

    return {
      ...item,
      x,
      y,
    }
  })
})

const uvTrendLinePoints = computed(() =>
  uvTrendPoints.value.map((point) => `${point.x},${point.y}`).join(' ')
)

const uvTrendAreaPoints = computed(() => {
  if (!uvTrendPoints.value.length) return ''

  const firstPoint = uvTrendPoints.value[0]
  const lastPoint = uvTrendPoints.value[uvTrendPoints.value.length - 1]

  return [
    `${firstPoint.x},264`,
    ...uvTrendPoints.value.map((point) => `${point.x},${point.y}`),
    `${lastPoint.x},264`,
  ].join(' ')
})

const pageBackground = computed(() => ({
  background: `linear-gradient(
    135deg,
    rgba(254, 114, 0, 0.78) 0%,
    rgba(255,255,255,0.72) 45%,
    rgba(255,255,255,0.9) 55%,
    rgba(31, 29, 240, 0.22) 100%
  )`,
}))

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

const fetchAwarenessData = async () => {
  loading.value = true
  apiError.value = ''

  try {
    const [stateResponse, ageResponse, yearResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/awareness/state-impact`),
      fetch(`${API_BASE_URL}/awareness/age-impact`),
      fetch(`${API_BASE_URL}/awareness/year-impact`),
    ])

    if (!stateResponse.ok || !ageResponse.ok || !yearResponse.ok) {
      throw new Error('Unable to load awareness data right now.')
    }

    const [stateData, ageData, yearData] = await Promise.all([
      stateResponse.json(),
      ageResponse.json(),
      yearResponse.json(),
    ])

    skinCancerImpact.value = stateData.items ?? []
    ageImpact.value = ageData.items ?? []
    uvTrend.value = (yearData.items ?? []).map((item) => ({
      label: String(item.label),
      value: Number(item.value),
    }))
  } catch (error) {
    console.error('Failed to load awareness data', error)
    apiError.value = 'Awareness data could not be loaded right now. Please try again in a bit.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAwarenessData()
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

.awareness-page {
  min-height: 100vh;
  width: 100%;
  padding: 1.1rem 1.6rem 1.4rem;
  font-family: 'Inter', sans-serif;
  transition: background 0.35s ease;
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

.nav-btn {
  min-width: 118px;
  height: 42px;
  border: 1px solid rgba(9, 0, 94, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: #1e1b4b;
  font-size: 0.96rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
  cursor: pointer;
}

.signout-btn {
  border: 1px solid rgba(9, 0, 94, 0.14);
  background: rgba(9, 0, 94, 0.86);
  color: white;
}

.main-content {
  display: grid;
  grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
  gap: 1.2rem;
  align-items: start;
}

.glass-card {
  background: rgba(255, 255, 255, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(16px);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.intro-card,
.insight-card,
.share-card {
  border-radius: 1.8rem;
  padding: 1.4rem 1.25rem;
}

.eyebrow,
.section-label {
  margin: 0 0 0.2rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #475569;
}

.intro-card h2,
.insight h3,
.card-header h3,
.share-card h3 {
  margin: 0;
  color: #111827;
}

.intro-card h2 {
  font-size: clamp(1.9rem, 2.2vw, 2.8rem);
  line-height: 1.02;
}

.intro-copy,
.insight p,
.chart-explainer,
.share-description {
  color: #334155;
  line-height: 1.5;
}

.intro-copy {
  margin: 0.8rem 0 1rem;
  font-size: 1rem;
}

.tab-row {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.tab-btn {
  min-height: 48px;
  border: 1px solid rgba(30, 41, 59, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: #0f172a;
  font-family: 'Inter', sans-serif;
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease;
}

.tab-btn.active {
  background: linear-gradient(135deg, #1d4ed8, #4338ca);
  color: white;
}

.visual-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-card {
  border-radius: 1.55rem;
  padding: 1rem 1.05rem;
}

.loading-copy,
.error-copy {
  margin: 0;
  min-height: 220px;
  display: grid;
  place-items: center;
  text-align: center;
  font-size: 1.05rem;
  font-weight: 600;
}

.loading-copy {
  color: #1f2937;
}

.error-copy {
  color: #b42318;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.mini-badge {
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  color: #1e1b4b;
  font-size: 0.76rem;
  font-weight: 700;
}

.bar-chart {
  min-height: 320px;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.85rem;
  align-items: end;
  padding: 0.8rem 0.25rem 0.2rem;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
}

.bar-track {
  width: 100%;
  height: 220px;
  display: flex;
  align-items: end;
  justify-content: center;
  padding: 0.35rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.5);
}

.bar-fill {
  width: 100%;
  border-radius: 0.8rem;
  background: linear-gradient(180deg, #ffbc01 0%, #fe7200 55%, #c43108 100%);
  box-shadow: 0 10px 20px rgba(196, 49, 8, 0.18);
}

.bar-value {
  font-size: 0.84rem;
  font-weight: 700;
  color: #1f2937;
}

.bar-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.age-chart {
  grid-template-columns: repeat(9, minmax(0, 1fr));
}

.age-fill {
  background: linear-gradient(180deg, #60a5fa 0%, #2563eb 55%, #1e3a8a 100%);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
}

.chart-explainer {
  margin: 1rem 0 0;
  font-size: 1rem;
  max-width: 820px;
}

.trend-chart-shell {
  min-height: 320px;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 0.75rem;
  align-items: stretch;
  padding-top: 0.5rem;
}

.trend-scale {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.4rem 0 3rem;
  color: #475569;
  font-size: 0.84rem;
  font-weight: 700;
}

.trend-chart {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.trend-svg {
  width: 100%;
  height: 320px;
  overflow: visible;
}

.trend-grid-line {
  stroke: rgba(71, 85, 105, 0.2);
  stroke-width: 1;
  stroke-dasharray: 6 8;
}

.trend-area {
  fill: rgba(37, 99, 235, 0.14);
  stroke: none;
}

.trend-line {
  fill: none;
  stroke: #2563eb;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trend-point {
  fill: #ffffff;
  stroke: #1d4ed8;
  stroke-width: 3;
}

.trend-x-axis {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 0.35rem;
  padding-left: 0.25rem;
}

.trend-x-label {
  text-align: center;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
}

.trend-summary-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.7rem;
  margin-top: 0.6rem;
}

.trend-stat-chip {
  padding: 0.8rem 0.9rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(37, 99, 235, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.trend-stat-year {
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
}

.trend-stat-value {
  color: #0f172a;
  font-size: 1.05rem;
}

.insight-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  grid-column: 1 / -1;
}

.insight-stat {
  min-width: 210px;
  padding: 1rem;
  border-radius: 1.4rem;
  background: rgba(255, 255, 255, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  font-weight: 700;
  color: #09005e;
  line-height: 1;
}

.stat-copy {
  margin-top: 0.35rem;
  font-size: 0.92rem;
  color: #334155;
  font-weight: 600;
}

.share-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.2rem;
}

.share-copy {
  flex: 1;
}

.share-description {
  margin: 0.7rem 0 0.45rem;
  font-size: 1rem;
  max-width: 680px;
}

.share-line {
  margin: 0.2rem 0 0;
  font-size: 0.92rem;
  color: #334155;
  font-weight: 600;
  line-height: 1.35;
}

.share-actions {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-width: 230px;
}

.share-btn {
  min-height: 48px;
  padding: 0.85rem 1.1rem;
  border-radius: 999px;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.share-btn:hover {
  transform: translateY(-2px);
}

.insta-btn {
  background: linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4);
  color: white;
  box-shadow: 0 10px 22px rgba(221, 42, 123, 0.22);
}

.channel-btn {
  background: rgba(255, 255, 255, 0.78);
  color: #1e1b4b;
  border: 1px solid rgba(30, 27, 75, 0.12);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

@media (max-width: 980px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .insight-card,
  .share-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .share-actions {
    width: 100%;
    min-width: unset;
  }

  .share-btn {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .awareness-page {
    padding: 0.85rem;
  }

  .top-bar {
    margin-bottom: 0.85rem;
  }

  .logo {
    font-size: 2rem;
  }

  .nav-btn {
    min-width: 100px;
    height: 38px;
    font-size: 0.9rem;
  }

  .top-actions {
    gap: 0.45rem;
  }

  .bar-chart {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .age-chart {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .trend-chart-shell {
    grid-template-columns: 1fr;
  }

  .trend-scale {
    display: none;
  }

  .trend-x-axis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .trend-summary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
