import { Component } from '@angular/core';
import { advanceGeneralSettingsKey } from '../../constants';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss'
})
export class LogoComponent {

 generalSettings: GeneralSettings;
  
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
}
