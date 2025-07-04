// @ts-nocheck
import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TAB_ID } from 'src/app/providers/tab-id.provider';
import { advanceGeneralSettingsKey, AIApiType } from '../../constants';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.Default
})
export class SettingsComponent implements OnInit {

  message: string;
  targetSiteSettings: any = [];
  sourceSiteSettings: any = [];
  selectedSiteSettings: any = [];
  faqs: any = [
    {
      question: 'Is there a free trial available?',
      answer: `We don’t offer a free trial, but we do provide a 30-day money-back guarantee. Try PastePerfect.Ai risk-free, and if you're not satisfied, we’ll refund your purchase—no questions asked.`,
      isActive: false
    },
    {
      question: `How do I use the Extension?`,
      answer: `Check our Help pages for details on how to use all our brilliant features. We provide text and video tutorials on all of our features.`,
      isActive: false
    },
    {
      question: `Can I Request a Site to be Integrated?`,
      answer: `Yes! Email us at Support@pasteperfect.ai with the details, and we can build a custom copy button for any site.`,
      isActive: false
    },
    {
      question: `I have an issue pasting information`,
      answer: `Email us at Support@pasteperfect.ai with the website and we can fix it ASAP!`,
      isActive: false
    },
    {
      question: `AI is Messing up on certain orders`,
      answer: `Email us at Support@pasteperfect.ai and include the log information so we can train our AI to prevent this issue going forward.`,
      isActive: false
    },
    {
      question: `Is my data private?`,
      answer: `We do not monitor or review any of your sites or mappings. We only provide logs to help fix any AI mistakes at your request. Access to logs is only possible if you provide us with your Log Password, ensuring your data stays private and secure.`,
      isActive: false
    },
  ];

  showAllSettings = false;
  isModalActive = false;
  selectedSetting: any = null;

  selectedTab = '1';
  logs: any = [];
  showLogs = false;

  generalSettings: GeneralSettings = {
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

  private readonly router: Router;

  constructor(@Inject(TAB_ID) readonly tabId: number, router: Router) {
    this.router = router;
  }

  ngOnInit() {
    this.isModalActive = false;
    this.getTargetSettings();
    this.selectedTab = '1';
    this.getGeneralSettings();
  }

  async toggleFaq(faq: Faq) {
    this.faqs.forEach(f => {
      if (f !== faq) {
        f.isActive = false;
      }
    });
    faq.isActive = !faq.isActive;
  }

  async getTargetSettings() {
    this.selectedSiteSettings = []
    let settings = await chrome.storage.local.get('settings');
    if (settings.settings) {
      this.targetSiteSettings = settings.settings.filter(z => !z.sourceSite);
    }
    else {
      this.targetSiteSettings = [];
    }
    this.selectedSiteSettings = this.targetSiteSettings;
    console.log('Settings fetched: ', this.selectedSiteSettings);
  }


  async getSourceSitesSettings() {
    this.selectedSiteSettings = []
    let settings = await chrome.storage.local.get('settings');
    if (settings.settings) {
      this.sourceSiteSettings = settings.settings.filter(z => z.sourceSite == true);
    }
    else {
      this.sourceSiteSettings = [];
    }
    this.selectedSiteSettings = this.sourceSiteSettings;
    console.log('Settings fetched: ', this.selectedSiteSettings);
  }

  goToMainScreen() {
    this.router.navigate(['popup']);
  }
  async confirmDeleteSetting(setting: any) {
    this.selectedSetting = setting;
    this.isModalActive = true;

    let host = this.selectedSetting.url;
    let keySettings = host + 'siteFieldMappingSettings';
    let sett = await chrome.storage.local.get();

    console.log('Settings: ', sett);
  }

  cancelDeleteSetting() {
    this.selectedSetting = null;
    this.isModalActive = false;
  }

  async deleteSetting() {
    this.targetSiteSettings = this.targetSiteSettings.filter(s => s !== this.selectedSetting);
    await chrome.storage.local.set({ settings: this.targetSiteSettings });

    //delete mapping settings
    //get host

    let host = this.selectedSetting.url;
    let keySettings = host + 'siteFieldMappingSettings';
    let keySettingsIndexed = host + 'siteFieldMappingSettingsIndexed';

    await chrome.storage.local.remove(keySettings);
    await chrome.storage.local.remove(keySettingsIndexed);
    await chrome.storage.local.remove("amazonSellerNotes");

    this.cancelDeleteSetting();
    this.getTargetSettings();
  }

  showDetailsOfWebsiteSetting(setting: any) {
    console.log('Setting: ', setting);
    this.router.navigate(['popup/setting/' + setting.url]);

  }

  async deleteInputMappingSetting() {
    let host = this.selectedSetting.url;
    let keySettings = host + 'siteFieldMappingSettings';
    let sett = await chrome.storage.local.get();

    let siteFieldMappingSettings = sett[keySettings] || {};

    //delete mapping settings
    await chrome.storage.local.remove(keySettings);

    this.cancelDeleteSetting();
    this.getTargetSettings();
  }

  async getLogs() {

    //get logs
    let logs = await chrome.storage.local.get('logs');
    
    if (logs.logs) {
      this.logs = logs.logs;
    }
    else {
      this.logs = [];
    }
  }

  async copyLog(log) {
    let text = JSON.stringify(log);
    navigator.clipboard.writeText(text);
    await this.showToaster('Log copied to clipboard');

  }

  async copyTransactionId(log) {
    let text = log.transactionId;
    navigator.clipboard.writeText(text);
    await this.showToaster('Log copied to clipboard');
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
      this.updateLogoPath("dark")
    }else{
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
      this.updateLogoPath("light")
    }

    await this.getGeneralSettings();

  }

  updateLogoPath(mode){
    const image = document.getElementById("headerLogoIcon");
    console.log("mode: ", mode);
    if(mode == "light"){
      console.log("entered in light");
      let img = '../../../../../assets/images/PastePerfectLogoLight.png';
      image.setAttribute("src", img);
    }else{
      console.log("entered in dark");
      let img = '../../../../../assets/images/PastePerfectLogoDark.png';
      image.setAttribute("src", img);
    }
  }

  async showToaster(text: string, success = true) {
    //disappearing message
    let toasrtMessage = document.createElement('div');
    toasrtMessage.textContent = text;
    toasrtMessage.style.position = 'fixed';
    toasrtMessage.style.top = '0';
    toasrtMessage.style.left = '0';
    toasrtMessage.style.right = '0';
    toasrtMessage.style.backgroundColor = success ? 'green' : 'red';
    toasrtMessage.style.color = 'white';
    toasrtMessage.style.padding = '10px';
    toasrtMessage.style.textAlign = 'center';
    toasrtMessage.style.zIndex = '9999';
    document.body.appendChild(toasrtMessage);

    //delete message after 2 seconds
    setTimeout(() => {
      toasrtMessage.remove();
    }, 2000);
  }
}
