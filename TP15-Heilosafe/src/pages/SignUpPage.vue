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
              ? 'Enter the verification code sent to your email to finish registration.'
              : 'Sign up to receive personalized UV protection insights.'
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
            {{ loading ? 'Creating account...' : 'Sign Up' }}
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
            {{ loading ? 'Confirming...' : 'Confirm Sign Up' }}
          </button>
        </form>

        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="auth-footer">
          <router-link v-if="!isConfirmStep" to="/login" class="auth-link">
            Already have an account? Login
          </router-link>
          <button v-else type="button" class="text-btn" @click="router.push('/login')">
            Back to Login
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
    return 'Please enter a username.'
  }

  if (trimmedUsername.includes('@')) {
    return 'Username cannot be an email address.'
  }

  if (!/^[a-zA-Z0-9._-]{3,20}$/.test(trimmedUsername)) {
    return 'Username must be 3-20 characters and use only letters, numbers, dot, underscore, or hyphen.'
  }

  return ''
}

const validatePassword = () => {
  if (password.value.length < 8) {
    return 'Password must be at least 8 characters long.'
  }

  if (password.value !== confirmPassword.value) {
    return 'Passwords do not match.'
  }

  return ''
}

const handleSignUp = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!username.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Please complete all fields.'
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
        successMessage.value = 'Verification code sent. Please check your email.'
      } else {
        successMessage.value = 'Account created successfully. Redirecting to login...'
        setTimeout(() => router.push('/login'), 1200)
      }
      return
    }

    isConfirmStep.value = true
    successMessage.value = 'Local dev mode: account created. Use code 123456 to continue.'
  } catch (err) {
    console.error('注册失败', err)
    if (err.name === 'UsernameExistsException') {
      errorMessage.value = 'This email is already registered.'
    } else if (err.name === 'InvalidPasswordException') {
      errorMessage.value = 'Password does not meet Cognito policy requirements.'
    } else {
      errorMessage.value = err.message || 'Sign up failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const handleConfirmSignUp = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!confirmationCode.value) {
    errorMessage.value = 'Please enter the verification code.'
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
      errorMessage.value = 'Local dev mode: use verification code 123456.'
      return
    }

    successMessage.value = 'Your account is confirmed. Redirecting to login...'
    setTimeout(() => router.push('/login'), 1200)
  } catch (err) {
    console.error('确认注册失败', err)
    if (err.name === 'CodeMismatchException') {
      errorMessage.value = 'Incorrect verification code.'
    } else if (err.name === 'ExpiredCodeException') {
      errorMessage.value = 'Verification code expired. Please sign up again.'
    } else {
      errorMessage.value = err.message || 'Confirmation failed. Please try again.'
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

.auth-card {
  width: min(100%, 600px);
  min-height: 78vh;
  background: #dddddd;
  border-radius: 2.5rem;
  padding: 8rem 2.3rem 3rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.auth-card h2 {
  margin: 0 0 0.4rem;
  font-size: clamp(2rem, 2.2vw, 3rem);
  font-weight: 600;
  color: #3c3c3c;
}

.helper-text {
  margin: 0 0 1.4rem;
  font-size: 1.08rem;
  color: #444;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.primary-btn {
  margin-top: 0.8rem;
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
}

.auth-link,
.text-btn {
  font-size: 1.12rem;
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

@media (max-width: 640px) {
  .logo {
    font-size: 4.5rem;
  }

  .tagline {
    font-size: 1.25rem;
  }

  .auth-card {
    border-radius: 2rem;
    padding: 3rem 1.2rem 2rem;
  }

  .primary-btn {
    font-size: 1.5rem;
  }
}
</style>
