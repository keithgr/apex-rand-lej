// Imports
const request = require('sync-request');

// Regex
const findNewSeasonPage = new RegExp(`\/games\/apex\-legends/\w+`, 'g');

// Main
const homePage = getHttpContent('https://www.ea.com/games/apex-legends');
const results = findNewSeasonPage.exec(homePage);
console.log(results);

// Functions
function getHttpContent(url) {
  const res = request('GET', url);
  return res.getBody().toString();
}
