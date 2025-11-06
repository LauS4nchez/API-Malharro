export default ({ env }: { env: any }) => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_CLOUD_NAME'),
        api_key: env('CLOUDINARY_API_KEY'),
        api_secret: env('CLOUDINARY_API_SECRET'),
      },
      actionOptions: {
        upload: {},
        delete: {},
      },
    },
  },
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
      register: {
        allowedFields: ['username', 'email', 'password'],
      },
      auth: {
        events: {
          onConnectionSuccess: (e: any) => console.log(e.user),
          onConnectionError: (e: any) => console.error(e),
        },
      },
    },
  },
});