import { factories } from '@strapi/strapi';

interface DiscordUserData {
  email: string;
  discordId: string;
  username?: string;
  discordUsername?: string;
  avatar?: string;
}

interface AuthResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: any;
    loginMethods: string;
  };
}

export default factories.createCoreService('api::discord-auth.discord-auth', ({ strapi }) => ({
  async login(discordUserData: DiscordUserData): Promise<AuthResponse> {
    const { email, discordId, username, discordUsername, avatar } = discordUserData;

    try {
      // Buscar usuario por email o discordId
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [
            { email: email.toLowerCase() },
            { discordId }
          ]
        },
        populate: ['role']
      });

      if (user) {
        // Usuario existe - actualizar info de Discord si es necesario
        const updateData: any = {
          discordId,
          discordUsername,
        };

        if (avatar) {
          updateData.avatar = avatar;
        }

        // Determinar loginMethods
        if (user.password && user.loginMethods !== 'both') {
          updateData.loginMethods = 'both';
        } else if (!user.loginMethods) {
          updateData.loginMethods = 'discord';
        }

        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: updateData
        });

        // Regenerar JWT
        const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
          id: user.id,
        });

        return {
          jwt,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            loginMethods: updateData.loginMethods || user.loginMethods || 'discord'
          }
        };

      } else {
        // Crear nuevo usuario
        const defaultRole = await strapi.db.query('plugin::users-permissions.role').findOne({
          where: { type: 'authenticated' }
        });

        if (!defaultRole) {
          throw new Error('Default role not found');
        }

        let finalUsername = username || discordUsername;
        if (!finalUsername) {
          finalUsername = `user_${discordId.substring(0, 8)}`;
        }

        // Verificar si el username ya existe
        const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
          where: { username: finalUsername }
        });

        if (existingUser) {
          finalUsername = `${finalUsername}_${discordId.substring(0, 4)}`;
        }

        const newUser = await strapi.db.query('plugin::users-permissions.user').create({
          data: {
            username: finalUsername,
            email: email.toLowerCase(),
            discordId,
            discordUsername,
            avatar,
            confirmed: true,
            loginMethods: 'discord',
            role: defaultRole.id,
            provider: 'discord'
          },
          populate: ['role']
        });

        // Generar JWT
        const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
          id: newUser.id,
        });

        return {
          jwt,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            loginMethods: newUser.loginMethods
          }
        };
      }

    } catch (error) {
      console.error('Discord auth error:', error);
      throw new Error(error instanceof Error ? error.message : 'Authentication failed');
    }
  },
}));