// client-side js
// run by the browser each time your view template referencing it is loaded

const pingInterval = 1000;
const spinInterval = 75;
const clientStatusTimeout = 900;

const trashTier = "lightgray";
const bTier = "#08F";
const pTier = "purple";
const gTier = "gold";
const hTier = "red";

const legends = [
  { name: "Bloodhound", tier: bTier, imageAddress: "https://media4.giphy.com/media/pcKnZKWncdpezITi6A/giphy-downsized-large.gif" },
  { name: "Gibraltar", tier: bTier, imageAddress: "https://thumbs.gfycat.com/VerifiableDirectCommabutterfly-size_restricted.gif" },
  { name: "Lifeline", tier: pTier, imageAddress: "https://media.tenor.com/images/5713e6f59e70d1b711d11a1d176e586b/tenor.gif" },
  { name: "Pathfinder", tier: gTier, imageAddress: "https://i.makeagif.com/media/7-08-2015/mOle_k.gif" },
  { name: "Wraith", tier: gTier, imageAddress: "https://64.media.tumblr.com/tumblr_mbtbb7NuK31ro2eu3o1_400.gifv" },
  { name: "Bangalore", tier: trashTier, imageAddress: "https://media0.giphy.com/media/lILXUUNBkEZwXRBGwS/giphy.gif" },
  { name: "Caustic", tier: trashTier, imageAddress: "https://i.ytimg.com/vi/R1x3B9O9TA0/maxresdefault.jpg" },
  { name: "Mirage", tier: trashTier, imageAddress: "https://i.pinimg.com/originals/6f/1f/30/6f1f308da0d735fdabee2e3711b28bd8.gif" },
  { name: "Octane", tier: trashTier, imageAddress: "https://media0.giphy.com/media/KAxcdTUUP9PMI/giphy.gif" },
  { name: "Wattson", tier: pTier, imageAddress: "https://images.squarespace-cdn.com/content/v1/54d951cbe4b0af07ca29dae7/1438809303397-1NK3L8QZUQ1SLH90ZJ6V/ke17ZwdGBToddI8pDm48kPJXHKy2-mnvrsdpGQjlhod7gQa3H78H3Y0txjaiv_0fDoOvxcdMmMKkDsyUqMSsMWxHk725yiiHCCLfrh8O1z5QHyNOqBUUEtDDsRWrJLTmrMDYraMJMCQwFxTSOIP7LpSBEQpA-g5k6VTjWbSuadHJq0dp98hg5AZvIaPb3DoM/charged+up.png?format=1500w" },
  { name: "Crypto", tier: hTier, imageAddress: "https://www.thesynergist.org/wp-content/uploads/2014/09/469564565.jpg" },
  { name: "Revenant", tier: bTier, imageAddress: "https://media1.giphy.com/media/3ohryxUEMbHq6Pp90Q/giphy.gif" },
  { name: "Loba", tier: bTier, imageAddress: "https://media3.giphy.com/media/qE3yayNjKcDBe/200.gif" },
  { name: "Rampart", tier: trashTier, imageAddress: "https://media1.giphy.com/media/3o7bucCyb4QAZOEC8U/200.gif" },
  { name: "Horizon", tier: bTier, imageAddress: "https://i.makeagif.com/media/5-18-2014/yLJVmt.gif" },
  { name: "Fuse", tier: pTier, imageAddress: "https://64.media.tumblr.com/9d3ca203db818aec86f53315b3e25dbb/tumblr_ojyursPQWX1tkb2p0o3_400.gifv" },
  { name: "Valkyrie", tier: pTier, imageAddress: "https://media.tenor.com/images/513e803a0af2bfe18a9a43a46917118d/tenor.gif" },
  { name: "Seer", tier: trashTier, imageAddress: "https://i.imgur.com/XXBLEpo.png" },
  { name: "Ash", tier: bTier, imageAddress: "https://64.media.tumblr.com/97dda50932aabb0e7c7fe4d479789f38/tumblr_oyw0x8NPTo1w3cefpo1_500.jpg" }
];

const roomId = document.getElementById("bod").getAttribute("roomId");
const spinButton = document.getElementById("spin");
const spinText = document.getElementById("spinText");

const slots = [
  document.getElementById("slot0"),
  document.getElementById("slot1"),
  document.getElementById("slot2")
];

let roomData = {
  version: 0
};

function showLegendBanner(slotIndex, legendId, isConfirmed=false) {
  const slot = slots[slotIndex];
  const legend = legends[legendId];
  slot.innerHTML = `<div class="card" width=115 height=250 style="${ isConfirmed ? `border: solid thick ${legend.tier}; box-shadow: 0 0 ${legend.tier === "red" ? 500 : 50}px ${legend.tier};` : 'border: thin dashed gray' }"><img class="legend-pic" height=180 src="${legend.imageAddress}"><div class="kard legend-name"><strong>${legend.name}</strong></div></div>`;
}

function showRandomLegendBanner(slotIndex) {
  const r = Math.floor(legends.length * Math.random());
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
