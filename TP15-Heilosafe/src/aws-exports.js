const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID,
      loginWith: {
        email: true,
      },
    },
  },
  API: {
    REST: {
      privateApi: {
        endpoint: import.meta.env.VITE_API_URL,
        region: import.meta.env.VITE_COGNITO_REGION,
      },
    },
  },
}

export default awsConfig
