<template>
  <div class="page">
    <section class="brand-panel">
      <div class="brand-content">
        <h1 class="logo">HelioSafe</h1>
        <p class="tagline">Know the Sun. Protect Your Skin.</p>
      </div>
    </section>

    <section class="form-panel">
      <div class="login-card">
        <h2>Welcome to HelioSafe!</h2>

        <form class="login-form" @submit.prevent="handleLogin">
          <input
            v-model="email"
            type="email"
            placeholder="Email Address"
            class="input-field"
            required
          />

          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="input-field"
            required
          />

          <div class="options-row">
            <label class="remember-me">
              <input v-model="remember" type="checkbox" />
              <span>Remember me</span>
            </label>

            <router-link to="/forgot-password" class="forgot-link">
              Forgot Password?
            </router-link>
          </div>

          <button type="submit" class="login-btn">Login</button>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const remember = ref(false)

const handleLogin = () => {
  console.log({
    email: email.value,
    password: password.value,
    remember: remember.value,
  })

  // temporary routing after login
  router.push('/home')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap');

:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  background: #f3f3f3;
}

:global(#app) {
  min-height: 100vh;
}

.page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 56% 44%;
  background: #f3f3f3;
}

.brand-panel {
  background: linear-gradient(90deg, #ff8c1a 0%, #f2b894 50%, #f1ece8 100%);
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 5rem 4.5rem;
}

.brand-content {
  max-width: 700px;
}

.logo {
  margin: 0;
  font-size: clamp(4.5rem, 8vw, 9rem);
  line-height: 0.95;
  font-style: italic;
  font-weight: 600;
  color: #09005e;
}

.tagline {
  margin-top: 0.4rem;
  font-size: clamp(1.3rem, 1.9vw, 2rem);
  font-weight: 600;
  color: #111;
}

.form-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.login-card {
  width: min(100%, 600px);
  min-height: 78vh;
  background: #dddddd;
  border-radius: 2.5rem;
  padding: 10rem 2.3rem 3rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.login-card h2 {
  margin: 0 0 1.2rem;
  font-size: clamp(2rem, 2.2vw, 3rem);
  font-weight: 600;
  color: #3c3c3c;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.input-field {
  width: 100%;
  height: 58px;
  border: none;
  outline: none;
  border-radius: 0.9rem;
  padding: 0 1.2rem;
  background: #f7f7f7;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.1rem;
  color: #333;
}

.input-field::placeholder {
  color: #555;
}

.options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: -0.1rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.15rem;
  color: #222;
}

.remember-me input {
  width: 18px;
  height: 18px;
  accent-color: #211ef0;
}

.forgot-link {
  font-size: 1.15rem;
  color: #1118ff;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.login-btn {
  margin-top: 1rem;
  width: 100%;
  height: 60px;
  border: none;
  border-radius: 1.3rem;
  background: #1f1df0;
  color: white;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.login-btn:hover {
  transform: translateY(-1px);
  opacity: 0.95;
}

@media (max-width: 1100px) {
  .page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 30vh;
    padding: 3rem 2rem;
  }

  .form-panel {
    padding: 1.5rem;
  }

  .login-card {
    min-height: auto;
    padding: 4rem 1.5rem 2rem;
  }
}

@media (max-width: 640px) {
  .logo {
    font-size: 4.5rem;
  }

  .tagline {
    font-size: 1.25rem;
  }

  .login-card {
    border-radius: 2rem;
    padding: 3rem 1.2rem 2rem;
  }

  .options-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .login-btn {
    font-size: 1.5rem;
  }
}
</style>