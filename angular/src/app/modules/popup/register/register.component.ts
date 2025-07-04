import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {

  isSaving = false;
  registerObj = {
    email: '',
    password: '',
    confirmPassword: ''
  }

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  }

  async loginPage() {
    this.router.navigate(['popup/login']);
  }


  async register() {
    try {

      if (!await this.validatePassword()) {
        return
      }

      this.isSaving = true;

      await this.authService.register(this.registerObj.email, this.registerObj.password);
    } catch (error) {
      console.error('Register error', error);
    } finally {
      this.isSaving = false;
    }
  }


  async validatePassword() {
    if (this.registerObj.password !== this.registerObj.confirmPassword) {
      await this.toastMessage('Password and Confirm Password should be same');
      return false;
    }

    //password should be atleast 6 characters with atleast 1 uppercase, 1 lowercase.
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
    if (!passwordRegex.test(this.registerObj.password)) {
      await this.toastMessage('Password should be atleast 6 characters with atleast 1 uppercase, 1 lowercase and 1 number');
      return false;
    }

    return true;
  }

  async toastMessage(text: string) {
    let message = document.createElement('div');
    message.textContent = text;
    message.style.position = 'fixed';
    message.style.top = '0';
    message.style.left = '0';
    message.style.right = '0';
    message.style.backgroundColor = 'green';
    message.style.color = 'white';
    message.style.padding = '10px';
    message.style.textAlign = 'center';
    message.style.zIndex = '9999';
    document.body.appendChild(message);

    //delete message after 2 seconds
    setTimeout(() => {
      message.remove();
    }, 2000);
  }
}