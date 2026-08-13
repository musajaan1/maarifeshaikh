const express = require('express');
const path = require('path');

function generateSlug(text) {
  if (!text) return '';
  return text.trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w\-\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
const cors = require('cors');
const multer = require('multer');

// Firebase initialization
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
let db;
let dbInitError = null;
try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const match = process.env.FIREBASE_SERVICE_ACCOUNT.match(/\{[\s\S]*\}/);
    if (match) {
      serviceAccount = JSON.parse(match[0]);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    } else {
      throw new Error("No valid JSON found in FIREBASE_SERVICE_ACCOUNT");
    }
  } else {
    serviceAccount = require('./firebase-service-account.json');
  }
  initializeApp({
    credential: cert(serviceAccount)
  });
  db = getFirestore();
  console.log("Firebase initialized");
} catch (e) {
  console.error("Firebase init error", e);
  dbInitError = e.message || String(e);
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// Initialize Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: 'tmyknxzc', 
  api_key: '273949662681685', 
  api_secret: 'LH62KWbXfjQdr3OsFHYIDk-xVLs' 
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Auth config
const COOKIE_NAME = 'admin_token';
const SECRET_TOKEN = 'secure_admin_session'; 

async function getAdminPassword() {
  try {
    const doc = await db.collection('config').doc('admin').get();
    if (doc.exists) {
      return doc.data().password || 'admin';
    } else {
      await db.collection('config').doc('admin').set({ password: 'admin' });
      return 'admin';
    }
  } catch (err) {
    console.error("Error reading admin config", err);
    return 'admin';
  }
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  rc && rc.split(';').forEach(function( cookie ) {
    const parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
}

function requireAuth(req, res, next) {
  const cookies = parseCookies(req);
  if (cookies[COOKIE_NAME] === SECRET_TOKEN) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.post('/api/login', async (req, res) => {
  const password = (req.body.password || '').trim();
  const actualPassword = (await getAdminPassword()).trim();
  console.log(`Login attempt: provided="${password}", actual="${actualPassword}"`);
  
  if (password === actualPassword) {
    res.cookie(COOKIE_NAME, SECRET_TOKEN, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false }); 
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

app.post('/api/change-password', requireAuth, async (req, res) => {
  const oldPassword = (req.body.oldPassword || '').trim();
  const newPassword = (req.body.newPassword || '').trim();
  const actualPassword = (await getAdminPassword()).trim();
  
  if (oldPassword !== actualPassword) {
    return res.status(401).json({ success: false, error: 'پرانا پاس ورڈ غلط ہے۔' });
  }
  
  if (!newPassword || newPassword.length < 4) {
     return res.status(400).json({ success: false, error: 'نیا پاس ورڈ کم از کم 4 حروف کا ہونا چاہیے۔' });
  }
  
  try {
    await db.collection('config').doc('admin').set({ password: newPassword });
    res.json({ success: true, message: 'پاس ورڈ کامیابی سے تبدیل ہو گیا۔' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'فائل محفوظ کرنے میں مسئلہ آیا۔' });
  }
});

// Protect /admin routes (except login.html)
app.use('/admin', (req, res, next) => {
  if (req.path === '/login.html') return next();
  
  const cookies = parseCookies(req);
  if (cookies[COOKIE_NAME] === SECRET_TOKEN) {
    next();
  } else {
    res.redirect('/admin/login.html');
  }
});

// Serve static files (frontend)
app.use(express.static(__dirname));

// API to GET data
app.get('/api/data', async (req, res) => {
  try {
    if (!db) {
       return res.status(500).json({ error: 'DB not initialized', details: dbInitError });
    }
    const doc = await db.collection('siteData').doc('main').get();
    if (doc.exists) {
      res.json(doc.data());
    } else {
      res.json({}); 
    }
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// API to POST (save) data
app.post('/api/data', requireAuth, async (req, res) => {
  let newData = req.body;
  if (newData && newData.content) {
    Object.keys(newData.content).forEach(key => {
      const unique = [];
      const seen = new Set();
      newData.content[key].forEach(item => {
        if (item && item.id) {
          const idStr = String(item.id);
          item.id = idStr;
          if (!seen.has(idStr)) {
            seen.add(idStr);
            unique.push(item);
          }
        }
      });
      newData.content[key] = unique;
    });
  }
  if (newData && newData.homeArticles) {
    const uniqueHome = [];
    const seenHome = new Set();
    newData.homeArticles.forEach(item => {
      if (item && item.id) {
        const idStr = String(item.id);
        item.id = idStr;
        if (!seenHome.has(idStr)) {
          seenHome.add(idStr);
          uniqueHome.push(item);
        }
      } else if (item && !item.id) {
        // legacy home articles might not have id, keep them but don't deduplicate by id
        uniqueHome.push(item);
      }
    });
    newData.homeArticles = uniqueHome;
  }
  
  try {
    await db.collection('siteData').doc('main').set(newData);
    res.json({ success: true, message: 'Data saved successfully' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// API to increment views
app.post('/api/increment-view', async (req, res) => {
  const { type, key, id, index } = req.body;
  try {
    const docRef = db.collection('siteData').doc('main');
    await db.runTransaction(async (t) => {
      const doc = await t.get(docRef);
      if (!doc.exists) throw new Error("No data");
      const siteData = doc.data();
      
      let updated = false;
      if (type === 'content' && key && id) {
        if (siteData.content && siteData.content[key]) {
          const item = siteData.content[key].find(i => i.id === id);
          if (item) {
            item.views = (item.views || 0) + 1;
            updated = true;
          }
        }
      } else if (type === 'home' && index !== undefined) {
        if (siteData.homeArticles && siteData.homeArticles[index]) {
          siteData.homeArticles[index].views = (siteData.homeArticles[index].views || 0) + 1;
          updated = true;
        }
      }
      
      if (updated) {
        t.set(docRef, siteData);
      }
    });
    res.json({ success: true });
  } catch (e) {
    console.error("Transaction error:", e);
    res.status(500).json({ error: 'Failed to increment view' });
  }
});

// API to upload files
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  let resourceType = 'auto';
  if (ext === '.pdf') {
    resourceType = 'image';
  } else if (ext === '.mp3' || ext === '.wav') {
    resourceType = 'video';
  } else if (ext === '.ttf' || ext === '.woff' || ext === '.woff2') {
    resourceType = 'raw';
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const baseName = path.basename(req.file.originalname, ext);
  const filename = uniqueSuffix + '-' + baseName;

  const uploadStream = cloudinary.uploader.upload_stream(
    { 
      resource_type: resourceType,
      folder: 'maarifeshaikh_uploads',
      public_id: filename
    },
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ error: 'Failed to upload to cloud' });
      }
      res.json({ url: result.secure_url });
    }
  );

  uploadStream.end(req.file.buffer);
});

// API to delete files
app.post('/api/delete-file', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Invalid file url' });
  }
  
  if (url.includes('cloudinary.com')) {
    try {
      let publicId = url.split('/upload/')[1].split('/').slice(1).join('/'); 
      const lastDot = publicId.lastIndexOf('.');
      if (lastDot !== -1) {
        publicId = publicId.substring(0, lastDot);
      }
      publicId = decodeURI(publicId);
      
      let resourceType = 'image';
      if (url.includes('/video/upload/')) resourceType = 'video';
      else if (url.includes('/raw/upload/')) resourceType = 'raw';
      
      cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
        if (error) console.error('Cloudinary delete error:', error);
        res.json({ success: true, message: 'File deleted successfully' });
      });
    } catch(e) {
      console.error(e);
      res.json({ success: true, message: 'File deleted (simulated)' });
    }
  } else {
    res.json({ success: true });
  }
});


app.get('/sitemap.xml', async (req, res) => {
  try {
    if (!db) return res.status(500).send('DB not initialized');
    const doc = await db.collection('siteData').doc('main').get();
    if (!doc.exists) return res.status(404).send('Not found');
    const siteData = doc.data();
    const baseUrl = 'https://' + req.get('host');
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/about</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/contact</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;

    if (siteData.homeArticles) {
      siteData.homeArticles.filter(a => a.status !== 'draft').forEach(item => {
        const itemSlug = generateSlug(item.title);
        xml += `  <url>\n    <loc>${baseUrl}/home/${encodeURIComponent(itemSlug)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });
    }

    if (siteData.categories) {
      for (const catKey in siteData.categories) {
        const cat = siteData.categories[catKey];
        if (!cat) continue;
        const catSlug = generateSlug(cat.title || catKey);
        xml += `  <url>\n    <loc>${baseUrl}/${encodeURIComponent(catSlug)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        
        if (cat.sections) {
          cat.sections.forEach(sec => {
            const secSlug = generateSlug(sec.title || sec.id);
            xml += `  <url>\n    <loc>${baseUrl}/${encodeURIComponent(catSlug)}/${encodeURIComponent(secSlug)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
            
            const dataKey = catKey + '_' + sec.id;
            if (siteData.content && siteData.content[dataKey]) {
              siteData.content[dataKey].filter(a => a.status !== 'draft').forEach(item => {
                const itemSlug = generateSlug(item.title || item.id);
                xml += `  <url>\n    <loc>${baseUrl}/${encodeURIComponent(catSlug)}/${encodeURIComponent(secSlug)}/${encodeURIComponent(itemSlug)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
              });
            }
          });
        }
      }
    }

    xml += `</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating sitemap');
  }
});

app.use(async (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.url.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, 'admin', 'index.html'));
  }

  const homeId = req.query.home;
  const articleId = req.query.article;
  
  const decodedPath = decodeURIComponent(req.path);
  const pathParts = decodedPath.split('/').filter(Boolean);
  
  let targetHomeArticleSlug = null;
  let targetArticleSlug = null;
  
  if (pathParts.length === 2 && pathParts[0] === 'home') {
    targetHomeArticleSlug = pathParts[1];
  } else if (pathParts.length === 3) {
    targetArticleSlug = pathParts[2];
  }

  if (homeId || articleId || targetHomeArticleSlug || targetArticleSlug) {
    try {
      const doc = await db.collection('siteData').doc('main').get();
      if (doc.exists) {
        const siteData = doc.data();
        let item = null;
        
        if (homeId) {
          const homeArticles = (siteData.homeArticles || []).filter(a => a.status !== 'draft');
          item = homeArticles.find(a => String(a.id) === String(homeId));
        } else if (articleId) {
          if (siteData.content) {
            for (const key in siteData.content) {
              const found = siteData.content[key].find(a => String(a.id) === String(articleId) && a.status !== 'draft');
              if (found) {
                item = found;
                break;
              }
            }
          }
        } else if (targetHomeArticleSlug) {
          const homeArticles = (siteData.homeArticles || []).filter(a => a.status !== 'draft');
          item = homeArticles.find(a => generateSlug(a.title) === targetHomeArticleSlug);
        } else if (targetArticleSlug) {
          if (siteData.content) {
            for (const key in siteData.content) {
              const found = siteData.content[key].find(a => generateSlug(a.title) === targetArticleSlug && a.status !== 'draft');
              if (found) {
                item = found;
                break;
              }
            }
          }
        }
        
        if (item) {
          const title = item.seoTitle || item.title || 'معارف شیخ';
          let desc = item.seoDesc || item.excerpt || 'معارف شیخ';
          desc = desc.replace(/<[^>]+>/g, '').substring(0, 200);
          
          let image = item.mediaUrl || ('https://' + req.get('host') + '/admin/assets/images/logo.png');
          
          let html = require('fs').readFileSync(path.join(__dirname, 'index.html'), 'utf8');
          
          const metaTags = `
            <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
            <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
            <meta property="og:image" content="${image}" />
            <meta property="og:type" content="article" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
            <meta name="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
            <meta name="twitter:image" content="${image}" />
            <title>${title.replace(/</g, '&lt;')} - معارف شیخ</title>
          `;
          
          html = html.replace('</head>', metaTags + '\n</head>');
          
          const articleHtml = `
            <div class="page-container" style="max-width: 1300px;">
              <div class="article-layout">
                <div class="article-main">
                  <div class="page-header">
                    <h1 class="page-title">${item.title || ''}</h1>
                  </div>
                  <div class="content-body">
                    ${item.content || ''}
                  </div>
                </div>
              </div>
            </div>
          `;
          html = html.replace('<main class="main-content" id="appRoot">', () => '<main class="main-content" id="appRoot">\n' + articleHtml);
          
          return res.send(html);
        }
      }
    } catch (e) {
      console.error('Error fetching SEO data:', e);
    }
  }

  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
