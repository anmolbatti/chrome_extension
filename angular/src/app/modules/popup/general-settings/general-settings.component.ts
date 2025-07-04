import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { advanceGeneralSettingsKey, AdvanceSettings, AIApiType, GeneralSettings } from '../../constants';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrl: './general-settings.component.scss'
})
export class GeneralSettingsComponent implements OnInit {


  url: string;
  generalSettings: GeneralSettings  = {
    addFirstAndLastNameToAddress: false,
    addCompanyToAddress: false,
    addZipCodeToAddress: false,
    addStateToAddress: false,
    addAddress1ToAddress: true,
    addAddress2ToAddress: false,
    addCityToAddress: false,
    addPhoneToAddress: false,
    addEmailToAddress: false,
    darkMode: false,
    aiAPI: AIApiType.GPT.toString()
  };

  constructor(private _router: Router) {

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
    
  }

  async updateSettings() {
    let key = advanceGeneralSettingsKey;
    await chrome.storage.local.set({ [key]: this.generalSettings });

    if(this.generalSettings.darkMode == true){
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }else{
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

    await this.getGeneralSettings();

  }

  async goToMainScreen() {
    this._router.navigate(['/popup']);
  }
}