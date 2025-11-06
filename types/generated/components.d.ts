import type { Schema, Struct } from '@strapi/strapi';

export interface RedesRedSocial extends Struct.ComponentSchema {
  collectionName: 'components_redes_red_socials';
  info: {
    displayName: 'red_social';
    icon: 'twitter';
  };
  attributes: {
    icono: Schema.Attribute.Media<'images' | 'files'>;
    nombre: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'redes.red-social': RedesRedSocial;
    }
  }
}
