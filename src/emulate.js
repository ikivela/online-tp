const net = require('net');
var WebSocket = require('ws');
var fs = require('fs');
var http = require('http');
const url = require('url');
const port = 7070;

var parser = require('fast-xml-parser');
var json_parser = require("fast-xml-parser").j2xParser;
var json_parser = new json_parser();
const { resolve } = require('path');

// add timestamps in front of log messages
require('console-stamp')(console, { pattern: 'yyyy-mm-dd HH:MM:ss.l' });

var client = new net.Socket();
client.connect(7070, '127.0.0.1', function () {
  console.log('Connected to server');
});

client.on('close', function () {
  console.log('Connection to server closed');
});

async function emulate() {
  var xmldata = await fs.readFileSync('src/tulokset_oma.xml');
  parseXML_results(xmldata.toString())
    .then(async function handle(data) {

      for (i = 0; i < data.length; i++) {
        delayedTask(data[i], i);
        i = (i === data.length - 1) ? 0 : i;
      };

    })
    .catch(err => {
      console.error(err);
    });
}


emulate();

function delayedTask(data, i) {
  setTimeout(() => {
    var root = {
      ResultRecord: {
        Participant: {
          Name: {
            Family: data.Family,
            Given: data.Given
          },
          Races: {
            Race: {
              Result: data.Time,
              ClassId: data.ClassName,
              Rank: data.Rank,
              Status: 'OK'
            }
          }
        }
      }
    };

    var xmldata = json_parser.parse(root);
    console.log(xmldata);
    client.write(Buffer.from(xmldata, 'utf8'));
  }, i * 2000);
}

async function parseXML_results(data) {
  let options = {};
  return new Promise((_resolve, _reject) => {
    try {
      var json = parser.parse(data, options, true);
      var competitors = []

      if (json.Event.EventClass.length > 0) {

        for (var i = 0; i < json.Event.EventClass.length; i++) {
          var sarja = json.Event.EventClass[i].ClassName;
          if (sarja) {
            for (var n = 0; n < json.Event.EventClass[i].Competitor.length; n++) {
              competitors.push(json.Event.EventClass[i].Competitor[n]);
            }
          }
        }
        //delayedTask(data.Event.EventClass[i], i)
        console.log(competitors.length);
        _resolve(competitors);
      } else {
        _reject("parsing error");
      }

    } catch (error) {
      console.log(error)
      _reject(error.message);
    }
  });
}

/*function sendData(data) {
  wsServer.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      console.log("Sending new data");
      client.send(JSON.stringify(data));
    }
  });
}*/
