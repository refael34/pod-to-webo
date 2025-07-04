const express = require('express');
const xml2js = require('xml2js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', async (req, res) => {
  try {
    // URL המקורי של הפודקאסט
    const targetFeed = 'https://feed.podbean.com/theanswer/feed.xml';

    // פרוקסי לעקיפת חסימות CORS
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(targetFeed);

    // משיכת הפיד דרך הפרוקסי
    const response = await fetch(proxyUrl);
    const json = await response.json();
    const xml = json.contents;

    console.log('📥 פיד נטען בהצלחה (אורך:', xml.length, ')');

    xml2js.parseString(xml, (err, result) => {
      if (err) {
        console.error('❌ שגיאה בפיענוח ה־XML:', err);
        return res.status(500).send('שגיאה בפיענוח הפודקאסט');
      }

      try {
        console.log('🔍 מבנה JSON שהתקבל מה־XML:', JSON.stringify(result, null, 2));

        // נוודא שקיים result.rss.channel[0].item
        const items = result?.rss?.channel?.[0]?.item;
        if (!items || !Array.isArray(items)) {
          console.error('⚠️ לא נמצאו פרקים בפיד');
          return res.status(500).send('לא נמצאו פרקים בפיד');
        }

        const episodes = items.slice(0, 10).map(entry => ({
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
