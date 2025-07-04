import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, HttpClientModule, AngularFireModule.initializeApp({
    apiKey: "AIzaSyANretwOEf3-B6ibdtMAVaVqyouh5o6O6s",
    authDomain: "gpt-email-dom.firebaseapp.com",
    projectId: "gpt-email-dom",
    storageBucket: "gpt-email-dom.appspot.com",
    messagingSenderId: "761893025889",
    appId: "1:761893025889:web:bf9789ba0703322054d220",
    measurementId: "G-EKWQPM85T2"
  }),AngularFireAuthModule, FormsModule],
  bootstrap: [AppComponent]
})
export class AppModule {}
