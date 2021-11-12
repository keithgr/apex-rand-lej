// Imports
const request = require('sync-request');

// Constants
const rootUrl = 'https://www.ea.com';

// Regex
const findNewSeasonPath = [
  new RegExp( `/games/apex-legends/[^<]+season` , 'ig' ),
  new RegExp( `/games/apex-legends/\\w+` , 'ig' )
];
const findNewLegendPath = [
  new RegExp( `/games/apex-legends/about/characters/[\\w\\-]+` , 'ig' )
];
const findLegendName = [
  new RegExp( `>\\w+</h1>` , 'ig' ),
  new RegExp( `\\w+` , 'ig' )
]
const findLegendImage = [
  new RegExp( `https\\://media\\.contentapi\\.ea\\.com/content/dam/apex-legends/common/legends/apex-section-bg-legends-[\\w\\-]+\\.jpg\\.adapt\\.768w\\.jpg` , 'ig' )
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

// Home page to season page
const homePage = getHttpContent(`${rootUrl}/games/apex-legends`);
const newSeasonPath = getFineMatch(homePage, findNewSeasonPath);

// Season page to new legend page
const newSeasonPage = getHttpContent(`${rootUrl}${newSeasonPath}`);
const newLegendPath = getFineMatch(newSeasonPage, findNewLegendPath);

// Visit each legend page and collect page data
const legendPageVisitQueue = []; 
const collectionMap = {};

addToLegendPageVisitQueue(legendPageVisitQueue, collectionMap, newLegendPath)
while (legendPageVisitQueue.length > 0) {
  const nextPagePath = legendPageVisitQueue.pop();
  collectLegendPageData(legendPageVisitQueue, collectionMap, nextPagePath);
}

console.log('COLLLECT: ' + JSON.stringify(collectionMap));

