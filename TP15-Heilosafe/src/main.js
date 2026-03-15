import { createApp } from 'vue'
import { Amplify } from 'aws-amplify'
import App from './App.vue'
import router from './router'
import awsConfig from './aws-exports'

if (import.meta.env.VITE_USE_COGNITO === 'true') {
  Amplify.configure(awsConfig)
}

createApp(App).use(router).mount('#app')
