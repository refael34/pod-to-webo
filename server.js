const express = require('express');
const xml2js = require('xml2js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', async (req, res) => {
  try {
    const feedUrl = 'https://feed.podbean.com/theanswer/feed.xml';

    // שליפה ישירה ללא פרוקסי
    const response = await fetch(feedUrl);
    const xml = await response.text();

    console.log('🔵 XML loaded, length:', xml.length);

    xml2js.parseString(xml, (err, result) => {
      if (err) {
        console.error('❌ שגיאה בפיענוח ה־XML:', err);
        return res.status(500).send('שגיאה בפיענוח הפודקאסט');
      }

      try {
        const channel = result?.rss?.channel?.[0];
        if (!channel || !Array.isArray(channel.item)) {
          console.error('⚠️ מבנה לא צפוי: אין channel.item');
          return res.status(500).send('לא נמצאו פרקים בפיד');
        }

        const episodes = channel.item.slice(0, 10).map(entry => ({
          title: entry.title?.[0] || 'ללא כותרת',
          description: entry.description?.[0] || '',
          audio: entry.enclosure?.[0]?.$?.url || ''
        }));

        res.render('index', { episodes });
      } catch (innerErr) {
        console.error('❌ שגיאה בטיפול בפרקים:', innerErr);
        res.status(500).send('שגיאה בטיפול בפרקים');
      }
    });
  } catch (err) {
    console.error('❌ שגיאה כללית:', err);
    res.status(500).send('שגיאה בטעינת הפודקאסט');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 השרת רץ על פורט ${PORT}`);
});
