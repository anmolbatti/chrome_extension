console.log("AUTO FILLER EXTENSION - CONTENT SCRIPT FOR Amazon");
let observer;
let observeTimeout;

const copyButton = () => {

  const newButton = document.createElement('button');
  newButton.type = "button";
  newButton.className = "copybutton";
  newButton.id = "fillCopyButton";

  // Create the text element within the button
  const buttonText = document.createElement('span');
  buttonText.className = "button__text";
  buttonText.textContent = "Copy Data";

  // Append the text element to the button
  newButton.appendChild(buttonText);

  var tag = document.querySelector('[data-test-id="shipping-section-buyer-address"]');

  if (tag) {
    tag.insertAdjacentHTML('afterend', newButton.outerHTML);
    const copyBtn = document.getElementById('fillCopyButton');
    copyBtn.onclick = () => {
      copyBtn.classList.add("button-loading")
      callApi();
    }
  }

}


const floatingButton = () => {

  if (document.querySelector('button#form_auto_filler_extension_btn')) {
    document.querySelector('button#form_auto_filler_extension_btn').remove();
  }

  const button = `<button type="button" id="form_auto_filler_extension_btn">Copy</button>`;
  var bodyTag = document.getElementsByTagName('body')[0];


  bodyTag.insertAdjacentHTML('beforeend', button);

  setTimeout(() => {
    floatingInit();
  }, 100);

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


  fabElement.onclick = () => {

    callApi();


  }

}


const callApi = () => {
  const shippingSection = document.querySelector('[data-test-id="shipping-section-buyer-po"]');

  // Check if the shipping section exists
  if (!shippingSection) {
    console.error('Shipping section not found.');
    return null;
  }

  // Get all span elements within the shipping section
  const spanElements = shippingSection.querySelectorAll('span');

  // Extract the text content from each span element
  let address = '';
  spanElements.forEach(span => {
    address += span.textContent.trim() + ' ';
  });

  //shipping-section-phone
  let phone = document.querySelector('[data-test-id="shipping-section-phone"]')?.innerText ?? "";
  let orderId = document.querySelector('[data-test-id="order-id-value"]')?.innerText ?? "";

  let text = "";
  // Initialize an object to store the extracted details
  if (orderId) {
    text += `Order ID: ${orderId}\n`;
  }

  if (address) {
    text += `Address: ${address}\n`;
  }

  if (phone) {
    text += `Phone: ${phone}\n`;
  }

  if(text.includes("Copy Data") ){
    text = text.replace("Copy Data", "");
  }

  chrome.runtime.sendMessage({ action: 'extract_data_amazon', data: { text } }, function (response) {
    const copyBtn = document.getElementById('fillCopyButton');
    copyBtn?.classList.remove("button-loading")
    console.log("extract_data_amazon response - ", response)
    // Send a message to the background script to save data
    chrome.runtime.sendMessage({ action: 'saveData', data: response.res }, function (res) {
      if (res && res.success) {
        console.log('Data saved successfully');
      } else {
        console.error('Failed to save data');
        alert('Failed to copy data, please try again by refreshing!');
      }
    });

  });
}


const observeTarget = () => {
  
  const targetNode = document.body; // You can adjust this to a more specific parent node if needed

  const observerConfig = { childList: true, subtree: true };

  const callback = function (mutationsList, observer) {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        const targetElement = document.querySelector('[data-test-id="shipping-section-buyer-address"]');
        if (targetElement) {
          // floatingButton();
          copyButton();
          observer.disconnect(); // Stop observing once the element is found and updated
          break;
        }
      }
    }
  };

  const observer = new MutationObserver(callback);

  observer.observe(targetNode, observerConfig);

};
observeTarget();