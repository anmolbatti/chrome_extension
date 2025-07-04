import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  readonly baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) { }

  getActiveSubscription(): Observable<any> {
    return new Observable(observer => {
      chrome.storage.local.get("extensionUser").then(user => {
        console.log({user});
        this.http.get(`${this.baseUrl}/lemon-squeezy/active-subscription`, {
          headers: {
            Authorization: `Bearer ${user?.['extensionUser']?.['sessionToken']}`
          }
        }).subscribe({
          next: (data) => {
            observer.next(data);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      });
    });
  }
}


