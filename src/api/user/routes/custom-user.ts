export default {
  routes: [
    {
      method: 'PUT',
      path: '/users/me',
      handler: 'user.updateMe',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/users/me',
      handler: 'user.getMe',
      config: {
        policies: [],
        middlewares: [],
      },
    }
  ],
};