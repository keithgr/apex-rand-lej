// client-side js
// run by the browser each time your view template referencing it is loaded

const pingInterval = 1000;
const spinInterval = 75;
const clientStatusTimeout = 900;

const cardColors = [
  "orange",
  "lightblue",
  "lightgreen"
];

const roomId = document.getElementById("bod").getAttribute("roomId");
const spinButton = document.getElementById("spin");
const spinText = document.getElementById("spinText");
const legendToggle = document.getElementById("legend-toggle");
const loadButton = document.getElementById("load");
const saveButton = document.getElementById("save");

const slots = [
  document.getElementById("slot0"),
  document.getElementById("slot1"),
  document.getElementById("slot2")
];

const playerNames = [
  "player_won",
  "player_too",
  "player_tree"
]

let roomData = {
  version: 0
};

function showLegendBanner(slotIndex, legendId, isConfirmed=false) {
  const slot = slots[slotIndex];
  const legend = roomData.legendDataList[legendId];
  const cardColor = cardColors[slotIndex];
  slot.innerHTML = `
    <div class="card" width=115 height=250 style="${ isConfirmed ? `border: solid thick ${cardColor}; box-shadow: 0 0 10px ${cardColor};` : 'border: thick solid gray' }">
      <div class="kard legend-name">
        <strong>${legend.name}</strong>
      </div>
      <img class="legend-pic" height=180 src="${legend.image}">
    </div>
    <h6 class="player-name">${playerNames[slotIndex]}</h6>
  `;
}

function showRandomLegendBanner(slotIndex) {
  const r = Math.floor(roomData.legendDataList.length * Math.random());
  showLegendBanner(slotIndex, r);
}

function isSpinning(slotIndex) {
  const roomDataSnapshot = roomData;
  const now = roomData.time;
  return now < roomDataSnapshot.spinTimes[slotIndex];
}

function renderSpinningStatus() {
  spinButton.setAttribute("disabled", "");
  spinButton.style.backgroundColor = "lightgray";
  spinText.style.color = "gray";
  spinText.innerHTML = "Spinning...";
}

function renderNonSpinningStatus() {
  spinButton.removeAttribute("disabled");
  spinButton.style.backgroundColor = "blue";
  spinText.style.color = "white";
  spinText.innerHTML = "Spin";
}

function spinUntilTime(slotIndex) {
  if (isSpinning(slotIndex)) {
    if (slotIndex == 2) {
      renderSpinningStatus();
    }
    setTimeout(() => {
      showRandomLegendBanner(slotIndex);
      spinUntilTime(slotIndex);
    }, spinInterval);
  } else {
    if (slotIndex == 2) {
      renderNonSpinningStatus();
    }
    const roomDataSnapshot = roomData;
    const legendId = roomDataSnapshot.meta[slotIndex];
    setTimeout(() => {
      showLegendBanner(slotIndex, legendId, true);
    }, spinInterval);
  }
}

function displayLastSpin() {
  const roomDataSnapshot = roomData;
  if (!roomDataSnapshot.meta) {
    console.log("What's the meta?");
    return;
  }
  const legendIds = [
    roomDataSnapshot.meta[0],
    roomDataSnapshot.meta[1],
    roomDataSnapshot.meta[2]
  ];
  showLegendBanner(0, legendIds[0], true);
  showLegendBanner(1, legendIds[1], true);
  showLegendBanner(2, legendIds[2], true);
}

function renderRoomData(data) {
  const roomDataSnapshot = roomData;
  console.log(roomDataSnapshot);
  spinUntilTime(0);
  spinUntilTime(1);
  spinUntilTime(2);
}

function getStatus() {
  try {
    const roomDataSnapshot = roomData;
    const xhttp = new XMLHttpRequest();
    xhttp.timeout = clientStatusTimeout;
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          // Typical action to be performed when the document is ready:
          const response = JSON.parse(xhttp.responseText);
          roomData = response;
          const time = response.time;
          const currentVersion = roomDataSnapshot.version;
          const newVersion = response.version;
          if (
            (!response.spinTimes || time < response.spinTimes[2]) &&
            (currentVersion !== newVersion)
          ) {
            try {
              renderRoomData();
            }
            catch (debug) {
              throw `${debug} : ${JSON.stringify(response)} : ${JSON.stringify(roomData)} : ${JSON.stringify(roomDataSnapshot)}`;
            }
          }
        } else {
          console.error('Server request was buggus maximus');
        }
      }
    };
    xhttp.open("GET", `/api/${roomId}`);
    xhttp.send();
  } catch (bug) {
    console.error("You've got a bug", bug);
  } finally {
    setTimeout(() => {
      getStatus();
    }, pingInterval);
  }
}

function submitSpin() {
  const xhttp = new XMLHttpRequest();
  xhttp.open("POST", `/api/spin/${roomId}`);
  xhttp.send();
}

function loadLegendSettings() {
  
}

function saveLegendSettings() {
  const toggleColumns = legendToggle.getElementsByClassName('toggle-column');
  const requestBody = {};
  for (let p = 0; p < toggleColumns.length; p++) {
    const toggleColumn = toggleColumns[p];
    const toggleOptions = toggleColumn.getElementsByClassName('toggle-option');
    requestBody[p] = {};
    for (let l = 0; l < toggleOptions.length; l++) {
      const toggleInput = document.getElementById(`p${p}l${l}`);
      requestBody[p][l] = toggleInput.checked;
    }
  }
  
  const request = JSON.stringify(requestBody);
  
  const xhttp = new XMLHttpRequest();
  xhttp.open("POST", `/api/settings/${roomId}`);
  xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhttp.send(request);
}



getStatus();
try {
  setTimeout(
    () => {
      displayLastSpin();  
    },
    1000
  );
}
catch (nah) {
  console.log("Could not display result of last spin");
}

spinButton.addEventListener("click", submitSpin);
loadButton.addEventListener("click", loadLegendSettings);
saveButton.addEventListener("click", saveLegendSettings);
