// @ts-nocheck

let oldPositionX, oldPositionY;
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
  WY: "Wyoming",
};

const usaStateCodesByName = {
  alabama: "AL",
  alaska: "AK",
  "american samoa": "AS",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  "district of columbia": "DC",
  "federated states of micronesia": "FM",
  florida: "FL",
  georgia: "GA",
  guam: "GU",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  "marshall islands": "MH",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  "northern mariana islands": "MP",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  palau: "PW",
  pennsylvania: "PA",
  "puerto rico": "PR",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  "virgin islands": "VI",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
};

function getStateCode(stateName) {
  return usaStateCodesByName[stateName] || stateName;
}

const preassignedCriteriaMap = {
  fullName: ["fullname", "fullName", "full-name", "full_name", "full name"],
  firstname: [
    "firstname",
    "firstName",
    "first-name",
    "fname",
    "first_name",
    "first name",
  ],
  lastname: [
    "lastname",
    "lastName",
    "last-name",
    "last_name",
    "lname",
    "last name",
  ],
  email: ["email", "mail", "emailAddress"],
  companyname: [
    "companyname",
    "company-name",
    "cname",
    "company",
    "organization",
    "org",
  ],
  city: ["city", "AddressCity"],
  state: ["state", "AddressStateOrRegion"],
  streetAddress: [
    "enterAddressLine1",
    "addressLine1",
    "streetAddress",
    "streetAddress1",
    "shipping-address1",
    "address1",
    "Street address",
    "address_1",
  ],
  streetAddress2: [
    "enterAddressLine2",
    "addressLine2",
    "streetAddress2",
    "shipping-address2",
    "address2",
    "address_2",
  ],
  zipcode: ["zip", "postalcode", "form-address-postal", "Post Code"],
  phone: ["phone", "mobileNumber", "mobile-number"],
  country: ["countryCode", "country"],
};

const DefaultCriteriaMap = {
  fullName: ["fullname", "fullName", "full-name", "full_name", "full name"],
  firstname: [
    "firstname",
    "firstName",
    "first-name",
    "fname",
    "first_name",
    "first name",
  ],
  lastname: [
    "lastname",
    "lastName",
    "last-name",
    "last_name",
    "lname",
    "last name",
  ],
  email: ["email", "mail", "emailAddress"],
  companyname: [
    "companyname",
    "company-name",
    "cname",
    "company",
    "organization",
    "org",
  ],
  city: ["city", "AddressCity"],
  state: ["state", "AddressStateOrRegion"],
  streetAddress: [
    "enterAddressLine1",
    "addressLine1",
    "streetAddress",
    "streetAddress1",
    "shipping-address1",
    "address1",
    "address_1",
  ],
  streetAddress2: [
    "enterAddressLine2",
    "addressLine2",
    "streetAddress2",
    "shipping-address2",
    "address2",
    "address_2",
  ],
  zipcode: ["zip", "postalcode", "form-address-postal", "Post Code"],
  phone: ["phone", "mobileNumber", "mobile-number", "mobilenumber"],
  country: ["countryCode", "country"],
};

let reCheckInterval;
let MAX_RETRY = 20; // Increased retry limit
let RETRY_COUNT = 0;
let init_done = false;

window.onload = async () => {
  const host = window.location.host;
  const d = await chrome.storage.local.get(host);
  let fieldsData = await chrome.storage.local.get();
  if (fieldsData?.fields) {
    fieldsData?.fields.forEach((item, key) => {
      appendToCriteriaMap(item, [item]);
    });
  }

  console.log("onload", d);

  window.addEventListener("message", (event) => {
    if (event.source !== window) return; // Ignore messages not from the same window

    if (event.data && event.data.type === "FROM_PAGE") {
      console.log("event", event);

      if (event.data.payload.action === "userloggedin") {
        const user = event.data.payload.data;
        console.log("User logged in", user);
        chrome.storage.local.set({ extensionUser: user }).then(function () {
          // Send a response back to the content script
          sendResponse({ success: true });
        });
      }

      // Forward the message to the background script
      chrome.runtime.sendMessage(event.data.payload, (response) => {
        // Optionally, handle the response from the background script
        window.postMessage(
          {
            type: "EXTENSION",
            payload: { action: "your_action", data: "some_data" },
          },
          "*"
        );
      });
    }
  });

  // if (!d[host]) return;

  reCheckInterval = setInterval(async () => {
    // console.log("document.querySelector('form'): ", document.querySelector("form"));
    if (document.readyState === "complete") {
      if (reCheckInterval) {
        clearInterval(reCheckInterval);
        reCheckInterval = undefined;
      }

      Init();

      if (host === "sellercentral.amazon.com") {
        saveAmazonSellerNotes();
        displayAmazonSellerNotes();

        setTimeout(function () {
          displayNotesForPagination();
        }, 3000);
      }

      if (
        host === "www.grainger.com" ||
        host === "grainger.com" || 
        host === "bhphotovideo.com" ||
        host === "www.bhphotovideo.com"
      ) {
        setTimeout(function () {
          modifyInputLabel();
          applyLabelStyles();
        }, 2000);
      }
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

function getElementIndexFromBody(element) {
  let index = [];
  while (element && element !== document.body) {
    const parent = element.parentNode;
    const children = Array.from(parent.children);
    index.unshift(children.indexOf(element)); // Add the index at the current level
    element = parent; // Move up the DOM tree
  }
  return index;
}

function getElementFromIndexPath(indexPath) {
  let currentElement = document.body; // Start from the <body>
  for (let index of indexPath) {
    if (!currentElement || !currentElement.children[index]) {
      return null; // If the path is invalid, return null
    }
    currentElement = currentElement.children[index]; // Move to the child at the current index
  }
  return currentElement;
}

const appendToCriteriaMap = (key, values) => {
  if (!DefaultCriteriaMap[key]) {
    DefaultCriteriaMap[key] = values;
  } else {
    DefaultCriteriaMap[key] = [
      ...new Set([...DefaultCriteriaMap[key], ...values]),
    ];
  }
};

async function Init() {
  console.log("Called");

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
      if (
        event.target &&
        event.target.id === "form_auto_filler_extension_btn"
      ) {
        event.preventDefault();
        fillForm();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        (event.key === "Z" || event.key === "S")
      ) {
        // event.preventDefault();
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

    document.body.addEventListener("dragover", function (e) {
      e.preventDefault();
    });

    let iframes = document.getElementsByTagName("iframe");
    if (iframes.length > 0) {
      Array.from(iframes).forEach((iframe, index) => {
        if (iframe.contentWindow) {
          try {
            let iframeDoc = iframe.contentWindow.document;

            if (iframeDoc) {
              iframeDoc.addEventListener("click", function (event) {
                if (
                  event.target &&
                  event.target.id === "form_auto_filler_extension_btn"
                ) {
                  event.preventDefault();
                  fillForm();
                }
              });

              iframeDoc.addEventListener("keydown", function (event) {
                if (
                  (event.metaKey || event.ctrlKey) &&
                  event.shiftKey &&
                  (event.key === "Z" || event.key === "S")
                ) {
                  fillForm();
                }
              });

              // Select the target node
              const targetNode = iframeDoc.body;

              // Options for the observer (which mutations to observe)
              const config = {
                attributes: false,
                childList: true,
                subtree: true,
              };

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

              iframeDoc.body.addEventListener("dragover", function (e) {
                e.preventDefault();
              });

              iframeDoc.body.addEventListener("drop", async function (e) {
                console.log("enetered drag");
                console.log(e);
                const host = window.location.host;

                e.preventDefault();
                let itemText = e.dataTransfer.getData("text/plain");
                let itemId = e.dataTransfer.getData("text/id");
                const src = e.dataTransfer.getData("source");

                if (src != "ext") return;

                console.log(itemText, itemId, src);
                let realValue = itemText;
                if (itemId == "state" && location.href.includes("zoro")) {
                  // if state is 2 letter then convert to full state name
                  if (itemText.length == 2) {
                    itemText = usaStates[itemText];
                  }
                }

                let keySettings = host + "siteFieldMappingSettings";
                let sett = await chrome.storage.local.get();

                let siteFieldMappingSettings = sett[keySettings] || {};

                let settingsSite = await chrome.storage.local.get(["settings"]);

                const oldSettings = settingsSite.settings || [];

                const index = oldSettings.findIndex(
                  (oldSetting) => oldSetting.url === host
                );

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
                  await chrome.storage.local.set({ settings: oldSettings });
                  console.log("Settings saved to storage", oldSettings);
                }

                console.log("e is here : ", e);
                if (e.target.tagName === "SELECT") {
                  e.target.querySelectorAll(`option`).forEach((op, index) => {
                    op.selected = false;

                    if (itemId === "state" && location.href.includes("zoro")) {
                      iframeDoc.querySelector(
                        ".v-autocomplete__selection-text"
                      ).textContent = itemText;
                      e.target.value = itemText;
                    }
                    if (
                      op.innerText.trim().toLowerCase() === itemText ||
                      op.value.toLowerCase() === itemText.toLowerCase()
                    ) {
                      const optionToSelect = e.target.options[index];
                      optionToSelect.selected = true;

                      const changeEvent = new Event("change", {
                        bubbles: true,
                        cancelable: true,
                      });
                      e.target.dispatchEvent(changeEvent);
                      let value = "";
                      if (location.href.includes("zoro")) {
                        const currentDiv = e.target;
                        const parentDiv = e.target.closest("div[data-za]");
                        value = `${parentDiv.tagName}[data-za="${parentDiv.attributes["data-za"].value}"] ${currentDiv.tagName}`;
                      } else if (e.target.attributes["data-bind"]) {
                        let attValue = e.target.getAttribute("data-bind");
                        if (attValue?.includes("options")) {
                          attValue = attValue.match(/value:([^,]*)/)[0];
                        }
                        value = `${e.target.tagName}[data-bind='${attValue}']`;
                      } else if (e.target.attributes["data-za"]) {
                        value = `${e.target.tagName}[data-za="${e.target.attributes["data-za"].value}"]`;
                      } else if (e.target.attributes["id"]) {
                        if (e.target.id.includes(".")) {
                          value =
                            `${e.target.tagName}#` +
                            e.target.id.replace(/\./g, "\\.");
                        } else {
                          value = `${e.target.tagName}#${e.target.id}`;
                        }
                      } else if (e.target.attributes["class"]) {
                        value = `${e.target.tagName}.${e.target.className}`;
                      } else {
                        value = `${e.target.tagName}[${e.target.name}="${e.target.value}"]`;
                      }
                      if (Object.keys(siteFieldMappingSettings).length != 0) {
                        //comma separated
                        let newval =
                          siteFieldMappingSettings[value] + "," + itemId;
                        siteFieldMappingSettings[value] = newval;
                      } else {
                        siteFieldMappingSettings[value] = itemId;
                      }
                      console.log(siteFieldMappingSettings);
                      return;
                    }
                  });
                  return;
                } else if (e.target.tagName === "INPUT") {
                  if (itemId === "state" && location.href.includes("zoro")) {
                    if (
                      iframeDoc.querySelector(".v-autocomplete__selection-text")
                    ) {
                      iframeDoc.querySelector(
                        ".v-autocomplete__selection-text"
                      ).textContent = itemText;
                      iframeDoc.querySelector(
                        '[autocomplete="address-level1"]'
                      ).value = realValue;
                      triggerEvents(
                        iframeDoc.querySelector(
                          '[autocomplete="address-level1"]'
                        )
                      );
                    } else {
                      // Select the parent div
                      // Select the parent div using the data-za attribute
                      const parentDiv = iframeDoc.querySelector(
                        '[data-za="address-form-state"]'
                      );

                      // Select the nested v-field__input div
                      const fieldInputDiv = parentDiv.querySelector(
                        ".v-field__input[data-no-activator]"
                      );

                      // Create the new div element
                      const newDiv = iframeDoc.createElement("div");
                      newDiv.classList.add("v-autocomplete__selection");

                      // Create the span element
                      const newSpan = iframeDoc.createElement("span");
                      newSpan.classList.add("v-autocomplete__selection-text");
                      newSpan.textContent = itemText;

                      // Append the span to the new div
                      newDiv.appendChild(newSpan);

                      // Select the input element
                      const inputElement = fieldInputDiv.querySelector("input");

                      // Insert the new div before the input element
                      fieldInputDiv.insertBefore(newDiv, inputElement);
                      iframeDoc.querySelector(
                        '[autocomplete="address-level1"]'
                      ).value = realValue;
                      triggerEvents(
                        iframeDoc.querySelector(
                          '[autocomplete="address-level1"]'
                        )
                      );
                    }

                    e.target.value = itemText;
                  }
                  //if already value then append with space
                  else if (e.target.value) {
                    e.target.value = e.target.value + " " + itemText;
                  } else {
                    e.target.value = itemText;
                  }
                  triggerEvents(e.target);
                  let value = "";
                  if (location.href.includes("zoro")) {
                    const currentDiv = e.target;
                    const parentDiv = e.target.closest("div[data-za]");
                    value = `${parentDiv.tagName}[data-za="${parentDiv.attributes["data-za"].value}"] ${currentDiv.tagName}`;
                  } else if (e.target.attributes["data-bind"]) {
                    let attValue = e.target.getAttribute("data-bind");
                    if (attValue?.includes("options")) {
                      attValue = attValue.match(/value:([^,]*)/)[0];
                    }
                    value = `${e.target.tagName}[data-bind='${attValue}']`;
                  } else if (e.target.attributes["data-za"]) {
                    value = `${e.target.tagName}[data-za="${e.target.attributes["data-za"].value}"]`;
                  } else if (e.target.attributes["id"]) {
                    if (e.target.id.includes(".")) {
                      value =
                        `${e.target.tagName}#` +
                        e.target.id.replace(/\./g, "\\.");
                    } else {
                      value = `${e.target.tagName}#${e.target.id}`;
                    }
                  } else if (e.target.attributes["class"]) {
                    value = `${e.target.tagName}.${e.target.className}`;
                  } else {
                    value = `${e.target.tagName}[${e.target.name}="${e.target.value}"]`;
                  }

                  if (
                    Object.keys(siteFieldMappingSettings).length != 0 &&
                    (siteFieldMappingSettings[value] != undefined ||
                      siteFieldMappingSettings[value] != null)
                  ) {
                    //comma separated
                    let newval = siteFieldMappingSettings[value] + "," + itemId;
                    siteFieldMappingSettings[value] = newval;
                  } else {
                    siteFieldMappingSettings[value] = itemId;
                  }

                  //store settings based on site
                  chrome.storage.local.set(
                    { [keySettings]: siteFieldMappingSettings },
                    function () {
                      console.log("Value is set to " + settings);
                    }
                  );

                  console.log(siteFieldMappingSettings);
                  return;
                }
              });
            }
          } catch (err) {
            // console.log("Cannot access to iframe!")
          }
        }
      });
    }

    // console.log("Here it is");

    document.body.addEventListener("drop", async function (e) {
      console.log("enetered drag");
      console.log(e);
      const host = window.location.host;

      e.preventDefault();

      let itemText = e.dataTransfer.getData("text/plain");
      let itemId = e.dataTransfer.getData("text/id");
      const src = e.dataTransfer.getData("source");

      if (src != "ext") return;

      console.log(itemText, itemId, src);
      let realValue = itemText;
      if (itemId == "state" && location.href.includes("zoro")) {
        // if state is 2 letter then convert to full state name
        if (itemText.length == 2) {
          itemText = usaStates[itemText];
        }
      }

      let keySettings = host + "siteFieldMappingSettings";
      let keySettingsIndexed = host + "siteFieldMappingSettingsIndexed";
      let sett = await chrome.storage.local.get();

      let siteFieldMappingSettings = sett[keySettings] || {};

      let settingsSite = await chrome.storage.local.get(["settings"]);

      const oldSettings = settingsSite.settings || [];

      const index = oldSettings.findIndex(
        (oldSetting) => oldSetting.url === host
      );
      console.log(index, "index");
      var draggedEle = e.target;
      // var indexedSettings = [];
      var indexedSettings = sett[keySettingsIndexed] || [];
      if (draggedEle) {
        var pos = getElementIndexFromBody(draggedEle);
        indexedSettings.push({ extField: itemId, indexedArray: pos });

        chrome.storage.local.set(
          { [keySettingsIndexed]: indexedSettings },
          function () {
            console.log("Indexed Value is set to q " + indexedSettings);
          }
        );
      }

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
        await chrome.storage.local.set({ settings: oldSettings });
        console.log("Settings saved to storage", oldSettings);
      }

      console.log(e.target.tagName, "targetName");
      if (e.target.tagName === "SELECT") {
        e.target.querySelectorAll(`option`).forEach((op, index) => {
          op.selected = false;

          if (itemId === "state" && location.href.includes("zoro")) {
            document.querySelector(
              ".v-autocomplete__selection-text"
            ).textContent = itemText;
            e.target.value = itemText;
          }
          if (
            op.innerText.trim().toLowerCase() === itemText ||
            op.value.toLowerCase() === itemText.toLowerCase()
          ) {
            const optionToSelect = e.target.options[index];
            optionToSelect.selected = true;

            const changeEvent = new Event("change", {
              bubbles: true,
              cancelable: true,
            });
            e.target.dispatchEvent(changeEvent);
            let value = "";
            if (location.href.includes("zoro")) {
              const currentDiv = e.target;
              const parentDiv = e.target.closest("div[data-za]");
              value = `${parentDiv.tagName}[data-za="${parentDiv.attributes["data-za"].value}"] ${currentDiv.tagName}`;
            } else if (e.target.attributes["data-bind"]) {
              let attValue = e.target.getAttribute("data-bind");
              if (attValue?.includes("options")) {
                attValue = attValue.match(/value:([^,]*)/)[0];
              }
              value = `${e.target.tagName}[data-bind='${attValue}']`;
            } else if (e.target.attributes["data-za"]) {
              value = `${e.target.tagName}[data-za="${e.target.attributes["data-za"].value}"]`;
            } else if (e.target.attributes["id"]) {
              if (e.target.id.includes(".")) {
                value =
                  `${e.target.tagName}#` + e.target.id.replace(/\./g, "\\.");
              } else {
                value = `${e.target.tagName}#${e.target.id}`;
              }
            } else if (e.target.attributes["class"]) {
              value = `${e.target.tagName}.${e.target.className}`;
            } else {
              value = `${e.target.tagName}[${e.target.name}="${e.target.value}"]`;
            }
            if (Object.keys(siteFieldMappingSettings).length != 0) {
              //comma separated
              let newval = siteFieldMappingSettings[value] + "," + itemId;
              siteFieldMappingSettings[value] = newval;
            } else {
              siteFieldMappingSettings[value] = itemId;
            }
            console.log(siteFieldMappingSettings);
            return;
          }
        });
        return;
      } else if (e.target.tagName === "INPUT") {
        console.log("hello there");
        if (itemId === "state" && location.href.includes("zoro")) {
          if (document.querySelector(".v-autocomplete__selection-text")) {
            document.querySelector(
              ".v-autocomplete__selection-text"
            ).textContent = itemText;
            document.querySelector('[autocomplete="address-level1"]').value =
              realValue;
            triggerEvents(
              document.querySelector('[autocomplete="address-level1"]')
            );
          } else {
            // Select the parent div
            // Select the parent div using the data-za attribute
            const parentDiv = document.querySelector(
              '[data-za="address-form-state"]'
            );

            // Select the nested v-field__input div
            const fieldInputDiv = parentDiv.querySelector(
              ".v-field__input[data-no-activator]"
            );

            // Create the new div element
            const newDiv = document.createElement("div");
            newDiv.classList.add("v-autocomplete__selection");

            // Create the span element
            const newSpan = document.createElement("span");
            newSpan.classList.add("v-autocomplete__selection-text");
            newSpan.textContent = itemText;

            // Append the span to the new div
            newDiv.appendChild(newSpan);

            // Select the input element
            const inputElement = fieldInputDiv.querySelector("input");

            // Insert the new div before the input element
            fieldInputDiv.insertBefore(newDiv, inputElement);
            document.querySelector('[autocomplete="address-level1"]').value =
              realValue;
            triggerEvents(
              document.querySelector('[autocomplete="address-level1"]')
            );
          }

          e.target.value = itemText;
        }
        //if already value then append with space
        else if (e.target.value) {
          e.target.value = e.target.value + " " + itemText;
        } else {
          e.target.value = itemText || "";
        }

        triggerEvents(e.target);
        console.log(e.target.value, "value");

        let value = "";
        if (location.href.includes("zoro")) {
          const currentDiv = e.target;
          const parentDiv = e.target.closest("div[data-za]");
          value = `${parentDiv.tagName}[data-za="${parentDiv.attributes["data-za"].value}"] ${currentDiv.tagName}`;
        } else if (e.target.attributes["data-bind"]) {
          let attValue = e.target.getAttribute("data-bind");
          if (attValue?.includes("options")) {
            attValue = attValue.match(/value:([^,]*)/)[0];
          }
          value = `${e.target.tagName}[data-bind='${attValue}']`;
        } else if (e.target.attributes["data-za"]) {
          value = `${e.target.tagName}[data-za="${e.target.attributes["data-za"].value}"]`;
        } else if (e.target.attributes["id"]) {
          if (e.target.id.includes(".")) {
            value = `${e.target.tagName}#` + e.target.id.replace(/\./g, "\\.");
          } else {
            value = `${e.target.tagName}#${e.target.id}`;
          }
        } else if (e.target.attributes["class"]) {
          value = `${e.target.tagName}.${e.target.className}`;
        } else {
          value = `${e.target.tagName}[${e.target.name}="${e.target.value}"]`;
        }

        if (
          Object.keys(siteFieldMappingSettings).length != 0 &&
          (siteFieldMappingSettings[value] != undefined ||
            siteFieldMappingSettings[value] != null)
        ) {
          //comma separated
          let newval = siteFieldMappingSettings[value] + "," + itemId;
          siteFieldMappingSettings[value] = newval;
        } else {
          siteFieldMappingSettings[value] = itemId;
        }

        //store settings based on site
        chrome.storage.local.set(
          { [keySettings]: siteFieldMappingSettings },
          function () {
            console.log("Value is set to " + settings);
          }
        );

        console.log(siteFieldMappingSettings);
        return;
      }
    });

    // setup drop functionality directly on input fields
    if (
      window.location.host == "www.homedepot.com" ||
      window.location.host == "homedepot.com"
    ) {
      setTimeout(() => {
        dropEventOnFields();
      }, 1000);
    }
  }

  // empty default settings of the sites
  // await chrome.storage.local.set({ 'settings': {} });

  // let keySettings = window.location.host + 'siteFieldMappingSettings';
  // console.log("keySettings: ", keySettings);
  // await chrome.storage.local.set({ [keySettings]: {} });
}

async function advanceSettingsKey(url: string) {
  //generate advance settings key
  let key = `${url}-advance-settings`;
  return key;
}

async function checkForSpecialCharacters(input) {
  if (!input) return input;
  // Regular expression to match any character that is not a letter, number, period, or comma
  const regex = /[^a-zA-Z0-9.,+\- ]/gi;

  return input.replace(regex, "");
}

async function checkForSpecialCharactersForPhone(input) {
  //if input null or undefined or empty then return
  if (!input) return input;
  // Regular expression to match any character that is not a letter, number, period, or comma
  const regex = /[^a-z0-9,()\- ]/gi;

  return input.replace(regex, "");
}

function getRealElement(clonedElement) {
  // Use a unique identifier to locate the real element
  if (clonedElement.id) {
    return document.getElementById(clonedElement.id);
  }

  if (clonedElement.name) {
    return document.querySelector(`[name="${clonedElement.name}"]`);
  }

  // If no unique identifier is present, use other attributes to locate the element
  const selector = Array.from(clonedElement.attributes)
    .map((attr) => `[${attr.name}="${attr.value}"]`)
    .join("");

  return document.querySelector(selector);
}

function escapeSelector(selector) {
  return selector.replace(
    /([:%.()>\+~*])|(?<![a-zA-Z])(#)/g,
    (match, group1, group2) => {
      if (group1) return "\\" + group1; // Escape special characters except #
      if (group2) return group2; // Do not escape # if it's part of an ID
      return match;
    }
  );
}

async function fillForm() {
  const d = await chrome.storage.local.get();
  console.log("d: ", d);

  if (d.settings) {
    const settings = d.settings;
    let matchedSettings;

    if (settings.length > 0) {
      settings.forEach((s) => {
        const hostUrl = window.location.host;
        const settingUrl = s?.url.replaceAll("https://", "");

        if (hostUrl === settingUrl) {
          matchedSettings = s;
          return;
        }
      });
    }

    if (matchedSettings) {
      console.log(`Inserting values by default`);
      fillFormInputsDefault();
      fillFormInputsDefaultIframe();

      console.log("matchedSettings: ", matchedSettings);
      let keySettings = window.location.host + "siteFieldMappingSettings";
      let keySettingsIndexed =
        window.location.host + "siteFieldMappingSettingsIndexed";

      let advancedSettingsKey = await advanceSettingsKey(window.location.host);
      let tempSettings = await chrome.storage.local.get(advancedSettingsKey);
      let advancedSettings = tempSettings[advancedSettingsKey] || {};

      var details = d.details;

      let keysAssigned = [];
      let assignedSelectors = [];
      let mapping = d[keySettings];
      let mappingIndexed = d[keySettingsIndexed];
      console.log("mappingIndexed: ", mappingIndexed);

      if (mapping) {
        console.log("mapping: ", mapping);
        // convert mapping object {} to array []
        let mappingArray = Object.entries(mapping);

        if (mappingArray.length === 0) {
          console.log("Element Not Found in drop mapping", element);
        } else {
          for (let [mappingKey, mappingValue] of mappingArray) {
            mappingKey = escapeSelector(mappingKey);
            // mappingKey = mappingKey.replace(/\\/g, "");

            console.log("mappingKey: ", mappingKey);

            let iframes = document.getElementsByTagName("iframe");
            if (iframes.length > 0) {
              Array.from(iframes).forEach((iframe, index) => {
                if (iframe.contentWindow) {
                  try {
                    let iframeDoc = iframe.contentWindow.document;

                    if (iframeDoc) {
                      let elements = iframeDoc.querySelectorAll(mappingKey);

                      elements.forEach((element) => {
                        if (element) {
                          if (mappingValue.includes(",")) {
                            let keyArr = mappingValue.split(",");
                            let lastKey = keyArr.length - 1;

                            // console.log("mappingKey: ", mappingKey);
                            // console.log("keyArr: ", keyArr);
                            // console.log("last key: ", lastKey);
                            // console.log("details[lastKey]: ", details[keyArr[lastKey]]);

                            let keyAssigned = keyArr[lastKey];
                            insertHandler(
                              element,
                              mappingKey,
                              details[keyAssigned]
                            );

                            element.setAttribute("paste-perfect-mapped", "1");
                          } else {
                            insertHandler(
                              element,
                              mappingKey,
                              details[mappingValue]
                            );
                            element.setAttribute("paste-perfect-mapped", "1");
                          }
                        }
                      });
                    }
                  } catch (err) {
                    // console.log("Cannot access to iframe!")
                  }
                }
              });
            }

            let elements = document.querySelectorAll(mappingKey);

            elements.forEach((element) => {
              if (element) {
                if (mappingValue.includes(",")) {
                  let keyArr = mappingValue.split(",");
                  let lastKey = keyArr.length - 1;

                  // console.log("mappingKey: ", mappingKey);
                  // console.log("keyArr: ", keyArr);
                  // console.log("last key: ", lastKey);
                  // console.log("details[lastKey]: ", details[keyArr[lastKey]]);

                  let keyAssigned = keyArr[lastKey];
                  insertHandler(element, mappingKey, details[keyAssigned]);

                  element.setAttribute("paste-perfect-mapped", "1");
                } else {
                  insertHandler(element, mappingKey, details[mappingValue]);
                  element.setAttribute("paste-perfect-mapped", "1");
                }
              }
            });
          }
        }
      }

      if (mappingIndexed) {
        // for (let [indexedMappingKey, indexedMappingValue] of mappingIndexed) {
        //   console.log("indexedMappingValue: ", indexedMappingValue);
        //   var element = getElementFromIndexPath(indexedMappingValue.indexedArray);

        //   if(element){
        //     insertHandler(element, indexedMappingValue.extField, details[indexedMappingValue.extField]);
        //   }
        // }

        mappingIndexed.forEach((indexedValue, indexedKey) => {
          var element = getElementFromIndexPath(indexedValue.indexedArray);

          if (element) {
            var checkEle = element.nodeName;

            if (checkEle == "INPUT" || checkEle == "SELECT") {
              // console.log("indexedValue.extField: ", indexedValue.extField);
              // console.log("details[indexedValue.extField]: ", details[indexedValue.extField]);
              // console.log("Inserting to input below");
              // console.log(element);

              element.setAttribute("paste-perfect-mapped", "1");
              insertHandler(
                element,
                indexedValue.extField,
                details[indexedValue.extField]
              );
            }
          }
        });
      }
    } else {
      console.log(`Insert non mapped fields data if settings not matched`);
      fillFormInputsDefault();
      fillFormInputsDefaultIframe();
    }
  } else {
    console.log(
      `Using Default settings, No Settings Available for ${window.location.host}.`
    );
    fillFormInputsDefault();
    fillFormInputsDefaultIframe();
  }
}

function insertAsteriskAfterDataBind(htmlString) {
  const regex = /data-bind=(')/g;
  return htmlString.replace(regex, "data-bind*=$1");
}

function triggerEvents(element) {
  // console.log('triggerEvents', element);
  const events = ["input", "change", "blur"];
  events.forEach((eventType) => {
    const event = new Event(eventType, { bubbles: true });
    element.dispatchEvent(event);
  });
}

function changevalue(element, value, mappingKey) {
  let realValue = value;
  // if (location.href.includes("zoro") && mappingKey.includes('state')) {

  //   if (value.length == 2) {
  //     value = usaStates[value];
  //   }

  //   if (document.querySelector('.v-autocomplete__selection-text')) {

  //     document.querySelector('.v-autocomplete__selection-text').textContent = value;

  //     document.querySelector('[autocomplete="address-level1"]').value = realValue;
  //     triggerEvents(document.querySelector('[autocomplete="address-level1"]'))
  //   } else {

  //     // Select the parent div
  //     // Select the parent div using the data-za attribute
  //     const parentDiv = document.querySelector('[data-za="address-form-state"]');

  //     // Select the nested v-field__input div
  //     const fieldInputDiv = parentDiv.querySelector('.v-field__input[data-no-activator]');

  //     // Create the new div element
  //     const newDiv = document.createElement('div');
  //     newDiv.classList.add('v-autocomplete__selection');

  //     // Create the span element
  //     const newSpan = document.createElement('span');
  //     newSpan.classList.add('v-autocomplete__selection-text');
  //     newSpan.textContent = value;

  //     // Append the span to the new div
  //     newDiv.appendChild(newSpan);

  //     // Select the input element
  //     const inputElement = fieldInputDiv.querySelector('input');

  //     // Insert the new div before the input element
  //     fieldInputDiv.insertBefore(newDiv, inputElement);
  //     document.querySelector('[autocomplete="address-level1"]').value = realValue;
  //     triggerEvents(document.querySelector('[autocomplete="address-level1"]'))
  //   }

  // }

  element.value = value;
  triggerEvents(element);
}

function fillCountryUSADefault() {
  // Regular expression to match 'country' in id or name (case insensitive)
  var regex = /country/i;
  // Try to find the element by id first
  var selectElement = Array.from(document.querySelectorAll("select")).find(
    (select) => regex.test(select.id) || regex.test(select.name)
  );

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
  // console.log("Element going to change");
  // console.log(element);

  try {
    if (!element) return;
    element.value = "";

    if (!value) {
      triggerEvents(element);
    }

    if (key === "state") {
      let inputVal = value.trim().toLowerCase();
      if (usaStateCodesByName[inputVal]) {
        value = getStateCode(inputVal);
      }
      console.log("key: ", key);
      console.log("value: ", value);
    }

    if (element && element.type !== "hidden") {
      if (element.tagName === "SELECT" && key === "country") {
        if( window.location.host != "www.fedex.com" && window.location.host != "fedex.com"){
          element.querySelectorAll(`option`).forEach((op, index) => {
            op.selected = false;
            if (
              op.innerText.trim().toLowerCase() === "united states" ||
              op.value.toLowerCase() === "us" ||
              op.value.toLowerCase() === "usa"
            ) {
              let optionToSelect = element.options[index];
              optionToSelect.selected = true;
  
              const changeEvent = new Event("change", {
                bubbles: true,
                cancelable: true,
              });
  
              if (window.location.host !== "www.amazon.com") {
                element.dispatchEvent(changeEvent);
              }
            } else {
              if (op.value == value) {
                let optionToSelect = element.options[index];
                optionToSelect.selected = true;
  
                // const changeEvent = new Event("change", {
                //   bubbles: true,
                //   cancelable: true,
                // });
  
                // element.dispatchEvent(changeEvent);
                return;
              }
            }
          });
        }
      } else {
        if (element.tagName === "INPUT") {
          changevalue(element, value, key);
          return;
        }

        if (element.tagName === "SELECT") {
          if (window.location.host === "spsindustrial.com") {
            setTimeout(() => {
              let isValueSet = false;
              element.querySelectorAll(`option`).forEach((op, index) => {
                op.selected = false;
                if (
                  op.innerText.trim().toLowerCase() === value ||
                  op.value.toLowerCase() === value.toLowerCase()
                ) {
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
          } else {
            let isValueSet = false;
            element.querySelectorAll(`option`).forEach((op, index) => {
              op.selected = false;
              if (
                op.innerText.trim().toLowerCase() === value ||
                op.value.toLowerCase() === value.toLowerCase()
              ) {
                var optionToSelect = element.options[index];
                optionToSelect.selected = true;
                optionToSelect.setAttribute("selected", true);
                element.value = value;
                isValueSet = true;

                // if(key === "state"){
                //   console.log("optionToSelect: ",optionToSelect);
                // }

                var changeEvent = new Event("change", {
                  bubbles: true,
                  cancelable: true,
                });
                element.dispatchEvent(changeEvent);
                return;
              }
            });

            // if (isValueSet) {
            //   console.log("value is set and ready to change the event...")
            //   setTimeout(() => {
            //     var changeEvent = new Event("change", {
            //       bubbles: true,
            //       cancelable: true,
            //     });
            //     element.dispatchEvent(changeEvent);
            //     return;
            //   }, 1000);

            // }
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

  if (input.name.toLowerCase().includes("phoneextension")) {
    return false;
  }

  return (
    input.name.toLowerCase().includes(cri) ||
    input.id.toLowerCase().includes(cri) ||
    input.className.toLowerCase().includes(cri) ||
    input.placeholder?.toLowerCase()?.includes(cri) ||
    input.getAttribute("label")?.toLowerCase()?.includes(cri) ||
    input.getAttribute("aria-label")?.toLowerCase()?.includes(cri)
  );
}

async function fillSingleFormInput(field, criteria, assignedSelectors) {
  const forms = document.querySelectorAll("form");
  const d = await chrome.storage.local.get();
  const details = d.details;

  if (!details) {
    return alert("Please copy the data to the extension.");
  }

  forms.forEach((form) => {
    const inputs = form.querySelectorAll(
      'input:not([type="hidden"]), select:not([type="hidden"])'
    );

    for (const input of inputs) {
      // let assignValue = false;

      // for (const selector of assignedSelectors) {
      //   let element = document.querySelector(selector.pageSelector);

      //   if (element.value != "") {
      //     assignValue = true;
      //     insertHandler(input, element, details[selector.keyAssigned]);

      //     break;

      //   } else {
      //     // newValueToassign = details[field];
      //     // break;
      //   }
      // }

      // if(!assignValue){
      if (criteria) {
        if (criteria.some((cri) => matchesCriteria(input, cri))) {
          insertHandler(input, field, details[field]);
          break;
        }
        // }
      }
    }
  });
}

async function fillFormInputsDefault() {
  const forms = document.querySelectorAll("form");
  const d = await chrome.storage.local.get();
  const details = d.details;
  let isFormFound = false;

  if (!details) {
    return alert("Please copy the data to the extension.");
  }

  if (forms.length > 0) {
    isFormFound = true;
  }

  // insert fields if form tag found in DOM
  // if(isFormFound){
  //   forms.forEach((form) => {
  //     form.querySelectorAll('input:not([type="hidden"]), select:not([type="hidden"])').forEach((input) => {
  //       let isMapped = input.getAttribute("paste-perfect-mapped");
  //       // console.log("input: ", input);
  //       if(isMapped !== "1"){

  //         for (const [field, criteria] of Object.entries(DefaultCriteriaMap)) {
  //           if (criteria.some((cri) => matchesCriteria(input, cri))) {
  //             if(details[field]){
  //               // console.log(`Value is going to assign key - ${field} || value - ${details[field]}`);
  //               // console.log(`Value is going to assign to input - ${input}`);
  //               insertHandler(input, field, details[field]);
  //             }

  //             break;
  //           }
  //         }
  //       }

  //       input.removeAttribute("paste-perfect-mapped");
  //     });
  //   });
  // }

  // insert fields if form tag not found in DOM
  // if(!isFormFound){
  document
    .querySelectorAll('input:not([type="hidden"]), select:not([type="hidden"])')
    .forEach((input) => {
      if (!input.hasAttribute("disabled")) {
        console.log("here we are");
        let isMapped = input.getAttribute("paste-perfect-mapped");
        console.log(isMapped, "isMapped");
        if (isMapped !== "1") {
          let isCriteriaMatched = false;
          for (const [field, criteria] of Object.entries(DefaultCriteriaMap)) {
            if (criteria.some((cri) => matchesCriteria(input, cri))) {
              if (details[field] || details[field] === "") {
                console.log(
                  `Value is going to assign key - ${field} || value - ${details[field]}`
                );
                console.log(input);
                isCriteriaMatched = true;
                insertHandler(input, field, details[field]);
              }

              break;
            }
          }

          // if(!isCriteriaMatched){
          //   if(input.getAttribute("type") == "tel"){

          //     if(details["phone"]){
          //       isCriteriaMatched = true;
          //       insertHandler(input, field, details["phone"]);
          //     }
          //   }
          // }
        }

        // input.removeAttribute("paste-perfect-mapped");
      }
    });
  // }
}

async function fillFormInputsDefaultIframe() {
  let iframes = document.getElementsByTagName("iframe");
  console.log("iframes: ", iframes);
  if (iframes.length > 0) {
    Array.from(iframes).forEach(async (iframe, index) => {
      if (iframe.contentWindow) {
        try {
          if (iframe.contentWindow?.document) {
            let iframeDoc = iframe.contentWindow?.document;
            const forms = iframeDoc.querySelectorAll("form");
            const d = await chrome.storage.local.get();
            const details = d.details;
            let isFormFound = false;

            if (!details) {
              return alert("Please copy the data to the extension.");
            }

            if (forms.length > 0) {
              isFormFound = true;
            }

            // insert fields if form tag found in DOM
            // if(isFormFound){
            //   forms.forEach((form) => {
            //     form.querySelectorAll('input:not([type="hidden"]), select:not([type="hidden"])').forEach((input) => {
            //       let isMapped = input.getAttribute("paste-perfect-mapped");
            //       console.log("input: ", input);
            //       if(isMapped !== "1"){

            //         for (const [field, criteria] of Object.entries(DefaultCriteriaMap)) {
            //           if (criteria.some((cri) => matchesCriteria(input, cri))) {

            //             if(details[field]){
            //               console.log(`Value is going to assign key - ${field} || value - ${details[field]}`);
            //               console.log(`Value is going to assign to input - ${input}`);
            //               insertHandler(input, field, details[field]);
            //             }

            //             break;
            //           }
            //         }
            //       }

            //       input.removeAttribute("paste-perfect-mapped");
            //     });
            //   });
            // }

            // insert fields if form tag not found in DOM
            // if(!isFormFound){
            iframeDoc
              .querySelectorAll(
                'input:not([type="hidden"]), select:not([type="hidden"])'
              )
              .forEach((input) => {
                if (!input.hasAttribute("disabled")) {
                  let isMapped = input.getAttribute("paste-perfect-mapped");
                  if (isMapped !== "1") {
                    let isCriteriaMatched = false;
                    for (const [field, criteria] of Object.entries(
                      DefaultCriteriaMap
                    )) {
                      if (criteria.some((cri) => matchesCriteria(input, cri))) {
                        if (details[field] || details[field] === "") {
                          // console.log(`Value is going to assign key - ${field} || value - ${details[field]}`);
                          // console.log(`Value is going to assign to input - ${input}`);
                          isCriteriaMatched = true;
                          insertHandler(input, field, details[field]);
                        }

                        break;
                      }
                    }

                    if (!isCriteriaMatched) {
                      if (input.getAttribute("type") == "tel") {
                        if (details["phone"]) {
                          isCriteriaMatched = true;
                          insertHandler(input, field, details["phone"]);
                        }
                      }
                    }
                  }

                  input.removeAttribute("paste-perfect-mapped");
                }
              });
            // }
          }
        } catch (err) {
          console.log("Cannot access to iframe!");
        }
      }
    });
  }
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
  if (
    element.getAttribute("data-added") ||
    document.querySelector("button#form_auto_filler_extension_btn")
  ) {
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

  if (
    element.getAttribute("data-added") ||
    document.querySelector("button#form_auto_filler_extension_btn")
  ) {
    return;
  }

  const button = `<button type="button" id="form_auto_filler_extension_btn">Fill</button>`;
  var bodyTag = document.getElementsByTagName("body")[0];

  element.setAttribute("data-added", true);
  bodyTag.insertAdjacentHTML("beforeend", button);

  setTimeout(() => {
    floatingInit();
  }, 0);
};

const floatingInit = () => {
  const fabElement = document.getElementById("form_auto_filler_extension_btn");

  //get position from storage and set it
  chrome.storage.local.get(
    [window.location.host + "siteBasedWidgetPosition"],
    function (data) {
      let widgetData = data[window.location.host + "siteBasedWidgetPosition"];
      if (widgetData) {
        fabElement.style.top = widgetData.y;
        fabElement.style.left = widgetData.x;
      }
    }
  );

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
    let settings = {
      site: window.location.host,
      x: fabElement.style.left,
      y: fabElement.style.top,
    };
    let key = window.location.host + "siteBasedWidgetPosition";

    //store settings based on site
    chrome.storage.local.set({ [key]: settings }, function () {
      console.log("Value is set to " + settings);
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
    const wrapperElement = document.getElementsByTagName("body")[0];
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
      fabElement.style.top = wrapperElement.clientHeight - 50 + "px";
    }
    if (currPositionX < windowWidth / 2) {
      fabElement.style.left = 30 + "px";
      fabElement.classList.remove("right");
      fabElement.classList.add("left");
    } else {
      fabElement.style.left = windowWidth - 30 + "px";
      fabElement.classList.remove("left");
      fabElement.classList.add("right");
    }
  };

  setTimeout(() => {
    fabElement.addEventListener("mousedown", mouseDown);

    fabElement.addEventListener("mouseup", mouseUp);

    fabElement.addEventListener("touchstart", mouseDown);

    fabElement.addEventListener("touchend", mouseUp);
  }, 100);
};

function formatSelector(selector) {
  return selector.replace(/\./g, "\\.").replace(/#/g, "\\#");
}

const getFormFields = () => {
  const otherAvailableFields = [];
  document
    .querySelectorAll('input:not([type="hidden"]), select:not([type="hidden"])')
    .forEach((input, index) => {
      // console.log("input.tagName: ", input.tagName);
      let matched = false;
      if (
        (input.getAttribute("type") &&
          input.tagName == "INPUT" &&
          input.getAttribute("type") !== "radio") ||
        input.tagName == "SELECT"
      ) {
        let fieldName, placeholder, inputName;

        placeholder = input.getAttribute("placeholder");
        inputName = input.getAttribute("name");
        inputId = input.getAttribute("id");
        ariaLabel = input.getAttribute("aria-label");

        if (inputName && inputName != "") {
          fieldName = inputName;
        }

        if (inputId && inputId != "") {
          fieldName = inputId;
        }

        if (placeholder && placeholder != "") {
          fieldName = placeholder;
        }

        if (ariaLabel && ariaLabel != "") {
          fieldName = ariaLabel;
        }

        for (const [field, criteria] of Object.entries(
          preassignedCriteriaMap
        )) {
          if (criteria.some((cri) => matchesCriteria(input, cri))) {
            matched = true;
            break;
          } else {
            matched = false;
          }
        }

        if (!matched) {
          otherAvailableFields.push(fieldName);
          appendToCriteriaMap(fieldName, [fieldName]);
        }
      }
    });

  return otherAvailableFields;
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_post_data") {
    let postData = [];
    document
      .querySelectorAll(
        'input:not([type="hidden"]), select:not([type="hidden"])'
      )
      .forEach((input, index) => {
        const inputData = {
          fieldID: index,
        };
        for (const d in input.attributes) {
          let value = input.attributes[d].value;
          let name = input.attributes[d].name;
          if (value !== undefined) {
            if (window.location.host === "www.logisticssupply.com") {
              //'input[data-bind="value:Name"]'
              let attValue = input.getAttribute("data-bind");
              if (attValue?.includes("options")) {
                attValue = attValue.match(/value:([^,]*)/)[0];
              }
              value = `${input.tagName}[data-bind='${attValue}']`;
            } else if (name === "class") {
              value = `${input.tagName}.${value}`;
            } else if (name === "id") {
              if (value.includes(".")) {
                value = value.replace(/\./g, "\\.");
              }
              value = `${input.tagName}#${value}`;
            } else {
              value = `${input.tagName}[${name}="${value}"]`;
            }
            inputData[name] = value;
          }
        }
        postData.push(inputData);
      });
    console.log(postData);
    sendResponse({ postData, url: window.location.host });
  }

  if (request.action === "get_field_data") {
    const elem = document.activeElement;
    if (
      elem.tagName.toLowerCase() === "input" ||
      elem.tagName.toLowerCase() === "select"
    ) {
      const inputData = {
        fieldID: Math.floor(Math.random() * 10),
      };
      for (const d in elem.attributes) {
        let value = elem.attributes[d].value;
        let name = elem.attributes[d].name;
        if (value !== undefined) {
          if (name === "class") {
            value = `${elem.tagName}.${value}`;
          } else if (name === "id") {
            value = `${elem.tagName}#${value}`;
          } else {
            value = `${elem.tagName}[${name}="${value}"]`;
          }
          inputData[name] = value;
        }
      }
      console.log(inputData);
      sendResponse({ postData: [inputData], url: window.location.host });
    }
  }

  if (request.action === "fill_form") {
    fillForm();
    sendResponse({ success: true });
  }

  if (request.action === "get_form_fields") {
    let fields = getFormFields();
    console.log("fields: ", fields);
    sendResponse({ success: true, fields });
  }

  if (request.action === "dragend") {
    // Handle the drag end event from the extension
    console.log("Data from extension:", request.data);
    // Optional: You can handle this event as needed
  }

  return true;
});

// for amazon seller notes
function saveAmazonSellerNotes() {
  setTimeout(async function () {
    const sellerNotesEle = document.querySelector(
      'div[data-test-id="seller-notes-text-area"] textarea'
    );

    if (sellerNotesEle) {
      const urlArr = window.location.href.split("/");
      const orderId = urlArr[urlArr.length - 1];
      var oldNotes = await chrome.storage.local.get("amazonSellerNotes");
      let newNotes = oldNotes?.amazonSellerNotes || [];

      const existingIndex = newNotes.findIndex((note) =>
        note.hasOwnProperty(orderId)
      );

      if (existingIndex !== -1) {
        sellerNotesEle.value = newNotes[existingIndex][orderId];
      }

      sellerNotesEle?.addEventListener("change", async function (event) {
        if (existingIndex !== -1) {
          newNotes[existingIndex][orderId] = event.target.value;
        } else {
          newNotes.push({ [orderId]: event.target.value });
        }

        await chrome.storage.local.set({ amazonSellerNotes: newNotes });
      });
    }
  }, 1000);
}

async function displayAmazonSellerNotes() {
  setTimeout(async function () {
    var ordersTable = document.querySelector("table#orders-table");

    if (ordersTable) {
      ordersTable
        ?.querySelectorAll("tbody tr td:nth-child(3)")
        .forEach(async (item, key) => {
          var orderId = item.querySelector(".cell-body-title a")?.innerHTML;

          var oldNotes = await chrome.storage.local.get("amazonSellerNotes");
          let newNotes = oldNotes?.amazonSellerNotes || [];

          var existingIndex = newNotes.findIndex((note) =>
            note.hasOwnProperty(orderId)
          );

          if (existingIndex !== -1) {
            var note = newNotes[existingIndex][orderId];
            var newHtml = `${item.innerHTML}<div class="ppOrderNote" style="background: #c1c1c1; padding: 2px 6px; width: 60%;">Your Note: ${note}</div>`;

            if (!item.querySelector(".ppOrderNote")) {
              item.innerHTML = newHtml;
            }
          } else {
            var newHtml = `${item.innerHTML}<div class="ppAddOrderNote" style="padding: 2px 6px; width: 60%;"><button class='ppAddOrderNoteBtn' value="${orderId}" order_id="${orderId}">Add Note "Processed"</button></div>`;
            if (!item.querySelector(".ppAddOrderNote")) {
              item.innerHTML = newHtml;
            }

            let button = item.querySelector("button.ppAddOrderNoteBtn");
            button?.addEventListener("click", async function (event) {
              var orderId = event.target.value;
              var oldNotes = await chrome.storage.local.get(
                "amazonSellerNotes"
              );
              let newNotes = oldNotes?.amazonSellerNotes || [];

              var existingIndex = newNotes.findIndex((note) =>
                note.hasOwnProperty(orderId)
              );

              if (existingIndex !== -1) {
                newNotes[existingIndex][orderId] = "Processed";
              } else {
                newNotes.push({ [orderId]: "Processed" });
              }

              await chrome.storage.local.set({ amazonSellerNotes: newNotes });

              event.target.setAttribute("disabled", true);
              event.target.removeAttribute("value");
              event.target.innerHTML = `Note Added "Processed"`;
            });
          }
        });
    }
  }, 1000);
}

function displayNotesForPagination() {
  var body = document.querySelector("body");
  body.addEventListener("click", function (event) {
    console.log("clicked");
    console.log(event.target.tagName);
    if (
      event.target.tagName === "A" ||
      (event.target.tagName === "SPAN" &&
        (event.target.innerHTML === "Canceled" ||
          event.target.innerHTML === "Unshipped" ||
          event.target.innerHTML === "Pending" ||
          event.target.innerHTML === "Shipped"))
    ) {
      setTimeout(function () {
        displayAmazonSellerNotes();
      }, 3000);
    }
  });
}

async function dropEventOnFields() {
  const inputs = document.querySelectorAll(
    'input:not([type="hidden"]), select:not([type="hidden"])'
  );

  for (const input of inputs) {
    input.addEventListener("drop", async function (e) {
      console.log("entered in drop event");
      const host = window.location.host;

      e.preventDefault();

      let itemText = e.dataTransfer.getData("text/plain");
      let itemId = e.dataTransfer.getData("text/id");
      const src = e.dataTransfer.getData("source");

      if (src != "ext") return;

      console.log(itemText, itemId, src);
      let realValue = itemText;

      let keySettings = host + "siteFieldMappingSettings";
      let keySettingsIndexed = host + "siteFieldMappingSettingsIndexed";
      let sett = await chrome.storage.local.get();

      let siteFieldMappingSettings = sett[keySettings] || {};

      let settingsSite = await chrome.storage.local.get(["settings"]);

      const oldSettings = settingsSite.settings || [];

      const index = oldSettings.findIndex(
        (oldSetting) => oldSetting.url === host
      );

      var draggedEle = e.target;
      // var indexedSettings = [];
      var indexedSettings = sett[keySettingsIndexed] || [];
      if (draggedEle) {
        var pos = getElementIndexFromBody(draggedEle);
        indexedSettings.push({ extField: itemId, indexedArray: pos });

        chrome.storage.local.set(
          { [keySettingsIndexed]: indexedSettings },
          function () {
            console.log("Indexed Value is set to a " + indexedSettings);
          }
        );
      }

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
        await chrome.storage.local.set({ settings: oldSettings });
        console.log("Settings saved to storage", oldSettings);
      }

      console.log(e);
      if (e.target.tagName === "SELECT") {
        e.target.querySelectorAll(`option`).forEach((op, index) => {
          op.selected = false;

          if (itemId === "state" && location.href.includes("zoro")) {
            document.querySelector(
              ".v-autocomplete__selection-text"
            ).textContent = itemText;
            e.target.value = itemText;
          }
          if (
            op.innerText.trim().toLowerCase() === itemText ||
            op.value.toLowerCase() === itemText.toLowerCase()
          ) {
            const optionToSelect = e.target.options[index];
            optionToSelect.selected = true;

            const changeEvent = new Event("change", {
              bubbles: true,
              cancelable: true,
            });
            e.target.dispatchEvent(changeEvent);
            let value = "";
            if (location.href.includes("zoro")) {
              const currentDiv = e.target;
              const parentDiv = e.target.closest("div[data-za]");
              value = `${parentDiv.tagName}[data-za="${parentDiv.attributes["data-za"].value}"] ${currentDiv.tagName}`;
            } else if (e.target.attributes["data-bind"]) {
              let attValue = e.target.getAttribute("data-bind");
              if (attValue?.includes("options")) {
                attValue = attValue.match(/value:([^,]*)/)[0];
              }
              value = `${e.target.tagName}[data-bind='${attValue}']`;
            } else if (e.target.attributes["data-za"]) {
              value = `${e.target.tagName}[data-za="${e.target.attributes["data-za"].value}"]`;
            } else if (e.target.attributes["id"]) {
              if (e.target.id.includes(".")) {
                value =
                  `${e.target.tagName}#` + e.target.id.replace(/\./g, "\\.");
              } else {
                value = `${e.target.tagName}#${e.target.id}`;
              }
            } else if (e.target.attributes["class"]) {
              value = `${e.target.tagName}.${e.target.className}`;
            } else {
              value = `${e.target.tagName}[${e.target.name}="${e.target.value}"]`;
            }
            if (Object.keys(siteFieldMappingSettings).length != 0) {
              //comma separated
              let newval = siteFieldMappingSettings[value] + "," + itemId;
              siteFieldMappingSettings[value] = newval;
            } else {
              siteFieldMappingSettings[value] = itemId;
            }
            console.log(siteFieldMappingSettings);
            return;
          }
        });
        return;
      } else if (e.target.tagName === "INPUT") {
        if (itemId === "state" && location.href.includes("zoro")) {
          if (document.querySelector(".v-autocomplete__selection-text")) {
            document.querySelector(
              ".v-autocomplete__selection-text"
            ).textContent = itemText;
            document.querySelector('[autocomplete="address-level1"]').value =
              realValue;
            triggerEvents(
              document.querySelector('[autocomplete="address-level1"]')
            );
          } else {
            // Select the parent div
            // Select the parent div using the data-za attribute
            const parentDiv = document.querySelector(
              '[data-za="address-form-state"]'
            );

            // Select the nested v-field__input div
            const fieldInputDiv = parentDiv.querySelector(
              ".v-field__input[data-no-activator]"
            );

            // Create the new div element
            const newDiv = document.createElement("div");
            newDiv.classList.add("v-autocomplete__selection");

            // Create the span element
            const newSpan = document.createElement("span");
            newSpan.classList.add("v-autocomplete__selection-text");
            newSpan.textContent = itemText;

            // Append the span to the new div
            newDiv.appendChild(newSpan);

            // Select the input element
            const inputElement = fieldInputDiv.querySelector("input");

            // Insert the new div before the input element
            fieldInputDiv.insertBefore(newDiv, inputElement);
            document.querySelector('[autocomplete="address-level1"]').value =
              realValue;
            triggerEvents(
              document.querySelector('[autocomplete="address-level1"]')
            );
          }

          e.target.value = itemText;
        }
        //if already value then append with space
        else if (e.target.value) {
          e.target.value = e.target.value + " " + itemText;
        } else {
          e.target.value = itemText;
        }
        triggerEvents(e.target);
        let value = "";
        if (location.href.includes("zoro")) {
          const currentDiv = e.target;
          const parentDiv = e.target.closest("div[data-za]");
          value = `${parentDiv.tagName}[data-za="${parentDiv.attributes["data-za"].value}"] ${currentDiv.tagName}`;
        } else if (e.target.attributes["data-bind"]) {
          let attValue = e.target.getAttribute("data-bind");
          if (attValue?.includes("options")) {
            attValue = attValue.match(/value:([^,]*)/)[0];
          }
          value = `${e.target.tagName}[data-bind='${attValue}']`;
        } else if (e.target.attributes["data-za"]) {
          value = `${e.target.tagName}[data-za="${e.target.attributes["data-za"].value}"]`;
        } else if (e.target.attributes["id"]) {
          if (e.target.id.includes(".")) {
            value = `${e.target.tagName}#` + e.target.id.replace(/\./g, "\\.");
          } else {
            value = `${e.target.tagName}#${e.target.id}`;
          }
        } else if (e.target.attributes["class"]) {
          value = `${e.target.tagName}.${e.target.className}`;
        } else {
          value = `${e.target.tagName}[${e.target.name}="${e.target.value}"]`;
        }

        if (
          Object.keys(siteFieldMappingSettings).length != 0 &&
          (siteFieldMappingSettings[value] != undefined ||
            siteFieldMappingSettings[value] != null)
        ) {
          //comma separated
          let newval = siteFieldMappingSettings[value] + "," + itemId;
          siteFieldMappingSettings[value] = newval;
        } else {
          siteFieldMappingSettings[value] = itemId;
        }

        //store settings based on site
        chrome.storage.local.set(
          { [keySettings]: siteFieldMappingSettings },
          function () {
            console.log("Value is set to " + settings);
          }
        );

        console.log(siteFieldMappingSettings);
        return;
      }
    });
  }
}
function modifyInputLabel() {
  const textInputs = document.querySelectorAll('input[type="text"]');

  textInputs.forEach((input) => {
    const parent = input.parentElement;
    if (parent) {
      const label = parent.querySelector("label");
      if (label) {  
        label.style.pointerEvents = "none";
      }
    }
  });
}
function applyLabelStyles() {
  const form = document.querySelector('.form.add-new-address__form');

  if (form) {
    const labels = form.querySelectorAll('label');

    labels.forEach(label => {
      label.style.pointerEvents = 'none';
    });
  }
}
const observer = new MutationObserver(() => {
  applyLabelStyles();
});

observer.observe(document.body, { childList: true, subtree: true });
