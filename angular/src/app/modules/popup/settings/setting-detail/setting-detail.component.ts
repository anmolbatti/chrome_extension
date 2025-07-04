import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdvanceSettings, advanceSettingsKey } from 'src/app/modules/constants';

@Component({
  selector: 'app-setting-detail',
  templateUrl: './setting-detail.component.html',
  styleUrl: './setting-detail.component.scss'
})
export class SettingDetailComponent implements OnInit {

  private readonly router: Router;
  url: string;
  siteSettings!: AdvanceSettings;
  lastSavedSettings!: AdvanceSettings;
  isSaving = false;
  constructor(router: Router, private activatedRoute: ActivatedRoute) {
    this.router = router;
    this.url = this.activatedRoute.snapshot.params["url"];
    console.log(this.url);
  }

  async ngOnInit() {
    await this.getAdvanceSettings();
  }

  async getAdvanceSettings() {
    //get advance settings from chrome storage
    let key = advanceSettingsKey(this.url);
    let settings = await chrome.storage.local.get(key);
    console.log(settings);
    if (settings[key] != null) {

      this.siteSettings = settings[key];
      this.lastSavedSettings = settings[key];
    }
    else {

      //create default settings and save
      let defaultSettings:AdvanceSettings = {
        specialCharacters: true,
        allowSpecialCharactersPhone: true,
        showFloatingButton: false,
        pasteCompletePhone: true,
        overRidePhone: false,
        overRidePhoneValue: ""
      };
      this.siteSettings = defaultSettings;
      this.lastSavedSettings = defaultSettings;
      await chrome.storage.local.set({ [key]: defaultSettings });
    }
  }

  async updateSettings(field?:string) {

    if(field == "overridePhoneValue"){
      this.isSaving = true;
    }

    let key = advanceSettingsKey(this.url);

    if(!this.siteSettings.overRidePhone){
      this.siteSettings.overRidePhoneValue = "";
    }
    await chrome.storage.local.set({[key]: this.siteSettings});

    let settings = await chrome.storage.local.get(key);
    this.siteSettings = settings[key];

    setTimeout(() => {
      this.isSaving = false;
    }, 1000);
   
    //refresh page if floatinbutton is enabled
    if(this.lastSavedSettings.showFloatingButton != this.siteSettings.showFloatingButton){
      this.lastSavedSettings = this.siteSettings;
      //reload tab
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.reload(tabs[0].id);
      });
    }
  }
  goToSettings() {
    this.router.navigate(['popup/settings']);
  }

  goToMainScreen() {
    this.router.navigate(['popup']);
  }


}
