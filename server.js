const request = require('sync-request');

const homePage = getHttpContent('https://www.ea.com/games/apex-legends');


function getHttpContent(url) {
  const res = request('GET', url);
  return res.getBody().toString();
}
