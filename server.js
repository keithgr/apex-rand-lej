// Imports
const request = require('sync-request');

// Regex
const findNewSeasonPage = new RegExp(`/games/apex-legends/\\w+`, 'g');

// Main
const homePage = getHttpContent('https://www.ea.com/games/apex-legends');
const results = getMatches(homePage, findNewSeasonPage);
console.log(results);

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
