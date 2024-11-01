export interface BasePermission {
  resourceId: number;
  resourceName: string;
  resourceType: string;
  resourcePath: string;
  action: string;
  ability: 'can' | 'cannot';
  type: string;
  context: string[];
  warehouseIds?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string;
  permissions: BasePermission[];
  accessToken: string | null;
  refreshToken: string | null;
}

export interface LoginResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    username: string;
    userPermissions: string | BasePermission[];
  };
}
