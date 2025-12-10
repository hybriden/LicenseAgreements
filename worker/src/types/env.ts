export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
}

export interface UserInfo {
  id: number;
  azureId: string;
  email: string;
  displayName: string | null;
  role: string;
}

export interface Variables {
  user: UserInfo | null;
}
