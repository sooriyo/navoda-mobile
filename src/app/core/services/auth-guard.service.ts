import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';
import { catchError, map, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private portalUrl = environment.PORTAL;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    if (route.routeConfig?.path === 'error') {
      return of(true);
    }

    const authKey = route.queryParams['auth-key'];

    if (authKey) {
      return this.handleAuthKeyRoute(authKey);
    }

    return this.authService.getAuthState().pipe(
      take(1),
      map(authState => this.handleNormalRoute(authState, route)),
      catchError(() => {
        console.error('Error checking authentication state');
        return of(this.router.createUrlTree([this.portalUrl]));
      })
    );
  }

  private handleAuthKeyRoute(authKey: string): Observable<boolean | UrlTree> {
    return this.authService.signIn(authKey).pipe(
      take(1),
      map(success => {
        if (success) {
          return this.router.createUrlTree(['/visitors']);
        }
        return this.router.createUrlTree([this.portalUrl]);
      }),
      catchError(() => {
        console.error('Error during sign-in with auth key');
        return of(this.router.createUrlTree([this.portalUrl]));
      })
    );
  }

  private handleNormalRoute(authState: any, route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!authState.isAuthenticated) {
      window.location.href = this.portalUrl;
      return false;
    }

    return this.checkPermissionsForRoute(route);
  }

  private checkPermissionsForRoute(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const requiredPath = route.routeConfig?.path || '';
    const requiredAction = route.data['requiredAction'] as string;
    const status = route.queryParams['status'];

    if (!requiredAction) {
      return true;
    }

    const hasPermission = this.authService.hasPermission(requiredPath, requiredAction, status);

    if (!hasPermission) {
      console.warn(`User lacks permission for path: ${requiredPath}, action: ${requiredAction}`);
      return this.router.createUrlTree(['/visitors']);
    }

    return true;
  }
}
