import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { advanceGeneralSettingsKey } from '../../constants';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  generalSettings: GeneralSettings;
  constructor(private router:Router){

  }

  async logOut() {
    //remove user from local storage
    await chrome.storage.local.remove("extensionUser");
    this.router.navigate(['popup/login']);
  }
  async ngOnInit() {  
    await this.getGeneralSettings();

  }

  
  async getGeneralSettings() {
    //get advance settings from chrome storage
    
    let key = advanceGeneralSettingsKey
    let settings = await chrome.storage.local.get(key);
    console.log(settings);
    if (settings[key] != null) {

      this.generalSettings = settings[key];
    }
    if(this.generalSettings.darkMode){
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }else{
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
    
  }
  async goToMainScreen(){
    this.router.navigate(['popup/mainscreen']);
  }

  goToSettings() {
    this.router.navigate(['popup/settings']);
  }

  get notMainScreen(){
    return this.router.url != '/popup/mainscreen';
  }
  
}
