/* Collect legends from website */

// Imports
const request = require('sync-request');

// Constants
const rootUrl = 'https://www.ea.com';
const charactersUrl = 'https://www.ea.com/games/apex-legends/about/characters';

// Regex
const findNewSeasonPath = [
  new RegExp( `/games/apex-legends/[^<]+season` , 'ig' ),
  new RegExp( `/games/apex-legends/\\w+` , 'ig' )
];
const scanLegendPath = [
  new RegExp( `/games/apex-legends/about/characters/[\\w\\-]+` , 'ig' )
];
const findLegendName = [
  new RegExp( `<h1[\\s\\S]+</h1>` , 'ig' ),
  new RegExp( `>[\\s\\S]+</h1>` , 'ig' ),
  new RegExp( `[a-z]+` , 'ig' )
] 
const findLegendImage = [
  new RegExp( `https\\://media\\.contentapi\\.ea\\.com/content/dam/apex-legends/common/[\\w\\-/]+/apex-section-bg-legends-[\\w\\-]+\\.jpg\\.adapt\\.768w\\.jpg` , 'ig' )
]
const scanLegendPaths = new RegExp( `/games/apex-legends/about/characters/[\\w\\-]+` , 'ig' )

// Functions
function getHttpContent(url) {
  const res = request('GET', url);
  return res.getBody().toString();
}

function getMatches(strToSearch, regex) {
  let arr;
  let results = [];
  while ((arr = regex.exec(strToSearch)) !== null) {
    results.push(arr[0]);  
  }
  return results;
}

function getFineMatch(strToSearch, regexList) {
  let m = strToSearch;
  for (let r = 0; r < regexList.length; r++) {
    m = getMatches(m, regexList[r])[0];
  }
  return m;
}

function addToLegendPageVisitQueue(queue, collectionMap, pagePath) {
  if (collectionMap[pagePath]) {
    console.log(`Page path, ${pagePath} , is already on the queue; skipping`);
    return;
  }
  console.log(`Page path, ${pagePath} , will be pushed to queue`);
  queue.push(pagePath);
  console.log(`Page path, ${pagePath} , will be added to the collection map`);
  collectionMap[pagePath] = {};
}

function collectLegendPageData(queue, collectionMap, pagePath) {
  const page = getHttpContent(`${rootUrl}${pagePath}`);
  const foundPaths = getMatches(page, scanLegendPaths);
  for (let p = 0; p < foundPaths.length; p++) {
    const foundPath = foundPaths[p];
    addToLegendPageVisitQueue(queue, collectionMap, foundPath);
  }
  const legendName = getFineMatch(page, findLegendName);
  collectionMap[pagePath]["name"] = legendName;
  const legendImage = getFineMatch(page, findLegendImage);
  collectionMap[pagePath]["image"] = legendImage;
}



/* Main */


// Begin at character page
const charactersPage = getHttpContent(charactersUrl);
const legendPaths = getMatches(charactersPage, scanLegendPaths);

// Visit each legend page and collect page data
const legendPageVisitQueue = []; 
const collectionMap = {};

for (let l = 0; l < legendPaths.length; l++) {
  addToLegendPageVisitQueue(legendPageVisitQueue, collectionMap, legendPaths[l])  
}
while (legendPageVisitQueue.length > 0) {
  const nextPagePath = legendPageVisitQueue.pop();
  collectLegendPageData(legendPageVisitQueue, collectionMap, nextPagePath);
}

const legendDataList = [];
for (let path in collectionMap) {
  const legendData = collectionMap[path];
  legendDataList.push(legendData);
}

console.log(legendDataList);






/* Pre-existing server init stuff */
// init project
require('merge-descriptors');

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// init sqlite db
// const dbFile = "./.data/sqlite.db";
// const exists = fs.existsSync(dbFile);
// const sqlite3 = require("sqlite3").verbose();
// const db = new sqlite3.Database(dbFile);

// set the view engine to ejs
app.set("view engine", "ejs");

// static values
const firstSlotTimeDelay = 3000;
const secondSlotTimeDelay = 6000;
const thirdSlotTimeDelay = 9000;

const defaultRoomData = {
  version: 0
};

const randLegs = [];
for (let i = 0; i < legendDataList.length; i++) {
  randLegs.push(i);
}

// server-side memory
const tempServerData = {
  rooms: {}
};

function generateMeta() {
  const randLegsCopy = randLegs.slice(0);
  const meta = [];
  for (let l = 0; l < 3; l++) {
    const r = Math.floor(randLegsCopy.length * Math.random());
    const randLeg = randLegsCopy.splice(r, 1)[0];
    meta.push(randLeg);
  }
  return meta;
}

// view homepage
app.get("/", (request, response) => {
  let roomId = request.query.roomId;
  if (!roomId || roomId === "") {
    response.render(`index`);
  }
  else {
    roomId = encodeURIComponent(request.query.roomId.toLowerCase())
    response.redirect(`/${roomId}`);
  }
});

// view a specific room
app.get("/:roomId/", (request, response) => {
  const roomId = request.params.roomId;
  response.render(`room`, {
    roomId: roomId
  });
});

// endpoint to update room data to a spinning state
app.post("/api/:roomId/", (request, response) => {
  const roomId = request.params.roomId;
  const roomDataSnapshot = tempServerData.rooms[roomId];
  const now = Date.now();
  if (!roomDataSnapshot || (roomDataSnapshot && now > roomDataSnapshot.spinTimes[2])) {
    const newRoomData = {
      version: now,
      spinTimes: [
        now + firstSlotTimeDelay,
        now + secondSlotTimeDelay,
        now + thirdSlotTimeDelay
      ],
      meta: generateMeta(),
      legendDataList: legendDataList
    };
    tempServerData.rooms[roomId] = newRoomData;
  } else {
    console.warn(`Room ${roomId} is already spinning`);
  }
});

// endpoint to get state data of a room
app.get("/api/:roomId/", (request, response) => {
  const roomId = request.params.roomId;
  const roomData = tempServerData.rooms[roomId] || defaultRoomData;
  roomData.time = Date.now();
  response.send(JSON.stringify(roomData));
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
