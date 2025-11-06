import { factories } from '@strapi/strapi';

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  async setPassword(ctx) {
    try {
      const { email, username, password } = ctx.request.body as {
        email?: string;
        username?: string;
        password?: string;
      };

      if (!email || !username || !password) {
        return ctx.badRequest('Faltan datos requeridos.');
      }

      // Buscar usuario por email
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { email },
        limit: 1,
      });

      const user = users[0];
      if (!user) return ctx.notFound('Usuario no encontrado.');

      // ✅ Actualizar usuario con contraseña sin hashear (Strapi lo hace solo)
      const updatedUser = await strapi.plugins['users-permissions'].services.user.edit(user.id, {
        username,
        password, // sin bcrypt.hash
        loginMethods: 'both',
        provider: 'local', // para permitir login manual
      });

      // Generar nuevo JWT
      const jwtService = strapi.plugins['users-permissions'].services.jwt;
      const jwt = jwtService.issue({ id: updatedUser.id });

      return ctx.send({
        jwt,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          loginMethods: updatedUser.loginMethods,
          provider: updatedUser.provider,
        },
      });
    } catch (error) {
      strapi.log.error('Error en setPassword:', error);
      return ctx.internalServerError('Error al configurar contraseña.');
    }
  },
}));
