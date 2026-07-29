const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' })); 

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Auth config
const CONFIG_FILE = path.join(__dirname, 'admin-config.json');
const COOKIE_NAME = 'admin_token';
const SECRET_TOKEN = 'secure_admin_session'; 

function getAdminPassword() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return config.password || 'admin';
    } else {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({ password: 'admin' }));
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

app.post('/api/login', (req, res) => {
  const password = (req.body.password || '').trim();
  const actualPassword = getAdminPassword().trim();
  console.log(`Login attempt: provided="${password}", actual="${actualPassword}"`);
  
  if (password === actualPassword) {
    res.cookie(COOKIE_NAME, SECRET_TOKEN, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false }); // false so JS can delete it easily on logout, though true is safer. Let's use false so the frontend can check it if needed, or stick to backend validation.
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid password' });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

app.post('/api/change-password', requireAuth, (req, res) => {
  const oldPassword = (req.body.oldPassword || '').trim();
  const newPassword = (req.body.newPassword || '').trim();
  
  if (oldPassword !== getAdminPassword().trim()) {
    return res.status(401).json({ success: false, error: 'پرانا پاس ورڈ غلط ہے۔' });
  }
  
  if (!newPassword || newPassword.length < 4) {
     return res.status(400).json({ success: false, error: 'نیا پاس ورڈ کم از کم 4 حروف کا ہونا چاہیے۔' });
  }
  
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ password: newPassword }));
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API to GET data
app.get('/api/data', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to read data' });
    }
    res.json(JSON.parse(data));
  });
});

// API to POST (save) data
app.post('/api/data', requireAuth, (req, res) => {
  const newData = req.body;
  fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to save data' });
    }
    res.json({ success: true, message: 'Data saved successfully' });
  });
});

// API to increment views
app.post('/api/increment-view', (req, res) => {
  const { type, key, id, index } = req.body;
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read data' });
    try {
      const siteData = JSON.parse(data);
      if (type === 'content' && key && id) {
        if (siteData.content && siteData.content[key]) {
          const item = siteData.content[key].find(i => i.id === id);
          if (item) {
            item.views = (item.views || 0) + 1;
          }
        }
      } else if (type === 'home' && index !== undefined) {
        if (siteData.homeArticles && siteData.homeArticles[index]) {
          siteData.homeArticles[index].views = (siteData.homeArticles[index].views || 0) + 1;
        }
      }
      fs.writeFile(DATA_FILE, JSON.stringify(siteData, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save data' });
        res.json({ success: true });
      });
    } catch (e) {
      res.status(500).json({ error: 'Parse error' });
    }
  });
});

// API to upload files
app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the path relative to the root URL
  res.json({ url: '/uploads/' + req.file.filename });
});

// API to delete files
app.post('/api/delete-file', (req, res) => {
  const { url } = req.body;
  if (!url || !url.startsWith('/uploads/')) {
    return res.status(400).json({ error: 'Invalid file url' });
  }
  
  const filename = url.replace('/uploads/', '');
  const filepath = path.join(__dirname, 'uploads', filename);
  
  fs.unlink(filepath, (err) => {
    if (err) {
      console.error(err);
      // It might already be deleted, so we just return success anyway or a specific message
      return res.status(500).json({ error: 'Failed to delete file' });
    }
    res.json({ success: true, message: 'File deleted successfully' });
  });
});


app.use((req, res, next) => {
  // Exclude /api routes from this fallback
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  // Check if admin page is requested
  if (req.url.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, 'admin', 'index.html'));
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
