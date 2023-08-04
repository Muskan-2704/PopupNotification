function loadDataTable() {
    $('#MyTable').DataTable({
        initComplete: function () {
            this.api().columns().every(function () {
                var column = this;
                var select = $('<select><option value=""></option></select>').appendTo($(column.footer()).empty()).on('change', function () {
                    var val = $.fn.dataTable.util.escapeRegex($(this).val());
                    // to select and search from grid
                    column.search(val ? '^' + val + '$' : '', true, false).draw();
                });
                column.data().unique().sort().each(function (d, j) {
                    select.append('<option value="' + d + '">' + d + '</option>')
                });
            });
        }
    });

    $('#MyTable').on('click', '.table-delete', function () {
        var id = $(this).attr('data-id');
        deleteNotificationById(id);
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
    var fileId = "1hzU5-4nSlB5ZchFaKVaRU0xQjGlDyZKW"; // "1hJFVMykj1gvT3hHfxf0LyVYLuvkAqpba";
    var fileurl = 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media&supportsAllDrives=true';
    return fetch(fileurl, requestObject).then(r => r.text());
}

async function initialLoad() {
    let token = await chrome.runtime.sendMessage('authorization');
    getNotifications(token)
    .then(res => {
        $('#MyTable').DataTable().destroy();
        var jsonData = JSON.parse(res);
        let valid_notification = jsonData.filter(x => x.id && x.content_title && (x.expiry_date > new Date().getTime()));
        let htmlString = ``;
        for (const item of valid_notification) {
            htmlString +=
                `<tr>
                <td>${item.imageBase64.length == 0? "": `<img src="${item.imageBase64}" width="64" height="80" />`}</td>
                <td>${item.content_title}</td>
                <td>${item.content.length > 15 ? item.content.substring(0, 15) + "..." : item.content}</td>
                <td>${item.link}</td>
                <td>
                    <a href="edit-notification.html?id=${item.id}" /> <img alt="Edit" class="table-edit" src="edit.png" data-id="${item.id}" /></a>
                    <img alt="Delete" class="table-delete" src="delete.png" data-id="${item.id}" />
                </td>
            </tr>`
        }
        let tbody = document.querySelector('#MyTable tbody');
        tbody.innerHTML = htmlString;
        setTimeout(loadDataTable, 200);
    });
}

initialLoad();

async function deleteNotificationById(id) {
    if (confirm("Are you sure you wanted to delete this notification")) {
        let token = await chrome.runtime.sendMessage('authorization');
        getNotifications(token)
            .then(res => {
                var jsonData = JSON.parse(res);
                jsonData = jsonData.filter(x => x.id != id);
                deleteNotification(jsonData, token);
            });
    }
}

function deleteNotification(fileContent, token) {
    var fileId = '1hzU5-4nSlB5ZchFaKVaRU0xQjGlDyZKW'; //"1TJpoAapWc6JXhTSAoR49ekHyhq3VNYnz";
    var file = new Blob([JSON.stringify(fileContent)], { type: 'text/plain' });
    var metadata = {
        'name': 'notification_' + (new Date()).toISOString() + '.txt', // Filename at Google Drive
        'mimeType': 'text/plain', // mimeType at Google Drive
        'parents': ['1eiMcHLpWW6yCIOJBS4FbBTKL-2kmdLiM'], // Folder ID at Google Drive
    };
    var xhr = new XMLHttpRequest();
    xhr.open('PATCH', 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media&supportsAllDrives=true');
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.responseType = 'json';
    xhr.onload = () => {
        initialLoad();
    };
    xhr.onerror = () => {
        const errorMessage = document.getElementById('form-error');
        errorMessage.textContent = 'Error! Something went wrong, please try again.';
        errorMessage.classList.remove('message-hide');
        setTimeout(clearMessage, 5000);
    }
    xhr.send(file);
}

