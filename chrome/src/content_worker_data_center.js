console.log("AUTO FILLER EXTENSION - CONTENT SCRIPT FOR DATACENTER");


insertButton();




function insertButton() {
  const button = document.createElement("a");

  button.setAttribute("id", "copyToExtension");
  button.setAttribute("class", "btn btn-sm btn-primary mb-2 text-white");
  button.innerText = "Copy to extension"
  button.onclick = () => {
    // Get the table element
    const table = document.querySelector('.table');

    // Initialize an object to store the extracted details
    const details = {
      country: "USA"
    };

    // Define mapping for each detail
    const mapping = {
      'Order ID': 'orderId',
      'Customer Name': 'customerName',
      'Company Name': 'companyname',
      'Shipping Address1': 'streetAddress',
      'Shipping Address2': 'streetAddress2',
      'City, State, zip': 'cityStateZip',
      'zip': 'zipcode',
      'Phone': 'phone'
    };

    // Loop through each row in the table body
    table.querySelectorAll('tbody tr').forEach(row => {
      // Get the cells in the current row
      const cells = row.querySelectorAll('td');

      // Extract the key and value based on the cell content
      const key = cells[0].textContent.trim().replace(':', '');
      const value = cells[1].textContent.trim();

      // Map the key to the appropriate property and add to details object
      if (mapping[key]) {
        details[mapping[key]] = value;
      }
    });

    // Split city, state, and zip code
    if (details.cityStateZip) {
      const [city, stateZip] = details.cityStateZip.split(',');
      details.city = city.trim();
      const [state, postalCode] = stateZip.trim().split(' ');
      details.state = state.trim();
      details.zipcode = postalCode.trim();
      delete details.cityStateZip;
    }


    if (details.customerName) {
      const splitedName = details.customerName.split(' ');
      details.firstname = splitedName[0];
      details.lastname = splitedName.slice(1).join(' ');


      details.fullName = `${details.firstname} ${details.lastname}`;


    }

    // Send a message to the background script to save data
    chrome.runtime.sendMessage({ action: 'saveData', data: details }, function (response) {
      if (response && response.success) {
        document.querySelector('#copyToExtension').innerText = "Copied!"
        console.log('Data saved successfully');
      } else {
        console.error('Failed to save data');
        alert('Failed to copy data, please try again by refreshing!');
      }
    });


  

  }




  document.querySelector('table').parentElement.insertAdjacentElement('afterbegin', button);

}