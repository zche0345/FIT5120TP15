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
        <h2>Welcome back</h2>
        <p class="helper-text">Log in, check the UV, and keep your skin one step ahead.</p>

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
              <span>Keep me signed in</span>
            </label>

            <router-link to="/forgot-password" class="forgot-link">
              Forgot password?
            </router-link>
          </div>

          <button type="submit" class="login-btn" :disabled="loading">
            {{ loading ? 'Logging you in...' : 'Log In' }}
          </button>
        </form>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="auth-footer">
          <span>New here?</span>
          <router-link to="/signup" class="signup-link">Create an account</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, signIn } from '@aws-amplify/auth'

const useCognito = import.meta.env.VITE_USE_COGNITO === 'true'

const router = useRouter()

const email = ref('')
const password = ref('')
const remember = ref(false)
const errorMessage = ref('')
const loading = ref(false)

onMounted(async () => {
  if (!useCognito) return

  try {
    await getCurrentUser()
    router.push('/home')
  } catch {
    // No active Cognito session, keep user on the login page.
  }
})

const handleLogin = async () => {
  errorMessage.value = ''
  if (!email.value || !password.value) {
    errorMessage.value = 'Pop in your email and password first.'
    return
  }

  loading.value = true
  try {
    if (useCognito) {
      await signIn({
        username: email.value,
        password: password.value,
      })
      router.push('/home')
      return
    }

    // 本地开发模式登录演示
    if (email.value === 'test@demo.com' && password.value === 'Test1234') {
      router.push('/home')
      return
    }

    errorMessage.value =
      'Local demo mode: use test@demo.com / Test1234, or turn on Cognito with VITE_USE_COGNITO=true.'
  } catch (err) {
    console.error('登录失败', err)
    if (err.name === 'UserAlreadyAuthenticatedException') {
      router.push('/home')
    } else if (err.name === 'UserNotConfirmedException') {
      errorMessage.value =
        'Your account is not confirmed yet. Check your email for the verification link or code.'
    } else if (err.name === 'NotAuthorizedException') {
      errorMessage.value = 'That password does not look right. Try again.'
    } else if (err.name === 'UserNotFoundException') {
      errorMessage.value = 'No account found for that email yet. Try signing up first.'
    } else {
      errorMessage.value = err.message || err || 'Login did not work this time. Give it another go.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap');

:global(*) {
  box-sizing: border-box;
}

:global(html, body) {
  margin: 0;
  padding: 0;
  width: 100%;
  overflow-x: hidden;
}

:global(body) {
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
  padding: clamp(2rem, 5vw, 5rem);
}

.brand-content {
  max-width: 700px;
  width: 100%;
}

.logo {
  margin: 0;
  font-size: clamp(3.2rem, 7vw, 9rem);
  line-height: 0.95;
  font-style: italic;
  font-weight: 600;
  color: #09005e;
  word-break: break-word;
}

.tagline {
  margin-top: 0.5rem;
  font-size: clamp(1.1rem, 1.8vw, 2rem);
  font-weight: 600;
  color: #111;
  max-width: 28rem;
}

.form-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: clamp(1rem, 3vw, 2rem);
}

.login-card {
  width: min(100%, 560px);
  background: #dddddd;
  border-radius: 2rem;
  padding: clamp(2rem, 5vw, 4rem) clamp(1.1rem, 3vw, 2.3rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.login-card h2 {
  margin: 0 0 0.7rem;
  font-size: clamp(1.9rem, 2.2vw, 3rem);
  font-weight: 600;
  color: #3c3c3c;
  line-height: 1.1;
}

.helper-text {
  margin: 0 0 1.2rem;
  font-size: clamp(1rem, 1.1vw, 1.12rem);
  color: #444;
  line-height: 1.4;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-field {
  width: 100%;
  height: 56px;
  border: none;
  outline: none;
  border-radius: 0.9rem;
  padding: 0 1rem;
  background: #f7f7f7;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.08rem;
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
  flex-wrap: wrap;
  margin-top: 0.1rem;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.08rem;
  color: #222;
}

.remember-me input {
  width: 18px;
  height: 18px;
  accent-color: #211ef0;
}

.forgot-link {
  font-size: 1.08rem;
  color: #1118ff;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.login-btn {
  margin-top: 0.6rem;
  width: 100%;
  min-height: 56px;
  border: none;
  border-radius: 1rem;
  background: #1f1df0;
  color: white;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.35rem, 1.8vw, 1.8rem);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  padding: 0.75rem 1rem;
}

.login-btn:hover {
  transform: translateY(-1px);
  opacity: 0.95;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  margin-top: 0.8rem;
  color: #dd3333;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
}

.auth-footer {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  text-align: center;
  font-size: 1.05rem;
  color: #333;
}

.signup-link {
  color: #1118ff;
  text-decoration: none;
  font-weight: 600;
}

.signup-link:hover {
  text-decoration: underline;
}

/* Large tablets / smaller laptops */
@media (max-width: 1024px) {
  .page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 32vh;
    align-items: center;
    padding: 2.5rem 2rem;
  }

  .form-panel {
    padding: 2rem 1.5rem 2.5rem;
  }

  .login-card {
    width: min(100%, 640px);
  }
}

/* Tablets */
@media (max-width: 768px) {
  .brand-panel {
    min-height: auto;
    padding: 2rem 1.4rem 1.6rem;
    justify-content: center;
    text-align: center;
  }

  .brand-content {
    max-width: 100%;
  }

  .tagline {
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  .form-panel {
    padding: 1.2rem 1rem 2rem;
    align-items: flex-start;
  }

  .login-card {
    border-radius: 1.5rem;
    padding: 2rem 1rem 1.6rem;
  }

  .input-field {
    height: 52px;
    font-size: 1rem;
  }

  .login-btn {
    min-height: 52px;
  }

  .options-row {
    align-items: flex-start;
  }
}

/* Phones */
@media (max-width: 480px) {
  .brand-panel {
    padding: 1.5rem 1rem 1.2rem;
  }

  .logo {
    font-size: 3.2rem;
  }

  .tagline {
    font-size: 1rem;
  }

  .form-panel {
    padding: 0.8rem 0.8rem 1.5rem;
  }

  .login-card {
    width: 100%;
    border-radius: 1.2rem;
    padding: 1.5rem 0.9rem 1.2rem;
  }

  .login-card h2 {
    font-size: 1.7rem;
  }

  .helper-text {
    font-size: 0.98rem;
  }

  .options-row {
    flex-direction: column;
    gap: 0.7rem;
  }

  .remember-me,
  .forgot-link,
  .auth-footer {
    font-size: 1rem;
  }
}
</style>