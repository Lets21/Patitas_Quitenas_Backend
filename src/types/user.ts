export type Role = 'adopter' | 'admin' | 'clinic' | 'foundation';

export interface JwtUser {
  id: string;
  role: Role;
  email?: string;
}

export interface AuthUser extends JwtUser {
  // agrega aquí lo que solo uses en app (no en el token)
  sub?: string; // si lo usas, que sea opcional
}
