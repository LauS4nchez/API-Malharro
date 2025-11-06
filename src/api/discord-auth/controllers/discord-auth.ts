import { factories } from '@strapi/strapi'

// --- Helper igual que el de Google ---
async function generateUniqueUsername(strapi: any, name: string): Promise<string> {
  const baseUsername = name.replace(/\s+/g, '').toLowerCase().substring(0, 15);
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const existingUser = await strapi.entityService.findMany(
      'plugin::users-permissions.user',
      {
        filters: { username },
        limit: 1
      }
    );

    if (existingUser.length === 0) break;
    username = `${baseUsername}${counter}`;
    counter++;

    if (counter > 100) {
      username = `${baseUsername}${Date.now()}`;
      break;
    }
  }

  return username;
}

// --- Controlador principal - IDÉNTICO AL DE GOOGLE ---
export default factories.createCoreController('api::discord-auth.discord-auth', ({ strapi }) => ({
  async discordLogin(ctx) {
    try {
      const { email, discordId, username, discordUsername, avatar } = ctx.request.body;

      console.log('🔵 Discord auth request:', { email, discordId, username });

      if (!email || !discordId) {
        console.log('🔴 Missing email or discordId');
        return ctx.badRequest('Email and Discord ID are required');
      }

      // Buscar usuario por email - EXACTAMENTE IGUAL QUE GOOGLE
      const users = await strapi.entityService.findMany(
        'plugin::users-permissions.user',
        {
          filters: { email },  // ← SOLO por email, igual que Google
          populate: ['role'],
          limit: 1,
        }
      );

      const existingUser = users[0];

      console.log('🔵 User found:', existingUser?.id);

      let user;

      if (existingUser) {
        // Usuario existe - actualizar discordId si es necesario - IGUAL QUE GOOGLE
        const updateData: any = { confirmed: true };
        
        if (!existingUser.discordId) {
          updateData.discordId = discordId;
          updateData.discordUsername = discordUsername;
          updateData.avatar = avatar;
          updateData.loginMethods = existingUser.password ? 'both' : 'discord';
        }

        user = await strapi.entityService.update(
          'plugin::users-permissions.user',
          existingUser.id,
          {
            data: updateData,
            populate: ['role']
          }
        );

        console.log('🔵 User updated with Discord data');

      } else {
        // Crear nuevo usuario con Discord - IGUAL QUE GOOGLE
        const finalUsername = await generateUniqueUsername(strapi, username || discordUsername || email.split('@')[0]);
        
        console.log('🔵 Creating new user with username:', finalUsername);
        
        user = await strapi.entityService.create(
          'plugin::users-permissions.user',
          {
            data: {
              username: finalUsername,
              email,
              discordId,
              discordUsername,
              avatar,
              loginMethods: 'discord',
              confirmed: true,
              password: discordId, // Usar discordId como password placeholder
              role: 1
            },
            populate: ['role']
          }
        );

        console.log('🔵 New user created:', user.id);
      }

      if (!user) {
        console.log('🔴 User not found after creation/update');
        return ctx.badRequest('User creation failed');
      }

      // Generar JWT - IGUAL QUE GOOGLE
      const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
        id: user.id,
      });

      console.log('🟢 JWT generated successfully for user:', user.id);

      // Limpiar datos sensibles - IGUAL QUE GOOGLE
      const { password, resetPasswordToken, confirmationToken, ...sanitizedUser } = user;

      return {
        jwt,
        user: {
          id: sanitizedUser.id,
          username: sanitizedUser.username,
          email: sanitizedUser.email,
          loginMethods: sanitizedUser.loginMethods || 'discord',
          role: sanitizedUser.role
        }
      };

    } catch (error: any) {
      console.error('🔴 Discord auth error:', error);
      return ctx.internalServerError('Authentication failed: ' + error.message);
    }
  }
}));