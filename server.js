const express = require('express');
const fetch = require('node-fetch');
const xml2js = require('xml2js');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', async (req, res) => {
  try {
    const response = await fetch('https://feed.podbean.com/theanswer/feed.xml');
    const xml = await response.text();

    xml2js.parseString(xml, (err, result) => {
      if (err) throw err;

      const items = result.rss.channel[0].item.slice(0, 10).map(entry => ({
        title: entry.title[0],
        description: entry.description[0],
        audio: entry.enclosure[0].$.url
      }));

      res.render('index', { episodes: items });
    });
  } catch (err) {
    res.status(500).send('שגיאה בטעינת הפודקאסט');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
