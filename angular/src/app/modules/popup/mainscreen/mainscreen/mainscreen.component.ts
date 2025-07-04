// @ts-nocheck

import { AfterViewInit, Component, Inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TAB_ID } from 'src/app/providers/tab-id.provider';

import('../../../../../../../chrome/src/serviceWorker')

import { advanceGeneralSettingsKey, AIApiType } from 'src/app/modules/constants';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { ApiService } from 'src/app/services/api.service';

declare function fetch_mappings({ }): any;

@Component({
  selector: 'app-mainscreen',
  standalone: false,
  templateUrl: './mainscreen.component.html',
  styleUrl: './mainscreen.component.scss'
})
export class MainscreenComponent implements OnInit, AfterViewInit {

  private readonly router: Router;
  activeSubscription: { activeSubscriptions: boolean } = { activeSubscriptions: false };
  inputModel: any = {};
  fields: string[] = [];
  extensionEnabled = false;
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

  constructor(@Inject(TAB_ID) readonly tabId: number, router: Router, private ngZone: NgZone, private authService: AuthService, private apiService: ApiService) {
    this.router = router;

  }


  async logout() {
    await this.authService.logout();
  }

  async fillFields(data?) {
    if (data) {
      this.inputModel = data;
    } else {
      const d = await chrome.storage.local.get();
      this.inputModel = d.details;
      console.log(d.details);

    }
  }


  async getGeneralSettings() {
    //get advance settings from chrome storage
    let key = advanceGeneralSettingsKey
    let settings = await chrome.storage.local.get(key);
    console.log(settings);
    if (settings[key] != null) {

      this.generalSettings = settings[key];
    }
    else {

      //create default settings and save
      let defaultSettings: GeneralSettings = {
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
      this.generalSettings = defaultSettings;
      await chrome.storage.local.set({ [key]: this.generalSettings });
    }

    if (this.generalSettings.darkMode == true) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }

  }

  async prepareAddressAndCopyToClipboard() {

    //get general settings
    let key = advanceGeneralSettingsKey;
    let settings = await chrome.storage.local.get(key);
    console.log(settings);
    let address = '';
    if (settings[key] != null) {

      let generalSettings = settings[key] as GeneralSettings;


      if (generalSettings.addFirstAndLastNameToAddress) {
        address = `${this.inputModel.firstname ?? ""} ${this.inputModel.lastname ?? ""}`
      }

      if (generalSettings.addCompanyToAddress)
        address += ` ${this.inputModel.companyname ?? ""}`;



      address += ` ${this.inputModel.streetAddress ?? ""}`

      if (generalSettings.addAddress2ToAddress) {
        address += ` ${this.inputModel.streetAddress2 ?? ""}`
      }

      if (generalSettings.addCityToAddress) {
        address += `, ${this.inputModel.city ?? ""}`
      }

      if (generalSettings.addStateToAddress) {
        address += `, ${this.inputModel.state ?? ""}`
      }

      if (generalSettings.addZipCodeToAddress) {
        address += `, ${this.inputModel.zipcode ?? ""}`
      }


      if (generalSettings.addPhoneToAddress) {
        address += `, ${this.inputModel.phone ?? ""}`
      }

      if (generalSettings.addEmailToAddress)
        address += `, ${this.inputModel.email ?? ""}`


      address = address.trim();

    } else {
      address = `${this.inputModel.streetAddress} ${this.inputModel.streetAddress2}, ${this.inputModel.city}, ${this.inputModel.state}, ${this.inputModel.zipcode}, ${this.inputModel.country}`.trim();

    }


    navigator.clipboard.writeText(address)
    this.showToastr('Address copied to clipboard!');

  }

  async showToastr(textContent: string) {

    //disappearing message
    let message = document.createElement('div');
    message.textContent = textContent;
    message.style.position = 'fixed';
    message.style.top = '0';
    message.style.left = '0';
    message.style.right = '0';
    message.style.backgroundColor = 'green';
    message.style.color = 'white';
    message.style.padding = '10px';
    message.style.textAlign = 'center';
    message.style.zIndex = '9999';
    document.body.appendChild(message);

    //delete message after 2 seconds
    setTimeout(() => {
      message.remove();
    }, 2000);
  }

  async ngAfterViewInit() {

    setTimeout(() => {
      const items = document.querySelectorAll('.dragItem');

      items.forEach(dragItem => {
        if (dragItem) {
          dragItem.addEventListener('dragstart', (e: DragEvent) => {

            const itemText = (e.target as HTMLElement).value;
            const itemId = (e.target as HTMLElement).name;
            e.dataTransfer.setData('text/plain', itemText);
            e.dataTransfer.setData('text/id', itemId);
            e.dataTransfer.setData('source', "ext");
            if (e.dataTransfer) {
              e.dataTransfer.setData('text/plain', itemText);
              e.dataTransfer.setData('text/id', itemId);
              e.dataTransfer.setData('source', "ext");
            }
          });

          dragItem.addEventListener('dragend', (e: DragEvent) => {

            const itemText = (e.target as HTMLElement).value;
            const itemId = (e.target as HTMLElement).name;
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
              if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'dragend', data: { text: itemText, id: itemId } });
              }
            });
          });
        }
      });
    }, 600);

  }

  getSubscriptionStatus(userId: string) {
    this.apiService.getActiveSubscription(userId).subscribe((res: any) => {
      chrome.storage.local.set({ activeSubscription: res });
      this.activeSubscription = res;
    });
  }

  async ngOnInit() {
    this.ngZone.run(async () => {
      let fieldsData = await chrome.storage.local.get();
      this.fields = fieldsData.fields;
    });


    const localSubscriptionStatus = await chrome.storage.local.get('activeSubscription');
    this.activeSubscription = localSubscriptionStatus.activeSubscription;
    console.log("activeSubscription", localSubscriptionStatus)
    let settings = await chrome.storage.local.get('settings');
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    const url = new URL(currentTab.url);
    const hostname = url.hostname;

    console.log(settings.settings);
    if (settings?.settings?.filter(z => z.url === hostname).length > 0) {
      this.extensionEnabled = true;
    }
    const authUser = await chrome.storage.local.get("extensionUser");
    console.log("ext user", authUser.extensionUser)
    if (authUser.extensionUser == null) {
      this.router.navigate(['popup/login']);
    }
    if (authUser.extensionUser)
      console.log("auth", authUser)
    this.getSubscriptionStatus(authUser.extensionUser.uid);
    this.fillFields();
    this.getGeneralSettings();
    chrome.runtime.onMessage.addListener(this.handleMessage);
  }


  handleMessage = (request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    this.ngZone.run(() => {
      if (request.action === 'changeData') {
        const data = request.data;
        this.fillFields(data)
        sendResponse({ success: true });
      }
      return true;
    });
  }



  goToGeneralSettings() {
    this.router.navigate(['popup/general-settings']);
  }

  async enableExtension(data: any) {
    console.log(data)
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    const url = new URL(currentTab.url);
    const hostname = url.hostname;

    await chrome.storage.local.set({ [hostname]: true });

  }

  async fillForm() {
    if (!this.activeSubscription.activeSubscriptions) {
      this.showToastr('Please subscribe to use this feature');
      return;
    }
    console.log('fill form')
    await chrome.tabs.sendMessage(this.tabId, { action: 'fill_form' })
  }

  async getFormFields() {
    await chrome.tabs.sendMessage(this.tabId, { action: 'get_form_fields' }, (response) => {
      if (response && response.success) {
        this.ngZone.run(async () => {
          this.fields = response.fields;
          await chrome.storage.local.set({ "fields": response.fields })
          this.showToastr("Fields Fetched!");
        });

      } else {
        this.showToastr("Failed to fetch fields.");
      }
    });
  }

  async onFieldChange(fieldName, fieldValue) {
    const d = await chrome.storage.local.get();
    await chrome.storage.local.set({ "details": { ...d.details, [fieldName]: fieldValue } })
  }

  async addressCorrection() {
    const d = await chrome.storage.local.get();
    const text = JSON.stringify(d.details);
    console.log('AddressCorrection contents: ', text);
    var response = await chrome.runtime.sendMessage({ action: 'address_correction', data: { text } });
    await chrome.runtime.sendMessage({ action: 'saveData', data: response.res });
  }

  async fetchMappings() {
    var res = await chrome.tabs.sendMessage(this.tabId, { action: 'get_post_data' });
    const d = res.postData;
    var result = await chrome.runtime.sendMessage({ action: 'fetch_mappings', data: { url: res.url, postData: d, isSingleFetch: false } });
    console.log(result)
    if (result.success) {
      this.extensionEnabled = true;
      this.enableExtension(true);
      // chrome.tabs.reload();
    }
  }

  async gotoSiteSettings() {
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    const url = new URL(currentTab.url);
    const hostname = url.hostname;
    this.router.navigate(['popup/setting/' + hostname]);

  }

  async getDataFromClipboard() {
    const text = await navigator.clipboard.readText();
    console.log('Clipboard contents: ', text);

    var result = await chrome.runtime.sendMessage({ action: 'fetch_mappings_clipboard', data: { text } });
    await chrome.runtime.sendMessage({ action: 'saveData', data: result.res });
    console.log("getDataFromClipboard", result)

  }
}
