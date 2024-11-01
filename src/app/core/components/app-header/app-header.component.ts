import {AfterViewInit, Component, computed, ElementRef, inject, OnInit} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from "@angular/router";
import { NgClass } from "@angular/common";
import { filter } from "rxjs";
import {AuthService, PermissionFlagsService} from "../../services";
import { FormsModule } from "@angular/forms";
import { Dropdown } from 'flowbite';
import type { DropdownOptions, DropdownInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    NgClass,
    FormsModule,
  ],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss'
})
export class AppHeaderComponent implements OnInit, AfterViewInit {
  activeButton = '';
  selectedLabel = 'Select Item';
  dropdown: DropdownInterface | null = null;
  authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private elementRef = inject(ElementRef);
  public permissionFlags = inject(PermissionFlagsService);

  // Create a computed signal for the filtered buttons
  filteredButtons = computed(() => {
    return this.buttons.filter(button => {
      const flagKey = `canAccess${this.capitalizeFirstLetter(button.status)}`;
      return this.permissionFlags.flags[flagKey as keyof typeof this.permissionFlags.flags]();
    });
  });

  buttons = [
    {label: 'Pending', status: 'pending', key: 'pending'},
    {label: 'Approved', status: 'approved', key: 'approved'},
    {label: 'Checked-In', status: 'checkedIn', key: 'checkedIn'},
    {label: 'Checked-Out', status: 'checkedOut', key: 'checkedOut'},
    {label: 'Rejected', status: 'rejected', key: 'rejected'},
    {label: 'Canceled', status: 'canceled', key: 'canceled'},
  ];

  private capitalizeFirstLetter(string: string): string {
    if (string === 'checkedIn') return 'CheckedIn';
    if (string === 'checkedOut') return 'CheckedOut';
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  ngOnInit() {
    this.setActiveButton();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.setActiveButton();
    });
  }

  setActiveButton() {
    this.route.queryParams.subscribe(params => {
      const status = params['status'] || '';
      // Only set active button if user has permission for that status
      const flagKey = `canAccess${this.capitalizeFirstLetter(status)}`;
      if (!status || this.permissionFlags.flags[flagKey as keyof typeof this.permissionFlags.flags]()) {
        this.activeButton = status;
        this.updateSelectedLabel();
      }
    });
  }

  updateSelectedLabel() {
    const selectedButton = this.filteredButtons().find(button => button.key === this.activeButton);
    this.selectedLabel = selectedButton ? selectedButton.label : 'Select Item';
  }

  navigate(status: string) {
    const flagKey = `canAccess${this.capitalizeFirstLetter(status)}`;
    if (!status || this.permissionFlags.flags[flagKey as keyof typeof this.permissionFlags.flags]()) {
      if (status === '') {
        this.router.navigate(['/visitors']);
      } else {
        this.router.navigate(['/visitors'], {queryParams: {status}});
      }
      this.dropdown?.hide();
    }
  }

  logout() {
    this.authService.signOut();
  }

  ngAfterViewInit() {
    this.initializeDropdown();
  }

  initializeDropdown() {
    const $targetEl: HTMLElement | null = document.getElementById('dropdown');
    const $triggerEl: HTMLElement | null = document.getElementById('dropdownDefaultButton');
    if ($targetEl && $triggerEl) {
      const options: DropdownOptions = {
        placement: 'bottom',
        triggerType: 'click',
        offsetSkidding: 0,
        offsetDistance: 10,
        onHide: () => {
          this.elementRef.nativeElement.click();
        },
        onShow: () => {
          this.elementRef.nativeElement.click();
        },
        onToggle: () => {
        },
      };
      const instanceOptions: InstanceOptions = {
        id: 'dropdown',
        override: true
      };
      this.dropdown = new Dropdown(
        $targetEl,
        $triggerEl,
        options,
        instanceOptions
      );
      $triggerEl.addEventListener('click', (event) => {
        event.stopPropagation();
        this.dropdown?.toggle();
      });
    }
  }
}
