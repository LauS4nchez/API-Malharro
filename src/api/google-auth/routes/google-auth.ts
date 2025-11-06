export default {
  routes: [
    {
      method: 'POST',
      path: '/google-auth/login',
      handler: 'google-auth.googleLogin',
      config: {
        auth: false, // Este endpoint es público
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/google-auth/link',
      handler: 'google-auth.linkGoogleAccount',
      config: {
        auth: false, // O puedes usar un middleware personalizado para autenticación
        policies: [],
        middlewares: [],
      },
    }
  ],
};