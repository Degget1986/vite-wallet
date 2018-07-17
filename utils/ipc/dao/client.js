'use strict';

const net = require('net'),
    EventParser = require('../entities/EventParser.js'),
    // Message = require('js-message'),    // 数据传输协议（使用jsonrpc替换）
    Queue = require('js-queue');

let Events = require('event-pubsub/es5');
if(process.version[1]>4){
    Events = require('event-pubsub');
}

let eventParser = new EventParser();

class Client extends Events{
    constructor(config,log){
        super();
        Object.assign(
            this,
            {
                Client  : Client,
                config  : config,
                queue   : new Queue,
                socket  : false,
                connect : connect,
                emit    : emit,
                log     : log,
                retriesRemaining: config.maxRetries||0,
                explicitlyDisconnected: false
            }
        );
    }
}

function emit(type,data){
    this.log('dispatching event to ', this.id, this.path, ' : ', type, ',', data);
    let message = {
        type, 
        data: eventParser.format(data)
    };

    if(!this.config.sync){
        this.socket.write(message.data);
        return;
    }

    this.queue.add(
        syncEmit.bind(this, message)
    );
}

function syncEmit(message){
    this.log('dispatching event to ', this.id, this.path, ' : ', message.type, ',', message);
    this.socket.write(message.data);
}

function connect(){
    //init client object for scope persistance especially inside of socket events.
    let client=this;

    client.log('requested connection to ', client.id, client.path);
    if(!this.path){
        client.log('\n\n######\nerror: ', client.id ,' client has not specified socket path it wishes to connect to.');
        return;
    }

    client.log('Connecting client on Unix Socket :', client.path);

    const options = {
        path: client.path
    };

    if (process.platform ==='win32' && !client.path.startsWith('\\\\.\\pipe\\')){
        // endpoint := "vite.ipc"
        // if runtime.GOOS == "windows" {
        //     endpoint = `\\.\pipe\vite.ipc`
        // }
        // return endpoint


        options.path = options.path.replace(/^\//, '');
        options.path = options.path.replace(/\//g, '-');
        options.path= `\\\\.\\pipe\\${options.path}`;
    }

    client.socket = net.connect(options);

    client.socket.setEncoding(this.config.encoding);

    client.socket.on(
        'error',
        function(err){
            client.log('\n\n######\nerror: ', err);
            client.publish('error', err);
        }
    );

    client.socket.on(
        'connect',
        function connectionMade(){
            client.publish('connect');
            client.retriesRemaining = client.config.maxRetries;
            client.log('retrying reset');
        }
    );

    client.socket.on(
        'close',
        function connectionClosed(){
            client.log('connection closed' ,client.id , client.path,
                client.retriesRemaining, 'tries remaining of', client.config.maxRetries
            );

            if(
                client.config.stopRetrying ||
                client.retriesRemaining<1 ||
                client.explicitlyDisconnected
            ){
                client.publish('disconnect');
                client.log(
                    (client.config.id),
                    'exceeded connection rety amount of',
                    ' or stopRetrying flag set.'
                );

                client.socket.destroy();
                client.publish('destroy');
                client=undefined;

                return;
            }

            setTimeout(
                function retryTimeout(){
                    client.retriesRemaining--;
                    client.connect();
                }.bind(null,client),
                client.config.retry
            );

            client.publish('disconnect');
        }
    );

    client.socket.on(
        'data',
        function(data) {
            client.log('## received events ##');

            if(!this.ipcBuffer){
                this.ipcBuffer='';
            }

            data = (this.ipcBuffer+=data);

            this.ipcBuffer='';

            data = eventParser.parse(data);
            client.log('detected event', data.id, data);
            client.publish(data.id, data);

            if(!client.config.sync){
                return;
            }

            client.queue.next();
        }
    );
}

module.exports=Client;
