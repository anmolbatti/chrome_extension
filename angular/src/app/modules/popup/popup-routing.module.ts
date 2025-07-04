import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PopupComponent } from './pages/popup/popup.component';
import { MainscreenComponent } from './mainscreen/mainscreen/mainscreen.component';
import { SettingsComponent } from './settings/settings.component';
import { SettingDetailComponent } from './settings/setting-detail/setting-detail.component';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { AuthService } from 'src/app/services/auth.service';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from 'src/app/providers/auth.guard';
import { RegisterComponent } from './register/register.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'mainscreen'
  },
  {
    path: 'mainscreen',
    component: MainscreenComponent,
      
  },
  {
    path: 'settings',
    component: SettingsComponent,
    
  },
  {
    path: 'general-settings',
    component: GeneralSettingsComponent,
    
  },
  {
    path: 'setting/:url',
    component: SettingDetailComponent,
    
  },
  {
    path: 'login',
    component: LoginComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PopupRoutingModule { }
