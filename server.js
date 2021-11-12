// Imports
const request = require('sync-request');

// Regex
const findNewSeasonPage = [
  new RegExp( `/games/apex-legends/[^<]+season` , 'ig' ),
  new RegExp( `/games/apex-legends/\\w+` , 'ig' )
];

// Main
const homePage = getHttpContent('https://www.ea.com/games/apex-legends');
let r = getMatches(homePage, findNewSeasonPage[0])[0];
console.log(r);
r = getMatches(r, findNewSeasonPage[1])[0];
console.log(r);

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

function 
