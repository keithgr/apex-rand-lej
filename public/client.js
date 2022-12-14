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
const saveMessage = document.getElementById("save-message");

const slots = [
  document.getElementById("slot0"),
  document.getElementById("slot1"),
  document.getElementById("slot2")
];

const isEditingPlayerName = [false, false, false];
let localToServerTimeOffset;
let expireSaveMessageTimeout;

let roomData = {
  version: 0
};

function showLegendBanner(slotIndex, legendId, isConfirmed=false) {
  const slot = slots[slotIndex];
  const legend = roomData.legendDataList[legendId];
  const profiles = roomData.profiles;
  const cardColor = cardColors[slotIndex];
  slot.innerHTML = `
    <div class="card" width=115 height=250 style="${ isConfirmed ? `border: solid thick ${cardColor}; box-shadow: 0 0 10px ${cardColor};` : 'border: thick solid gray' }">
      <div class="kard legend-name">
        <strong>${legend.name}</strong>
      </div>
      <img class="legend-pic" height=180 src="${legend.image}">
    </div>
    <input id="playerName${slotIndex}" type="text" class="player-name" value="${profiles[slotIndex].name}" onClick="editPlayerName(${slotIndex})" onBlur="submitName(${slotIndex})">
  `;
}

function showRandomLegendBanner(slotIndex) {
  const roomDataSnapshot = roomData;
  const slotCandidateSet = roomDataSnapshot.slotCandidates[slotIndex];
  const randIndex = Math.floor(slotCandidateSet.length * Math.random());
  const legendId = slotCandidateSet[randIndex];
  showLegendBanner(slotIndex, legendId);
}

function isSpinning(slotIndex) {
  // const roomDataSnapshot = roomData;
  // const now = roomDataSnapshot.time;
  // return now < roomDataSnapshot.spinTimes[slotIndex];
  const roomDataSnapshot = roomData;
  const trueServerTime = Date.now() - localToServerTimeOffset;
  return trueServerTime < roomDataSnapshot.spinTimes[slotIndex];
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
  } 
  else {
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
          const serverTime = response.time;
          localToServerTimeOffset = Date.now() - serverTime;
          const currentVersion = roomDataSnapshot.version;
          const newVersion = response.version;
          if (
            (!response.spinTimes || serverTime < response.spinTimes[2]) &&
            (currentVersion !== newVersion)
          ) {
            console.log('Rendering room data...');
            renderRoomData();
            console.log('Rendered.');
          }
          else {
            renderPlayerNames();
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
  console.log('Submitting spin...');
  const xhttp = new XMLHttpRequest();
  xhttp.open("POST", `/api/spin/${roomId}`);
  xhttp.send();
  
  console.log('Spin submitted.');
}

function loadLegendSettings(scrollTo=true) {
  console.log('Loading legend settings...');
  const roomDataSnapshot = roomData;
  const settings = roomDataSnapshot.settings;
  
  console.log(settings);
  const toggleColumns = legendToggle.getElementsByClassName('toggle-column');
  for (let p = 0; p < toggleColumns.length; p++) {
    const toggleColumn = toggleColumns[p];
    const toggleOptions = toggleColumn.getElementsByClassName('toggle-option');
    for (let l = 0; l < toggleOptions.length; l++) {
      const toggleInput = document.getElementById(`p${p}l${l}`);
      toggleInput.checked = settings[p][l];
    }
  }
  
  console.log('Loaded');
  saveMessage.style.color = "#333";
  saveMessage.innerHTML = `Successfully loaded legend settings`;
  if (scrollTo) {
    saveMessage.scrollIntoView();
  }
  expireSaveMessage();
}

function initializeRoom() {
  if (!roomData || !roomData.settings) {
    setTimeout(
      () => {
        initializeRoom();  
      },
      500
    );
  }
  else {
    loadLegendSettings(false);
  }
}

function saveLegendSettings() {
  console.log('Saving legend settings...');
  const toggleColumns = legendToggle.getElementsByClassName('toggle-column');
  const requestBody = [];
  for (let p = 0; p < toggleColumns.length; p++) {
    const toggleColumn = toggleColumns[p];
    const toggleOptions = toggleColumn.getElementsByClassName('toggle-option');
    requestBody[p] = [];
    for (let l = 0; l < toggleOptions.length; l++) {
      const toggleInput = document.getElementById(`p${p}l${l}`);
      requestBody[p][l] = toggleInput.checked;
    }
  }
  
  console.log(requestBody);
  const request = JSON.stringify(requestBody);
  const xhttp = new XMLHttpRequest();
  xhttp.timeout = clientStatusTimeout;
  xhttp.open("POST", `/api/settings/${roomId}`);
  xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        saveMessage.style.color = "#333";
        saveMessage.innerHTML = `Successfully saved legend settings`;
      }
      else if (this.status == 400) {
        saveMessage.style.color = "red";
        saveMessage.innerHTML = `Invalid settings: Each player must have at least 3 legends selected`;
      }
      else {
        saveMessage.style.color = "red";
        saveMessage.innerHTML = `Unexpected error occurred`;
      }
      saveMessage.scrollIntoView();
      expireSaveMessage();
    }
  };
  xhttp.send(request);
  
  console.log('Saved.');
}

function expireSaveMessage() {
  if (expireSaveMessageTimeout) {
    clearTimeout(expireSaveMessageTimeout);
  }
  expireSaveMessageTimeout = setTimeout(
    () => {
      saveMessage.innerHTML = ``;
    },
    10000
  );
}

function submitName(index) {
  isEditingPlayerName[index] = false;
  if (!(index in [0, 1, 2])) {
    console.error("submitName requires a valid player index");
    return
  }
  
  const newName = document.getElementById(`playerName${index}`).value;
  const request = JSON.stringify(
    {
      name: newName
    }
  );
  const endpoint = `/api/profiles/${index}/${roomId}`;
  console.log(`Attempting to submit request, ${request}, to endpoint, [${endpoint}]`);
  
  const xhttp = new XMLHttpRequest();
  xhttp.timeout = clientStatusTimeout;
  xhttp.open("POST", endpoint);
  xhttp.setRequestHeader("Content-type", "application/json; charset=utf-8");
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if (this.status == 200) {
        console.log(`Name, "${newName}" saved for player${index}`);
      }
      else {
        console.error(`Unexpected error saving name, "${newName}" for player${index}`);
      }
    }
  };
  xhttp.send(request);
}

function renderPlayerNames() {
  const roomDataSnapshot = roomData;
  for (let p = 0; p < 3; p++) {
    const playerNameDisplay = document.getElementById(`playerName${p}`);
    const currentlyDisplayedPlayerName = playerNameDisplay.value;
    const latestPlayerName = roomDataSnapshot.profiles[p].name;
    if (currentlyDisplayedPlayerName != latestPlayerName && document.activeElement !== playerNameDisplay) {
      playerNameDisplay.value = latestPlayerName;
    }
  }
}

function editPlayerName(index) {
  const playerNameInput = document.getElementById(`playerName${index}`);
  if (!isEditingPlayerName[index]) {
    playerNameInput.select(); 
  }
  isEditingPlayerName[index] = true;
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

initializeRoom();

spinButton.addEventListener("click", submitSpin);
loadButton.addEventListener("click", loadLegendSettings);
saveButton.addEventListener("click", saveLegendSettings);
