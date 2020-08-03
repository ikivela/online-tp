var wsUri = "ws://luna.chydenius.fi/ws/";
var baseUrl = "http://luna.chydenius.fi/live";
////////////////////////////////////////////
// For debugging
//var wsUri = "ws://192.168.0.107:8080";
//var baseUrl = "http://192.168.0.107:8080";
var state = "finish_line";
var livelist = [];
var results = {};
var startlist = "";
var start_times_text = "LÃ¤htÃ¶ajat";
var results_text = "Tulokset";

function init() {
  initWebSocket();
  console.log("init");
  displayTime();
}

function updateStartlist() {
  // 1. Create a new XMLHttpRequest object
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    // 2. Configure it: GET-request for the URL /article/.../load
    xhr.open("GET", baseUrl + "/startlist");

    // 3. Send the request over the network
    xhr.send();

    // 4. This will be called after the response is received
    xhr.onload = function () {
      if (xhr.status != 200) {
        // analyze HTTP status of the response
        console.log(`Error ${xhr.status}: ${xhr.statusText}`); // e.g. 404: Not Found
        reject(xhr.status);
      } else {
        // show the result

        resolve(JSON.parse(xhr.response));
      }
    };
  });
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
        printResults(results);
      }
    }
  };
}

function writeClassMenu(data) {
  var menu = "<option>NÃ¤ytÃ¤ kaikki</option>";
  var menus = "";
  for (var i = 0; i < data.Event.EventClass.length; i++) {
    menus += "<option>" + data.Event.EventClass[i].ClassName + "</option>\n";
  }
  $("#classmenu").html(menu + menus);
  $("#classmenu").selectpicker("refresh");
  $("#splitmenu").html(menus);
  $("#splitmenu").selectpicker("refresh");
}

function printResults(data, class_name) {
  //selectpicker('val', ["mustard", "relish"]);//menus); //data.Event.EventClass[i].ClassName);

  var html = "";
  var mobile = window.matchMedia("(max-width: 767px)").matches ? true : false;

  //console.log(data.Event.EventClass);
  html = `<h4>${results_text}</h4><table class="table table-fit table-bordered table-sm stable-striped">\n`;
  if (!class_name) {
    for (var i = 0; i < data.Event.EventClass.length; i++) {
      if (data.Event.EventClass[i].Competitor.length > 0)
        data.Event.EventClass[i].Competitor.sort((a, b) => {
          return a.Rank - b.Rank;
        });

      if (!Array.isArray(data.Event.EventClass[i].Competitor)) {
        data.Event.EventClass[i].Competitor = [
          data.Event.EventClass[i].Competitor,
        ];
      }

      if (
        data.Event.EventClass[i].Competitor.filter((x) => {
          return x;
        }).length > 0
      ) {
        html += `<tr class="table-secondary" style="font-weight:bold"><td colspan="5">${data.Event.EventClass[i].ClassName} ${data.Event.EventClass[i].ClassDist}km</td></tr>`;
        for (var k = 0; k < data.Event.EventClass[i].Competitor.length; k++) {
          var club = mobile
            ? data.Event.EventClass[i].Competitor[k].ClubID
            : data.Event.EventClass[i].Competitor[k].ClubName;
          if (data.Event.EventClass[i].Competitor[k].Time) {
            html += `<tr class="competitor"><td>${
              data.Event.EventClass[i].Competitor[k].Rank
                ? data.Event.EventClass[i].Competitor[k].Rank
                : ""
            }</td>`;
            if (
              data.Event.EventClass[i].Competitor[k].SplitTimes &&
              ["DQ", "DNS", "DNF"].indexOf(
                data.Event.EventClass[i].Competitor[k].Status
              ) < 0
            )
              html += `<td><a class="competitor-link" href="#splits/class/${data.Event.EventClass[i].ClassName}/competitor/${data.Event.EventClass[i].Competitor[k].StartNumber}">${data.Event.EventClass[i].Competitor[k].Family} ${data.Event.EventClass[i].Competitor[k].Given}</a></td>`;
            else
              html += `<td>${data.Event.EventClass[i].Competitor[k].Given} ${data.Event.EventClass[i].Competitor[k].Family} </td>`;
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
      } else {
        html += "<tr><td>Ei tuloksia</td></tr>";
      }
    }
  } else {
    //console.log("mobile", mobile);
    //data.Competitor.sort((a, b) => a.Rank));
    html += `<tr class="table-secondary" style="font-weight:bold"><td colspan="5">${data.ClassName} ${data.ClassDist}km</td></tr>`;
    if (data.Competitor.length > 0) {
      data.Competitor.sort((a, b) => {
        return a.Rank - b.Rank;
      });
    }
    if (!Array.isArray(data.Competitor)) {
      data.Competitor = [data.Competitor];
    }
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
        html += `<tr class="competitor"><td>${
          data.Competitor[k].Rank ? data.Competitor[k].Rank : ""
        }</td>`;
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
  //console.log("livelist", livelist);
  if (livelist.length === 0)
    return $("#results").html("<p>Odotellaan kilpailijoita maaliin...</p>");
  // In case we are viewing results, return
  //if ($("#results").html() != '') return;

  //if (livelist.length == 200) livelist = [];

  var html =
    '<h4>Maali</h4><table id="results" class="table table-bordered table-sm table-striped">\n';
  html +=
    '<thead><tr><th scope="col">Kilpailija</th><th scope="col">Sarja</th><th scope="col">Tulos</th><th scope="col">Sija</th></tr></thead><tbody>';

  for (var i = 0; i < livelist.length; i++) {
    var rank = livelist[i].Races.Race.Rank;
    var result = livelist[i].Races.Race.Result;
    var person = results.Event.EventClass.find((x) => {
      return (x.ClassName = livelist[i].Races.Race.ClassId);
    }).Competitor.find((x) => {
      return (
        x.Family == livelist[i].Name.Family && x.Given == livelist[i].Name.Given
      );
    });
    console.log(i, livelist[i].Name.Family, person);
    var split_html = undefined;
    if (person && person.SplitTimes)
      split_html = `<a class="competitor-link" href="#splits/class/${person.ClassName}/competitor/${person.StartNumber}">${person.Family} ${person.Given}</a><td>${person.ClassName}</td><td>`;
    html +=
      result !== "00:00:00" && rank < 2
        ? '<tr class="table-success"><td>'
        : "<tr><td>";
    html += split_html
      ? split_html
      : livelist[i].Name.Family +
        " " +
        livelist[i].Name.Given +
        "</td><td>" +
        livelist[i].Races.Race.ClassId +
        "</td><td>";
    var status = livelist[i].Races.Race.Status;
    if ((status && status == "DQ") || livelist[i].Races.Race.Result == "DQ")
      status = "DQ";
    html +=
      `${
        livelist[i].Races.Race.Result !== "00:00:00"
          ? livelist[i].Races.Race.Result
          : status
      }` + "</td><td>";
    if (livelist[i].Races.Race.Result !== "00:00:00") {
      html += livelist[i].Races.Race.Rank + "</td></tr>";
    } else {
      html += "</td><tr>";
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
      if (x && x.ResultRecord) {
        x = x.ResultRecord;
        if (
          x &&
          x.Participant &&
          x.Participant.Races.Race.Status &&
          x.Participant.Races.Race.ClassId
        ) {
          //console.log("adding", x.Participant);
          livelist.push(x.Participant);
        }
      }
    });
    livelist.reverse();
  } else {
    receivedData = receivedData.ResultRecord;
    //console.log(receivedData);
    if (
      receivedData &&
      receivedData.Participant &&
      receivedData.Participant.Races.Race.Status &&
      receivedData.Participant.Races.Race.ClassId
    ) {
      livelist.unshift(receivedData.Participant);
      //console.log("livelist updated");
    }
  }

  if (state == "finish_line") {
    $("#message").text(
      "Sivu pÃ¤ivittyy automaattisesti, viimeisin maaliintulija ylimpÃ¤nÃ¤"
    );
    updateLiveList();
  }

  //websocket.close();
}

function onError(evt) {
  console.log(evt);
  /*$("#results").html(
    '<span style="color: red;">Ei saatu yhteyttÃ¤ palvelimeen</span>'
  );*/
}

function doSend(message) {
  console.log("SENT: " + message);
  websocket.send(message);
}

function convertMinSecs(secs, plus) {
  var mins = Math.floor(secs / 60);
  if (isNaN(mins)) return "";
  var secs = secs - mins * 60;
  if (mins === 0 && secs === 0) return "";
  secs = secs < 10 ? "0" + secs : secs;
  return plus ? mins + ":" + secs : "+" + mins + ":" + secs;
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
  //console.log(class_dist.replace(",", "."));
  class_dist = parseFloat(class_dist.replace(",", "."));
  var minutes = Math.floor(competitor.TSecs / class_dist / 60);
  var seconds = Math.floor(competitor.TSecs / class_dist - minutes * 60);
  var km_vauhti =
    minutes + ":" + (seconds < 10 ? "0" + seconds : seconds) + "min/km";
  var html = `<table class="table table-sm"><tr><td>LÃ¤htÃ¶aika</td><td colspan="6" align="right">${competitor.StartTime}</td></tr>`;
  html += `<tr><td>Maali</td><td>${class_dist}km</td><td>${competitor.Time}</td><td><td>${competitor.TimeBehind}</td><td>${competitor.Rank}.</td><td align="right">${km_vauhti}</td></tr></table>`;
  html += '<table class="table table-sm">';
  html +=
    '<th class="text-right">Rasti</th><th class="text-right">Koodi</th><th class="text-right" colspan="3">Tilanne rastilla</th><th class="text-right" colspan="3">RastivÃ¤liajat<th>';
  competitor.SplitTimes.Control.map(calcSplits);
  //console.log(test);
  competitor.SplitTimes.Control.forEach((element) => {
    //console.log(element);
    var splitdiff = convertMinSecs(element.SplitDiff);
    var controldiff = convertMinSecs(element.ControlDiff);
    html += '<tr><td align="right">' + element.ControlOrder + "</td>";
    html += '<td align="right">' + element.CCode + "</td>";
    html +=
      '<td align="right">' +
      element.ControlTime +
      '</td><td align="right">' +
      controldiff +
      '</td><td align="right">' +
      element.ControlRank +
      "." +
      '</td><td align="right">' +
      element.Split +
      '</td><td align="right">' +
      splitdiff +
      '</td><td align="right">' +
      element.SplitRank +
      "." +
      "</td></tr>";
  });
  return html;
}

function printStartList() {
  var mobile = window.matchMedia("(max-width: 767px)").matches ? true : false;
  var html = "";

  //console.log(results.Event.EventClass);
  html = `<h4>${start_times_text}</h4><table class="table table-fit table-bordered table-sm stable-striped">\n`;
  for (var i = 0; i < startlist.Event.EventClass.length; i++) {
    html += `<tr class="table-secondary" style="font-weight:bold"><td colspan="4">${
      startlist.Event.EventClass[i].ClassName
    } ${
      startlist.Event.EventClass[i].ClassDist
        ? startlist.Event.EventClass[i].ClassDist + "km"
        : ""
    }</td></tr>`;

    //if (results.Event.EventClass[i].Competitor.length > 0) {
    var competitors = startlist;
    if (!Array.isArray(competitors.Event.EventClass[i].Competitor)) {
      competitors.Event.EventClass[i].Competitor = [
        competitors.Event.EventClass[i].Competitor,
      ];
    }

    competitors.Event.EventClass[i].Competitor.sort((a, b) => {
      return a.StartTime < b.StartTime ? -1 : 1;
    });
    for (
      var k = 0;
      k < competitors.Event.EventClass[i].Competitor.length;
      k++
    ) {
      var club = mobile
        ? competitors.Event.EventClass[i].Competitor[k].ClubID
        : competitors.Event.EventClass[i].Competitor[k].ClubName;

      html += `<tr class="competitor"><td>${competitors.Event.EventClass[i].Competitor[k].StartNumber}</td>`;
      html += `<td>${
        competitors.Event.EventClass[i].Competitor[k].StartTime
          ? competitors.Event.EventClass[i].Competitor[k].StartTime
          : ""
      }</td>`;
      html += `<td>${competitors.Event.EventClass[i].Competitor[k].Family} ${competitors.Event.EventClass[i].Competitor[k].Given}</td>`;
      html += `<td>${club ? club : ""}</td></tr>`;
    }
    //}
  }
  html += `</table>`;

  $("#results").html(html);
}

async function showStartList() {
  if (startlist.length === 0) {
    console.log("updating start list");
    updateStartlist().then((data) => {
      startlist = data;
      printStartList();
    });
  } else {
    printStartList();
  }
}

function showSplits(splitclass) {
  //data.Competitor.sort((a, b) => a.Rank));
  var data = results.Event.EventClass.find((x) => {
    return x.ClassName == splitclass;
  });

  if (!Array.isArray(data.Competitor)) {
    data.Competitor = [data.Competitor];
  }
  if (data.Competitor.length > 0) {
    data.Competitor.sort((a, b) => {
      return a.Rank - b.Rank;
    });
  }
  // If the 1. competitor does not have splits, then return
  if (!data.Competitor[0].SplitTimes) {
    return $("#results").html("<p>Ei rastivÃ¤liaikoja</p>");
  }

  var mobile = window.matchMedia("(max-width: 767px)").matches ? true : false;
  var control_length = data.Competitor[0].SplitTimes.Control.length;

  var html = `<h4>${data.ClassName} ${data.ClassDist}km rastivÃ¤liajat</h4>`;
  html += `<div class="table-responsive"><table class="table">`;
  html += `<thead><tr><th colspan="3"></th>`;
  for (let i of data.Competitor[0].SplitTimes.Control) {
    html += `<th class="text-right">${i.ControlOrder}.(${i.CCode})</th>`;
  }
  html += "</tr></thead>";

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
      html += `<tr class="competitor"><td>${
        data.Competitor[k].Rank ? data.Competitor[k].Rank : ""
      }</td>`;
      html += `<td class="sticky">${data.Competitor[k].Family} ${data.Competitor[k].Given}</td>`;
      html += `<td>${club}</td>`;

      if (data.Competitor[k].SplitTimes) {
        var split_row = "";
        data.Competitor[k].SplitTimes.Control.forEach((x) => {
          split_row += `<td align="right" class="split">${
            x.ControlTime +
            "&nbsp;(" +
            x.ControlRank +
            ")<br />" +
            convertMinSecs(x.Split, true) +
            "&nbsp;(" +
            (x.SplitRank ? x.SplitRank : "") +
            ")"
          }</td>`;
        });
        html += split_row;
      } else {
        html += "<td>no splits</td>";
      }
      html += "</tr>";
    }
  }
  html += "</table></div>";
  $("#results").html(html);
}

window.addEventListener("load", init, false);
//window.onload = displayTime();

$(document).ready(function () {
  /*var url_path = window.location.pathname;
  console.log(url_path);
  if (url_path == "/update");
  {
    state = "update";
    console.log("lets update");
    var str =
      '<div class="input-group"><div class="input-group-prepend"> \
    <span class="input-group-text" id="inputGroupFileAddon01">Update tulokset.xml</span> \
  </div> \
  <div class="custom-file"> \
    <input type="file" class="custom-file-input" id="inputGroupFile01" \
      aria-describedby="inputGroupFileAddon01"> \
    <label class="custom-file-label" for="inputGroupFile01">Choose file</label> \
  </div> \
  <a id="file_upload" class="btn btn-primary" href="#submit" role="button">Update</a>\
  </div>';
    $("#results").html(str);
  }

  $("#file_upload").on("click", (e) => {
    console.log("update xml");
  });
  */
  displayTime();
  updateResults(true);
  $("#classmenu").selectpicker();
  $("#splitmenu").selectpicker();

  $("#results").on("click", ".competitor-link", (e) => {
    state = "splits";
    $("#message").text("");
    e.preventDefault();
    var url = $(e.target).attr("href");
    var path = url.split("/");
    var class_id = path[2];
    var start_nbr = path[4];
    if (!Array.isArray(results.Event.EventClass))
      results.Event.EventClass = [results.Event.EventClass];

    var competitor = results.Event.EventClass.find((x) => {
      //console.log(class_id, x);
      return x.ClassName == class_id;
    }).Competitor.find((y) => {
      return y.StartNumber == start_nbr;
    });

    var classDist = results.Event.EventClass.find((x) => {
      return x.ClassName == class_id;
    }).ClassDist;

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
    $(".navbar-collapse").collapse("hide");
    switch (url) {
      case "#maali":
        state = "finish_line";
        $("#message").text(
          "Sivu pÃ¤ivittyy automaattisesti, viimeisin maaliintulija ylimpÃ¤nÃ¤"
        );
        $("#results").html("");
        updateLiveList();
        break;
      case "#lahtoajat":
        state = "start_times";
        $("#message").text("");
        $("#results").html();
        showStartList();
        break;
      case "#valiajat":
        state = "splits";
        $("#message").text("");
        showSplits();
        break;
      default:
        console.log("default url", url);
        break;
    }
  });

  $("#searchbar").on("keyup", function (e) {
    e.preventDefault();
    var value = $(this).val().toLowerCase();
    //console.log(value);
    $("#results table tr.competitor").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  });

  $("#splitmenu").change((event) => {
    state = "splits";
    $("#message").text("");
    $(".navbar-collapse").collapse("hide");
    var splitclass = $("#splitmenu").val();
    $("#splitmenu").prop("selectedIndex", 0);
    $("#splitmenu").selectpicker("render");
    if (splitclass) {
      splitclass = results.Event.EventClass.find((x) => {
        return x.ClassName == splitclass;
      });
      if (splitclass) {
        showSplits(splitclass.ClassName);
      }
    }
  });

  $("#classmenu").change((event) => {
    state = "results";
    $("#message").text("");
    $(".navbar-collapse").collapse("hide");
    var classname = $("#classmenu").val();
    $("#classmenu").prop("selectedIndex", 0);
    $("#classmenu").selectpicker("render");
    var class_results = "";
    classname = classname == "NÃ¤ytÃ¤ kaikki" ? undefined : classname;

    if (classname) {
      class_results = results.Event.EventClass.find((x) => {
        return x.ClassName == classname;
      });
    } else {
      class_results = results;
    }
    printResults(class_results, classname); //console.log("menu event", classname, class_id);
  });

  setInterval(() => {
    updateResults(true);
  }, 30000);
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
