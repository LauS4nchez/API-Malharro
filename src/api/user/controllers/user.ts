import { factories } from '@strapi/strapi'

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  // Método para obtener el usuario actual
  async getMe(ctx) {
    try {
      // Verificar que el usuario esté autenticado
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('No estás autenticado');
      }

      // Buscar el usuario completo con los campos que necesitas
      const userData = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        {
          populate: ['role', 'usinas_creadas', 'agendas_creadas'],
          fields: ['id', 'username', 'email', 'name', 'surname', 'carrera', 'confirmed', 'blocked', 'createdAt', 'updatedAt']
        }
      );

      if (!userData) {
        return ctx.notFound('Usuario no encontrado');
      }

      // Limpiar datos sensibles
      const { password, resetPasswordToken, confirmationToken, ...sanitizedUser } = userData;
      
      ctx.send(sanitizedUser);
    } catch (error) {
      console.error('Error en getMe:', error);
      ctx.throw(500, 'Error interno del servidor');
    }
  },

  // Método para actualizar el usuario actual
  async updateMe(ctx) {
    try {
      // Verificar que el usuario esté autenticado
      const user = ctx.state.user;
      if (!user) {
        return ctx.unauthorized('No estás autenticado');
      }

      const { id } = user;
      const updateData = ctx.request.body;

      console.log('Actualizando usuario:', id, 'con datos:', updateData);

      // Validar campos permitidos (solo los que quieres que sean editables)
      const allowedFields = ['name', 'surname', 'carrera'];
      const filteredData: any = {};
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });

      // Actualizar el usuario
      const updatedUser = await strapi.entityService.update(
        'plugin::users-permissions.user',
        id,
        {
          data: filteredData,
          populate: ['role', 'usinas_creadas', 'agendas_creadas'],
        }
      );

      if (!updatedUser) {
        return ctx.notFound('Usuario no encontrado');
      }

      // Limpiar datos sensibles
      const { password, resetPasswordToken, confirmationToken, ...sanitizedUser } = updatedUser;
      
      ctx.send({
        message: 'Perfil actualizado correctamente',
        user: sanitizedUser
      });
    } catch (error) {
      console.error('Error en updateMe:', error);
      ctx.throw(500, 'Error al actualizar el perfil');
    }
  },
}));