

// @ts-nocheck

let oldPositionX,
  oldPositionY;
declare const floatingInit: any;
console.log("AUTO FILLER EXTENSION - CONTENT SCRIPT FOR FILLER");

const usaStates = {
  AL: "Alabama",
  AK: "Alaska",
  AS: "American Samoa",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District Of Columbia",
  FM: "Federated States Of Micronesia",
  FL: "Florida",
  GA: "Georgia",
  GU: "Guam",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MH: "Marshall Islands",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  MP: "Northern Mariana Islands",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PW: "Palau",
  PA: "Pennsylvania",
  PR: "Puerto Rico",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VI: "Virgin Islands",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming"
}

const DefaultCriteriaMap = {
  fullName: ["fullname"],
  firstname: ["firstname", "first-name", "fname"],
  lastname: ["lastname", "last-name", "lname"],
  companyname: ["companyname", "company-name", "cname", "company", "organization", "org"],
  city: ["city", "AddressCity"],
  state: ["state", "AddressStateOrRegion"],
  streetAddress: ["enterAddressLine1"],
  streetAddress2: ["enterAddressLine2"],
  zipcode: ["zip", "postalcode", "form-address-postal"],
  phone: ["phone"],
  country: ["countryCode"],
};

let reCheckInterval;
let MAX_RETRY = 20; // Increased retry limit
let RETRY_COUNT = 0;
let init_done = false;

window.onload = async () => {
  const host = window.location.host;
  const d = await chrome.storage.local.get(host);
  console.log('onload', d);

  window.addEventListener("message", (event) => {
    if (event.source !== window) return; // Ignore messages not from the same window

    if (event.data && event.data.type === "FROM_PAGE") {
      console.log('event', event);

      if (event.data.payload.action === 'userloggedin') {
    
        const user = event.data.payload.data;
        console.log('User logged in', user);
        chrome.storage.local.set({ extensionUser: user }).then(function () {
          // Send a response back to the content script
          sendResponse({ success: true });
        });;

      }

      // Forward the message to the background script
      chrome.runtime.sendMessage(event.data.payload, (response) => {
        // Optionally, handle the response from the background script
        window.postMessage({ type: "EXTENSION", payload: { action: "your_action", data: "some_data" } }, "*");
      });
    }
  });

  // if (!d[host]) return;

  reCheckInterval = setInterval(async () => {
    if (document.readyState === "complete" && document.querySelector("form")) {
      if (reCheckInterval) {
        clearInterval(reCheckInterval);
        reCheckInterval = undefined;
      }
      Init();
      return;
    }
    RETRY_COUNT++;
    if (RETRY_COUNT >= MAX_RETRY) {
      clearInterval(reCheckInterval);
      reCheckInterval = undefined;
      RETRY_COUNT = 0;
    }
  }, 500);
};


async function Init() {
  console.log('Called');



  const d = await chrome.storage.local.get();

  if (d.settings) {
    const settings = d.settings;
    let matchedSettings;
    settings.forEach((s) => {
      const hostUrl = window.location.host;
      const settingUrl = s.url.replaceAll("https://", "");

      if (hostUrl === settingUrl) {
        console.log("Matched Settings.", s);
        matchedSettings = s;
      }
    });

    // if (matchedSettings) {
    //   let selector;
    //   if (matchedSettings.streetAddress !== '') {
    //     selector = matchedSettings.streetAddress;
    //   } else {
    //     selector = Object.keys(matchedSettings).filter((key) => matchedSettings[key] !== "" && key !== "url")[0];
    //     if (selector === undefined) return;
    //   }

    //   const element = document.querySelector(selector);
    //   if (element) {
    //     floatingButton(element);
    //   }
    // }
  }

  if (!init_done) {
    document.addEventListener("click", function (event) {

      if (event.target && event.target.id === "form_auto_filler_extension_btn") {
        event.preventDefault();
        fillForm();
      }
    });

    document.addEventListener("keydown", function (event) {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === "Y") {
        fillForm();
      }
    });

    // Select the target node
    const targetNode = document.body;

    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    const callback = async function (mutationsList, observer) {
      await handleCallBack();
      await matchAndInsertOption(DefaultCriteriaMap);
    };

    // Create a MutationObserver instance
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
    init_done = true;

    fillCountryUSADefault();




    document.body.addEventListener('dragover', function (e) {
      e.preventDefault();
    });

    document.body.addEventListener('drop', async function (e) {



      console.log(e);
      const host = window.location.host;

      e.preventDefault();
      let itemText = e.dataTransfer.getData('text/plain');
      let itemId = e.dataTransfer.getData('text/id');
      const src = e.dataTransfer.getData('source');

      if (src != "ext")
        return;

      console.log(itemText, itemId, src);
      let realValue = itemText;
      if (itemId == 'state' && location.href.includes("zoro")) {

        // if state is 2 letter then convert to full state name
        if (itemText.length == 2) {
          itemText = usaStates[itemText];
        }

      }

      let keySettings = host + 'siteFieldMappingSettings';
      let sett = await chrome.storage.local.get();

      let siteFieldMappingSettings = sett[keySettings] || {};

      let settingsSite = await chrome.storage.local.get(['settings']);

      const oldSettings = settingsSite.settings || [];

      const index = oldSettings.findIndex(oldSetting => oldSetting.url === host);

      if (index === -1) {
        oldSettings.push({
          url: host,
          fullName: "",
          firstname: "",
          lastname: "",
          companyname: "",
          city: "",
          state: "",
          streetAddress: "",
          streetAddress2: "",
          zipcode: "",
          phone: "",
          country: "",
        });
        // Save the updated settings to storage
        await chrome.storage.local.set({ 'settings': oldSettings });
        console.log('Settings saved to storage', oldSettings);
      }




      console.log(e);
      if (e.target.tagName === "SELECT") {


        e.target.querySelectorAll(`option`).forEach((op, index) => {
          op.selected = false;

          if (itemId === 'state' && location.href.includes("zoro")) {
            document.querySelector('.v-autocomplete__selection-text').textContent = itemText;
            e.target.value = itemText;

          }
          if (op.innerText.trim().toLowerCase() === itemText || op.value.toLowerCase() === itemText.toLowerCase()) {
            const optionToSelect = e.target.options[index];
            optionToSelect.selected = true;

            const changeEvent = new Event("change", {
              bubbles: true,
              cancelable: true,
            });
            e.target.dispatchEvent(changeEvent);
            let value = '';
            if (location.href.includes("zoro")) {
              const currentDiv = e.target;
              const parentDiv = e.target.closest('div[data-za]');
              value = `${parentDiv.tagName}[data-za="${parentDiv.attributes['data-za'].value}"] ${currentDiv.tagName}`
            }
            else if (e.target.attributes['data-bind']) {
              let attValue = e.target.getAttribute('data-bind');
              if (attValue?.includes('options')) {
                attValue = attValue.match(/value:([^,]*)/)[0]
              }
              value = `${e.target.tagName}[data-bind='${attValue}']`;
            }
            else if (e.target.attributes['data-za']) {
              value = `${e.target.tagName}[data-za="${e.target.attributes['data-za'].value}"]`;
            }
            else if (e.target.attributes['id']) {
              if (e.target.id.includes('.')) {
                value = `${e.target.tagName}#` + e.target.id.replace(/\./g, '\\.');
              } else {
                value = `${e.target.tagName}#${e.target.id}`;
              }
            }
            else if (e.target.attributes['class']) {
              value = `${e.target.tagName}.${e.target.className}`;
            } else {
              value = `${e.target.tagName}[${e.target.name}="${e.target.value}"]`
            }
            if (Object.keys(siteFieldMappingSettings).length != 0) {
              //comma separated
              let newval = siteFieldMappingSettings[value] + ',' + itemId;
              siteFieldMappingSettings[value] = newval;
            } else {
              siteFieldMappingSettings[value] = itemId;
            }
            console.log(siteFieldMappingSettings);
            return;
          }
        });
        return;
      }
      else if (e.target.tagName === "INPUT") {


        if (itemId === 'state' && location.href.includes("zoro")) {

          if (document.querySelector('.v-autocomplete__selection-text')) {

            document.querySelector('.v-autocomplete__selection-text').textContent = itemText;
            document.querySelector('[autocomplete="address-level1"]').value = realValue;
            triggerEvents(document.querySelector('[autocomplete="address-level1"]'))
          } else {

            // Select the parent div
            // Select the parent div using the data-za attribute
            const parentDiv = document.querySelector('[data-za="address-form-state"]');

            // Select the nested v-field__input div
            const fieldInputDiv = parentDiv.querySelector('.v-field__input[data-no-activator]');

            // Create the new div element
            const newDiv = document.createElement('div');
            newDiv.classList.add('v-autocomplete__selection');

            // Create the span element
            const newSpan = document.createElement('span');
            newSpan.classList.add('v-autocomplete__selection-text');
            newSpan.textContent = itemText;

            // Append the span to the new div
            newDiv.appendChild(newSpan);

            // Select the input element
            const inputElement = fieldInputDiv.querySelector('input');

            // Insert the new div before the input element
            fieldInputDiv.insertBefore(newDiv, inputElement);
            document.querySelector('[autocomplete="address-level1"]').value = realValue;
            triggerEvents(document.querySelector('[autocomplete="address-level1"]'))

          }

          e.target.value = itemText;

        }
        //if already value then append with space
        else if (e.target.value) {
          e.target.value = e.target.value + ' ' + itemText;
        } else {
          e.target.value = itemText;
        }
        triggerEvents(e.target);
        let value = '';
        if (location.href.includes("zoro")) {
          const currentDiv = e.target;
          const parentDiv = e.target.closest('div[data-za]');
          value = `${parentDiv.tagName}[data-za="${parentDiv.attributes['data-za'].value}"] ${currentDiv.tagName}`
        }
        else if (e.target.attributes['data-bind']) {

          let attValue = e.target.getAttribute('data-bind');
          if (attValue?.includes('options')) {
            attValue = attValue.match(/value:([^,]*)/)[0]
          }
          value = `${e.target.tagName}[data-bind='${attValue}']`;
        }
        else if (e.target.attributes['data-za']) {
          value = `${e.target.tagName}[data-za="${e.target.attributes['data-za'].value}"]`;
        }
        else if (e.target.attributes['id']) {

          if (e.target.id.includes('.')) {
            value = `${e.target.tagName}#` + e.target.id.replace(/\./g, '\\.');
          } else {
            value = `${e.target.tagName}#${e.target.id}`;
          }

        }
        else if (e.target.attributes['class']) {
          value = `${e.target.tagName}.${e.target.className}`;
        } else {
          value = `${e.target.tagName}[${e.target.name}="${e.target.value}"]`
        }

        if (Object.keys(siteFieldMappingSettings).length != 0 && (siteFieldMappingSettings[value] != undefined || siteFieldMappingSettings[value] != null)) {
          //comma separated
          let newval = siteFieldMappingSettings[value] + ',' + itemId;
          siteFieldMappingSettings[value] = newval;
        } else {
          siteFieldMappingSettings[value] = itemId;
        }


        //store settings based on site
        chrome.storage.local.set({ [keySettings]: siteFieldMappingSettings }, function () {
          console.log('Value is set to ' + settings);
        });


        console.log(siteFieldMappingSettings);
        return;
      }




    });



  }
}

async function advanceSettingsKey(url: string) {
  //generate advance settings key
  let key = `${url}-advance-settings`;
  return key;
}

async function checkForSpecialCharacters(input) {
  if (!input)
    return input;
  // Regular expression to match any character that is not a letter, number, period, or comma
  const regex = /[^a-zA-Z0-9.,+\- ]/gi;

  return input.replace(regex, '')

}

async function checkForSpecialCharactersForPhone(input) {

  //if input null or undefined or empty then return
  if (!input)
    return input;
  // Regular expression to match any character that is not a letter, number, period, or comma
  const regex = /[^a-z0-9,()\- ]/gi;

  return input.replace(regex, '')

}



async function fillForm() {
  const d = await chrome.storage.local.get();
  if (d.settings) {
    const settings = d.settings;
    let matchedSettings;
    settings.forEach((s) => {
      const hostUrl = window.location.host;
      const settingUrl = s.url.replaceAll("https://", "");

      if (hostUrl === settingUrl) {
        console.log("Matched Settings.", s);
        matchedSettings = s;
        return;
      }
    });

    if (matchedSettings) {
      let keySettings = window.location.host + 'siteFieldMappingSettings';
      let advancedSettingsKey = await advanceSettingsKey(window.location.host);
      let tempSettings = await chrome.storage.local.get(advancedSettingsKey);
      let advancedSettings = tempSettings[advancedSettingsKey] || {};
      console.log('Advanced Settings', advancedSettings);
      const details = d.details;
      for (const [key, value] of Object.entries(matchedSettings)) {
        if (value !== "" && key !== "url") {
          let element;

          if (window.location.host === 'www.logisticssupply.com') {
            element = document.querySelector(insertAsteriskAfterDataBind(value))
          }
          else {
            element = document.querySelector(value);
          }
          if (element) {

            //replace \\ with single slash
            let tempValue = value.replace('\\\\.', '\\.');;
            if (d[keySettings]?.[tempValue]) {

              if (!advancedSettings.specialCharacters) {

                details[d[keySettings][tempValue]] = await checkForSpecialCharacters(details[d[keySettings][tempValue]])
                // //throw error
                // alert('Special characters are not allowed - Field : ' + key + ' Value : ' + details[d[keySettings][tempValue]]);
                // return;
              }

              if (!advancedSettings.allowSpecialCharactersPhone && key == 'phone') {
                details[d[keySettings][tempValue]] = await checkForSpecialCharactersForPhone(details[d[keySettings][tempValue]])
              }

              if (key == 'phone' && advancedSettings.overRidePhone) {
                const val = advancedSettings.overRidePhoneValue ?? "";
                insertHandler(element, key, val);
              } else {
                const val = details[d[keySettings][tempValue]];
                insertHandler(element, key, val);
              }

            } else {
              if (!advancedSettings.specialCharacters) {

                details[key] = await checkForSpecialCharacters(details[key])
                // //throw error
                // alert('Special characters are not allowed - Field : ' + key + ' Value : ' + details[d[keySettings][tempValue]]);
                // return;
              }


              if (!advancedSettings.allowSpecialCharactersPhone && key == 'phone') {
                details[key] = await checkForSpecialCharactersForPhone(details[key])
              }

              if (key == 'phone' && advancedSettings.overRidePhone) {
                const val = advancedSettings.overRidePhoneValue ?? "";
                insertHandler(element, key, val);
              } else {
                const val = details[key];
                insertHandler(element, key, val);
              }

            }

          }
          else {


            console.log('Element Not Found', element);
          }
        }


      }


      let mapping = d[keySettings];

      if (mapping) {
        // convert mapping object {} to array []
        let mappingArray = Object.entries(mapping);

        if (mappingArray.length === 0) {
          console.log('Element Not Found in drop mapping', element);
        } else {

          for (let [mappingKey, mappingValue] of mappingArray) {

            let elements = document.querySelectorAll(mappingKey);
            elements.forEach(element => {

              if (mappingValue.includes(',') && mappingValue.split(',').length >= 2) {
                let values = mappingValue.split(',');
                //prepare value using multiple values and with space between

                let valueToAssign = '';
                values.forEach(splitValue => {
                  if (splitValue == 'undefined') return;
                  if (splitValue) {
                    valueToAssign = valueToAssign + ' ' + details[splitValue];
                  }
                });

                insertHandler(element, mappingKey, valueToAssign);

                return;
              }
              if (element) {
                insertHandler(element, mappingKey, details[mappingValue]);
              }
            })


          }

          return;
        }


      }


      return;
    }

    console.log(`Using Default settings, No Settings Available for ${window.location.host}.`);
    fillFormInputsDefault();
  }
}

function insertAsteriskAfterDataBind(htmlString) {
  const regex = /data-bind=(')/g;
  return htmlString.replace(regex, 'data-bind*=$1');
}

function triggerEvents(element) {
  console.log('triggerEvents', element);
  const events = ['input', 'change', 'blur'];
  events.forEach(eventType => {
    const event = new Event(eventType, { bubbles: true });
    element.dispatchEvent(event);
  });
}

function changevalue(element, value, mappingKey) {
  let realValue = value;
  if (location.href.includes("zoro") && mappingKey.includes('state')) {



    if (value.length == 2) {
      value = usaStates[value];
    }

    if (document.querySelector('.v-autocomplete__selection-text')) {

      document.querySelector('.v-autocomplete__selection-text').textContent = value;

      document.querySelector('[autocomplete="address-level1"]').value = realValue;
      triggerEvents(document.querySelector('[autocomplete="address-level1"]'))
    } else {

      // Select the parent div
      // Select the parent div using the data-za attribute
      const parentDiv = document.querySelector('[data-za="address-form-state"]');

      // Select the nested v-field__input div
      const fieldInputDiv = parentDiv.querySelector('.v-field__input[data-no-activator]');

      // Create the new div element
      const newDiv = document.createElement('div');
      newDiv.classList.add('v-autocomplete__selection');

      // Create the span element
      const newSpan = document.createElement('span');
      newSpan.classList.add('v-autocomplete__selection-text');
      newSpan.textContent = value;

      // Append the span to the new div
      newDiv.appendChild(newSpan);

      // Select the input element
      const inputElement = fieldInputDiv.querySelector('input');

      // Insert the new div before the input element
      fieldInputDiv.insertBefore(newDiv, inputElement);
      document.querySelector('[autocomplete="address-level1"]').value = realValue;
      triggerEvents(document.querySelector('[autocomplete="address-level1"]'))
    }


  }

  element.value = value;
  triggerEvents(element);

}

function fillCountryUSADefault() {

  // Regular expression to match 'country' in id or name (case insensitive)
  var regex = /country/i;
  // Try to find the element by id first
  var selectElement = Array.from(document.querySelectorAll('select'))
    .find(select => regex.test(select.id) || regex.test(select.name));

  if (!selectElement) {
    return;
  }
  selectElement.querySelectorAll(`option`).forEach((op, index) => {
    op.selected = false;
    if (
      op.innerText.trim().toLowerCase() === "united states" ||
      op.value.toLowerCase() === "us" ||
      op.value.toLowerCase() === "usa"
    ) {
      const optionToSelect = selectElement.options[index];
      optionToSelect.selected = true;

      const changeEvent = new Event("change", {
        bubbles: true,
        cancelable: true,
      });

      if (window.location.host !== "www.amazon.com") {
        selectElement.dispatchEvent(changeEvent);
      }
    }
  });

}

function insertHandler(element, key, value) {
  console.log('insertHandler', element, key, value);
  try {

    if (!element) return;
    element.value = "";

    if (!value) {
      triggerEvents(element);
    }

    if (element && element.type !== "hidden") {

      if (element.tagName === "SELECT" && key === "country") {
        element.querySelectorAll(`option`).forEach((op, index) => {
          op.selected = false;
          if (
            op.innerText.trim().toLowerCase() === "united states" ||
            op.value.toLowerCase() === "us" ||
            op.value.toLowerCase() === "usa"
          ) {
            const optionToSelect = element.options[index];
            optionToSelect.selected = true;

            const changeEvent = new Event("change", {
              bubbles: true,
              cancelable: true,
            });

            if (window.location.host !== "www.amazon.com") {
              element.dispatchEvent(changeEvent);
            }
          }
        });
      } else {
        if (element.tagName === "INPUT") {
          changevalue(element, value, key);
          return;
        }

        if (element.tagName === "SELECT") {

          if (window.location.host === 'spsindustrial.com') {
            setTimeout(() => {
              let isValueSet = false;
              element.querySelectorAll(`option`).forEach((op, index) => {
                op.selected = false;
                if (op.innerText.trim().toLowerCase() === value || op.value.toLowerCase() === value.toLowerCase()) {
                  const optionToSelect = element.options[index];
                  optionToSelect.selected = true;
                  element.value = value;
                  isValueSet = true;

                }
              });
              if (isValueSet) {

                const changeEvent = new Event("change", {
                  bubbles: true,
                  cancelable: true,
                });
                element.dispatchEvent(changeEvent);
                return;


              }
            }, 1000);
          }
          else {

            let isValueSet = false;
            element.querySelectorAll(`option`).forEach((op, index) => {
              op.selected = false;
              if (op.innerText.trim().toLowerCase() === value || op.value.toLowerCase() === value.toLowerCase()) {
                const optionToSelect = element.options[index];
                optionToSelect.selected = true;
                element.value = value;
                isValueSet = true;

              }
            });
            if (isValueSet) {
              setTimeout(() => {
                const changeEvent = new Event("change", {
                  bubbles: true,
                  cancelable: true,
                });
                element.dispatchEvent(changeEvent);
                return;
              }, 1000);

            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error.message, element);
  }
}

function matchesCriteria(input, criteria) {
  const cri = criteria.toLowerCase();

  return (
    input.name.toLowerCase().includes(cri) ||
    input.id.toLowerCase().includes(cri) ||
    input.className.toLowerCase().includes(cri) ||
    input.placeholder?.toLowerCase()?.includes(cri) ||
    input.getAttribute('label')?.toLowerCase()?.includes(cri) ||
    input.getAttribute('aria-label')?.toLowerCase()?.includes(cri)
  );
}

async function fillFormInputsDefault() {
  const forms = document.querySelectorAll("form");
  const d = await chrome.storage.local.get();
  const details = d.details;

  if (details.length === 0) {
    return alert("Please copy the data to the extension.");
  }

  forms.forEach((form) => {
    form.querySelectorAll('input:not([type="hidden"]), select:not([type="hidden"])').forEach((input) => {
      for (const [field, criteria] of Object.entries(DefaultCriteriaMap)) {

        if (criteria.some((cri) => matchesCriteria(input, cri))) {
          insertHandler(input, field, details[field]);
          break;
        }
      }
    });
  });
}

async function handleCallBack() {
  const d = await chrome.storage.local.get();
  if (d.settings) {
    const settings = d.settings;
    let matchedSettings;
    settings.forEach((s) => {
      const hostUrl = window.location.host;
      const settingUrl = s.url.replaceAll("https://", "");

      if (hostUrl === settingUrl) {
        matchedSettings = s;
      }
    });

    // if (matchedSettings) {
    //   let selector;
    //   if (matchedSettings.streetAddress !== '') {
    //     selector = matchedSettings.streetAddress;
    //   } else {
    //     selector = Object.keys(matchedSettings).filter((key) => matchedSettings[key] !== "" && key !== "url")[0];
    //     // if (selector === undefined) return;
    //   }

    //   let element;
    //   if (window.location.host === 'www.logisticssupply.com') {
    //     element = document.querySelector(selector)
    //   }
    //   else {
    //     element = document.querySelector(selector);
    //   }

    //   if (element) {
    //     floatingButton(element);
    //   }
    // }
  }
}

async function matchAndInsertOption(criteriaMap) {
  const forms = document.querySelectorAll("form");
  let matchedElements = [];
  forms.forEach((form) => {
    form.querySelectorAll("input[type='text']").forEach((input) => {
      for (const [field, criteria] of Object.entries(criteriaMap)) {
        if (criteria.some((cri) => matchesCriteria(input, cri))) {
          matchedElements.push(input);
        }
      }
    });
  });

  const lastElement = matchedElements[matchedElements.length - 1];
  if (lastElement) {
    // floatingButton(lastElement);
  }
}

const createAndInsertButton = (element) => {

  if (element.getAttribute("data-added") || document.querySelector('button#form_auto_filler_extension_btn')) {
    return;
  }

  const fillBtn = document.createElement("button");
  fillBtn.type = "button";
  fillBtn.innerText = "Autofill";
  fillBtn.style.padding = "8px 32px";
  fillBtn.style.background = "#FFD814";
  fillBtn.style.border = "none";
  fillBtn.style.margin = "5px";
  fillBtn.style.borderRadius = "15px";
  fillBtn.id = "form_auto_filler_extension_btn";

  element.setAttribute("data-added", true);
  element.insertAdjacentElement("afterend", fillBtn);
};


const floatingButton = async (element) => {

  let advancedSettingsKey = await advanceSettingsKey(window.location.host);
  let tempSettings = await chrome.storage.local.get(advancedSettingsKey);
  let advancedSettings = tempSettings[advancedSettingsKey] || {};

  if (!advancedSettings.showFloatingButton) {
    return;
  }

  if (element.getAttribute("data-added") || document.querySelector('button#form_auto_filler_extension_btn')) {
    return;
  }

  const button = `<button type="button" id="form_auto_filler_extension_btn">Fill</button>`;
  var bodyTag = document.getElementsByTagName('body')[0];

  element.setAttribute("data-added", true);
  bodyTag.insertAdjacentHTML('beforeend', button);

  setTimeout(() => {
    floatingInit();
  }, 0);

};


const floatingInit = () => {

  const fabElement = document.getElementById("form_auto_filler_extension_btn");

  //get position from storage and set it
  chrome.storage.local.get([window.location.host + 'siteBasedWidgetPosition'], function (data) {
    let widgetData = data[window.location.host + 'siteBasedWidgetPosition'];
    if (widgetData) {
      fabElement.style.top = widgetData.y;
      fabElement.style.left = widgetData.x;
    }
  })




  const move = (e) => {

    if (e.type === "touchmove") {
      fabElement.style.top = e.touches[0].clientY + "px";
      fabElement.style.left = e.touches[0].clientX + "px";
    } else {
      fabElement.style.top = e.clientY + "px";
      fabElement.style.left = e.clientX + "px";
    }

    //store the current position
    oldPositionY = fabElement.style.top;
    oldPositionX = fabElement.style.left;
    let settings = { site: window.location.host, x: fabElement.style.left, y: fabElement.style.top };
    let key = window.location.host + 'siteBasedWidgetPosition';

    //store settings based on site
    chrome.storage.local.set({ [key]: settings }, function () {
      console.log('Value is set to ' + settings);
    });

  };

  const mouseDown = (e) => {
    console.log("mouse down ");
    oldPositionY = fabElement.style.top;
    oldPositionX = fabElement.style.left;
    if (e.type === "mousedown") {
      window.addEventListener("mousemove", move);
    } else {
      window.addEventListener("touchmove", move);
    }

    fabElement.style.transition = "none";
  };

  const mouseUp = (e) => {
    console.log("mouse up");
    if (e.type === "mouseup") {
      window.removeEventListener("mousemove", move);
    } else {
      window.removeEventListener("touchmove", move);
    }
    // snapToSide(e);
    fabElement.style.transition = "0.3s ease-in-out left";
  };

  const snapToSide = (e) => {
    const wrapperElement = document.getElementsByTagName('body')[0];
    const windowWidth = window.innerWidth;
    let currPositionX, currPositionY;
    if (e.type === "touchend") {
      currPositionX = e.changedTouches[0].clientX;
      currPositionY = e.changedTouches[0].clientY;
    } else {
      currPositionX = e.clientX;
      currPositionY = e.clientY;
    }
    if (currPositionY < 50) {
      fabElement.style.top = 50 + "px";
    }
    if (currPositionY > wrapperElement.clientHeight - 50) {
      fabElement.style.top = (wrapperElement.clientHeight - 50) + "px";
    }
    if (currPositionX < windowWidth / 2) {
      fabElement.style.left = 30 + "px";
      fabElement.classList.remove('right');
      fabElement.classList.add('left');
    } else {
      fabElement.style.left = windowWidth - 30 + "px";
      fabElement.classList.remove('left');
      fabElement.classList.add('right');
    }

  };




  setTimeout(() => {
    fabElement.addEventListener("mousedown", mouseDown);

    fabElement.addEventListener("mouseup", mouseUp);

    fabElement.addEventListener("touchstart", mouseDown);

    fabElement.addEventListener("touchend", mouseUp);
  }, 100);


}

function formatSelector(selector) {
  return selector.replace(/\./g, "\\.").replace(/#/g, "\\#");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === 'get_post_data') {
    let postData = [];
    document.querySelectorAll('input:not([type="hidden"]), select:not([type="hidden"])').forEach((input, index) => {
      const inputData = {
        fieldID: index,
      };
      for (const d in input.attributes) {

        let value = input.attributes[d].value;
        let name = input.attributes[d].name;
        if (value !== undefined) {

          if (window.location.host === 'www.logisticssupply.com') {
            //'input[data-bind="value:Name"]'
            let attValue = input.getAttribute('data-bind');
            if (attValue?.includes('options')) {
              attValue = attValue.match(/value:([^,]*)/)[0]
            }
            value = `${input.tagName}[data-bind='${attValue}']`;

          } else if (name === 'class') {
            value = `${input.tagName}.${value}`;
          } else if (name === 'id') {
            if (value.includes('.')) {
              value = value.replace(/\./g, '\\.');
            }
            value = `${input.tagName}#${value}`;
          } else {
            value = `${input.tagName}[${name}="${value}"]`
          }
          inputData[name] = value;
        }
      }
      postData.push(inputData);
    });
    console.log(postData);
    sendResponse({ postData, url: window.location.host });
  }

  if (request.action === 'get_field_data') {
    const elem = document.activeElement;
    if (elem.tagName.toLowerCase() === 'input' || elem.tagName.toLowerCase() === 'select') {
      const inputData = {
        fieldID: Math.floor(Math.random() * 10),
      };
      for (const d in elem.attributes) {
        let value = elem.attributes[d].value;
        let name = elem.attributes[d].name;
        if (value !== undefined) {
          if (name === 'class') {
            value = `${elem.tagName}.${value}`;
          } else if (name === 'id') {
            value = `${elem.tagName}#${value}`;
          } else {
            value = `${elem.tagName}[${name}="${value}"]`
          }
          inputData[name] = value;
        }
      }
      console.log(inputData);
      sendResponse({ postData: [inputData], url: window.location.host });
    }
  }


  if (request.action === 'fill_form') {

    fillForm();
    sendResponse({ success: true });

  }

  if (request.action === 'dragend') {
    // Handle the drag end event from the extension
    console.log('Data from extension:', request.data);
    // Optional: You can handle this event as needed
  }

  return true;
});
