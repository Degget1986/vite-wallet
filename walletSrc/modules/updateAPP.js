const { shell, dialog } = require('electron');
const version = require('../version.json');
const request = require('../utils/http.js');

module.exports = function(win) {
    request({
        path: '/api/walletapp/version',
        params: {
            code: version.code,
            channel: version.channel
        },
        method: 'GET'
    }).then(({
        codeName, appUrl, message, isForce
    })=>{
        if (!isForce || !win || win.isDestroyed()) {
            win = null;
            return;
        }
    
        dialog.showMessageBox({
            type: 'info',
            title: `${codeName} update`,
            message: `${message}`,
            buttons: ['no thanks', 'download'],
        }, (id) => {
            id === 1 && shell.openExternal(appUrl);
        });
    }).catch((err)=>{
        console.log(err);
    });
};
