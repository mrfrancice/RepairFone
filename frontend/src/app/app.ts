import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { ToastContainerComponent } from './shared/components/toast/toast-container.component';
import { NetworkStatusComponent } from './shared/components/network-status/network-status.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BottomNavComponent, ToastContainerComponent, NetworkStatusComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
