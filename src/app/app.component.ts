import {Component, computed, effect, inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {initFlowbite} from "flowbite";
import {AppHeaderComponent, AuthService, LoadingService, NotificationService} from "./core";
import {DotAnimationComponent} from "./core/components/loading/dot-animation/dot-animation.component";
import {NotificationAlertComponent} from "./core/components/notification/notification-alert.component";
import {DotLoadingServices} from "./core/services/dot-loading.Services";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AppHeaderComponent, DotAnimationComponent, NotificationAlertComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit ,OnDestroy {
  title = 'VMS';

  private route = inject(ActivatedRoute);

  private subscriptions: Subscription = new Subscription();
  isLoading = computed(() => this.dotLoadingServices.isLoading());
  hideOnPages: boolean = false;
  showError: boolean = false;
  private querySub: Subscription | undefined;
  isLoginPage: boolean = false;


  constructor(
    private loadingService: LoadingService,
    private router: Router,
    public dotLoadingServices: DotLoadingServices,
    public notificationService: NotificationService,
    protected authService: AuthService,
    private activatedRoute: ActivatedRoute,

  ) {
    effect(() => {
      this.querySub = this.activatedRoute.queryParams.subscribe(params => {
        const keyValue = params['auth-key'];
        if (keyValue) {
          this.authService.signIn(keyValue).subscribe(
            response => {
              this.showError = false;
            },
            error => {
              console.error('Login failed', error);
              this.triggerError();
            }
          );
        }
      });
    });
  }

  get notifications() {
    return this.notificationService.notification;
  }
  ngOnInit(): void {
    initFlowbite();
    this.subscriptions.add(
      this.loadingService.isLoading.subscribe((isLoading) => {
        this.dotLoadingServices.setLoading(isLoading);
      })
    );

    this.subscriptions.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.hideOnPages = this.router.url.includes('/login' && '/error' && '/authenticate');
        }
      })
    );
  }



  ngOnDestroy(): void {
    if (this.querySub)
      this.querySub.unsubscribe();

    this.subscriptions.unsubscribe();
  }

  triggerError() {
    this.showError = false;
    setTimeout(() => this.showError = true, 0);
  }


}
