export interface DiscordUserData {
  email: string;
  discordId: string;
  username?: string;
  discordUsername?: string;
  avatar?: string;
}

export interface AuthResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: any;
    loginMethods: string;
  };
}