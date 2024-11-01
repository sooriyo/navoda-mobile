import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, map } from 'rxjs';

type AccessFlag = 'Pending' | 'Approved' | 'CheckedIn' | 'CheckedOut' | 'Rejected' | 'Canceled';
type PermissionFlag = 'Create' | 'Update' | 'Delete' | 'Approve' | 'Reject' | 'Cancel' | 'CheckIn' | 'CheckOut';
type FlagKey = `canAccess${AccessFlag}` | `can${PermissionFlag}Visitor`;

type FlagSignals = {
  [K in FlagKey]: Signal<boolean>;
};

interface PermissionConfig {
  [key: string]: {
    flags: FlagKey[];
    contextMap?: Record<string, FlagKey>;
    supportsWarehouse?: boolean;
  };
}

interface Permission {
  resourcePath: string;
  context: string[];
  warehouseIds?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionFlagsService {
  private permissionConfig: PermissionConfig = {
    'visitors': {
      flags: [
        'canAccessPending',
        'canAccessApproved',
        'canAccessCheckedIn',
        'canAccessCheckedOut',
        'canAccessRejected',
        'canAccessCanceled'
      ] as const
    },
    'visitor-create': {
      flags: [
        'canCreateVisitor',
        'canUpdateVisitor',
        'canDeleteVisitor'
      ] as const,
      contextMap: {
        'Create': 'canCreateVisitor',
        'Update': 'canUpdateVisitor',
        'Delete': 'canDeleteVisitor'
      }
    },
    'handle-visitors': {
      flags: [
        'canApproveVisitor',
        'canRejectVisitor',
        'canCancelVisitor',
        'canCheckInVisitor',
        'canCheckOutVisitor'
      ] as const,
      contextMap: {
        'Approve': 'canApproveVisitor',
        'Reject': 'canRejectVisitor',
        'Cancel': 'canCancelVisitor',
        'Check-In': 'canCheckInVisitor',
        'Check-Out': 'canCheckOutVisitor'
      }
    }
  } as const;

  private permissionsSubject = new BehaviorSubject<Permission[]>([]);
  permissions$ = this.permissionsSubject.asObservable();

  readonly flags: FlagSignals = Object.fromEntries(
    Object.values(this.permissionConfig)
      .flatMap(config => config.flags)
      .map(flag => [
        flag,
        toSignal(this.permissions$.pipe(
          map(permissions => this.calculateFlagValue(flag, permissions))
        ), { initialValue: false })
      ])
  ) as FlagSignals;

  updatePermissionFlags(permissions: Permission[]) {
    this.permissionsSubject.next(permissions);
  }

  private calculateFlagValue(flag: FlagKey, permissions: Permission[]): boolean {
    for (const permission of permissions) {
      const config = this.permissionConfig[permission.resourcePath];
      if (config) {
        console.log(`Checking permission:`, permission);
        if (permission.resourcePath === 'visitors' && flag.startsWith('canAccess')) {
          const accessType = flag.replace('canAccess', '');
          if (permission.context.includes('all') ||
            permission.context.includes(accessType)) {
            return true;
          }
        } else if (config.contextMap) {
          const contextKey = Object.entries(config.contextMap)
            .find(([, value]) => value === flag)?.[0];
          if (contextKey && permission.context.includes(contextKey)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getPermissionSignal(status: string): Signal<boolean> {
    const key = `canAccess${status}` as FlagKey;
    return this.flags[key];
  }

  hasAnyAccess(): Signal<boolean> {
    return toSignal(this.permissions$.pipe(
      map(permissions => permissions.some(p =>
        p.resourcePath === 'visitors' && p.context.length > 0
      ))
    ), { initialValue: false });
  }
}
