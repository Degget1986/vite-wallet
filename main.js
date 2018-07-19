// [TODO] app-log test
const {app, BrowserWindow, shell} = require('electron');
const path = require('path');

const APP_PATH = app.getAppPath();

// APIs
const ipcGo = require( path.join(APP_PATH, './walletSrc/modules/ipcGo.js') );
global.goViteIPC = new ipcGo();
require( path.join(APP_PATH, './walletSrc/middle/index.js') );

let win;
function createWindow () {
    // Generate configuration file
    require( path.join(APP_PATH, './walletSrc/initConfig.js') );
    
    win = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'VITE-WALLET',
        images: true
    });

    // Loading first
    win.loadURL(
        'data:text/html,<div class="lds-ripple"><div></div><div></div></div><style>body{background: #f1f1f1;height:100vh;margin: 0;padding: 0;display: flex;justify-content: center;align-items: center;}.lds-ripple{display:inline-block;position:relative;width:64px;height:64px;}.lds-ripple div{position: absolute;border: 4px solid #4169E1;opacity: 1;border-radius: 50%;animation: lds-ripple 1s cubic-bezier(0, 0.2, 0.8, 1) infinite;}.lds-ripple div:nth-child(2) {animation-delay: -0.5s;}@keyframes lds-ripple {0% {top: 28px;left: 28px;width: 0;height: 0;opacity: 1;}100% {top: -1px;left: -1px;width: 58px;height: 58px;opacity: 0;}}</style>'
    );

    // Load file
    win.loadFile( path.join(APP_PATH, '/wallet/dist/index.html') );
    win.webContents.once('did-get-response-details', () => {
        win.webContents.executeJavaScript(`
            let basePath = process.cwd();
            require(basePath + '/walletSrc/modules/webAPIs.js');
            let config = require(basePath + '/walletSrc/viteWebConfig.json');
            window.walletConfig = config;
            window.$i18n.locale = window.walletConfig.locale;
        `);
    });

    // Redefine file
    win.webContents.on('new-window', (event, url) => {
        // [TODO] only vite.net
        const protocol = require('url').parse(url).protocol;
        if (protocol === 'http:' || protocol === 'https:') {
            event.preventDefault();
            shell.openExternal(url);
        }
    });

    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    process.platform !== 'darwin' && app.quit();
});

app.on('activate', () => {
    win === null && (win = createWindow());
});
