import { CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { Observable } from "rxjs";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
  })
export class AuthGuard implements CanActivate{
    constructor(private authService: AuthService, private router: Router) {}
  
    async canActivate(): Promise<boolean> {


      //get auth status from local storage
      const authUser = await chrome.storage.local.get("extensionUser") as any;
      console.log("ext user", authUser.extensionUser)

      if(authUser.extensionUser){
        return true;
      }
      this.router.navigate(['popup/login']);
        return false;
      

      // return this.authService.isAuthenticated().then(isAuth => {
      //   if (!isAuth) {
      //     this.router.navigate(['popup/login']);
      //     return false;
      //   }
      //   return true;
      // });
    }
  }