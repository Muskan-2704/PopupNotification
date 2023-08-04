function addNewNotification(fileContent,token) { 
    var fileId = '1hzU5-4nSlB5ZchFaKVaRU0xQjGlDyZKW'; //"1TJpoAapWc6JXhTSAoR49ekHyhq3VNYnz";
    var file = new Blob([ JSON.stringify(fileContent)], { type: 'text/plain' });
    var metadata = {
        'name': 'notification_'+(new Date()).toISOString() +'.txt', // Filename at Google Drive
        'mimeType': 'text/plain', // mimeType at Google Drive
        'parents': ['1eiMcHLpWW6yCIOJBS4FbBTKL-2kmdLiM'], // Folder ID at Google Drive
    };
    var xhr = new XMLHttpRequest();
    xhr.open('PATCH', 'https://www.googleapis.com/upload/drive/v3/files/'+fileId+'?uploadType=media&supportsAllDrives=true');
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.responseType = 'json';
    xhr.onload = () => {
        const successMessage = document.getElementById('form-success');
        successMessage.textContent = 'Notification Updated Successfully!';
        successMessage.classList.remove('message-hide');
        setTimeout(clearMessage, 5000);
    };
    xhr.onerror = () => { 
        const errorMessage = document.getElementById('form-error');
        errorMessage.textContent = 'Error! Something went wrong, please try again.';
        errorMessage.classList.remove('message-hide');
        setTimeout(clearMessage, 5000);
    }
    xhr.send(file);
}

function getBase64(file) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        document.getElementById('form-hidden-image-base64').value = reader.result;
    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };
 }

async function uploadImage() {
    let token = await chrome.runtime.sendMessage('authorization');
    var form = new FormData();
    var file = document.getElementById('form-image').files[0];
    getBase64(file);
    // var metadata = {
    //     'name': 'image_'+(new Date()).toISOString() +`.${file.name.split('.').pop()}`, // Filename at Google Drive
    //     'mimeType': 'application/octet-stream', // mimeType at Google Drive
    //     'parents': ['1eiMcHLpWW6yCIOJBS4FbBTKL-2kmdLiM'], // Folder ID at Google Drive
    // };
    // form.append('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}));
    // form.append('file',file);
    // fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    //     method: 'POST',
    //     headers: new Headers({'Authorization': 'Bearer ' + token}),
    //     body: form
    // }).then(res => res.json()).then(val => {
    //     console.log(val)
    //     document.getElementById('form-hidden-image').value = val.id;
    // });
}
async function createNotificationDocument(event) { 
    let token = await chrome.runtime.sendMessage('authorization');
    clearMessage();
    const expiry = document.getElementById('form-expiry').value;
    if(expiry == ""|| expiry == undefined || expiry == null){
        const errorMessage = document.getElementById('form-error');
        errorMessage.textContent = 'Please fill the expiry';
        errorMessage.classList.remove('message-hide');
        setTimeout(clearMessage, 5000);
        return;
    }
    const content = document.getElementById('form-content').value;
    if(content == ""|| content == undefined || content == null){
        const errorMessage = document.getElementById('form-error');
        errorMessage.textContent = 'Please fill the content';
        errorMessage.classList.remove('message-hide');
        setTimeout(clearMessage, 5000);
        return;
    }
    const link = document.getElementById('form-link').value;
    const content_title = document.getElementById('form-content-title').value;
    if(content_title == ""|| content_title == undefined || content_title == null){
        const errorMessage = document.getElementById('form-error');
        errorMessage.textContent = 'Please fill the content title';
        errorMessage.classList.remove('message-hide');
        setTimeout(clearMessage, 5000);
        return;
    }
    const category = document.getElementById('form-category').value;
    if(category == ""|| category == undefined || category == null){
        const errorMessage = document.getElementById('form-error');
        errorMessage.textContent = 'Please select the category';
        errorMessage.classList.remove('message-hide');
        setTimeout(clearMessage, 5000);
        return;
    }
    const Auto_open = document.getElementById('form-auto-open').checked;
    const image_id = document.getElementById('form-hidden-image').value;
    const notificationId = document.getElementById('notification-id').value;
    const imageBase64 = document.getElementById('form-hidden-image-base64').value;
    getNotifications(token).then(res => {
        var jsonData = JSON.parse(res);
        var index = jsonData.findIndex(x=>x.id == notificationId);
        var fileContent = {
            'id': notificationId,
            'expiry': jsonData[index].expiry,
            'expiry_date': jsonData[index].expiry_date,
            'link': link,
            'content': content,
            'content_title':content_title,
            'category':category,
            'Auto_open': Auto_open,
            'image_url': `${ image_id.length == 0? "":`https://drive.google.com/file/d/${image_id}/view`}`,
            'imageBase64': `${imageBase64.length == 0? "": imageBase64}`,
            'created_date': jsonData[index].created_date,
            'modified_date': new Date().getTime()
        }; 
        if(index > -1){
            jsonData[index] = fileContent;
            addNewNotification(jsonData,token);
        }
    });
}

function getNotifications(token) {
    let requestObject = {
        method: 'GET',
        async: true,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    };
    var fileId = "1hzU5-4nSlB5ZchFaKVaRU0xQjGlDyZKW"; //"1hJFVMykj1gvT3hHfxf0LyVYLuvkAqpba";
    var fileurl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media&supportsAllDrives=true';
    return fetch(fileurl, requestObject).then(r => r.text());
}

function clearForm() {
    document.getElementById('form-expiry').value='';
    document.getElementById('form-content').value='';
    document.getElementById('form-link').value='';
    document.getElementById('form-content-title').value='';
    document.getElementById('form-category').selectedIndex='';
    document.getElementById('form-auto-open').checked=false;
    document.getElementById('form-hidden-image').value='';
    document.getElementById('form-image').value='';
}

function clearMessage() { 
    document.getElementById('form-success').classList.add('message-hide');
    document.getElementById('form-error').classList.add('message-hide');
}

function bindEvents() { 
    const cancelButton = document.getElementById('ext-btn-cancel');
    const submitButton = document.getElementById('ext-btn-submit');
    const inputfile = document.getElementById('form-image');
    cancelButton.addEventListener('click', event => {
        window.close();
    });
    submitButton.addEventListener('click', createNotificationDocument);
    inputfile.addEventListener('change', uploadImage);
}

function createGuid(){  
    function S4() {  
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);  
    }
    return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase(); 
}

async function populateNotifications() {
    let token = await chrome.runtime.sendMessage('authorization'); 
    getNotifications(token).then(res => {
        var jsonData = JSON.parse(res);
        console.log(jsonData);
        const params = new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
        });
        let notificationId = params.id;
        console.log(notificationId);
        let notification = jsonData.filter(x=> x.id == notificationId)
        if(notification.length > 0) {
            populateForm(notification[0]);
        }else {
            console.log("Notification not found");
        }
    });
}

function populateForm(notification) {
    document.getElementById('form-expiry').value= notification.expiry;
    document.getElementById('form-content').value= notification.content;
    document.getElementById('form-link').value= notification.link;
    document.getElementById('form-content-title').value= notification.content_title;
    document.getElementById('form-category').value= notification.category;
    document.getElementById('form-auto-open').checked= notification.Auto_open;
    let imageArr = notification.image_url.length == 0? [] : notification.image_url.split('/');
    if(imageArr.length > 0)
        imageArr.pop();
    document.getElementById('form-hidden-image').value= `${imageArr.length >0? imageArr.pop(): ""}`;
    document.getElementById('notification-image').src= notification.imageBase64;
    document.getElementById('form-hidden-image-base64').value = notification.imageBase64;
    document.getElementById('notification-id').value = notification.id;
}

function initializePopup() { 
    bindEvents();
    populateNotifications();
}
initializePopup();