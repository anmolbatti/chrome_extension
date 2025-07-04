import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-subscribe-message',
  standalone: true,
  imports: [],
  templateUrl: './subscribe-message.component.html',
  styleUrl: './subscribe-message.component.scss'
})
export class SubscribeMessageComponent {
  constructor(private router: Router) {}

  goToSubscribe() {
    // Open the subscription page in a new tab
    window.open(`${environment.appUrl}/#pricing`, '_blank');
  }
}
