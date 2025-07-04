import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PopupComponent } from './pages/popup/popup.component';
import { PopupRoutingModule } from './popup-routing.module';
import { MainscreenComponent } from './mainscreen/mainscreen/mainscreen.component';
import { SettingsComponent } from './settings/settings.component';
import { FormsModule } from '@angular/forms';
import { SettingDetailComponent } from './settings/setting-detail/setting-detail.component';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HeaderComponent } from "./header/header.component";
import { LogoComponent } from './logo/logo.component';
import { SubscribeMessageComponent } from "./subscribe-message/subscribe-message.component";

@NgModule({
  declarations: [PopupComponent, MainscreenComponent, SettingsComponent, SettingDetailComponent, GeneralSettingsComponent, LoginComponent, RegisterComponent, HeaderComponent,
    LogoComponent
  ],
  imports: [CommonModule, PopupRoutingModule, FormsModule, SubscribeMessageComponent]
})
export class PopupModule { }
