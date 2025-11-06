import { factories } from '@strapi/strapi'

// --- Helper fuera del controlador ---
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

// --- Controlador principal ---
export default factories.createCoreController('api::google-auth.google-auth', ({ strapi }) => ({
  async googleLogin(ctx) {
    try {
      const { email, googleId, name } = ctx.request.body;

      console.log('🔵 Google auth request:', { email, googleId, name });

      if (!email || !googleId) {
        console.log('🔴 Missing email or googleId');
        return ctx.badRequest('Email and Google ID are required');
      }

      // Buscar usuario por email
      const users = await strapi.entityService.findMany(
        'plugin::users-permissions.user',
        {
          filters: { email },
          populate: ['role'],
          limit: 1,
        }
      );

      const existingUser = users[0];

      console.log('🔵 User found:', existingUser?.id);

      let user;

      if (existingUser) {
        // Usuario existe - actualizar googleId si es necesario
        const updateData: any = { confirmed: true };
        
        if (!existingUser.googleId) {
          updateData.googleId = googleId;
          updateData.loginMethods = existingUser.password ? 'both' : 'google';
        }

        user = await strapi.entityService.update(
          'plugin::users-permissions.user',
          existingUser.id,
          {
            data: updateData,
            populate: ['role']
          }
        );

        console.log('🔵 User updated with Google data');

      } else {
        // Crear nuevo usuario con Google
        const username = await generateUniqueUsername(strapi, name);
        
        console.log('🔵 Creating new user with username:', username);
        
        user = await strapi.entityService.create(
          'plugin::users-permissions.user',
          {
            data: {
              username,
              email,
              googleId,
              loginMethods: 'google',
              confirmed: true,
              password: googleId,
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

      // Generar JWT
      const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
        id: user.id,
      });

      console.log('🟢 JWT generated successfully for user:', user.id);

      // Limpiar datos sensibles
      const { password, resetPasswordToken, confirmationToken, ...sanitizedUser } = user;

      return {
        jwt,
        user: {
          id: sanitizedUser.id,
          username: sanitizedUser.username,
          email: sanitizedUser.email,
          loginMethods: sanitizedUser.loginMethods || 'google',
          role: sanitizedUser.role
        }
      };

    } catch (error: any) {
      console.error('🔴 Google auth error:', error);
      return ctx.internalServerError('Authentication failed: ' + error.message);
    }
  },

  async linkGoogleAccount(ctx) {
    try {
      // Para autenticación manual, puedes verificar el token JWT en el header
      const authHeader = ctx.request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ctx.unauthorized('Token de autenticación requerido');
      }

      const token = authHeader.split(' ')[1];
      
      try {
        // Verificar el token JWT
        const decoded: any = strapi.plugins['users-permissions'].services.jwt.verify(token);
        const user = await strapi.entityService.findOne(
          'plugin::users-permissions.user',
          decoded.id,
          {
            populate: ['role']
          }
        );

        if (!user) {
          return ctx.unauthorized('Usuario no válido');
        }

        const { googleId, email } = ctx.request.body;

        if (!googleId) {
          return ctx.badRequest('Google ID is required');
        }

        // Actualizar el usuario con el Google ID
        const updatedUser = await strapi.entityService.update(
          'plugin::users-permissions.user',
          user.id,
          {
            data: { 
              googleId,
              loginMethods: 'both',
              confirmed: true
            },
            populate: ['role']
          }
        );

        // Limpiar datos sensibles
        const { password, resetPasswordToken, confirmationToken, ...sanitizedUser } = updatedUser;

        return {
          success: true,
          user: sanitizedUser
        };

      } catch (jwtError: any) {
        console.error('🔴 JWT verification error:', jwtError);
        return ctx.unauthorized('Token inválido');
      }

    } catch (error: any) {
      console.error('🔴 Link Google account error:', error);
      return ctx.internalServerError('Failed to link Google account');
    }
  },
}));
