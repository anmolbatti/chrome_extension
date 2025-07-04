import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  isSaving = false;
  loginObj = {
    email: '',
    password: ''
  }

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  }

  async login() {
    try {
      this.isSaving = true;
      await this.authService.login(this.loginObj.email, this.loginObj.password);
    } catch (error) {
      console.error('Login error', error);
    } finally {
      this.isSaving = false;
    }
  }

  async gotoRegister() {
    chrome.tabs.create({ url: `${environment.appUrl}/register` });
    return;
  }

  async gotoLogin() {
    chrome.tabs.create({ url: `${environment.appUrl}/login` });
    return;
  }
}
