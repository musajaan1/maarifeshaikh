const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

// Firebase initialization
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
let db;
let dbInitError = null;
try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
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
  const newData = req.body;
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


app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (req.url.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, 'admin', 'index.html'));
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
