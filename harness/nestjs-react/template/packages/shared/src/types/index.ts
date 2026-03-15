export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
}

export interface AuthProfile {
  id: string;
  cognitoId: string;
  email: string;
  groups: string[];
  createdAt: string | Date;
}
