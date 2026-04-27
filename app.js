var scoutingMode = false;
var teams = [
  { players: {} },
  { players: {} }
];
var actionHistory = [];
var STORAGE_KEY = "volleyballOpponentTracker_v1";

function saveState() {
  try {
    var state = {
      scoutingMode: scoutingMode,
      teams: teams,
      actionHistory: actionHistory,
      teamNames: [
        document.getElementById("teamName0") ? document.getElementById("teamName0").value : "",
        document.getElementById("teamName1") ? document.getElementById("teamName1").value : ""
      ]
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.log("Save failed", e);
  }
}

function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    var state = JSON.parse(raw);

    if (typeof state.scoutingMode === "boolean") {
      scoutingMode = state.scoutingMode;
    }

    if (state.teams && state.teams.length >= 2) {
      teams = state.teams;
    }

    if (state.actionHistory && Array.isArray(state.actionHistory)) {
      actionHistory = state.actionHistory;
    }

    document.getElementById("scoutingToggle").checked = scoutingMode;

    if (state.teamNames) {
      document.getElementById("teamName0").value = state.teamNames[0] || "";
      document.getElementById("teamName1").value = state.teamNames[1] || "";
    }
  } catch (e) {
    console.log("Load failed", e);
  }
}

function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.log("Clear failed", e);
  }
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, function(m) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m];
  });
}

function safeFileName(text) {
  return (text || "scouting").trim().replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "") || "scouting";
}

function todayStamp() {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function visibleTeamCount() {
  return scoutingMode ? 2 : 1;
}

function sortPlayers(teamIndex) {
  var players = teams[teamIndex].players;
  return Object.keys(players).sort(function(a, b) {
    var aLib = players[a].isLibero ? 0 : 1;
    var bLib = players[b].isLibero ? 0 : 1;
    if (aLib !== bLib) return aLib - bLib;

    var aNum = parseInt(a, 10);
    var bNum = parseInt(b, 10);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;

    return String(a).localeCompare(String(b), undefined, { numeric: true });
  });
}

function addPlayer(teamIndex, isLibero) {
  var input = document.getElementById("playerInput" + teamIndex);
  var num = input.value.trim();
  if (!num) return;

  if (teams[teamIndex].players[num]) {
    teams[teamIndex].players[num].isLibero = isLibero;
  } else {
    teams[teamIndex].players[num] = { isLibero: isLibero, scores: [] };
  }

  input.value = "";
  renderTeam(teamIndex);
  saveState();
}

function record(teamIndex, player, value) {
  teams[teamIndex].players[player].scores.push(value);
  actionHistory.push({ teamIndex: teamIndex, player: player, value: value });
  renderTeam(teamIndex);
  saveState();
}

function undoLast() {
  if (actionHistory.length === 0) return;
  var last = actionHistory.pop();

  if (teams[last.teamIndex] && teams[last.teamIndex].players[last.player]) {
    teams[last.teamIndex].players[last.player].scores.pop();
  }

  renderTeam(last.teamIndex);
  saveState();
}

function avg(arr) {
  if (arr.length === 0) return "0.00";
  return (arr.reduce(function(a, b) { return a + b; }, 0) / arr.length).toFixed(2);
}

function teamAvg(teamIndex) {
  var total = 0;
  var count = 0;
  var players = teams[teamIndex].players;

  Object.keys(players).forEach(function(p) {
    players[p].scores.forEach(function(v) {
      total += v;
      count++;
    });
  });

  if (count === 0) return "0.00";
  return (total / count).toFixed(2);
}

function getLowestAverageRanks(teamIndex) {
  var players = teams[teamIndex].players;

  return Object.keys(players)
    .filter(function(playerKey) {
      return players[playerKey].scores.length > 0;
    })
    .map(function(playerKey) {
      return {
        playerKey: playerKey,
        average: parseFloat(avg(players[playerKey].scores))
      };
    })
    .sort(function(a, b) {
      if (a.average !== b.average) return a.average - b.average;

      var aNum = parseInt(a.playerKey, 10);
      var bNum = parseInt(b.playerKey, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;

      return String(a.playerKey).localeCompare(String(b.playerKey), undefined, { numeric: true });
    })
    .slice(0, 3);
}

function renderTeam(teamIndex) {
  document.getElementById("teamAvg" + teamIndex).textContent = teamAvg(teamIndex);

  var grid = document.getElementById("playerGrid" + teamIndex);
  grid.innerHTML = "";
  var lowestAverageRanks = getLowestAverageRanks(teamIndex);
  var lowestAverageClassMap = {};

  lowestAverageRanks.forEach(function(entry, index) {
    lowestAverageClassMap[entry.playerKey] = "target" + (index + 1);
  });

  sortPlayers(teamIndex).forEach(function(p) {
    var player = teams[teamIndex].players[p];
    var avgClass = lowestAverageClassMap[p] ? "avgValue " + lowestAverageClassMap[p] : "avgValue";

    var row = document.createElement("div");
    row.className = "playerRow" + (player.isLibero ? " libero" : "");

    var playerInfo = document.createElement("div");
    playerInfo.className = "playerInfo";
    playerInfo.innerHTML =
      "<div class='jersey'>#" + escapeHTML(p) + "</div>" +
      (player.isLibero ? "<div class='liberoLabel'>LIB</div>" : "") +
      "<div class='avg'>Avg<br><span class='" + avgClass + "'>" + avg(player.scores) + "</span></div>";

    var scoreButtons = document.createElement("div");
    scoreButtons.className = "scoreButtons";

    [0, 1, 2, 3].forEach(function(v) {
      var b = document.createElement("button");
      b.className = "scoreBtn";
      b.textContent = v;
      b.addEventListener("click", function() {
        record(teamIndex, p, v);
      });
      scoreButtons.appendChild(b);
    });

    var history = document.createElement("div");
    history.className = "history";
    history.innerHTML = "<span class='historyLabel'>Hist: </span>" +
      (player.scores.length ? player.scores.join(", ") : "—");

    row.appendChild(playerInfo);
    row.appendChild(scoreButtons);
    row.appendChild(history);
    grid.appendChild(row);
  });
}

function renderAll() {
  document.getElementById("team1").style.display = scoutingMode ? "block" : "none";
  document.getElementById("team0Label").textContent = scoutingMode ? "Team 1" : "Team";
  renderTeam(0);
  renderTeam(1);
}

function makePdfLines() {
  var lines = [
    "Volleyball Opponent Tracker",
    "Date: " + todayStamp(),
    "Scouting mode: " + (scoutingMode ? "2 teams" : "1 team"),
    ""
  ];

  for (var i = 0; i < visibleTeamCount(); i++) {
    var name = document.getElementById("teamName" + i).value.trim() || (i === 0 ? "Team 1" : "Team 2");
    lines.push((i === 0 ? "Team 1: " : "Team 2: ") + name);
    lines.push("Team average: " + teamAvg(i));

    var targets = getLowestAverageRanks(i);
    if (targets.length) {
      lines.push("Best serve targets:");
      targets.forEach(function(entry, index) {
        lines.push("  " + (index + 1) + ". #" + entry.playerKey + " - " + entry.average.toFixed(2));
      });
    }

    lines.push("");
    lines.push("Player        Role        Avg     History");
    lines.push("-----------------------------------------------");

    sortPlayers(i).forEach(function(p) {
      var player = teams[i].players[p];
      var role = player.isLibero ? "Libero" : "Player";
      lines.push(
        padRight("#" + p, 13) +
        padRight(role, 12) +
        padRight(avg(player.scores), 8) +
        (player.scores.length ? player.scores.join(", ") : "-")
      );
    });

    lines.push("");
  }

  return lines;
}

function padRight(text, width) {
  text = String(text);
  while (text.length < width) text += " ";
  return text;
}

function pdfEscape(text) {
  return String(text)
    .replace(/[^\x20-\x7E]/g, "-")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildPdfBlob(lines) {
  var pageWidth = 612;
  var pageHeight = 792;
  var margin = 46;
  var lineHeight = 16;
  var linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
  var pages = [];

  for (var i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  if (!pages.length) pages.push(["No scouting data yet."]);

  var objects = [];
  var pageRefs = [];
  var fontObjectNumber = 3 + (pages.length * 2);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [" + pages.map(function(_, index) {
    return (3 + index * 2) + " 0 R";
  }).join(" ") + "] /Count " + pages.length + " >>";

  pages.forEach(function(pageLines, index) {
    var pageObjectNumber = 3 + index * 2;
    var contentObjectNumber = pageObjectNumber + 1;
    pageRefs.push(pageObjectNumber + " 0 R");

    var content = "BT\n/F1 11 Tf\n" + margin + " " + (pageHeight - margin) + " Td\n";
    pageLines.forEach(function(line, lineIndex) {
      if (lineIndex > 0) content += "0 -" + lineHeight + " Td\n";
      content += "(" + pdfEscape(line) + ") Tj\n";
    });
    content += "ET";

    objects[pageObjectNumber] =
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + pageWidth + " " + pageHeight + "] " +
      "/Resources << /Font << /F1 " + fontObjectNumber + " 0 R >> >> " +
      "/Contents " + contentObjectNumber + " 0 R >>";
    objects[contentObjectNumber] =
      "<< /Length " + content.length + " >>\nstream\n" + content + "\nendstream";
  });

  objects[fontObjectNumber] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  var pdf = "%PDF-1.4\n";
  var offsets = [0];
  for (var objectNumber = 1; objectNumber < objects.length; objectNumber++) {
    if (!objects[objectNumber]) continue;
    offsets[objectNumber] = pdf.length;
    pdf += objectNumber + " 0 obj\n" + objects[objectNumber] + "\nendobj\n";
  }

  var xrefOffset = pdf.length;
  pdf += "xref\n0 " + objects.length + "\n";
  pdf += "0000000000 65535 f \n";
  for (var x = 1; x < objects.length; x++) {
    pdf += String(offsets[x]).padStart(10, "0") + " 00000 n \n";
  }
  pdf += "trailer\n<< /Size " + objects.length + " /Root 1 0 R >>\n";
  pdf += "startxref\n" + xrefOffset + "\n%%EOF";

  return new Blob([pdf], { type: "application/pdf" });
}

function getReportBaseName() {
  var n0 = document.getElementById("teamName0").value.trim();
  var n1 = document.getElementById("teamName1").value.trim();
  return scoutingMode ? safeFileName(n0 + "_vs_" + n1) : safeFileName(n0);
}

function downloadBlob(blob, filename) {
  var a = document.createElement("a");
  var url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function() {
    URL.revokeObjectURL(url);
  }, 1000);
}

function exportPDF() {
  var filename = getReportBaseName() + "_serve_receive_" + todayStamp() + ".pdf";
  var blob = buildPdfBlob(makePdfLines());
  var file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
    navigator.share({
      files: [file],
      title: "Volleyball scouting report"
    }).catch(function(err) {
      if (!err || err.name !== "AbortError") downloadBlob(blob, filename);
    });
    return;
  }

  downloadBlob(blob, filename);
}

function resetAll() {
  if (!confirm("Reset all teams, players, and scores?")) return;

  teams = [
    { players: {} },
    { players: {} }
  ];
  actionHistory = [];

  document.getElementById("teamName0").value = "";
  document.getElementById("teamName1").value = "";
  clearSavedState();
  renderAll();
}

document.getElementById("scoutingToggle").addEventListener("change", function() {
  scoutingMode = this.checked;
  renderAll();
  saveState();
});

document.getElementById("addPlayer0").addEventListener("click", function() { addPlayer(0, false); });
document.getElementById("addLibero0").addEventListener("click", function() { addPlayer(0, true); });
document.getElementById("addPlayer1").addEventListener("click", function() { addPlayer(1, false); });
document.getElementById("addLibero1").addEventListener("click", function() { addPlayer(1, true); });

document.getElementById("teamName0").addEventListener("input", saveState);
document.getElementById("teamName1").addEventListener("input", saveState);

document.getElementById("playerInput0").addEventListener("keydown", function(e) {
  if (e.key === "Enter") addPlayer(0, false);
});

document.getElementById("playerInput1").addEventListener("keydown", function(e) {
  if (e.key === "Enter") addPlayer(1, false);
});

document.getElementById("undoBtn").addEventListener("click", undoLast);
document.getElementById("printBtn").addEventListener("click", exportPDF);
document.getElementById("resetBtn").addEventListener("click", resetAll);

loadState();
renderAll();
