const express = require('express');
const xml2js = require('xml2js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', async (req, res) => {
  try {
    // משתמשים בפרוקסי כדי לעקוף חסימות
    const targetFeed = 'https://feed.podbean.com/theanswer/feed.xml';
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(targetFeed);
    const response = await fetch(proxyUrl);
    const json = await response.json();
    const xml = json.contents;

    // נכניס לוג למקרה שנרצה לבדוק את הפלט
    console.log('🔵 XML loaded, length:', xml.length);

    xml2js.parseString(xml, (err, result) => {
      if (err) {
        console.error('❌ שגיאה בפיענוח ה־XML:', err);
        return res.status(500).send('שגיאה בפיענוח הפודקאסט');
      }

      try {
        const items = result.rss.channel[0].item.slice(0, 10).map(entry => ({
          title: entry.title[0],
          description: entry.description[0],
          audio: entry.enclosure[0].$.url
        }));

        res.render('index', { episodes: items });
      } catch (innerErr) {
        console.error('❌ שגיאה בהוצאת המידע מה־JSON:', innerErr);
        res.status(500).send('שגיאה בטיפול בפרקים');
      }
    });
  } catch (err) {
    console.error('❌ שגיאה כללית:', err);
    res.status(500).send('שגיאה בטעינת הפודקאסט');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
