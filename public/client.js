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
    <div class="card" width=115 height=250 style="${ isConfirmed ? `border: solid thick ${cardColor}; box-shadow: 0 0 10px ${cardColor};` : 'border: thick dashed gray' }">
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
    renderNonSpinningStatus();
    const roomDataSnapshot = roomData;
    const legendId = roomDataSnapshot.meta[slotIndex];
    setTimeout(() => {
      showLegendBanner(slotIndex, legendId, true);
    }, spinInterval);
  }
}

function displayLastSpin() {
  const roomDataSnapshot = roomData;
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
  spinUntilTime(0);
  spinUntilTime(1);
  spinUntilTime(2);
}

function getStatus() {
  try {
    const roomDataSnapshot = roomData;
    var xhttp = new XMLHttpRequest();
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
            renderRoomData();
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
  const roomDataSnapshot = roomData;
  console.log(roomDataSnapshot);
  var xhttp = new XMLHttpRequest();
  xhttp.open("POST", `/api/${roomId}`);
  xhttp.send();
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
