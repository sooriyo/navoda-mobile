import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PermissionFlagsService } from './permissionFlags.service';
import {AuthState, BasePermission, LoginResponse} from "../types/userAuth.types";

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = `${environment.API_BASE}/auth/login`;
  private readonly PORTAL_URL = environment.PORTAL;
  private readonly AUTH_STORAGE_KEY = 'auth-state';

  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    username: '',
    permissions: [],
    accessToken: null,
    refreshToken: null,
  });

  private permissionFlagsService = inject(PermissionFlagsService);
  private http = inject(HttpClient);

  constructor() {
    this.initAuthState();
  }

  signIn(authKey: string): Observable<boolean> {
    const headers = new HttpHeaders().set('auth-key', authKey);

    return this.http.post<LoginResponse>(this.API_URL, {}, { headers }).pipe(
      map(response => this.handleSignInResponse(response)),
      catchError(error => this.handleSignInError(error))
    );
  }

  signOut(): void {
    this.clearAuthData();
    window.location.href = this.PORTAL_URL;
  }

  getAuthState(): Observable<AuthState> {
    return this.authState.asObservable();
  }

  hasPermission(requiredPath: string, requiredAction: string, status?: string): boolean {
    const currentState = this.authState.value;

    if (!currentState.isAuthenticated) {
      return false;
    }

    if (requiredPath === 'visitors' && status) {
      return this.permissionFlagsService.getPermissionSignal(status)();
    }

    const relevantPermission = currentState.permissions.find(
      perm => perm.resourcePath === requiredPath
    );

    if (!relevantPermission) {
      return false;
    }

    return relevantPermission.context.includes(requiredAction) ||
      relevantPermission.context.includes('all');
  }

  private initAuthState(): void {
    try {
      const savedState = sessionStorage.getItem(this.AUTH_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState) as AuthState;
        this.validateAuthState(parsedState);
        this.updateAuthState(parsedState);
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.clearAuthData();
    }
  }

  private validateAuthState(state: AuthState): void {
    if (!state || typeof state.isAuthenticated !== 'boolean' || !Array.isArray(state.permissions)) {
      throw new Error('Invalid auth state structure');
    }
  }

  private handleSignInResponse(response: LoginResponse): boolean {
    if (!response?.data?.accessToken) {
      console.warn('Invalid login response structure');
      return false;
    }

    try {
      const { accessToken, refreshToken, username, userPermissions } = response.data;
      const parsedPermissions = this.parseUserPermissions(userPermissions);

      const newState: AuthState = {
        isAuthenticated: true,
        username,
        permissions: parsedPermissions,
        accessToken,
        refreshToken,
      };

      this.updateAuthState(newState);
      return true;
    } catch (error) {
      console.error('Error handling sign-in response:', error);
      return false;
    }
  }

  private handleSignInError(error: HttpErrorResponse): Observable<boolean> {
    console.error('Sign-in error:', error.message);
    this.clearAuthData();
    return of(false);
  }

  private updateAuthState(state: AuthState): void {
    try {
      // Update BehaviorSubject
      this.authState.next(state);

      // Update session storage
      sessionStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(state));

      // Update permission flags
      if (state.permissions.length > 0) {
        this.permissionFlagsService.updatePermissionFlags(state.permissions);
      }
    } catch (error) {
      console.error('Error updating auth state:', error);
      this.clearAuthData();
    }
  }

  private parseUserPermissions(permissions: string | BasePermission[]): BasePermission[] {
    try {
      let parsedPermissions: BasePermission[];

      if (typeof permissions === 'string') {
        parsedPermissions = JSON.parse(permissions);
      } else if (Array.isArray(permissions)) {
        parsedPermissions = permissions;
      } else {
        console.warn('Invalid permissions format');
        return [];
      }

      return parsedPermissions.map(perm => ({
        ...perm,
        context: this.normalizeContext(perm.context)
      }));
    } catch (error) {
      console.error('Error parsing permissions:', error);
      return [];
    }
  }

  private normalizeContext(context: string | string[]): string[] {
    if (Array.isArray(context)) {
      return context.map(c => c.trim()).filter(Boolean);
    }
    if (typeof context === 'string') {
      return context.split(',').map(c => c.trim()).filter(Boolean);
    }
    return [];
  }

  private clearAuthData(): void {
    const emptyState: AuthState = {
      isAuthenticated: false,
      username: '',
      permissions: [],
      accessToken: null,
      refreshToken: null,
    };

    try {
      this.updateAuthState(emptyState);
      sessionStorage.removeItem(this.AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }
}
