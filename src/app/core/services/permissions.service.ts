import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {PermissionFlagsService} from "./permissionFlags.service";

export interface Permission {
  resourceId: number;
  resourceName: string;
  resourceType: string;
  resourcePath: string;
  action: string;
  ability: 'can' | 'cannot';
  type: string;
  context: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private permissionsSubject = new BehaviorSubject<Permission[]>([]);

  constructor(private permissionFlagsService: PermissionFlagsService) {
    this.loadPermissionsFromStorage();
  }

  private loadPermissionsFromStorage(): void {
    const userAuthString = sessionStorage.getItem('user-auth');
    if (userAuthString) {
      try {
        const userAuth = JSON.parse(userAuthString);
        if (userAuth && userAuth.userPermissions) {
          this.updatePermissions(userAuth.userPermissions);
        } else {
          console.warn('No user permissions found in storage');
        }
      } catch (error) {
        console.error('Error parsing user permissions from session storage:', error);
      }
    }
  }

  updatePermissions(userPermissions: Permission[]): void {
    this.permissionsSubject.next(userPermissions);
    this.permissionFlagsService.updatePermissionFlags(userPermissions);
  }
}
