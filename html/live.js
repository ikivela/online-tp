//var wsUri = "ws://luna.chydenius.fi/ws";
var wsUri = "ws://luna.chydenius.fi/live";
var baseUrl = "http://luna.chydenius.fi/live/";

var livelist = [];
var results = {};
var start_times_text = "Lähtöajat";
var results_text = "Tulokset";

function init() {
  initWebSocket();
  console.log("init");
  displayTime();
}

function updateResults(silent) {
  // 1. Create a new XMLHttpRequest object
  let xhr = new XMLHttpRequest();

  // 2. Configure it: GET-request for the URL /article/.../load
  xhr.open("GET", baseUrl + "/results");

  // 3. Send the request over the network
  xhr.send();

  // 4. This will be called after the response is received
  xhr.onload = function () {
    if (xhr.status != 200) {
      // analyze HTTP status of the response
      console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
    } else {
      // show the result

      results = JSON.parse(xhr.response);
      //$("#title").html("<h4>" + results.Event.EventName + "</h4>");
      writeClassMenu(results);

      if (!silent) {
        writeResults(results);
      }
    }
  };
}

function writeClassMenu(data) {
  var menus = "<option>Näytä kaikki</option>";
  for (var i = 0; i < data.Event.EventClass.length; i++) {
    menus += "<option>" + data.Event.EventClass[i].ClassName + "</option>\n";
  }
  $("#classmenu").html(menus);
  $("#classmenu").selectpicker("refresh");
}

function writeResults(data, class_name) {
  //console.log("writeResults", data, class_name);
  //selectpicker('val', ["mustard", "relish"]);//menus); //data.Event.EventClass[i].ClassName);

  var html = "";
  var mobile = window.matchMedia("(max-width: 767px)").matches ? true : false;

  //console.log(data.Event.EventClass);
  html = `<h6>${results.Event.EventName}</h6><h4>${results_text}</h4><table class="table table-fit table-bordered table-sm stable-striped">\n`;
  if (!class_name) {
    for (var i = 0; i < data.Event.EventClass.length; i++) {
      if (data.Event.EventClass[i].Competitor.length > 0)
        data.Event.EventClass[i].Competitor.sort((a, b) => {
          return a.Rank - b.Rank;
        });
      html += `<tr class="table-secondary" style="font-weight:bold"><td colspan="5">${data.Event.EventClass[i].ClassName} ${data.Event.EventClass[i].ClassDist}km</td></tr>`;
      for (var k = 0; k < data.Event.EventClass[i].Competitor.length; k++) {
        var club = mobile
          ? data.Event.EventClass[i].Competitor[k].ClubID
          : data.Event.EventClass[i].Competitor[k].ClubName;
        if (data.Event.EventClass[i].Competitor[k].Time) {
          html += `<tr class="competitor"><td>${data.Event.EventClass[i].Competitor[k].Order}</td>`;
          if (data.Event.EventClass[i].Competitor[k].SplitTimes)
            html += `<td><a class="competitor-link" href="#splits/class/${data.Event.EventClass[i].ClassName}/competitor/${data.Event.EventClass[i].Competitor[k].StartNumber}">${data.Event.EventClass[i].Competitor[k].Family} ${data.Event.EventClass[i].Competitor[k].Given}</a></td>`;
          else
            html += `<td>${data.Event.EventClass[i].Competitor[k].Family} ${data.Event.EventClass[i].Competitor[k].Given}</td>`;
          html += `<td>${club ? club : ""}</td>`;
          html += `<td>${
            data.Event.EventClass[i].Competitor[k].Time
              ? data.Event.EventClass[i].Competitor[k].Time
              : ""
          }</td>`;
          html += `<td>${
            data.Event.EventClass[i].Competitor[k].TimeBehind
              ? Number.isInteger(
                  data.Event.EventClass[i].Competitor[k].TimeBehind
                )
                ? "+" + data.Event.EventClass[i].Competitor[k].TimeBehind
                : data.Event.EventClass[i].Competitor[k].TimeBehind
              : ""
          }</td></tr>`;
        }
      }
    }
  } else {
    //console.log("mobile", mobile);
    //data.Competitor.sort((a, b) => a.Rank));
    html += `<tr class="table-secondary" style="font-weight:bold"><td colspan="5">${data.ClassName} ${data.ClassDist}km</td></tr>`;
    data.Competitor.sort((a, b) => {
      return a.Rank - b.Rank;
    });
    //console.log(data);
    for (var k = 0; k < data.Competitor.length; k++) {
      if (data.Competitor[k].Time) {
        /*console.log(
          data.Competitor[k].TimeBehind,
          Number.isInteger(data.Competitor[k].TimeBehind)
        );*/
        var club = mobile
          ? data.Competitor[k].ClubID
          : data.Competitor[k].ClubName;
        //console.log("mobile", data.Competitor[k]);
        html += `<tr class="competitor"><td>${data.Competitor[k].Order}</td>`;
        if (data.Competitor[k].SplitTimes)
          html += `<td><a class="competitor-link" href="#splits/class/${class_name}/competitor/${data.Competitor[k].StartNumber}">${data.Competitor[k].Family} ${data.Competitor[k].Given}</a></td>`;
        else
          html += `<td>${data.Competitor[k].Family} ${data.Competitor[k].Given}</td>`;
        html += `<td>${club}</td>`;
        html += `<td>${
          data.Competitor[k].Time ? data.Competitor[k].Time : ""
        }</td>`;
        html += `<td>${
          data.Competitor[k].TimeBehind
            ? Number.isInteger(data.Competitor[k].TimeBehind)
              ? "+" + data.Competitor[k].TimeBehind
              : data.Competitor[k].TimeBehind
            : ""
        }</td></tr>`;
      }
    }
  }

  html += `</table>`;

  $("#results").html(html);
}

function updateLiveList() {
  //console.log(resultsTable[0]);
  console.log("maali", livelist.length);
  if (livelist.length === 0)
    return $("#results").html("<p>Odotellaan kilpailijoita maaliin...</p>");
  // In case we are viewing results, return
  //if ($("#results").html() != '') return;

  //if (livelist.length == 200) livelist = [];

  var html =
    '<h2>Maali</h2><table id="results" class="table table-bordered table-sm table-striped">\n';
  html +=
    '<thead><tr><th scope="col">Kilpailija</th><th scope="col">Sarja</th><th scope="col">Tulos</th><th scope="col">Sija</th></tr></thead><tbody>';

  for (var i = 0; i < livelist.length; i++) {
    var rank = livelist[i].Races.Race.Rank;
    var result = livelist[i].Races.Race.Result;
    html +=
      result !== "00:00:00" && rank < 2
        ? '<tr class="table-success"><td>'
        : "<tr><td>";
    html +=
      livelist[i].Name.Family +
      " " +
      livelist[i].Name.Given +
      "</td><td>" +
      livelist[i].Races.Race.ClassId +
      "</td><td>";
    html += livelist[i].Races.Race.Result + "</td><td>";
    var status = livelist[i].Races.Race.Status;
    if ((status && status == "DQ") || livelist[i].Races.Race.Result == "DQ") {
      html += "Hylätty";
    } else if (status == "DNS") {
      html += "Ei läht.";
    } else {
      html += livelist[i].Races.Race.Rank + "</td></tr>";
    }
  }
  html += "</tbody></table> ";
  //console.log(html);

  $("#results").html(html);
}

function initWebSocket() {
  websocket = new WebSocket(wsUri, "echo-protocol");
  websocket.onopen = function (evt) {
    onOpen(evt);
  };
  websocket.onclose = function (evt) {
    onClose(evt);
  };
  websocket.onmessage = function (evt) {
    onMessage(evt);
  };
  websocket.onerror = function (evt) {
    onError(evt);
  };
}

function onOpen(evt) {
  $("#status").html(
    '<i class="fa fa-circle" style="color:#8fd19e; padding-right: 0.25em" title="Status: online"></i>'
  );
  //doSend("I am listening");
  console.log("CONNECTED");
  updateLiveList();
}

function onClose(evt) {
  console.log("DISCONNECTED");
  $("#status").html(
    '<i class="fa fa-circle" style="color:red; padding-right: 0.25em" title="Status: offline"></i>'
  );
  setTimeout(() => {
    initWebSocket();
  }, 2000);
}

function onMessage(evt) {
  //console.log(evt.data);
  var receivedData = JSON.parse(evt.data);
  if (Array.isArray(receivedData)) {
    //console.log(receivedData);
    receivedData.forEach((x) => {
      x = x.ResultRecord;
      if (
        x &&
        x.Participant &&
        x.Participant.Races.Race.Status &&
        x.Participant.Races.Race.ClassId
      ) {
        //console.log("adding", x.Participant)
        livelist.push(x.Participant);
      }
    });
  } else {
    console.log(evt.data);
    if (
      receivedData &&
      receivedData.Participant &&
      receivedData.Participant.Races.Race.Status &&
      receivedData.Participant.Races.Race.ClassId
    )
      livelist.unshift(receivedData.Participant);
  }

  updateLiveList();

  //websocket.close();
}

function onError(evt) {
  console.log(evt);
  $("#results").html(
    '<span style="color: red;">Ei saatu yhteyttä palvelimeen</span>'
  );
}

function doSend(message) {
  console.log("SENT: " + message);
  websocket.send(message);
}

function convertMinSecs(secs) {
  var mins = Math.floor(secs / 60);
  var secs = secs - mins * 60;
  if (mins === 0 && secs === 0) return "";
  secs = secs < 10 ? "0" + secs : secs;
  return "+" + mins + ":" + secs;
}

function calcSplits(val, i, arr) {
  //console.log(val.CTSecs, i, arr[i].CTSecs);
  if (i == 0) val.Split = val.CTSecs;
  else val.Split = val.CTSecs - arr[i - 1].CTSecs;
  var mins = Math.floor(val.Split / 60);
  var secs = val.Split - mins * 60;
  secs = secs < 10 ? "0" + secs : secs;
  val.Split = mins + ":" + secs;
  return val;
}

function splits_html(competitor, class_dist) {
  console.log(class_dist.replace(",", "."));
  class_dist = parseFloat(class_dist.replace(",", "."));
  var minutes = Math.floor(competitor.TSecs / class_dist / 60);
  var seconds = Math.floor(competitor.TSecs / class_dist - minutes * 60);
  var km_vauhti =
    minutes + ":" + (seconds < 10 ? "0" + seconds : seconds) + "min/km";
  var html = `<table class="table table-sm"><tr><td>Lähtöaika</td><td colspan="6" align="right">${competitor.StartTime}</td></tr>`;
  html += `<tr><td>Maali</td><td>${class_dist}km</td><td>${competitor.Time}</td><td><td>${competitor.TimeBehind}</td><td>${competitor.Rank}.</td><td align="right">${km_vauhti}</td></tr></table>`;
  html += '<table class="table table-sm">';
  html +=
    '<th class="text-right">Rasti</th><th class="text-right">Koodi</th><th class="text-right" colspan="3">Rastiväliajat<th>';
  var test = competitor.SplitTimes.Control.map(calcSplits);
  console.log(test);
  competitor.SplitTimes.Control.forEach((element) => {
    console.log(element);
    var splitdiff = convertMinSecs(element.SplitDiff);
    var controldiff = convertMinSecs(element.ControlDiff);
    html += '<tr><td align="right">' + element.ControlOrder + "</td>";
    html += '<td align="right">' + element.CCode + "</td>";
    html +=
      '<td align="right">' +
      element.ControlTime +
      '</td><td align="right">' +
      controldiff +
      "</td><td>" +
      element.ControlRank +
      "." +
      '</td><td align="right">' +
      element.Split +
      '</td><td align="right">' +
      splitdiff +
      "</td><td>" +
      element.SplitRank +
      "." +
      "</td></tr>";
  });
  return html;
}

function showStartList() {
  if (!results) {
    //console.log("updating start list");
    updateResults(false);
  }

  var html = "";

  //console.log(results.Event.EventClass);
  html = `<h4>${start_times_text}</h4><table class="table table-fit table-bordered table-sm stable-striped">\n`;
  for (var i = 0; i < results.Event.EventClass.length; i++) {
    html += `<tr class="table-secondary" style="font-weight:bold"><td colspan="4">${results.Event.EventClass[i].ClassName} ${results.Event.EventClass[i].ClassDist}km</td></tr>`;
    if (results.Event.EventClass[i].Competitor.length > 0) {
      var competitors = results;
      competitors.Event.EventClass[i].Competitor.sort((a, b) => {
        return a.StartTime < b.StartTime ? -1 : 1;
      });
      //console.log(competitors);
      for (
        var k = 0;
        k < competitors.Event.EventClass[i].Competitor.length;
        k++
      ) {
        html += `<tr class="competitor"><td>${competitors.Event.EventClass[i].Competitor[k].StartNumber}</td>`;
        html += `<td>${
          competitors.Event.EventClass[i].Competitor[k].StartTime
            ? competitors.Event.EventClass[i].Competitor[k].StartTime
            : ""
        }</td>`;
        html += `<td>${competitors.Event.EventClass[i].Competitor[k].Family} ${competitors.Event.EventClass[i].Competitor[k].Given}</td>`;
        html += `<td>${
          competitors.Event.EventClass[i].Competitor[k].ClubID
            ? competitors.Event.EventClass[i].Competitor[k].ClubID
            : ""
        }</td></tr>`;
      }
    }
  }
  html += `</table>`;

  $("#results").html(html);
}

window.addEventListener("load", init, false);
//window.onload = displayTime();
$(document).ready(function () {
  //console.log("doc ready");
  displayTime();
  updateResults(true);
  $("#classmenu").selectpicker();

  $("#results").on("click", ".competitor-link", (e) => {
    e.preventDefault();
    var url = $(e.target).attr("href");
    var path = url.split("/");
    var class_id = path[2];
    var start_nbr = path[4];
    var competitor = results.Event.EventClass.find((x) => {
      return x.ClassName == class_id;
    }).Competitor.find((y) => {
      return y.StartNumber == start_nbr;
    });

    var classDist = results.Event.EventClass.find((x) => {
      return x.ClassName == class_id;
    }).ClassDist;

    console.log(
      results.Event.EventClass.find((x) => {
        return x.ClassName == class_id;
      })
    );
    //var splits = competitor.SplitTimes;
    var person = competitor.Family + " " + competitor.Given;
    $(".modal_body").html("hello"); //splits_html(splits));
    $("#myModal").modal("show");
    $("#myModal")
      .find(".modal-title")
      .html("<h4>" + person + "</h4><h6>" + competitor.ClubName + "</h6>");
    $("#myModal").find(".modal-body").html(splits_html(competitor, classDist));
    //$("#classes").html(splits_html(competitor));
  });
  //  $('#classmenu').click((e))

  $(".nav-link").click((e) => {
    e.preventDefault();
    var url = $(e.target).attr("href");

    switch (url) {
      case "#maali":
        $("#results").html("");
        $(".navbar-collapse").collapse("hide");
        updateLiveList();
        break;
      case "#lahtoajat":
        $("#results").html("");
        $(".navbar-collapse").collapse("hide");
        showStartList();
        break;
      default:
        console.log("default url", url);
        break;
    }
  });

  $("#searchbar").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    //console.log(value);
    $("#results table tr.competitor").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  });

  $("#classmenu").change((event) => {
    $(".navbar-collapse").collapse("hide");
    var classname = $("#classmenu").val();
    $("#classmenu").prop("selectedIndex", 0);
    $("#classmenu").selectpicker("render");
    var class_results = "";
    classname = classname == "Näytä kaikki" ? undefined : classname;

    if (classname) {
      class_results = results.Event.EventClass.find((x) => {
        return x.ClassName == classname;
      });
    } else {
      class_results = results;
    }
    writeResults(class_results, classname); //console.log("menu event", classname, class_id);
  });
});

function displayTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  var html = h + ":" + m + ":" + s;
  $("#time").html(html); // + '<i class="fas fa-circle" style="color:purple"></i>);
  var t = setTimeout(displayTime, 500);
}
function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  } // add zero in front of numbers < 10
  return i;
}