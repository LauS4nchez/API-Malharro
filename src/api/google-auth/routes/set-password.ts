export default {
  routes: [
    {
      method: 'POST',
      path: '/set-password',
      handler: 'api::google-auth.set-password.setPassword',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
