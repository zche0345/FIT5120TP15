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
        <h2>See the impact. Take UV seriously.</h2>
        <p class="intro-copy">
          Real melanoma data, shown in a way that is quick to get and hard to ignore.
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
            Melanoma risk is not the same everywhere. UV exposure builds up over time.
          </p>
        </section>

        <section v-else-if="!loading && !apiError" class="glass-card chart-card">
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
            UV damage builds over time. Small habits now can matter later.
          </p>
        </section>
      </section>

      <section class="glass-card insight-card">
        <div class="insight">
          <p class="section-label">Skin Myth</p>
          <h3>Myth: Cool weather means low UV.</h3>
          <p>
            Fact: UV can still be strong on cool or cloudy days. The temperature can feel fine
            while your skin is still taking damage.
          </p>
        </div>

        <div class="insight-stat">
          <span class="stat-value">3</span>
          <span class="stat-copy">shareable takeaways for your group chat</span>
          <p class="share-line">UV damage builds up, even on mild days.</p>
          <p class="share-line">Daily SPF matters more than people think.</p>
          <p class="share-line">Sun safety is easier when your friends do it too.</p>
        </div>
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

const maxImpactValue = computed(() => Math.max(...skinCancerImpact.value.map((item) => item.value), 1))
const maxAgeValue = computed(() => Math.max(...ageImpact.value.map((item) => item.value), 1))

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
    const [stateResponse, ageResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/awareness/state-impact`),
      fetch(`${API_BASE_URL}/awareness/age-impact`),
    ])

    if (!stateResponse.ok || !ageResponse.ok) {
      throw new Error('Unable to load awareness data right now.')
    }

    const [stateData, ageData] = await Promise.all([
      stateResponse.json(),
      ageResponse.json(),
    ])

    skinCancerImpact.value = stateData.items ?? []
    ageImpact.value = ageData.items ?? []
  } catch (error) {
    console.error('Failed to load awareness data', error)
    apiError.value = 'Awareness data could not be loaded right now. Try again in a moment.'
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
.insight-card {
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
.card-header h3 {
  margin: 0;
  color: #111827;
}

.intro-card h2 {
  font-size: clamp(1.9rem, 2.2vw, 2.8rem);
  line-height: 1.02;
}

.intro-copy,
.insight p,
.chart-explainer {
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

.share-line {
  margin: 0.45rem 0 0;
  font-size: 0.9rem;
  color: #334155;
  font-weight: 600;
  line-height: 1.35;
}

@media (max-width: 980px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .insight-card {
    flex-direction: column;
    align-items: flex-start;
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
}
</style>
