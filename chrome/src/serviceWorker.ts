// @ts-nocheck
let currentTabId = null; // Store the current tab ID
let sourcesites = ['sellercentral', 'datacenter'];
const advanceGeneralSettingsKey: string = "advance-general-settings";
const baseURLs = {
    'local': 'http://localhost:3000',
    'dev': 'https://api.pasteperfect.ai',
    'prod': 'https://api.pasteperfect.ai',
}
const apiBaseUrl = baseURLs['prod'];

type GeneralSettings = {
    addFirstAndLastNameToAddress: boolean;
    addCompanyToAddress: boolean;
    addAddress1ToAddress: boolean;
    addAddress2ToAddress: boolean;
    addCityToAddress: boolean;
    addStateToAddress: boolean;
    addZipCodeToAddress: boolean;
    addPhoneToAddress: boolean;
    addEmailToAddress: boolean;
    darkMode: false,
    aiAPI: string;

}

// Listen for page load events
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === "complete") {
        const url = new URL(tab.url);
        const hostname = url.hostname;

        // Check if the extension is enabled for the current site
        chrome.storage.local.get(hostname, function (data) {
            const isEnabled = data[hostname];
        });

    }


});


chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    chrome.tabs.sendMessage(details.tabId, { type: "rerender" });
    if (details.url.includes("https://sellercentral.amazon.com/orders-v3/order/")) {
        chrome.scripting.executeScript({
            target: { tabId: details.tabId },
            files: ["amazon_data_center.js"]
        });
    }
});

// Listen for cookie changes
chrome.cookies.onChanged.addListener(function (changeInfo) {
    const cookie = changeInfo.cookie;
    const removed = changeInfo.removed;
    const cause = changeInfo.cause;
    if (cookie.name === 'loggedInUser' && cookie.value !== null && cookie.value !== undefined && (cookie.domain.startsWith('pasteperfect.ai') || cookie.domain.startsWith('localhost'))) {
        const loggedInUser = JSON.parse(decodeURIComponent(cookie.value));
        if (loggedInUser?.sessionToken) {
            chrome.storage.local.set({ extensionUser: loggedInUser })
        }
    }
});


chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
    // chrome.tabs.sendMessage(details.tabId, { type: "rerender" });
    const pastePerfectUrl = 'https://pasteperfect.ai/';
    if (details.url.startsWith(pastePerfectUrl) || details.url.startsWith('http://localhost:4200/')) {
        chrome.scripting.executeScript({
            target: { tabId: details.tabId },
            files: ["authPage.js"]
        });
    }
});


chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.user) {
        console.log('Token received', request.user);
        chrome.storage.local.set({ extensionUser: request.user });
        sendResponse({ success: true });
    }
    if (request.action === 'userloggedout') {
        chrome.storage.local.remove('extensionUser');
        sendResponse({ success: true });
    }
})


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    //log
    if (request.action === 'userloggedin') {
        console.log('User logged in', request.data);
        const user = request.data;
        chrome.storage.local.set({ extensionUser: user }).then(function () {
            // Send a response back to the content script
            sendResponse({ success: true });
        });;

    }

    if (request.action === 'saveData') {
        const data = request.data;
        if (data.zipcode && data.zipcode.includes('-')) {
            data.zipcode = data.zipcode.split('-')[0];
        }
        chrome.storage.local.set({ details: data }).then(function () {
            // Send a response back to the content script
            sendResponse({ success: true });
        });
        chrome.runtime.sendMessage({ action: 'changeData', data: data }, function (response) {

        });
    }


    if (request.action === 'fetch_mappings') {
        const data = request.data;
        console.log('DATA', data);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            if (!currentTab) {
                sendResponse({ success: false, reason: 'No tab found' });
                return;
            }
            const url = new URL(currentTab.url);
            const hostname = url.hostname;
            fetch_mappings(data, sendResponse, hostname);
        });
    }

    if (request.action === 'fetch_mappings_clipboard') {
        const data = request.data;
        console.log('fetch_mappings_clipboard', data);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            console.log('currentTab', currentTab);
            const url = new URL(currentTab.url);
            const hostname = url.hostname;
            fetch_mappings_clipboard(data, sendResponse, hostname);
        });
    }

    if (request.action === 'address_correction') {
        const data = request.data;
        console.log('address_correction', data);

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            const url = new URL(currentTab.url);
            const hostname = url.hostname;
            address_correction(data, sendResponse, hostname);
        });

    }


    if (request.action === 'extract_data_amazon') {
        const data = request.data;
        console.log('extract_data_amazon', data);
        //tab url is passed as website
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            const url = new URL(currentTab.url);
            const hostname = url.hostname;
            extract_data_amazon(data, sendResponse, hostname);
        });
    }

    return true;
});



async function fetch_mappings(request, sendResponse?, website?) {
    debugger;
    console.log(request.postData)
    const transactionId = await generateGUID();
    try {
        const loggedInUser = await chrome.storage.local.get('extensionUser');
        debugger;
        const req = await fetch(`${apiBaseUrl}/gpt/parse`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loggedInUser?.['extensionUser']?.sessionToken}`,
                "X-Site": website,
                "X-TransactionId": `${transactionId}`
            },
            body: JSON.stringify(request.postData),
        });

        const res = await req.json();
        console.log('RES FROM SERVER', res);

        let fieldData = {
            url: request.url,
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
        };

        res.filter((d) => d.AImatch !== undefined).forEach((el) => {


            if (request.url === 'www.zoro.com') {
                fieldData[el.AImatch] = el['data-za'] || el.id || el.autocomplete || el.name || el.class || el.placeholder || el.label || el['aria-label'];
            } else {
                fieldData[el.AImatch] = el.id || el.autocomplete || el.name || el.class || el.placeholder || el.label || el['aria-label'];

            }

        });
        let result: any = await chrome.storage.local.get(['settings']);

        const oldSettings = result.settings || [];

        const index = oldSettings.findIndex(oldSetting => oldSetting.url === fieldData.url);

        if (index !== -1) {
            if (request.isSingleFetch) {
                if (res[0].AImatch) {
                    oldSettings[index][res[0].AImatch] = res[0].id || res[0].class || res[0].name || res[0].label;
                }
            } else {
                // If the setting already exists, update it
                oldSettings[index] = fieldData;
            }

        } else {
            // If it's a new setting, add it to the list
            oldSettings.push(fieldData);
        }

        if (isSourceDataSite(request.url)) {

            oldSettings[index].sourceSite = true;
        }


        await saveLogsToStorage({ success: true, res: fieldData, transactionId: transactionId });

        // Save the updated settings to storage
        await chrome.storage.local.set({ 'settings': oldSettings });
        console.log('Settings saved to storage', oldSettings);
        if (sendResponse) {

            sendResponse({ success: true, fieldData, transactionId: transactionId });
        }


    } catch (error) {
        console.error(error);
        if (sendResponse) {
            await saveLogsToStorage({ success: false, reason: error.message, transactionId: transactionId });
            sendResponse({ success: false, reason: error.message, transactionId: transactionId });
        }

    }




}






//method for identify source and target sites eg. amazon seller central is source and shopify is target
function isSourceDataSite(url: string) {
    for (let i = 0; i < sourcesites.length; i++) {
        if (url.includes(sourcesites[i])) {
            return true;
        }
    }
    return false;
}

async function GetSelectedAIAPIName(): Promise<string> {
    let key = advanceGeneralSettingsKey
    let settings = await chrome.storage.local.get(key);
    this.generalSettings = settings[key] as GeneralSettings;
    console.log(this.generalSettings)
    return this.generalSettings.aiAPI.toLowerCase();
}


async function fetch_mappings_clipboard(request, sendResponse?, website?) {

    console.log(request)
    const transactionId = await generateGUID();
    try {
        const loggedInUser = await chrome.storage.local.get('extensionUser');
        const apiPrefix = await GetSelectedAIAPIName()
        const req = await fetch(`${apiBaseUrl}/${apiPrefix}/tunedmodel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loggedInUser?.['extensionUser']?.sessionToken}`,
                "X-Site": website,
                "X-TransactionId": `${transactionId}`
            },
            body: JSON.stringify(request),
        });
        debugger;
        const res = await req.json();
        console.log('RES FROM SERVER', res);
        await saveLogsToStorage({ success: true, res, transactionId: transactionId });


        if (sendResponse) {
            if (res) {

                sendResponse({ success: true, res, transactionId: transactionId });
                console.log('Data saved successfully');
            } else {
                console.error('Failed to save data');
                alert('Failed to copy data, please try again by refreshing!');
            }


        }

    } catch (error) {
        console.error(error);
        if (sendResponse) {
            await saveLogsToStorage({ success: false, reason: error.message, transactionId: transactionId });
            sendResponse({ success: false, reason: error.message, transactionId: transactionId });
        }

    }
}
async function address_correction(request, sendResponse?, website?) {
    console.log(request)
    const transactionId = await generateGUID();
    try {
        const loggedInUser = await chrome.storage.local.get('extensionUser');
        const apiPrefix = await GetSelectedAIAPIName()
        const req = await fetch(`${apiBaseUrl}/${apiPrefix}/tunedmodel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loggedInUser?.['extensionUser']?.sessionToken}`,
                "X-Site": website,
                "X-TransactionId": `${transactionId}`
            },
            body: JSON.stringify(request),
        });
        const res = await req.json();
        console.log('RES FROM SERVER', res);
        await saveLogsToStorage({ success: true, res, transactionId: transactionId });
        if (sendResponse) {
            if (res) {

                sendResponse({ success: true, res, transactionId: transactionId });
                console.log('Data saved successfully');
            } else {
                console.error('Failed to save data');
                alert('Failed to copy data, please try again by refreshing!');
            }


        }

    } catch (error) {
        console.error(error);
        if (sendResponse) {
            await saveLogsToStorage({ success: false, reason: error.message, transactionId: transactionId });
            sendResponse({ success: false, reason: error.message, transactionId: transactionId });
        }

    }

}

async function extract_data_amazon(request, sendResponse?, website?) {

    console.log(request)
    const transactionId = await generateGUID();
    try {
        const apiPrefix = await GetSelectedAIAPIName()
        const loggedInUser = await chrome.storage.local.get('extensionUser');
        const req = await fetch(`${apiBaseUrl}/${apiPrefix}/tunedmodel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${loggedInUser?.['extensionUser']?.sessionToken}`,
                "X-Site": website,
                "X-TransactionId": `${transactionId}`
            },
            body: JSON.stringify(request),
        });

        const resp = await req.json();
        const res = resp;

        console.log('RES FROM SERVER', res);

        await saveLogsToStorage({ success: true, res, transactionId: transactionId });

        if (sendResponse) {
            if (res) {

                sendResponse({ success: true, res, transactionId: transactionId });
                console.log('Data saved successfully');
            } else {
                console.error('Failed to save data');
                alert('Failed to copy data, please try again by refreshing!');
            }


        }

    } catch (error) {
        console.error(error);
        if (sendResponse) {
            await saveLogsToStorage({ success: false, reason: error.message, transactionId: transactionId });
            sendResponse({ success: false, reason: error.message, transactionId: transactionId });
        }

    }
}

async function saveLogsToStorage(response: any, logs?: ILog) {
    if (response.success) {

        const logobj = {
            transactionId: response.transactionId,
            response: response.res,
            success: response.success,
        }
        //store logs in local storage using await
        let logs: any = await chrome.storage.local.get(['logs']);
        logs = logs.logs || [];
        logs.push(logobj);

        //need to make sure only last 20 logs are stored
        if (logs.length > 20) {
            logs = logs.slice(logs.length - 20);
        }
        await chrome.storage.local.set({ logs });

    } else {
        const logobj = {
            transactionId: response.transactionId,
            response: response.reason,
            success: response.success,
        }
        //store logs in local storage
        let logs: any = await chrome.storage.local.get(['logs']);
        logs = logs.logs || [];
        logs.push(logobj);
        if (logs.length > 20) {
            logs = logs.slice(logs.length - 20);
        }
        await chrome.storage.local.set({ logs });
    }


}

async function generateGUID(): Promise<string> {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


interface ILog {
    website: string;
    transactionId: string;
    log: string;
    requestData: string;
    responseData: string;
}

