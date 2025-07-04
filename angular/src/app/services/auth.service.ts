import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private afAuth: AngularFireAuth, private router: Router) { }

  async login(email: string, password: string): Promise<void> {
    try {
      const res = await this.afAuth.signInWithEmailAndPassword(email, password);
     console.log("login",res)
      this.router.navigate(['popup/mainscreen']);
    } catch (error) {
      console.error('Login error', error);
    }
  }

  async register(email: string, password: string): Promise<void> {
    try {
      const res = await this.afAuth.createUserWithEmailAndPassword(email, password);
      //signout
      await this.afAuth.signOut();
      console.log("register",res)
      this.router.navigate(['popup/login']);
    } catch (error) {
      console.error('Register error', error.message);
    }
  }

  async logout(): Promise<void> {
    try {
      await this.afAuth.signOut();
      this.router.navigate(['popup/login']);
    } catch (error) {
      console.error('Logout error', error);
    }
  }

  getAuthState() {
    return this.afAuth.authState;
  }

  isAuthenticated(): Promise<boolean> {
    return this.afAuth.authState.pipe(take(1)).toPromise().then(user => !!user);
  }
}
