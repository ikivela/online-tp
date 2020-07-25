const net = require("net");
var WebSocket = require("ws");
var http = require("http");
const url = require("url");
const port = 7070;
const websocket_port = 8080;
const host = "0.0.0.0";
const chokidar = require("chokidar");
var iconv = require("iconv-lite");

const MessageBuffer = require("./messagebuffer");
var parser = require("fast-xml-parser");
const fs = require("fs");
const { setFlagsFromString } = require("v8");
let received_xml = new MessageBuffer("\x02");
// add timestamps in front of log messages
require("console-stamp")(console, { pattern: "yyyy-mm-dd HH:MM:ss.l" });

const wwwroot = "./html/";
var json_results = "";
var startlist = "";
var from_socket = true;

try {
  if (fs.existsSync("./data/tulokset.xml")) {
    fs.readFile("./data/tulokset.xml", async (err, data) => {
      if (err) console.error(err);
      if (data) {
        console.log("reading data: ", "./data/tulokset.xml");
        json_results = await parseXML(data.toString("utf8"));
        json_results = createSplitRanks(json_results);
      }
    });
  }
  if (fs.existsSync("./data/livelist.json")) {
    fs.readFile("./data/livelist.json", async (err, data) => {
      if (err) console.error(err);
      if (data) {
        console.log("reading data: ", "./data/livelist.json");
        datatable = JSON.parse(data.toString("utf8"));
      }
    });
  }
  if (fs.existsSync("./data/startlist.xml")) {
    fs.readFile("./data/startlist.xml", async (err, data) => {
      if (err) console.error(err);
      if (data) {
        console.log("reading data: ", "./data/startlist.xml");
        startlist = await parseXML(data.toString("utf8"));
      }
    });
  }
} catch (_error) {
  console.error(_error);
}

console.log(`Watching for file changes on ./data/tulokset.xml`);

/*chokidar.watch("./data/tulokset.xml").on("raw", (event, path, details) => {
  console.log(event, path, details);
  fs.readFile("./data/tulokset.xml", async (err, data) => {
    if (err) console.error(err);
    try {
      if (data && !from_socket) {
        json_results = await parseXML(data.toString("utf8"));
        json_results = createSplitRanks(json_results);
      }
    } catch (_err) {
      console.error(_err);
    }
  });
});
*/
function calcSplits(val, i, arr) {
  //console.log(val.ControlOrder, i + 1, arr[i].CTSecs);
  if (i > 0 && val.ControlOrder - arr[i - 1].ControlOrder === 1) {
    val.Split = val.CTSecs - arr[i - 1].CTSecs;
  } else if (i === 0) {
    val.Split = val.CTSecs;
  }
  return val;
}

function createSplitRanks(res) {
  // create splits for each class
  //{ class, identity, splits: { control, time, rank, split_time, split_rank } }

  //fs.writeFileSync('res.json', JSON.stringify(res));
  console.log("Creating split times from xml");
  //console.log(res);
  if (!Array.isArray(res.Event.EventClass)) {
    res.Event.EventClass = [res.Event.EventClass];
  }

  res.Event.EventClass.forEach((_class) => {
    //if (_class.ClassName !== "H21") process.exit(-1);
    if (!Array.isArray(_class.Competitor))
      _class.Competitor = [_class.Competitor];

    if (_class.Competitor.length > 0) {
      //console.log(JSON.stringify(split_ranks));
      //split_ranks = !Array.isArray(split_ranks) ? [split_ranks] : split_ran ks;
      _class.Competitor.forEach((c) => {
        if (c.SplitTimes && c.Status == "")
          c.SplitTimes.Control.map(calcSplits);
      });
      //console.log(split_ranks);
      if (_class.Competitor[0].SplitTimes) {
        var controls = _class.Competitor[0].SplitTimes.Control.length;
      } else {
        return;
      }
      for (var n = 0; n < controls; n++) {
        //console.log("Sorting control %s of %s", n, controls);
        //if (n == 7) console.log(JSON.stringify(_class.Competitor));
        _class.Competitor.sort((a, b) => {
          //console.log(a.SplitTimes.Control[0].CTSecs - b.SplitTimes.Control[0].CTSecs);
          if (
            a.SplitTimes &&
            b.SplitTimes &&
            a.SplitTimes.Control[n] &&
            b.SplitTimes.Control[n]
          ) {
            return (
              a.SplitTimes.Control[n].CTSecs - b.SplitTimes.Control[n].CTSecs
            );
          } else {
            return 1;
          }
        });

        _class.Competitor.forEach((rank, i, arr) => {
          if (arr[i].SplitTimes && arr[i].SplitTimes.Control[n]) {
            var diff =
              i !== 0
                ? arr[i].SplitTimes.Control[n].CTSecs -
                  arr[0].SplitTimes.Control[n].CTSecs
                : 0;
            rank.SplitTimes.Control[n].ControlDiff = diff;
            rank.SplitTimes.Control[n].ControlRank = i + 1;
            /*console.log(
              i + 1 + ".",
              rank.Family,
              rank.SplitTimes.Control[n].CTSecs,
              "+" + diff
            );*/
          } else {
            //console.log("Control", n, " not found for ", rank.Family);
          }
        });
      }

      for (var n = 0; n < controls; n++) {
        //console.log("Sorting split", n);
        _class.Competitor.sort((a, b) => {
          //console.log(a.SplitTimes.Control[0].CTSecs - b.SplitTimes.Control[0].CTSecs);
          if (
            a.SplitTimes &&
            a.SplitTimes.Control[n] &&
            b.SplitTimes &&
            b.SplitTimes.Control[n]
          ) {
            return (
              a.SplitTimes.Control[n].Split - b.SplitTimes.Control[n].Split
            );
          } else {
            //console.error("No split times for", a.Family);
          }
        });

        _class.Competitor.forEach((rank, i, arr) => {
          //console.log(rank.SplitTimes.Control[n].Split); //rank);
          if (
            arr[i].SplitTimes &&
            arr[i].SplitTimes.Control[n] &&
            arr[0].SplitTimes.Control[n]
          ) {
            var n_split = arr[i].SplitTimes.Control[n].Split;
            //console.log(JSON.stringify(_split));
            if (n_split) {
              var diff = n_split - arr[0].SplitTimes.Control[n].Split;
              rank.SplitTimes.Control[n].SplitDiff = diff;
              rank.SplitTimes.Control[n].SplitRank =
                diff === 0 ? (i <= 1 ? 1 : i - 1) : i + 1;
            }
          }
        });
      }
      //JSON.stringify(split_ranks));
      //
      _class.Competitor.sort((a, b) => {
        return a.Rank - b.Rank;
      });

      fs.writeFileSync("splits.json", JSON.stringify(res));
    }
    /*setTimeout(() => {
      console.log("writing splits.json");
      fs.writeFileSync("splits.json", JSON.stringify(res));
      process.exit(-1);
    }, 2000);*/
  });

  return res;
}

async function updateJSON_results() {}

const http_server = http.createServer((_req, _res) => {
  if (_req.method == "GET") {
    return handleGET(_req, _res);
  }
  if (_req.method == "POST") {
    return handlePOST(_req, _res);
  }
});

function handleGET(_request, _response) {
  //fonsole.log(_response);
  //var filePath = '.' + _request.url;
  //console.log(_request.url);
  if (_request.url == "/") {
    _response.writeHead(200, '{ "Content-Type: "text/html" }');
    _response.end(fs.readFileSync(wwwroot + "index.html"));
  } else if (_request.url == "/live.js") {
    _response.writeHead(200, '{ "Content-Type: "application/json" }');
    _response.end(fs.readFileSync(wwwroot + "live.js"));
  } else if (_request.url == "/startlist") {
    _response.writeHead(200, '{ "Content-Type: "application/json" }');
    _response.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    //console.log("/results");
    var data = startlist ? startlist : "";
    return _response.end(JSON.stringify(data));
  } else if (_request.url == "/update") {
    _response.writeHead(200, '{ "Content-Type: "text/html" }');
    _response.end(fs.readFileSync(wwwroot + "index.html"));
  } else if (_request.url == "/results") {
    _response.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    //console.log("/results");
    var data = json_results !== undefined ? json_results : null;
    return _response.end(JSON.stringify(data));
  } else if (_request.url == "/favicon.ico") {
    _response.writeHead(200, {
      "Content-Type": "image/x-icon",
      "Access-Control-Allow-Origin": "*",
    });
    return _response.end(fs.readFileSync(wwwroot + "favicon.ico"));
  } else {
    console.log(_request.url);
    _response.writeHead(403, { "Content-Type": "text/html" });
    return _response.end("Not allowed");
  }
}

const wsServer = new WebSocket.Server({ noServer: true });
wsServer.on("connection", function connection(ws, request) {
  //console.log(JSON.stringify(request.headers));
  ws.isAlive = true;
  var ip = request.headers.host;
  //if (request.headers["x-forwarded-for"]) ip = req.headers["x-forwarded-for"];

  //console.log("Websocket accepted for %s [%s]", ip, wsServer.clients.size);
  if (datatable.length > 0) {
    console.log("send datatable[%s]", datatable.length);
    ws.send(JSON.stringify(datatable));
  }

  ws.on("message", function (message) {
    console.log(
      `Received message '${message}' from ${ws._socket.remoteAddress}`
    );
  });
  ws.on("close", function () {
    //clearInterval(interval);
  });
  ws.on("pong", heartbeat);
});

const interval = setInterval(function ping() {
  wsServer.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

wsServer.on("close", () => {
  console.warn("closing websocket server");
  clearInterval(interval);
});

function noop() {}
function heartbeat() {
  this.isAlive = true;
}

function sendData(data) {
  wsServer.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

http_server.listen(websocket_port);

http_server.on("get", function get(_req) {
  console.log("GET");
});

http_server.on("upgrade", function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;

  if (pathname === "/" + process.env.WS_PATH || "ws") {
    wsServer.handleUpgrade(request, socket, head, function done(ws) {
      wsServer.emit("connection", ws, request);
    });
  }
});

//
const tcp_server = net.createServer();
tcp_server.listen(port, host, () => {
  console.log(
    "online-tp is running on port " +
      port +
      ", websocket server on port " +
      websocket_port
  );
});

let sockets = [];
let datatable = [];

tcp_server.on("connection", function (sock) {
  console.log(
    "tp client CONNECTED: " + sock.remoteAddress + ":" + sock.remotePort
  );
  sockets.push(sock);
  sock.setEncoding("binary");
  //let data = '';
  //let i = 0;

  sock.on("data", function (chunk) {
    //console.log(chunk.toString().substr(0, 14));

    if (chunk.toString().substr(0, 14) == "<ResultRecord>") {
      chunk = iconv.decode(Buffer.from(chunk, "binary"), "UTF8");
      //console.log(chunk);
      var jsondata = parseXML(chunk);
      //console.log(jsondata);
      datatable.push(jsondata);
      fs.writeFile("./data/livelist.json", JSON.stringify(datatable), () => {
        //console.log("write livelist");
      });
      sendData(jsondata);
    } else {
      received_xml.push(chunk);
      if (received_xml.isFinished()) {
        let message = received_xml.handleData();
        message = iconv.decode(Buffer.from(message, "binary"), "ISO-8859-1");
        //console.log(message);
        let results = parseXML(message);

        //json_results = json_results.Promise;
        //console.log(results);
        if (results && results.Event && results.Event.EventClass) {
          //console.log(message);
          from_socket = true;
          fs.writeFile("./data/tulokset.xml", message, () => {});
          //console.log(JSON.stringify(jsondata));
          // XML results received
          json_results = createSplitRanks(results);
          console.log("XML results updated");
          from_socket = false;
          //updateClasses();
        }
      }
    }
  });

  sock.on("end", () => {
    console.log("end event");
    /*if (data.substr(0, 10) !== '<?xml version=') {
          console.log("add root");
          jsondata = parseXML("<root>" + data + "</root>");
          jsondata = jsondata.root.ResultRecord;
        } else {
          jsondata = parseXML(data);
        }*/
  });

  // Add a 'close' event handler to this instance of socket
  sock.on("close", function (data) {
    let index = sockets.findIndex(function (o) {
      return (
        o.remoteAddress === sock.remoteAddress &&
        o.remotePort === sock.remotePort
      );
    });
    if (index !== -1) sockets.splice(index, 1);
    console.log(
      "tp client CLOSE: " + sock.remoteAddress + " " + sock.remotePort
    );
  });

  sock.on("error", function (e) {
    console.log("ERROR: ", e);
  });
});

function parseXML(data) {
  let options = {};

  try {
    var json = parser.parse(data, options, true);
    return json;
  } catch (error) {
    console.log("Parsing Error", error);
  }
}
