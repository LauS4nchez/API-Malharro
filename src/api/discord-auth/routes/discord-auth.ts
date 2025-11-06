export default {
  routes: [
    {
      method: 'POST',
      path: '/discord-auth/login',
      handler: 'discord-auth.discordLogin',
      config: {
        auth: false, // Este endpoint es público
        policies: [],
        middlewares: [],
      },
    }
  ],
};