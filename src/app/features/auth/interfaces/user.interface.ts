export interface User {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  roles: string[];
  createdAt: string;
}