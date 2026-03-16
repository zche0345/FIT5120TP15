<template>
  <div class="page">
    <section class="brand-panel">
      <div class="brand-content">
        <h1 class="logo">HelioSafe</h1>
        <p class="tagline">Know the Sun. Protect Your Skin.</p>
      </div>
    </section>

    <section class="form-panel">
      <div class="auth-card">
        <h2>{{ isConfirmStep ? 'Confirm your account' : 'Create your account' }}</h2>
        <p class="helper-text">
          {{
            isConfirmStep
              ? 'Drop in the code from your email and you are good to go.'
              : 'Sign up, stay UV-aware, and make sunscreen your main-character move.'
          }}
        </p>

        <form v-if="!isConfirmStep" class="auth-form" @submit.prevent="handleSignUp">
          <input
            v-model="username"
            type="text"
            placeholder="Username"
            class="input-field"
            required
          />

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

          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            class="input-field"
            required
          />

          <button type="submit" class="primary-btn" :disabled="loading">
            {{ loading ? 'Setting you up...' : 'Sign Up' }}
          </button>
        </form>

        <form v-else class="auth-form" @submit.prevent="handleConfirmSignUp">
          <input
            v-model="confirmationCode"
            type="text"
            inputmode="numeric"
            placeholder="Verification Code"
            class="input-field"
            required
          />

          <button type="submit" class="primary-btn" :disabled="loading">
            {{ loading ? 'Confirming...' : 'Verify My Account' }}
          </button>
        </form>

        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="auth-footer">
          <router-link v-if="!isConfirmStep" to="/login" class="auth-link">
            Already have an account? Log in
          </router-link>
          <button v-else type="button" class="text-btn" @click="router.push('/login')">
            Back to login
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { confirmSignUp, signUp } from '@aws-amplify/auth'

const router = useRouter()
const useCognito = import.meta.env.VITE_USE_COGNITO === 'true'

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const confirmationCode = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const isConfirmStep = ref(false)

onMounted(() => {
  if (!useCognito) return

  const savedEmail = sessionStorage.getItem('signupEmail')
  const savedUsername = sessionStorage.getItem('signupUsername')

  if (savedEmail) {
    email.value = savedEmail
  }

  if (savedUsername) {
    username.value = savedUsername
  }
})

const validateUsername = () => {
  const trimmedUsername = username.value.trim()

  if (!trimmedUsername) {
    return 'Pick a username first.'
  }

  if (trimmedUsername.includes('@')) {
    return 'Your username cannot be an email address.'
  }

  if (!/^[a-zA-Z0-9._-]{3,20}$/.test(trimmedUsername)) {
    return 'Your username should be 3-20 characters and only use letters, numbers, dots, underscores, or hyphens.'
  }

  return ''
}

const validatePassword = () => {
  if (password.value.length < 8) {
    return 'Your password needs at least 8 characters.'
  }

  if (password.value !== confirmPassword.value) {
    return 'Those passwords do not match.'
  }

  return ''
}

const handleSignUp = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!username.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Fill in all the fields first.'
    return
  }

  const usernameError = validateUsername()
  if (usernameError) {
    errorMessage.value = usernameError
    return
  }

  const passwordError = validatePassword()
  if (passwordError) {
    errorMessage.value = passwordError
    return
  }

  loading.value = true
  try {
    if (useCognito) {
      sessionStorage.setItem('signupEmail', email.value)
      sessionStorage.setItem('signupUsername', username.value.trim())

      const result = await signUp({
        username: username.value.trim(),
        password: password.value,
        options: {
          userAttributes: {
            email: email.value,
          },
        },
      })

      if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        isConfirmStep.value = true
        successMessage.value = 'Code sent. Check your email and pop it in here.'
      } else {
        successMessage.value = 'Account created. Sending you to login...'
        setTimeout(() => router.push('/login'), 1200)
      }
      return
    }

    isConfirmStep.value = true
    successMessage.value = 'Local demo mode: account created. Use code 123456 to keep going.'
  } catch (err) {
    console.error('注册失败', err)
    if (err.name === 'UsernameExistsException') {
      errorMessage.value = 'That account already exists.'
    } else if (err.name === 'InvalidPasswordException') {
      errorMessage.value = 'That password does not match the Cognito rules yet.'
    } else {
      errorMessage.value = err.message || 'Sign up did not work this time. Try again.'
    }
  } finally {
    loading.value = false
  }
}

const handleConfirmSignUp = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!confirmationCode.value) {
    errorMessage.value = 'Enter the verification code first.'
    return
  }

  loading.value = true
  try {
    if (useCognito) {
      await confirmSignUp({
        username: username.value.trim(),
        confirmationCode: confirmationCode.value,
      })
      sessionStorage.removeItem('signupEmail')
      sessionStorage.removeItem('signupUsername')
    } else if (confirmationCode.value !== '123456') {
      errorMessage.value = 'Local demo mode: use verification code 123456.'
      return
    }

    successMessage.value = 'You are verified. Heading to login...'
    setTimeout(() => router.push('/login'), 1200)
  } catch (err) {
    console.error('确认注册失败', err)
    if (err.name === 'CodeMismatchException') {
      errorMessage.value = 'That code does not look right.'
    } else if (err.name === 'ExpiredCodeException') {
      errorMessage.value = 'That code expired. Sign up again and grab a fresh one.'
    } else {
      errorMessage.value = err.message || 'Verification failed. Please try again.'
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

.auth-card {
  width: min(100%, 560px);
  background: #dddddd;
  border-radius: 2rem;
  padding: clamp(2rem, 5vw, 4rem) clamp(1.1rem, 3vw, 2.3rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
}

.auth-card h2 {
  margin: 0 0 0.4rem;
  font-size: clamp(1.9rem, 2.2vw, 3rem);
  font-weight: 600;
  color: #3c3c3c;
  line-height: 1.1;
}

.helper-text {
  margin: 0 0 1.4rem;
  font-size: clamp(1rem, 1.1vw, 1.12rem);
  color: #444;
  line-height: 1.4;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
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

.primary-btn {
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

.primary-btn:hover {
  transform: translateY(-1px);
  opacity: 0.95;
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.success-message,
.error-message {
  margin-top: 0.9rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
}

.success-message {
  color: #167a35;
}

.error-message {
  color: #dd3333;
}

.auth-footer {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  text-align: center;
}

.auth-link,
.text-btn {
  font-size: 1.08rem;
  color: #1118ff;
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  cursor: pointer;
}

.auth-link:hover,
.text-btn:hover {
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

  .auth-card {
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

  .auth-card {
    border-radius: 1.5rem;
    padding: 2rem 1rem 1.6rem;
  }

  .input-field {
    height: 52px;
    font-size: 1rem;
  }

  .primary-btn {
    min-height: 52px;
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

  .auth-card {
    width: 100%;
    border-radius: 1.2rem;
    padding: 1.5rem 0.9rem 1.2rem;
  }

  .auth-card h2 {
    font-size: 1.7rem;
  }

  .helper-text {
    font-size: 0.98rem;
  }

  .auth-link,
  .text-btn {
    font-size: 1rem;
  }
}
</style>