const net = require('net');
var WebSocket = require('ws');
var http = require('http');
const port = 7070;
const websocket_port = 8080;
const host = '0.0.0.0';

var parser = require('fast-xml-parser');
const { resolve } = require('path');
const { rootCertificates } = require('tls');

// add timestamps in front of log messages
require('console-stamp')(console, { pattern: 'yyyy-mm-dd HH:MM:ss.l' });

const wsServer = new WebSocket.Server({ port: websocket_port });

wsServer.on('connection', function connection(ws) {

  console.log('Websocket accepted for %s [%s]', ws._socket.remoteAddress, wsServer.clients.size);
  if (datatable.length > 0) {
    console.log("send datatable[%s]", datatable.length);
    ws.send(JSON.stringify(datatable));
  }

  ws.on('message', function (message) {
    console.log(`Received message '${message}' from ${ws._socket.remoteAddress}`);
  });
  ws.on('close', function () {
    console.log('Peer ' + ws + 'disconnected.');
  });

});



// 
const server = net.createServer();
server.listen(port, host, () => {
  console.log('online-tp is running on port ' + port + '.');
});

let sockets = [];
let datatable = [];

server.on('connection', function (sock) {
  console.log('tp client CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
  sockets.push(sock);

  sock.on('data', function (data) {
    //console.log('DATA ' + sock.remoteAddress + ': ' + data);
    //console.log(data.toString('utf8').trim());
    data = data.toString('utf8').trim();
    if (data) {

      let jsondata = parseXML("<root>" + data + "</root>");
      jsondata = jsondata.root.ResultRecord;
      //if (!Array.isArray(jsondata)) jsondata = [jsondata];
      //jsondata.forEach((x) => {
      datatable.push(jsondata);
      sendData(jsondata);
      console.log(JSON.stringify(jsondata)); //.Participant.Name.Family, x.Participant.Name.Given, x.Participant.Races.Race.Result, x.Participant.Races.Race.Status);

      //});
    }

    // Write the data back to all the connected, the client will receive it as data from the server
    //sockets.forEach(function (sock, index, array) {
    //  sock.write(sock.remoteAddress + ':' + sock.remotePort + " said " + data + '\n');
    //});
  });

  // Add a 'close' event handler to this instance of socket
  sock.on('close', function (data) {
    let index = sockets.findIndex(function (o) {
      return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
    })
    if (index !== -1) sockets.splice(index, 1);
    console.log('tp client CLOSE: ' + sock.remoteAddress + ' ' + sock.remotePort);
  });

  sock.on('error', function (e) {

    console.log('ERROR: ', e);

  });
});

function parseXML(data) {
  let options = {};
  try {
    var jsonObj = parser.parse(data, options, true);
    return jsonObj;

  } catch (error) {
    console.log(error.message)
  }

}

function sendData(data) {
  wsServer.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      console.log("Sending new data");
      client.send(JSON.stringify(data));
    }
  });
}
