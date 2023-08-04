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
        successMessage.textContent = 'Notification Created Successfully!';
        successMessage.classList.remove('message-hide');
        clearForm();
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
        var imageElement = document.getElementById('display-image');
        imageElement.src = reader.result;
        imageElement.classList.remove('hide');
        var closeSpan = document.getElementById('close-image-btn');
        closeSpan.classList.remove('hide');
        closeSpan.addEventListener('click', function() {
            imageElement.src = "";
            imageElement.classList.add('hide');
            closeSpan.classList.add('hide');
            document.getElementById('form-image').value = "";
            document.getElementById('form-hidden-image-base64').value = "";
            document.getElementById('form-hidden-image').value = "";
        });
    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };
 }

async function uploadImage() {
    let token = await chrome.runtime.sendMessage('authorization');
    var form = new FormData();
    var file = document.getElementById('form-image').files[0];
    if(file != undefined && file != null){
        getBase64(file);
        // var metadata = {
        //     'name': 'image_'+(new Date()).toISOString() +`.${file.name.split('.').pop()}`, // Filename at Google Drive
        //     'mimeType': 'application/octet-stream', // mimeType at Google Drive
        //     'parents': ['1eiMcHLpWW6yCIOJBS4FbBTKL-2kmdLiM'], // Folder ID at Google Drive
        // };
        // form.append('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}));
        // form.append('file',file);
        // fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        // method: 'POST',
        // headers: new Headers({'Authorization': 'Bearer ' + token}),
        // body: form
        // }).then(res => res.json()).then(val => {
        //     console.log(val)
        //     document.getElementById('form-hidden-image').value = val.id;
        // });
    } else {
        var imageElement = document.getElementById('display-image');
        var closeSpan = document.getElementById('close-image-btn');
        imageElement.src = "";
        imageElement.classList.add('hide');
        closeSpan.classList.add('hide');
        document.getElementById('form-image').value = "";
        document.getElementById('form-hidden-image-base64').value = "";
        document.getElementById('form-hidden-image').value = "";
    }
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
    document.getElementById('form-content').innerHTML =  document.getElementById('form-content').value;
    const content = document.getElementById('form-content').innerHTML;
    document.getElementById('form-content').innerHTML = "";
    if(content == ""|| content == undefined || content == null){
        const errorMessage = document.getElementById('form-error');
        errorMessage.textContent = 'Please fill the content';
        errorMessage.classList.remove('message-hide');
        setTimeout(clearMessage, 5000);
        return;
    }
    const link = document.getElementById('form-link').value;
    document.getElementById('form-content').innerHTML = document.getElementById('form-content-title').value;
    const content_title = document.getElementById('form-content').innerHTML;
    document.getElementById('form-content').innerHTML = "";
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
    const imageBase64 = document.getElementById('form-hidden-image-base64').value;
    const expiry_date = new Date().getTime()+(expiry*24*60*60*1000);

    getNotifications(token)
        .then(res => {
            var jsonData = JSON.parse(res);
            jsonData = jsonData.filter(x => (new Date(x.expiry_date).toDateString() == (new Date()).toDateString())|| new Date(x.expiry_date).getTime()>=(new Date()).getTime())
            var fileContent = {
                'id': createGuid(),
                'expiry': expiry,
                'expiry_date': expiry_date,
                'link': link,
                'content': content,
                'content_title':content_title,
                'category':category,
                'Auto_open': Auto_open,
                'image_url': `${image_id.length == 0? "":`https://drive.google.com/file/d/${image_id}/view`}`,
                'imageBase64': `${imageBase64.length == 0? "": imageBase64}`,
                'created_date': new Date().getTime(),
                'modified_date': new Date().getTime()
            }; 
            
            var list = [];
            if (Array.isArray(jsonData)) {
                list = [fileContent, ...jsonData];
            } else { 
                list = [fileContent, jsonData];
            }
            addNewNotification(list,token);
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
    return fetch(fileurl, requestObject)
    .then(r => r.text());
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
    getNotifications(token)
        .then(res => {
            var jsonData = JSON.parse(res);
            console.log(jsonData);
        });
}

function initializePopup() { 
    bindEvents();
    populateNotifications();
}

initializePopup();