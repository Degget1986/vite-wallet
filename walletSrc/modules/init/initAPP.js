const path = require('path');
const { app, BrowserWindow } = require('electron');
const { stopIPCServer } = require( path.join(global.APP_PATH, '/walletSrc/modules/viteNode.js') );
const updateAPP = require( path.join(global.APP_PATH, '/walletSrc/modules/updateAPP.js') );

// Single app instance
const isSecondInstance = app.makeSingleInstance(() => {
    // Someone tried to run a second instance, we should focus our window.
    if (!global.WALLET_WIN) {
        return;
    }

    global.WALLET_WIN.isMinimized() && global.WALLET_WIN.restore();
    global.WALLET_WIN.focus();
});
isSecondInstance && app.quit();

module.exports = function () {
    global.viteEventEmitter.emit('appStatus', 0);

    app.on('gpu-process-crashed', () => {
        global.dialog.crash('gpu-process-crashed');
        global.walletLog.info('gpu-process-crashed', false);
    });

    app.on('ready', function () {
        global.$i18n.setLocale( app.getLocale() );
        createWindow && createWindow();
    });
};

function createWindow () {
    global.WALLET_WIN = new BrowserWindow({
        width: 1200,
        minWidth: 1210,
        height: 768,
        title: 'VITE WALLET',
        images: true
    });

    global.WALLET_WIN.on('close', (event) => {
        event.preventDefault();
        global.dialog.quit();        
    });

    global.WALLET_WIN.on('closed', () => {
        global.WALLET_WIN = null;
        stopIPCServer();
        app.quit();
    });

    // Loading first
    global.WALLET_WIN.loadURL(
        'data:text/html,<div class="lds-ripple"><div></div><div></div></div><style>body{background: #f1f1f1;height:100vh;margin: 0;padding: 0;display: flex;justify-content: center;align-items: center;}.lds-ripple{display:inline-block;position:relative;width:64px;height:64px;}.lds-ripple div{position: absolute;border: 4px solid #4169E1;opacity: 1;border-radius: 50%;animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;}.lds-ripple div:nth-child(2) {animation-delay: -0.5s;}@keyframes lds-ripple {0% {top: 28px;left: 28px;width: 0;height: 0;opacity: 1;}100% {top: -1px;left: -1px;width: 58px;height: 58px;opacity: 0;}}</style>'
    );

    global.viteEventEmitter.emit('appStatus', 1);

    // Because net module can only be used after app is ready
    updateAPP();
}
