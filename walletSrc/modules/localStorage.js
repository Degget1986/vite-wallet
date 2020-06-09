const fs = require('fs');
const path = require('path');

const USER_WALLET_PATH = path.join(global.USER_DATA_PATH, '/wallet/');

if (!fs.existsSync(USER_WALLET_PATH)) {
    fs.mkdirSync(USER_WALLET_PATH);
}

function getFileName(name) {
    if (!name) {
        return null;
    }
    name = name.replace(':', '_');
    return path.join(USER_WALLET_PATH, name);
}

function setItem(name, str) {
    global.walletLog.info('setFile', JSON.stringify({
        name, str
    }));

    let fileName = getFileName(name);
    global.walletLog.info('setFile: fileName', fileName);

    if (!fileName) {
        return;
    }

    try {
        fs.writeFileSync(fileName, str, 'utf8');
    } catch (err) {
        global.walletLog.error(`Write ${fileName}: ${JSON.stringify(err)}`);
    }
}

function getItem(name) {
    global.walletLog.info('getFile', name);

    let fileName = getFileName(name);
    global.walletLog.info('getFile: fileName', fileName);

    if (!fileName) {
        return null;
    }

    let file = '';
    try {
        // Not exists
        if ( !fs.existsSync(fileName) ) {
            global.walletLog.info('getFile: !file', fileName);
            return null;
        }

        file = fs.readFileSync(fileName, {
            encoding: 'utf8'
        });
        global.walletLog.info('getFile: !file', file);
    } catch(err) {
        global.walletLog.error(`Read account-file: ${JSON.stringify(err)}`);
    }

    return file;
}

module.exports = {
    setItem, getItem
};