export type Role = 'adopter' | 'admin' | 'clinic' | 'foundation';

export interface JwtUser {
  id: string;
  sub: string; // ID del usuario
  role: Role;
  email?: string;
}

export interface AuthUser extends JwtUser {
  // agrega aquí lo que solo uses en app (no en el token)
}
