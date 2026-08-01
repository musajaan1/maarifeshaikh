let siteData = null;

function extractSeriesAndSubtitle(title) {
  const match = title.match(/^(.*?)(جلد|شمارہ|حصہ)(.*)$/);
  if (match) {
    const series = match[1].trim();
    const subtitle = (match[2] + match[3]).trim();
    return { series, subtitle };
  }
  return { series: '', subtitle: title };
}

window.togglePasswordVisibility = function(inputId, iconElement) {
  const input = document.getElementById(inputId);
  if (input) {
    if (input.type === 'password') {
      input.type = 'text';
      iconElement.classList.remove('fa-eye');
      iconElement.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      iconElement.classList.remove('fa-eye-slash');
      iconElement.classList.add('fa-eye');
    }
  }
};
document.addEventListener("DOMContentLoaded", () => {
  fetch('/api/data')
    .then(res => res.json())
    .then(data => {
      siteData = data;
      document.getElementById('loadingMessage').style.display = 'none';
      
      // Default to Dashboard
      document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
      document.getElementById('section-dashboard').style.display = 'block';
      
      initAdmin();
      renderDashboard();
      if(typeof initThemeColors === 'function') initThemeColors();
      if(typeof applyThemeColors === 'function') applyThemeColors();
    })
    .catch(err => {
      document.getElementById('loadingMessage').textContent = 'ڈیٹا لوڈ کرنے میں خرابی۔ سرور چیک کریں۔';
      console.error(err);
    });
});

function initTinyMCE() {
  tinymce.init({
    selector: '#richEditor, #homeRichEditor',
    directionality: 'rtl',
    height: 400,
    menubar: false,
    plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
    toolbar: 'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | table | removeformat | help',
    content_style: 'body { font-family: sans-serif; font-size: 16px; }',
    setup: function(editor) {
      editor.on('change', function() {
        tinymce.triggerSave();
      });
    }
  });
}

function initAdmin() {
  const catSelect = document.getElementById('catSelect');
  const secSelect = document.getElementById('secSelect');
  const manageCatSelect = document.getElementById('manageCatSelect');
  const manageSecSelect = document.getElementById('manageSecSelect');
  const manageSecCategorySelect = document.getElementById('manageSecCategorySelect');
  
  // Populate Categories
  Object.keys(siteData.categories).forEach(key => {
    const cat = siteData.categories[key];
    catSelect.appendChild(new Option(cat.title, key));
    manageCatSelect.appendChild(new Option(cat.title, key));
    manageSecCategorySelect.appendChild(new Option(cat.title, key));
  });

  // Handle Category Change in Add Form
  catSelect.addEventListener('change', (e) => {
    const catId = e.target.value;
    secSelect.innerHTML = '<option value="">-- سیکشن منتخب کریں --</option>';
    
    // Hide all dynamic fields first
    document.getElementById('richTextGroup').style.display = 'none';
    document.getElementById('imageUploadGroup').style.display = 'none';
    document.getElementById('fileOrLinkGroup').style.display = 'none';
    
    if (catId && siteData.categories[catId]) {
      siteData.categories[catId].sections.forEach(sec => {
        secSelect.appendChild(new Option(sec.title, sec.id));
      });

      // Show relevant fields based on category
      const catType = siteData.categories[catId].type;
      if (catType === 'article') {
        document.getElementById('richTextGroup').style.display = 'block';
        if (!tinymce.get('richEditor')) {
          initTinyMCE();
        }
      } else if (catType === 'post') {
        document.getElementById('imageUploadGroup').style.display = 'block';
      } else if (catType === 'book' || catType === 'audio') {
        document.getElementById('fileOrLinkGroup').style.display = 'block';
      }
    }
  });

  // Handle Radio Toggles for File/Link
  document.querySelectorAll('input[name="fileTypeOption"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'upload') {
        document.getElementById('uploadInputContainer').style.display = 'block';
        document.getElementById('linkInputContainer').style.display = 'none';
      } else {
        document.getElementById('uploadInputContainer').style.display = 'none';
        document.getElementById('linkInputContainer').style.display = 'block';
      }
    });
  });

  // Handle Category Change in Manage Form
  manageCatSelect.addEventListener('change', (e) => {
    const catId = e.target.value;
    manageSecSelect.innerHTML = '<option value="">-- تمام --</option>';
    if (catId && siteData.categories[catId]) {
      siteData.categories[catId].sections.forEach(sec => {
        manageSecSelect.appendChild(new Option(sec.title, sec.id));
      });
    }
    renderManageList();
  });

  manageSecSelect.addEventListener('change', renderManageList);

  // Form Submit
  const form = document.getElementById('addItemForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const catId = catSelect.value;
    const secId = secSelect.value;
    if (!catId || !secId) {
      showStatus('براہ کرم کیٹگری اور سیکشن منتخب کریں۔', 'error');
      return;
    }

    const saveBtn = document.getElementById('saveBtn');
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
    saveBtn.disabled = true;

    try {
      let fileUrl = '';
      
      // Upload logic based on category
      const catType = siteData.categories[catId].type;
      if (catType === 'post') {
        const fileInput = document.getElementById('imageFile');
        if (fileInput.files.length > 0) {
          fileUrl = await uploadFile(fileInput.files[0]);
        }
      } else if (catType === 'book' || catType === 'audio') {
        const option = document.querySelector('input[name="fileTypeOption"]:checked').value;
        if (option === 'upload') {
          const fileInput = document.getElementById('mediaFile');
          if (fileInput.files.length > 0) {
            fileUrl = await uploadFile(fileInput.files[0]);
          }
        } else {
          fileUrl = document.getElementById('mediaLink').value;
        }
      }

      const editCatId = document.getElementById('editCatId').value;
      const editSecId = document.getElementById('editSecId').value;
      const editItemId = document.getElementById('editItemId').value;
      const isEditing = !!editItemId;

      const newItem = {
        id: isEditing ? editItemId : Date.now().toString(),
        title: document.getElementById('itemTitle').value,
        author: document.getElementById('itemAuthor').value,
        date: document.getElementById('itemDate').value,
        kalam: document.getElementById('itemKalam') ? document.getElementById('itemKalam').value : '',
        awaz: document.getElementById('itemAwaz') ? document.getElementById('itemAwaz').value : '',
        excerpt: document.getElementById('itemExcerpt').value,
        status: document.getElementById('itemStatus').value,
        seoTitle: document.getElementById('itemSeoTitle') ? document.getElementById('itemSeoTitle').value : '',
        seoDesc: document.getElementById('itemSeoDesc') ? document.getElementById('itemSeoDesc').value : '',
        seoKeywords: document.getElementById('itemSeoKeywords') ? document.getElementById('itemSeoKeywords').value : '',
        audioUrl: document.getElementById('audioUrlLink') ? document.getElementById('audioUrlLink').value : '',
        pdfUrl: document.getElementById('pdfUrlLink') ? document.getElementById('pdfUrlLink').value : '',
      };

      let oldItem = null;
      if (isEditing) {
         const oldDataKey = `${editCatId}_${editSecId}`;
         if (siteData.content[oldDataKey]) {
             oldItem = siteData.content[oldDataKey].find(i => i.id === editItemId);
             if (oldItem) {
                 newItem.views = oldItem.views || 0;
                 if (!fileUrl && oldItem.mediaUrl) {
                     newItem.mediaUrl = oldItem.mediaUrl;
                 }
             }
         }
      }

      if (catType === 'article') {
        newItem.fullContent = tinymce.get('richEditor').getContent();
      }
      if (fileUrl) {
        newItem.mediaUrl = fileUrl;
      }

      const dataKey = `${catId}_${secId}`;
      if (!siteData.content[dataKey]) {
        siteData.content[dataKey] = [];
      }
      
      if (isEditing) {
         if (editCatId !== catId || editSecId !== secId) {
             const oldDataKey = `${editCatId}_${editSecId}`;
             if (siteData.content[oldDataKey]) {
                 siteData.content[oldDataKey] = siteData.content[oldDataKey].filter(i => i.id !== editItemId);
             }
             siteData.content[dataKey].unshift(newItem);
         } else {
             const index = siteData.content[dataKey].findIndex(i => i.id === editItemId);
             if (index !== -1) {
                 siteData.content[dataKey][index] = newItem;
             } else {
                 siteData.content[dataKey].unshift(newItem);
             }
         }
      } else {
         siteData.content[dataKey].unshift(newItem); // Add to top
      }

      saveDataToServer(() => {
        showStatus('مواد کامیابی سے محفوظ کر لیا گیا!', 'success');
        form.reset();
        document.getElementById('editCatId').value = '';
        document.getElementById('editSecId').value = '';
        document.getElementById('editItemId').value = '';
        document.querySelector('#section-add .card-title').textContent = 'نیا مواد شامل کریں';
        if (tinymce.get('richEditor')) tinymce.get('richEditor').setContent('');
        catSelect.value = '';
        secSelect.innerHTML = '<option value="">-- پہلے کیٹگری منتخب کریں --</option>';
        document.getElementById('richTextGroup').style.display = 'none';
        document.getElementById('imageUploadGroup').style.display = 'none';
        document.getElementById('fileOrLinkGroup').style.display = 'none';
        renderManageList();
      });

    } catch (err) {
      console.error(err);
      showStatus('فائل اپلوڈ کرنے میں مسئلہ آیا۔', 'error');
    } finally {
      saveBtn.innerHTML = originalBtnText;
      saveBtn.disabled = false;
    }
  });

  // Navigation Helper
  function showSection(navId, sectionId) {
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    const navItem = document.getElementById(navId);
    if (navItem) navItem.classList.add('active');
    
    document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
    const secItem = document.getElementById(sectionId);
    if (secItem) secItem.style.display = 'block';
  }

  document.getElementById('nav-dashboard').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('nav-dashboard', 'section-dashboard');
    renderDashboard();
  });

  document.getElementById('nav-feedback').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('nav-feedback', 'section-feedback');
    renderMessages();
  });

  document.getElementById('nav-add').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('editCatId').value = '';
    document.getElementById('editSecId').value = '';
    document.getElementById('editItemId').value = '';
    document.getElementById('addItemForm').reset();
    document.querySelector('#section-add .card-title').textContent = 'نیا مواد شامل کریں';
    if (tinymce.get('richEditor')) tinymce.get('richEditor').setContent('');
    showSection('nav-add', 'section-add');
  });

  document.getElementById('nav-manage').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('nav-manage', 'section-manage');
    renderManageList();
  });

  document.getElementById('nav-sections').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('nav-sections', 'section-manage-sections');
  });

  document.getElementById('nav-manage-categories').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('nav-manage-categories', 'section-manage-categories');
  });

  document.getElementById('nav-home-article').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('nav-home-article', 'section-home-article');
    renderHomeArticlesList();
    loadHomeArticleData(0);
  });

  document.getElementById('nav-ad').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('nav-ad', 'section-ad');
    loadAdData();
  });

  document.getElementById('nav-news').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('nav-news', 'section-news');
    loadNewsData();
  });

  document.getElementById('nav-footer').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('nav-footer', 'section-footer');
    loadFooterData();
  });

  document.getElementById('nav-bg').addEventListener('click', (e) => {
    e.preventDefault();
    showSection('nav-bg', 'section-bg');
    loadBgData();
  });

  const navSecurity = document.getElementById('nav-security');
  if (navSecurity) {
    navSecurity.addEventListener('click', (e) => {
      e.preventDefault();
      showSection('nav-security', 'section-security');
    });
  }

  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟')) {
        try {
          await fetch('/api/logout', { method: 'POST' });
          window.location.href = '/admin/login.html';
        } catch (err) {
          console.error('Logout error', err);
        }
      }
    });
  }

  function loadFooterData() {
    const footer = siteData.footer || { contactInfo: {}, socialLinks: {} };
    document.getElementById('footerAbout').value = footer.aboutText || '';
    document.getElementById('footerEmail').value = footer.contactInfo?.email || '';
    document.getElementById('footerPhone').value = footer.contactInfo?.phone || '';
    document.getElementById('footerCopyright').value = footer.copyrightText || '';
    document.getElementById('footerFacebook').value = footer.socialLinks?.facebook || '';
    document.getElementById('footerYoutube').value = footer.socialLinks?.youtube || '';
    document.getElementById('footerWhatsapp').value = footer.socialLinks?.whatsapp || '';
    document.getElementById('footerTwitter').value = footer.socialLinks?.twitter || '';
    document.getElementById('footerInstagram').value = footer.socialLinks?.instagram || '';
  }

  // Footer Submit
  const footerForm = document.getElementById('footerForm');
  if (footerForm) {
    footerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const saveBtn = document.getElementById('saveFooterBtn');
      const originalBtnText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
      saveBtn.disabled = true;

      if (!siteData.footer) siteData.footer = { contactInfo: {}, socialLinks: {} };
      
      siteData.footer.aboutText = document.getElementById('footerAbout').value.trim();
      siteData.footer.contactInfo.email = document.getElementById('footerEmail').value.trim();
      siteData.footer.contactInfo.phone = document.getElementById('footerPhone').value.trim();
      siteData.footer.copyrightText = document.getElementById('footerCopyright').value.trim();
      
      siteData.footer.socialLinks.facebook = document.getElementById('footerFacebook').value.trim();
      siteData.footer.socialLinks.youtube = document.getElementById('footerYoutube').value.trim();
      siteData.footer.socialLinks.whatsapp = document.getElementById('footerWhatsapp').value.trim();
      siteData.footer.socialLinks.twitter = document.getElementById('footerTwitter').value.trim();
      siteData.footer.socialLinks.instagram = document.getElementById('footerInstagram').value.trim();

      saveDataToServer(() => {
        showStatus('فٹر کی ترتیبات محفوظ ہو گئیں!', 'success', 'footerStatusMessage');
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
      });
    });
  }

  // Background Settings Logic
  const bgTypeOptions = document.querySelectorAll('input[name="bgTypeOption"]');
  bgTypeOptions.forEach(opt => {
    opt.addEventListener('change', (e) => {
      document.getElementById('bgColorContainer').style.display = 'none';
      document.getElementById('bgGradientContainer').style.display = 'none';
      document.getElementById('bgImageContainer').style.display = 'none';
      
      if (e.target.value === 'color') {
        document.getElementById('bgColorContainer').style.display = 'block';
      } else if (e.target.value === 'gradient') {
        document.getElementById('bgGradientContainer').style.display = 'flex';
      } else if (e.target.value === 'image') {
        document.getElementById('bgImageContainer').style.display = 'block';
      }
    });
  });

  function loadBgData() {
    if (!siteData.background) {
      siteData.background = { type: 'color', value: '#f5f7fa', gradientColor1: '#f5f7fa', gradientColor2: '#c3cfe2' };
    }
    const bg = siteData.background;
    
    // Set radio button
    const opt = document.querySelector(`input[name="bgTypeOption"][value="${bg.type}"]`);
    if (opt) {
      opt.checked = true;
      opt.dispatchEvent(new Event('change'));
    }

    if (bg.type === 'color') {
      document.getElementById('bgColorInput').value = bg.value || '#f5f7fa';
    } else if (bg.type === 'gradient') {
      document.getElementById('bgGrad1Input').value = bg.gradientColor1 || '#f5f7fa';
      document.getElementById('bgGrad2Input').value = bg.gradientColor2 || '#c3cfe2';
    } else if (bg.type === 'image') {
      if (bg.value) {
        document.getElementById('currentBgImage').innerHTML = `<img src="${bg.value}" style="max-height: 100px; border-radius: 4px;">`;
      }
    }

    // Load Logo
    if (siteData.logo) {
      document.getElementById('currentLogoPreview').innerHTML = `<img src="${siteData.logo}" style="max-height: 80px; border-radius: 4px;">`;
    } else {
      document.getElementById('currentLogoPreview').innerHTML = `<p style="color: #666; margin: 0; font-size: 0.9rem;">ڈیفالٹ لوگو استعمال ہو رہا ہے</p>`;
    }
  }

  const bgForm = document.getElementById('bgForm');
  if (bgForm) {
    bgForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const saveBtn = document.getElementById('saveBgBtn');
      const originalBtnText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
      saveBtn.disabled = true;

      try {
        const type = document.querySelector('input[name="bgTypeOption"]:checked').value;
        let bgValue = '';
        let grad1 = '';
        let grad2 = '';

        if (type === 'color') {
          bgValue = document.getElementById('bgColorInput').value;
        } else if (type === 'gradient') {
          grad1 = document.getElementById('bgGrad1Input').value;
          grad2 = document.getElementById('bgGrad2Input').value;
          bgValue = `linear-gradient(to right, ${grad1}, ${grad2})`;
        } else if (type === 'image') {
          const fileInput = document.getElementById('bgImageFile');
          if (fileInput.files.length > 0) {
            bgValue = await uploadFile(fileInput.files[0]);
            document.getElementById('currentBgImage').innerHTML = `<img src="${bgValue}" style="max-height: 100px; border-radius: 4px;">`;
          } else {
            // Keep existing image if no new file is selected
            bgValue = siteData.background?.value || '';
            if (siteData.background?.type !== 'image' && !bgValue) {
               showStatus('براہ کرم تصویر منتخب کریں۔', 'error', 'bgStatusMessage');
               return;
            }
          }
        }

        if (!siteData.background) siteData.background = {};
        siteData.background.type = type;
        siteData.background.value = bgValue;
        if (type === 'gradient') {
          siteData.background.gradientColor1 = grad1;
          siteData.background.gradientColor2 = grad2;
        }

        saveDataToServer(() => {
          showStatus('پس منظر محفوظ ہو گیا!', 'success', 'bgStatusMessage');
        });
      } catch (err) {
        console.error(err);
        showStatus('فائل اپلوڈ کرنے میں مسئلہ آیا۔', 'error', 'bgStatusMessage');
      } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
      }
    });
  }

  const logoForm = document.getElementById('logoForm');
  if (logoForm) {
    logoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const saveBtn = document.getElementById('saveLogoBtn');
      const originalBtnText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
      saveBtn.disabled = true;

      try {
        const fileInput = document.getElementById('logoFile');
        if (fileInput.files.length > 0) {
          const fileUrl = await uploadFile(fileInput.files[0]);
          siteData.logo = fileUrl;
          document.getElementById('currentLogoPreview').innerHTML = `<img src="${fileUrl}" style="max-height: 80px; border-radius: 4px;">`;
          
          saveDataToServer(() => {
            showStatus('لوگو محفوظ ہو گیا!', 'success', 'logoStatusMessage');
          });
        } else {
          showStatus('براہ کرم کوئی نئی تصویر منتخب کریں۔', 'error', 'logoStatusMessage');
        }
      } catch (err) {
        console.error(err);
        showStatus('فائل اپلوڈ کرنے میں مسئلہ آیا۔', 'error', 'logoStatusMessage');
      } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
      }
    });
  }

  const securityForm = document.getElementById('securityForm');
  if (securityForm) {
    securityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('saveSecurityBtn');
      const originalBtnText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
      saveBtn.disabled = true;

      const oldPassword = document.getElementById('oldPassword').value;
      const newPassword = document.getElementById('newPassword').value;

      try {
        const res = await fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPassword, newPassword })
        });
        const data = await res.json();
        
        if (data.success) {
          showStatus(data.message, 'success', 'securityStatusMessage');
          securityForm.reset();
        } else {
          showStatus(data.error || 'تبدیل کرنے میں مسئلہ آیا۔', 'error', 'securityStatusMessage');
        }
      } catch (err) {
        console.error(err);
        showStatus('سرور سے رابطہ نہیں ہو سکا۔', 'error', 'securityStatusMessage');
      } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
      }
    });
  }

  function renderNewsPreview() {
    const previewDiv = document.getElementById('newsLivePreview');
    if (!previewDiv) return;

    const speed = document.getElementById('newsSpeed').value;
    const bgColor = document.getElementById('newsBgColor').value;
    const textColor = document.getElementById('newsTextColor').value;
    const pauseOnHover = document.getElementById('newsPauseHover').checked;

    // Get current items
    const items = [];
    document.querySelectorAll('.news-item-row').forEach(row => {
      const type = row.querySelector('.news-type-select').value;
      if (type === 'text') {
        const val = row.querySelector('.news-text-input').value.trim();
        if (val) items.push({ type: 'text', content: val });
      } else {
        const val = row.querySelector('.news-image-url').value;
        if (val) items.push({ type: 'image', content: val });
      }
    });

    if (items.length === 0) items.push({ type: 'text', content: "کوئی تحریر موجود نہیں ہے۔" });

    const content = items.map(n => {
      if (n.type === 'image') {
        return `<span style="display:inline-block; margin-left:50px; vertical-align: middle;"><img src="${n.content}" style="height: 30px; vertical-align: middle;" alt="News Image"></span>`;
      }
      return `<span style="display:inline-block; margin-left:50px; vertical-align: middle;">${n.content}</span>`;
    }).join('');
    
    // Add dynamic animation keyframes if not exists
    if (!document.getElementById('livePreviewStyles')) {
      const style = document.createElement('style');
      style.id = 'livePreviewStyles';
      document.head.appendChild(style);
    }
    
    // We recreate a simple marquee logic in pure CSS for the preview
    document.getElementById('livePreviewStyles').innerHTML = `
      @keyframes previewScroll {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
      .preview-ticker-content {
        display: inline-block;
        white-space: nowrap;
        animation: previewScroll ${speed}s linear infinite;
      }
      .preview-ticker-container:hover .preview-ticker-content {
        animation-play-state: ${pauseOnHover ? 'paused' : 'running'};
      }
    `;

    previewDiv.innerHTML = `
      <div class="preview-ticker-container" style="background-color: ${bgColor}; color: ${textColor}; padding: 10px 0; overflow: hidden; position: relative; white-space: nowrap; direction: ltr;">
        <div class="preview-ticker-content" dir="rtl">
          ${content}
        </div>
      </div>
    `;
  }

  function addNewsInput(itemObj = null) {
    let type = 'text';
    let content = '';
    
    // Support backwards compatibility for old string array
    if (typeof itemObj === 'string') {
      content = itemObj;
    } else if (itemObj && typeof itemObj === 'object') {
      type = itemObj.type || 'text';
      content = itemObj.content || '';
    }

    const container = document.getElementById('newsItemsContainer');
    const div = document.createElement('div');
    div.className = 'news-item-row';
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.gap = '10px';
    div.style.marginBottom = '15px';
    div.style.padding = '15px';
    div.style.border = '1px solid #ddd';
    div.style.borderRadius = '8px';
    div.style.background = '#fff';
    
    const isNew = !content;

    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="news-drag-handle" style="cursor: grab; color: #999; padding: 0 5px;" title="ڈرैग اینڈ ڈراپ"><i class="fas fa-grip-vertical"></i></span>
        
        <div style="flex:1; display:flex; gap:10px; margin-left: 10px; align-items:center;">
          <select class="news-type-select" style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
            <option value="text" ${type === 'text' ? 'selected' : ''}>ٹیکسٹ</option>
            <option value="image" ${type === 'image' ? 'selected' : ''}>تصویر (PNG)</option>
          </select>
          <button type="button" class="btn-edit-news" style="display: ${isNew ? 'none' : 'inline-block'}; background:#17a2b8; color:#fff; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i> ایڈٹ کریں</button>
          <button type="button" class="btn-done-news" style="display: ${isNew ? 'inline-block' : 'none'}; background:#28a745; color:#fff; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;"><i class="fas fa-check"></i> ڈن (محفوظ)</button>
          <button type="button" class="btn-delete remove-news-btn" style="background:#dc3545; color:#fff; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;"><i class="fas fa-trash"></i> ڈیلیٹ</button>
        </div>
      </div>
      
      <div class="news-input-container" style="margin-top: 5px;">
        <div class="news-text-wrapper" style="display: ${type === 'text' ? 'block' : 'none'};">
            <div class="news-display" style="display: ${isNew ? 'none' : 'block'}; padding: 10px; background: #f9f9f9; border: 1px solid #eee; border-radius: 4px; font-size: 1rem; color: #333; line-height: 1.6;">
              ${content || 'کوئی خبر نہیں...'}
            </div>
            <textarea class="news-text-input" placeholder="یہاں خبر درج کریں..." style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; display: ${isNew ? 'block' : 'none'}; resize: vertical; min-height: 80px; font-family: inherit; font-size: 1rem; line-height: 1.6;">${type === 'text' ? content : ''}</textarea>
        </div>
        
        <div class="news-image-wrapper" style="display: ${type === 'image' ? 'flex' : 'none'}; gap: 10px; align-items: center; width: 100%;">
          <label style="padding: 0.5rem 1rem; border: 1px solid #ccc; background: #f8f9fa; cursor: pointer; border-radius: 4px; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;">
            <i class="fas fa-upload"></i> تصویر منتخب کریں
            <input type="file" class="news-file-input" accept="image/png, image/jpeg" style="display: none;">
          </label>
          <input type="hidden" class="news-image-url" value="${type === 'image' ? content : ''}">
          <div class="news-image-preview">
            ${type === 'image' && content ? `<img src="${content}" style="height: 30px; border-radius: 4px;">` : ''}
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(div);
    
    const typeSelect = div.querySelector('.news-type-select');
    const textInput = div.querySelector('.news-text-input');
    const imageWrapper = div.querySelector('.news-image-wrapper');
    const fileInput = div.querySelector('.news-file-input');
    const urlInput = div.querySelector('.news-image-url');
    const imgPreview = div.querySelector('.news-image-preview');

    const editBtn = div.querySelector('.btn-edit-news');
    const doneBtn = div.querySelector('.btn-done-news');
    const displayDiv = div.querySelector('.news-display');
    const textWrapper = div.querySelector('.news-text-wrapper');

    editBtn.addEventListener('click', () => {
       if (typeSelect.value === 'text') {
           displayDiv.style.display = 'none';
           textInput.style.display = 'block';
       }
       editBtn.style.display = 'none';
       doneBtn.style.display = 'inline-block';
       textInput.focus();
    });

    doneBtn.addEventListener('click', () => {
       if (typeSelect.value === 'text') {
           displayDiv.textContent = textInput.value || 'کوئی خبر نہیں...';
           displayDiv.style.display = 'block';
           textInput.style.display = 'none';
       }
       editBtn.style.display = 'inline-block';
       doneBtn.style.display = 'none';
       renderNewsPreview();
    });

    typeSelect.addEventListener('change', () => {
      if (typeSelect.value === 'text') {
        textWrapper.style.display = 'block';
        imageWrapper.style.display = 'none';
      } else {
        textWrapper.style.display = 'none';
        imageWrapper.style.display = 'flex';
      }
      renderNewsPreview();
    });

    textInput.addEventListener('input', renderNewsPreview);

    fileInput.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        try {
          const fileUrl = await uploadFile(file);
          urlInput.value = fileUrl;
          imgPreview.innerHTML = `<img src="${fileUrl}" style="height: 30px; border-radius: 4px;">`;
          renderNewsPreview();
        } catch (err) {
          showStatus('تصویر اپلوڈ کرنے میں مسئلہ آیا۔', 'error', 'newsStatusMessage');
        }
      }
    });

    div.querySelector('.remove-news-btn').addEventListener('click', () => {
      div.remove();
      renderNewsPreview();
    });
  }

  function loadNewsData() {
    const news = siteData.newsTicker || { items: [], settings: {} };
    const items = news.items || [];
    const settings = news.settings || { speed: 15, pauseOnHover: true, bgColor: '#16a085', textColor: '#ffffff' };

    document.getElementById('newsSpeed').value = settings.speed;
    document.getElementById('speedValue').textContent = settings.speed;
    document.getElementById('newsBgColor').value = settings.bgColor;
    document.getElementById('newsTextColor').value = settings.textColor;
    document.getElementById('newsPauseHover').checked = settings.pauseOnHover;

    const container = document.getElementById('newsItemsContainer');
    container.innerHTML = '';
    
    if (items.length > 0) {
      items.forEach(item => addNewsInput(item));
    } else {
      addNewsInput(); // Add at least one empty input
    }
    
    renderNewsPreview();
  }

  // Bind live preview events
  const newsEvents = ['newsSpeed', 'newsBgColor', 'newsTextColor', 'newsPauseHover'];
  newsEvents.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        if (id === 'newsSpeed') {
          document.getElementById('speedValue').textContent = e.target.value;
        }
        renderNewsPreview();
      });
    }
  });

  const addNewsBtn = document.getElementById('addNewsBtn');
  if (addNewsBtn) {
    addNewsBtn.addEventListener('click', () => addNewsInput());
  }

  // News Submit
  const newsForm = document.getElementById('newsForm');
  if (newsForm) {
    newsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const saveBtn = document.getElementById('saveNewsBtn');
      const originalBtnText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
      saveBtn.disabled = true;

      const items = [];
      document.querySelectorAll('.news-item-row').forEach(row => {
        const type = row.querySelector('.news-type-select').value;
        if (type === 'text') {
          const val = row.querySelector('.news-text-input').value.trim();
          if (val) items.push({ type: 'text', content: val });
        } else {
          const val = row.querySelector('.news-image-url').value;
          if (val) items.push({ type: 'image', content: val });
        }
      });

      siteData.newsTicker = {
        items: items,
        settings: {
          speed: parseInt(document.getElementById('newsSpeed').value),
          pauseOnHover: document.getElementById('newsPauseHover').checked,
          bgColor: document.getElementById('newsBgColor').value,
          textColor: document.getElementById('newsTextColor').value
        }
      };

      saveDataToServer(() => {
        showStatus('خبریں اور سیٹنگز کامیابی سے محفوظ ہو گئیں!', 'success', 'newsStatusMessage');
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
      });
    });
  }

  function loadAdData() {
    if (!siteData.ads) {
      siteData.ads = [];
      if (siteData.adImage) {
        siteData.ads.push({ id: Date.now().toString(), image: siteData.adImage, link: '' });
      }
    }
    if (!siteData.adInterval) {
      siteData.adInterval = 5;
    }
    document.getElementById('adInterval').value = siteData.adInterval;
    renderAdsList();
  }

  function renderAdsList() {
    const container = document.getElementById('adsListContainer');
    if (!container) return;
    container.innerHTML = '';
    
    if (!siteData.ads || siteData.ads.length === 0) {
      container.innerHTML = '<p style="color:#777; text-align: center;">کوئی اشتہار موجود نہیں۔ نیا اشتہار شامل کریں۔</p>';
      return;
    }

    siteData.ads.forEach((ad, index) => {
      const div = document.createElement('div');
      div.className = 'manage-item';
      div.innerHTML = `
        <div style="display: flex; gap: 1rem; align-items: center;">
          <img src="${ad.image}" style="max-height: 50px; border-radius: 4px; border: 1px solid #ccc;">
          <div style="font-size: 0.9rem; color: #555;">
            ${ad.link ? `<a href="${ad.link}" target="_blank">${ad.link}</a>` : 'کوئی لنک نہیں'}
          </div>
        </div>
        <button type="button" class="btn-delete" onclick="deleteAd(${index})">
          <i class="fas fa-trash"></i>
        </button>
      `;
      container.appendChild(div);
    });
  }

  window.deleteAd = function(index) {
    if (confirm('کیا آپ واقعی یہ اشتہار حذف کرنا چاہتے ہیں؟')) {
      siteData.ads.splice(index, 1);
      renderAdsList();
    }
  };

  const addAdBtn = document.getElementById('addAdBtn');
  if (addAdBtn) {
    addAdBtn.addEventListener('click', async () => {
      const fileInput = document.getElementById('adImageFile');
      const linkInput = document.getElementById('adLinkInput');
      
      if (fileInput.files.length > 0) {
        addAdBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
        addAdBtn.disabled = true;
        try {
          const fileUrl = await uploadFile(fileInput.files[0]);
          if (!siteData.ads) siteData.ads = [];
          siteData.ads.push({
            id: Date.now().toString(),
            image: fileUrl,
            link: linkInput.value.trim()
          });
          fileInput.value = '';
          linkInput.value = '';
          renderAdsList();
        } catch (err) {
          console.error(err);
          showStatus('تصویر اپلوڈ کرنے میں مسئلہ آیا۔', 'error', 'adStatusMessage');
        } finally {
          addAdBtn.innerHTML = '<i class="fas fa-plus"></i> شامل کریں';
          addAdBtn.disabled = false;
        }
      } else {
        showStatus('براہ کرم پہلے تصویر منتخب کریں۔', 'error', 'adStatusMessage');
      }
    });
  }

  // Ad Submit (Save all settings)
  const adForm = document.getElementById('adForm');
  if (adForm) {
    adForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      siteData.adInterval = parseInt(document.getElementById('adInterval').value) || 5;
      
      const saveBtn = document.getElementById('saveAdBtn');
      const originalBtnText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
      saveBtn.disabled = true;

      saveDataToServer(() => {
        showStatus('اشتہارات کی سیٹنگز کامیابی سے محفوظ ہو گئیں!', 'success', 'adStatusMessage');
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
      });
    });
  }

  function loadHomeArticleData(index = -1) {
    if (!siteData.homeArticles) siteData.homeArticles = [];
    
    let art = {};
    if (index >= 0 && siteData.homeArticles[index]) {
      art = siteData.homeArticles[index];
      document.getElementById('homeArticleEditIndex').value = index;
      document.getElementById('saveHomeBtn').innerHTML = '<i class="fas fa-save"></i> اپڈیٹ کریں';
    } else {
      document.getElementById('homeArticleEditIndex').value = -1;
      document.getElementById('saveHomeBtn').innerHTML = '<i class="fas fa-save"></i> نیا شامل کریں';
    }

    document.getElementById('homeTitle').value = art.title || '';
    document.getElementById('homeAuthor').value = art.author || '';
    document.getElementById('homeDate').value = art.date || '';
    document.getElementById('homeExcerpt').value = art.excerpt || '';
    if (document.getElementById('homeStatus')) {
      document.getElementById('homeStatus').value = art.status || 'published';
    }
    if (document.getElementById('homeSeoTitle')) {
      document.getElementById('homeSeoTitle').value = art.seoTitle || '';
      document.getElementById('homeSeoDesc').value = art.seoDesc || '';
      document.getElementById('homeSeoKeywords').value = art.seoKeywords || '';
    }
    
    if (art.mediaUrl) {
      document.getElementById('currentHomeImage').innerHTML = `
        <img src="${art.mediaUrl}" style="max-height: 100px; border-radius: 4px;">
        <button type="button" class="btn-delete delete-home-img-btn" data-index="${index}" style="padding: 0.5rem 1rem;"><i class="fas fa-trash"></i> تصویر ہٹائیں</button>
      `;
      // Attach delete event
      document.querySelector('.delete-home-img-btn').addEventListener('click', async (e) => {
        const idx = e.currentTarget.dataset.index;
        if (confirm('کیا آپ واقعی اس تصویر کو حذف کرنا چاہتے ہیں؟')) {
          const imgUrl = siteData.homeArticles[idx].mediaUrl;
          try {
            await fetch('/api/delete-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: imgUrl })
            });
          } catch(err) { console.error(err); }
          
          siteData.homeArticles[idx].mediaUrl = "";
          saveDataToServer(() => {
            loadHomeArticleData(idx);
            renderHomeArticlesList();
            showStatus('تصویر ہٹا دی گئی!', 'success', 'homeStatusMessage');
          });
        }
      });
    } else {
      document.getElementById('currentHomeImage').innerHTML = '';
    }
    
    if (!tinymce.get('homeRichEditor')) {
      initTinyMCE();
    }
    setTimeout(() => {
      if (tinymce.get('homeRichEditor')) {
        tinymce.get('homeRichEditor').setContent(art.fullContent || '');
      }
    }, 100);
  }
  
  window.editHomeArticle = function(index) {
    loadHomeArticleData(index);
    window.scrollTo({ top: document.getElementById('section-home-article').offsetTop, behavior: 'smooth' });
  };
  
  window.deleteHomeArticle = function(index) {
    if (confirm("کیا آپ واقعی اس ہوم پیج مضمون کو ڈیلیٹ کرنا چاہتے ہیں؟")) {
      siteData.homeArticles.splice(index, 1);
      saveDataToServer(() => {
        renderHomeArticlesList();
        loadHomeArticleData(-1);
        showStatus('مضمون ڈیلیٹ ہو گیا!', 'success', 'homeStatusMessage');
      });
    }
  };

  function renderHomeArticlesList() {
    const list = document.getElementById('homeArticlesList');
    if (!list) return;
    list.innerHTML = '';
    
    const articles = siteData.homeArticles || [];
    if (articles.length === 0) {
      list.innerHTML = '<p style="color:#777; text-align: center;">کوئی ہوم پیج مضمون موجود نہیں۔</p>';
      return;
    }
    
    articles.forEach((art, index) => {
      const div = document.createElement('div');
      div.className = 'manage-item';
      div.innerHTML = `
      <div class="manage-item-info">
        <strong>${art.title} ${art.status === 'draft' ? '<span style="background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-right: 10px;">مسودہ (Draft)</span>' : ''}</strong>
        <span style="font-size: 0.9em; color: #555; margin-right: 10px;">(${art.date || 'کوئی تاریخ نہیں'})</span>
      </div>
        <div class="manage-item-actions">
          <button class="btn-edit" onclick="editHomeArticle(${index})"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" onclick="deleteHomeArticle(${index})"><i class="fas fa-trash"></i></button>
        </div>
      `;
      list.appendChild(div);
    });
  }

  // Handle New Article Button
  document.getElementById('newHomeArticleBtn').addEventListener('click', () => {
    loadHomeArticleData(-1);
  });

  // Home Article Submit
  const homeForm = document.getElementById('homeArticleForm');
  if (homeForm) {
    homeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const saveBtn = document.getElementById('saveHomeBtn');
      const originalBtnText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
      saveBtn.disabled = true;

      try {
        const editIndex = parseInt(document.getElementById('homeArticleEditIndex').value, 10);
        const isEditing = editIndex >= 0;
        
        if (!siteData.homeArticles) siteData.homeArticles = [];
        
        let fileUrl = '';
        if (isEditing && siteData.homeArticles[editIndex]) {
          fileUrl = siteData.homeArticles[editIndex].mediaUrl || '';
        }
        
        const fileInput = document.getElementById('homeImageFile');
        if (fileInput.files.length > 0) {
          fileUrl = await uploadFile(fileInput.files[0]);
        }

        const articleData = {
          title: document.getElementById('homeTitle').value,
          author: document.getElementById('homeAuthor').value,
          date: document.getElementById('homeDate').value,
          excerpt: document.getElementById('homeExcerpt').value,
          fullContent: tinymce.get('homeRichEditor') ? tinymce.get('homeRichEditor').getContent() : '',
          mediaUrl: fileUrl,
          status: document.getElementById('homeStatus') ? document.getElementById('homeStatus').value : 'published',
          seoTitle: document.getElementById('homeSeoTitle') ? document.getElementById('homeSeoTitle').value : '',
          seoDesc: document.getElementById('homeSeoDesc') ? document.getElementById('homeSeoDesc').value : '',
          seoKeywords: document.getElementById('homeSeoKeywords') ? document.getElementById('homeSeoKeywords').value : '',
        };

        if (isEditing) {
          siteData.homeArticles[editIndex] = articleData;
        } else {
          // Unshift to add to the beginning (newest first)
          siteData.homeArticles.unshift(articleData);
        }

        saveDataToServer(() => {
          showStatus(isEditing ? 'ہوم پیج مضمون اپڈیٹ کر لیا گیا!' : 'نیا ہوم پیج مضمون شامل کر دیا گیا!', 'success', 'homeStatusMessage');
          fileInput.value = '';
          renderHomeArticlesList();
          loadHomeArticleData(isEditing ? editIndex : 0);
        });
      } catch (err) {
        console.error(err);
        showStatus('فائل اپلوڈ کرنے میں مسئلہ آیا۔', 'error', 'homeStatusMessage');
      } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
      }
    });
  }

  // Section Management Logic
  manageSecCategorySelect.addEventListener('change', renderSectionsList);
  

  document.getElementById('addSectionBtn').addEventListener('click', () => {
    const catId = manageSecCategorySelect.value;
    const nameInput = document.getElementById('newSectionName');
    const colorInput = document.getElementById('newSectionColor');
    const secName = nameInput.value.trim();
    const color = colorInput ? colorInput.value : '#fbbf24';

    if (!secName || !catId) {
      showStatus('کیٹگری منتخب کریں اور سیکشن کا نام درج کریں۔', 'error');
      return;
    }

    const secId = 'sec_' + Date.now();
    siteData.categories[catId].sections.push({ id: secId, title: secName });

    const seriesData = extractSeriesAndSubtitle(secName);
    const series = seriesData.series || secName;
    
    if (!siteData.categories[catId].seriesColors) {
      siteData.categories[catId].seriesColors = {};
    }
    siteData.categories[catId].seriesColors[series] = color;
    
    saveDataToServer(() => {
      showStatus('نیا سیکشن شامل کر دیا گیا!', 'success');
      nameInput.value = '';
      if(colorInput) colorInput.value = '#fbbf24';
      renderSectionsList();
      updateCategoryDropdowns();
    });
  });

  // Category Management Logic
  document.getElementById('nav-manage-categories').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    e.currentTarget.classList.add('active');
    document.getElementById('section-add').style.display = 'none';
    document.getElementById('section-manage').style.display = 'none';
    document.getElementById('section-manage-categories').style.display = 'block';
    document.getElementById('section-manage-sections').style.display = 'none';
    document.getElementById('section-home-article').style.display = 'none';
    document.getElementById('section-ad').style.display = 'none';
    document.getElementById('section-news').style.display = 'none';
    document.getElementById('section-footer').style.display = 'none';
    document.getElementById('section-bg').style.display = 'none';
    renderCategoriesList();
  });

  document.getElementById('addCategoryBtn').addEventListener('click', () => {
    const nameInput = document.getElementById('newCategoryName');
    const typeInput = document.getElementById('newCategoryType');
    const catName = nameInput.value.trim();
    const catType = typeInput.value;

    if (!catName) {
      showStatus('نئی کیٹگری کا نام درج کریں۔', 'error');
      return;
    }

    // Generate a unique ID (lowercase, replace spaces)
    let baseId = catName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!baseId) baseId = 'cat';
    let catId = baseId;
    let count = 1;
    while (siteData.categories[catId]) {
      catId = baseId + count;
      count++;
    }

    siteData.categories[catId] = {
      title: catName,
      type: catType,
      sections: []
    };

    saveDataToServer(() => {
      showStatus('نئی کیٹگری شامل کر دی گئی!', 'success');
      nameInput.value = '';
      renderCategoriesList();
      updateCategoryDropdowns();
    });
  });
}

function renderCategoriesList() {
  const list = document.getElementById('categoriesList');
  list.innerHTML = '';

  const categories = siteData.categories;
  if (Object.keys(categories).length === 0) {
    list.innerHTML = '<p style="color:#777; text-align: center;">کوئی کیٹگری موجود نہیں۔</p>';
    return;
  }

  const typeNames = {
    'article': 'مضامین',
    'post': 'پوسٹس',
    'book': 'کتب',
    'audio': 'آڈیو بیانات'
  };

  Object.keys(categories).forEach(catId => {
    const cat = categories[catId];
    const div = document.createElement('div');
    div.className = 'manage-item';
    div.id = `cat-row-${catId}`;
    div.innerHTML = `
      <div class="manage-item-info">
        <strong>${cat.title}</strong>
        <span>قسم: ${typeNames[cat.type] || cat.type} | سیکشنز: ${cat.sections.length}</span>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-submit" style="padding: 0.3rem 0.6rem; font-size: 0.9rem; border-radius: 4px;" onclick="editCategory('${catId}')">
          <i class="fas fa-edit"></i> ترمیم کریں
        </button>
        <button class="btn-delete" onclick="deleteCategory('${catId}')">
          <i class="fas fa-trash"></i> حذف کریں
        </button>
      </div>
    `;
    list.appendChild(div);
  });
}

window.editCategory = function(catId) {
  const cat = siteData.categories[catId];
  const row = document.getElementById(`cat-row-${catId}`);
  if (!row) return;

  row.innerHTML = `
    <div style="display: flex; gap: 10px; flex: 1; align-items: center;">
      <input type="text" id="editCatName_${catId}" value="${cat.title}" style="flex: 2; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
      <select id="editCatType_${catId}" style="flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
        <option value="article" ${cat.type === 'article' ? 'selected' : ''}>مضامین (Text)</option>
        <option value="post" ${cat.type === 'post' ? 'selected' : ''}>پوسٹس (Images)</option>
        <option value="book" ${cat.type === 'book' ? 'selected' : ''}>کتب (PDF/Links)</option>
        <option value="audio" ${cat.type === 'audio' ? 'selected' : ''}>آڈیو (Audio)</option>
      </select>
    </div>
    <div style="display: flex; gap: 10px; margin-right: 10px;">
      <button class="btn-submit" style="padding: 0.3rem 0.6rem; font-size: 0.9rem; border-radius: 4px;" onclick="saveCategoryEdit('${catId}')">
        <i class="fas fa-save"></i> محفوظ کریں
      </button>
      <button class="btn-delete" style="background-color: #6c757d;" onclick="renderCategoriesList()">
        منسوخ کریں
      </button>
    </div>
  `;
}

window.saveCategoryEdit = function(catId) {
  const newName = document.getElementById(`editCatName_${catId}`).value.trim();
  const newType = document.getElementById(`editCatType_${catId}`).value;

  if (!newName) {
    showStatus('کیٹگری کا نام خالی نہیں ہو سکتا۔', 'error');
    return;
  }

  const cat = siteData.categories[catId];
  cat.title = newName;
  cat.type = newType;

  saveDataToServer(() => {
    showStatus('کیٹگری محفوظ کر لی گئی!', 'success');
    renderCategoriesList();
    updateCategoryDropdowns();
  });
}

window.deleteCategory = function(catId) {
  if (confirm('کیا آپ واقعی یہ کیٹگری، اس کے تمام سیکشنز اور سارا مواد حذف کرنا چاہتے ہیں؟ یہ عمل واپس نہیں ہو سکتا!')) {
    delete siteData.categories[catId];
    // Clean up content
    Object.keys(siteData.content).forEach(dataKey => {
      if (dataKey.startsWith(catId + '_')) {
        delete siteData.content[dataKey];
      }
    });
    
    saveDataToServer(() => {
      showStatus('کیٹگری حذف کر دی گئی!', 'success');
      renderCategoriesList();
      updateCategoryDropdowns();
    });
  }
}

function updateCategoryDropdowns() {
  document.getElementById('catSelect').innerHTML = '<option value="">-- کیٹگری منتخب کریں --</option>';
  document.getElementById('manageCatSelect').innerHTML = '<option value="">-- تمام --</option>';
  document.getElementById('manageSecCategorySelect').innerHTML = '<option value="">-- کیٹگری منتخب کریں --</option>';

  Object.keys(siteData.categories).forEach(key => {
    const cat = siteData.categories[key];
    document.getElementById('catSelect').appendChild(new Option(cat.title, key));
    document.getElementById('manageCatSelect').appendChild(new Option(cat.title, key));
    document.getElementById('manageSecCategorySelect').appendChild(new Option(cat.title, key));
  });
}

function renderSectionsList() {
  const catId = document.getElementById('manageSecCategorySelect').value;
  const sectionsArea = document.getElementById('sectionsArea');
  const list = document.getElementById('sectionsList');
  
  if (!catId) {
    sectionsArea.style.display = 'none';
    return;
  }
  
  sectionsArea.style.display = 'block';
  list.innerHTML = '';
  
  const sections = siteData.categories[catId].sections;
  if (sections.length === 0) {
    list.innerHTML = '<p style="color:#777; text-align: center;">اس کیٹگری میں کوئی سیکشن موجود نہیں۔</p>';
    return;
  }
  
  sections.forEach(sec => {
    const div = document.createElement('div');
    div.className = 'manage-item';
    div.innerHTML = `
      <div class="manage-item-info">
        <strong>${sec.title}</strong>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-submit" style="width: auto; background-color: var(--gold);" onclick="editSection('${catId}', '${sec.id}')">
          <i class="fas fa-edit"></i> ترمیم کریں
        </button>
        <button class="btn-delete" onclick="deleteSection('${catId}', '${sec.id}')">
          <i class="fas fa-trash"></i> حذف کریں
        </button>
      </div>
    `;
    list.appendChild(div);
  });
}

window.editSection = function(catId, secId) {
  const sec = siteData.categories[catId].sections.find(s => s.id === secId);
  if (!sec) return;
  
  const seriesData = extractSeriesAndSubtitle(sec.title);
  const series = seriesData.series || sec.title;
  let currentColor = '#fbbf24';
  
  if (siteData.categories[catId].seriesColors && siteData.categories[catId].seriesColors[series]) {
    currentColor = siteData.categories[catId].seriesColors[series];
  }

  document.getElementById('editSectionCatId').value = catId;
  document.getElementById('editSectionId').value = secId;
  document.getElementById('editSectionNameInput').value = sec.title;
  document.getElementById('editSectionColorInput').value = currentColor;
  
  if (seriesData.series) {
    document.getElementById('editSectionSeriesInfo').textContent = `یہ رنگ '${series}' سیریز پر لاگو ہوگا۔`;
  } else {
    document.getElementById('editSectionSeriesInfo').textContent = '';
  }

  document.getElementById('editSectionModal').style.display = 'flex';
}

document.getElementById('saveEditSectionBtn').addEventListener('click', () => {
  const catId = document.getElementById('editSectionCatId').value;
  const secId = document.getElementById('editSectionId').value;
  const newName = document.getElementById('editSectionNameInput').value.trim();
  const color = document.getElementById('editSectionColorInput').value;

  if (!newName) {
    showStatus('سیکشن کا نام درج کریں۔', 'error');
    return;
  }

  const sec = siteData.categories[catId].sections.find(s => s.id === secId);
  if (sec) {
    sec.title = newName;
    const seriesData = extractSeriesAndSubtitle(newName);
    const series = seriesData.series || newName;
    
    if (!siteData.categories[catId].seriesColors) {
      siteData.categories[catId].seriesColors = {};
    }
    siteData.categories[catId].seriesColors[series] = color;

    saveDataToServer(() => {
      document.getElementById('editSectionModal').style.display = 'none';
      showStatus('سیکشن کی تفصیلات کامیابی سے تبدیل ہو گئیں!', 'success');
      renderSectionsList();
      updateCategoryDropdowns();
    });
  }
});

window.deleteSection = function(catId, secId) {
  if (confirm('کیا آپ واقعی یہ سیکشن اور اس کا تمام مواد حذف کرنا چاہتے ہیں؟')) {
    siteData.categories[catId].sections = siteData.categories[catId].sections.filter(s => s.id !== secId);
    saveDataToServer(() => {
      showStatus('سیکشن حذف کر دیا گیا!', 'success');
      renderSectionsList();
      updateCategoryDropdowns();
    });
  }
}

function renderManageList() {
  const catId = document.getElementById('manageCatSelect').value;
  const secId = document.getElementById('manageSecSelect').value;
  const list = document.getElementById('manageList');
  list.innerHTML = '';

  if (!catId) {
    list.innerHTML = '<p style="color:#777; text-align: center;">براہ کرم کیٹگری منتخب کریں۔</p>';
    return;
  }

  let items = [];
  if (secId) {
    const dataKey = `${catId}_${secId}`;
    items = (siteData.content[dataKey] || []).map(item => ({ ...item, dataKey }));
  } else {
    // Show all sections for category
    siteData.categories[catId].sections.forEach(sec => {
      const dataKey = `${catId}_${sec.id}`;
      const secItems = (siteData.content[dataKey] || []).map(item => ({ ...item, dataKey }));
      items = items.concat(secItems);
    });
  }

  if (items.length === 0) {
    list.innerHTML = '<p style="color:#777; text-align: center;">کوئی مواد موجود نہیں۔</p>';
    return;
  }

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'manage-item';
    div.innerHTML = `
      <div class="manage-item-info">
        <strong>${item.title} ${item.status === 'draft' ? '<span style="background: #f59e0b; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7em; margin-right: 10px;">مسودہ (Draft)</span>' : ''}</strong>
        <span>${item.date ? item.date + ' | ' : ''} ${item.author || ''} | <i class="fas fa-eye"></i> ${item.views || 0} ویوز</span>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-submit" style="background: var(--teal); margin: 0; padding: 0.5rem 1rem; width: auto;" onclick="editItem('${item.dataKey}', '${item.id}')">
          <i class="fas fa-edit"></i> ترمیم کریں
        </button>
        <button class="btn-delete" onclick="deleteItem('${item.dataKey}', '${item.id}')">
          <i class="fas fa-trash"></i> حذف کریں
        </button>
      </div>
    `;
    list.appendChild(div);
  });
}

window.editItem = function(dataKey, itemId) {
  const items = siteData.content[dataKey];
  if (!items) return;
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const [catId, secId] = dataKey.split('_');

  document.getElementById('editCatId').value = catId;
  document.getElementById('editSecId').value = secId;
  document.getElementById('editItemId').value = itemId;

  document.querySelector('#section-add .card-title').textContent = 'مواد میں ترمیم کریں';

  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const navAdd = document.getElementById('nav-add');
  if (navAdd) navAdd.classList.add('active');
  document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
  document.getElementById('section-add').style.display = 'block';

  document.getElementById('catSelect').value = catId;
  document.getElementById('catSelect').dispatchEvent(new Event('change'));
  
  setTimeout(() => {
    document.getElementById('secSelect').value = secId;
    
    document.getElementById('itemTitle').value = item.title || '';
    document.getElementById('itemAuthor').value = item.author || '';
    document.getElementById('itemDate').value = item.date || '';
    if (document.getElementById('itemKalam')) document.getElementById('itemKalam').value = item.kalam || '';
    if (document.getElementById('itemAwaz')) document.getElementById('itemAwaz').value = item.awaz || '';
    document.getElementById('itemExcerpt').value = item.excerpt || '';
    document.getElementById('itemStatus').value = item.status || 'published';
    if (document.getElementById('itemSeoTitle')) document.getElementById('itemSeoTitle').value = item.seoTitle || '';
    if (document.getElementById('itemSeoDesc')) document.getElementById('itemSeoDesc').value = item.seoDesc || '';
    if (document.getElementById('itemSeoKeywords')) document.getElementById('itemSeoKeywords').value = item.seoKeywords || '';
    if (document.getElementById('audioUrlLink')) document.getElementById('audioUrlLink').value = item.audioUrl || '';
    if (document.getElementById('pdfUrlLink')) document.getElementById('pdfUrlLink').value = item.pdfUrl || '';

    if (tinymce.get('richEditor')) {
      tinymce.get('richEditor').setContent(item.fullContent || '');
    }

    if (item.link || (item.mediaUrl && item.mediaUrl.startsWith('http'))) {
      const linkOpt = document.querySelector('input[name="fileTypeOption"][value="link"]');
      if (linkOpt) {
          linkOpt.checked = true;
          linkOpt.dispatchEvent(new Event('change'));
          document.getElementById('mediaLink').value = item.link || item.mediaUrl;
      }
    } else {
      const upOpt = document.querySelector('input[name="fileTypeOption"][value="upload"]');
      if (upOpt) {
          upOpt.checked = true;
          upOpt.dispatchEvent(new Event('change'));
      }
    }

    window.scrollTo(0,0);
  }, 100);
}

window.deleteItem = function(dataKey, itemId) {
  if (confirm('کیا آپ واقعی یہ مواد حذف کرنا چاہتے ہیں؟')) {
    siteData.content[dataKey] = siteData.content[dataKey].filter(i => i.id !== itemId);
    saveDataToServer(() => {
      renderManageList();
    });
  }
}

function saveDataToServer(onSuccess) {
  const btn = document.getElementById('saveBtn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
  btn.disabled = true;

  fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(siteData)
  })
  .then(res => res.json())
  .then(res => {
    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      showStatus('فائل محفوظ کرنے میں مسئلہ آیا۔', 'error');
    }
  })
  .catch(err => {
    console.error(err);
    showStatus('نیٹ ورک کا مسئلہ۔', 'error');
  })
  .finally(() => {
    btn.innerHTML = originalText;
    btn.disabled = false;
  });
}

function showStatus(msg, type, elementId = 'statusMessage') {
  const statusEl = document.getElementById(elementId);
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.className = `status-msg ${type}`;
  setTimeout(() => {
    statusEl.className = 'status-msg';
  }, 4000);
}

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  
  const data = await response.json();
  return data.url;
}

function applyThemeColors() {
  if (siteData && siteData.colors) {
    const root = document.documentElement;
    if (siteData.colors.ink) root.style.setProperty('--ink', siteData.colors.ink);
    if (siteData.colors.parchment) root.style.setProperty('--parchment', siteData.colors.parchment);
    if (siteData.colors.gold) root.style.setProperty('--gold', siteData.colors.gold);
    if (siteData.colors.teal) root.style.setProperty('--teal', siteData.colors.teal);
    if (siteData.colors.maroon) root.style.setProperty('--maroon', siteData.colors.maroon);
    if (siteData.colors.parchment2) root.style.setProperty('--parchment-2', siteData.colors.parchment2);
    
    if (siteData.colors.footerBg) root.style.setProperty('--footer-bg', siteData.colors.footerBg);
    if (siteData.colors.footerText) root.style.setProperty('--footer-text', siteData.colors.footerText);
    if (siteData.colors.footerBottom) root.style.setProperty('--footer-bottom-bg', siteData.colors.footerBottom);
    if (siteData.colors.footerBottomText) root.style.setProperty('--footer-bottom-text', siteData.colors.footerBottomText);
    if (siteData.colors.socialIconBg) root.style.setProperty('--social-icon-bg', siteData.colors.socialIconBg);
    if (siteData.colors.socialIconText) root.style.setProperty('--social-icon-text', siteData.colors.socialIconText);
    if (siteData.colors.feedbackBg) root.style.setProperty('--feedback-bg', siteData.colors.feedbackBg);
    if (siteData.colors.feedbackText) root.style.setProperty('--feedback-text', siteData.colors.feedbackText);
  }
}

function initThemeColors() {
  const colorInk = document.getElementById('colorInk');
  const colorParchment = document.getElementById('colorParchment');
  const colorGold = document.getElementById('colorGold');
  const colorTeal = document.getElementById('colorTeal');
  const colorMaroon = document.getElementById('colorMaroon');
  const colorParchment2 = document.getElementById('colorParchment2');

  const textInk = document.getElementById('textInk');
  const textParchment = document.getElementById('textParchment');
  const textGold = document.getElementById('textGold');
  const textTeal = document.getElementById('textTeal');
  const textMaroon = document.getElementById('textMaroon');
  const textParchment2 = document.getElementById('textParchment2');

  const colorFooterBg = document.getElementById('colorFooterBg');
  const textFooterBg = document.getElementById('textFooterBg');
  const colorFooterText = document.getElementById('colorFooterText');
  const textFooterText = document.getElementById('textFooterText');
  const colorFooterBottom = document.getElementById('colorFooterBottom');
  const textFooterBottom = document.getElementById('textFooterBottom');
  const colorFooterBottomText = document.getElementById('colorFooterBottomText');
  const textFooterBottomText = document.getElementById('textFooterBottomText');
  const colorSocialIconBg = document.getElementById('colorSocialIconBg');
  const textSocialIconBg = document.getElementById('textSocialIconBg');
  const colorSocialIconText = document.getElementById('colorSocialIconText');
  const textSocialIconText = document.getElementById('textSocialIconText');
  const colorFeedbackBg = document.getElementById('colorFeedbackBg');
  const textFeedbackBg = document.getElementById('textFeedbackBg');
  const colorFeedbackText = document.getElementById('colorFeedbackText');
  const textFeedbackText = document.getElementById('textFeedbackText');

  const livePreview = document.getElementById('themeLivePreview');
  if (!colorInk) return;

  const colors = siteData.colors || {
    ink: '#1e293b',
    parchment: '#F8F9FA',
    gold: '#10b981',
    teal: '#0f766e',
    maroon: '#6366f1',
    parchment2: '#e2e8f0',
    footerBg: '#1e293b',
    footerText: '#e2e8f0',
    footerBottom: '#0f766e',
    footerBottomText: '#ffffff',
    socialIconBg: '#0f766e',
    socialIconText: '#ffffff',
    feedbackBg: '#10b981',
    feedbackText: '#ffffff'
  };

  colorInk.value = textInk.value = colors.ink;
  colorParchment.value = textParchment.value = colors.parchment;
  colorGold.value = textGold.value = colors.gold;
  colorTeal.value = textTeal.value = colors.teal;
  colorMaroon.value = textMaroon.value = colors.maroon;
  colorParchment2.value = textParchment2.value = colors.parchment2;

  colorFooterBg.value = textFooterBg.value = colors.footerBg || '#1e293b';
  colorFooterText.value = textFooterText.value = colors.footerText || '#e2e8f0';
  colorFooterBottom.value = textFooterBottom.value = colors.footerBottom || '#0f766e';
  colorFooterBottomText.value = textFooterBottomText.value = colors.footerBottomText || '#ffffff';
  colorSocialIconBg.value = textSocialIconBg.value = colors.socialIconBg || '#0f766e';
  colorSocialIconText.value = textSocialIconText.value = colors.socialIconText || '#ffffff';
  colorFeedbackBg.value = textFeedbackBg.value = colors.feedbackBg || '#10b981';
  colorFeedbackText.value = textFeedbackText.value = colors.feedbackText || '#ffffff';

  function updateLivePreview() {
    if(livePreview) {
      livePreview.style.setProperty('--ink', textInk.value);
      livePreview.style.setProperty('--parchment', textParchment.value);
      livePreview.style.setProperty('--gold', textGold.value);
      livePreview.style.setProperty('--teal', textTeal.value);
      livePreview.style.setProperty('--maroon', textMaroon.value);
      livePreview.style.setProperty('--parchment-2', textParchment2.value);
      
      livePreview.style.setProperty('--footer-bg', textFooterBg.value);
      livePreview.style.setProperty('--footer-text', textFooterText.value);
      livePreview.style.setProperty('--footer-bottom-bg', textFooterBottom.value);
      livePreview.style.setProperty('--footer-bottom-text', textFooterBottomText.value);
      livePreview.style.setProperty('--social-icon-bg', textSocialIconBg.value);
      livePreview.style.setProperty('--social-icon-text', textSocialIconText.value);
      livePreview.style.setProperty('--feedback-bg', textFeedbackBg.value);
      livePreview.style.setProperty('--feedback-text', textFeedbackText.value);
    }
  }

  const pairs = [
    { c: colorInk, t: textInk },
    { c: colorParchment, t: textParchment },
    { c: colorGold, t: textGold },
    { c: colorTeal, t: textTeal },
    { c: colorMaroon, t: textMaroon },
    { c: colorParchment2, t: textParchment2 },
    { c: colorFooterBg, t: textFooterBg },
    { c: colorFooterText, t: textFooterText },
    { c: colorFooterBottom, t: textFooterBottom },
    { c: colorFooterBottomText, t: textFooterBottomText },
    { c: colorSocialIconBg, t: textSocialIconBg },
    { c: colorSocialIconText, t: textSocialIconText },
    { c: colorFeedbackBg, t: textFeedbackBg },
    { c: colorFeedbackText, t: textFeedbackText }
  ];

  pairs.forEach(pair => {
    pair.c.addEventListener('input', (e) => {
      pair.t.value = e.target.value;
      updateLivePreview();
    });
    pair.t.addEventListener('input', (e) => {
      // Update color picker if valid hex
      const val = e.target.value.trim();
      if(val.startsWith('#') && (val.length === 4 || val.length === 7)) {
        pair.c.value = val;
      }
      updateLivePreview();
    });
  });

  updateLivePreview();

  document.getElementById('themeColorsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    siteData.colors = {
      ink: textInk.value.trim(),
      parchment: textParchment.value.trim(),
      gold: textGold.value.trim(),
      teal: textTeal.value.trim(),
      maroon: textMaroon.value.trim(),
      parchment2: textParchment2.value.trim(),
      footerBg: textFooterBg.value.trim(),
      footerText: textFooterText.value.trim(),
      footerBottom: textFooterBottom.value.trim(),
      footerBottomText: textFooterBottomText.value.trim(),
      socialIconBg: textSocialIconBg.value.trim(),
      socialIconText: textSocialIconText.value.trim(),
      feedbackBg: textFeedbackBg.value.trim(),
      feedbackText: textFeedbackText.value.trim()
    };

    const btn = document.getElementById('saveColorsBtn');
    const og = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> محفوظ ہو رہا ہے...';
    btn.disabled = true;

    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData)
    }).then(res => res.json()).then(res => {
      if (res.success) {
        showStatus('رنگ کامیابی سے محفوظ ہو گئے!', 'success', 'themeStatusMessage');
        applyThemeColors();
      } else {
        showStatus('مسئلہ درپیش ہے۔', 'error', 'themeStatusMessage');
      }
    }).catch(err => {
      showStatus('نیٹ ورک کا مسئلہ۔', 'error', 'themeStatusMessage');
    }).finally(() => {
      btn.innerHTML = og;
      btn.disabled = false;
    });
  });

  document.getElementById('resetColorsBtn').addEventListener('click', () => {
    if (confirm('کیا آپ رنگوں کو ڈیفالٹ پر لانا چاہتے ہیں؟')) {
      delete siteData.colors;
      const btn = document.getElementById('resetColorsBtn');
      const og = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>...';
      btn.disabled = true;

      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
      }).then(() => {
         window.location.reload();
      });
    }
  });
}

// ====================
// Dashboard & Messages
// ====================

function renderDashboard() {
  let totalArticles = 0;
  let totalBooks = 0;
  let totalAudios = 0;
  let totalViews = 0;

  if (siteData.content) {
    Object.keys(siteData.content).forEach(key => {
      const catId = key.split('_')[0];
      const cat = siteData.categories[catId];
      if (cat) {
        const items = siteData.content[key];
        const count = items.length;
        if (cat.type === 'article') totalArticles += count;
        if (cat.type === 'book') totalBooks += count;
        if (cat.type === 'audio') totalAudios += count;
        
        items.forEach(i => {
          totalViews += (i.views || 0);
        });
      }
    });
  }
  
  if (siteData.homeArticles) {
    siteData.homeArticles.forEach(i => {
      totalViews += (i.views || 0);
    });
  }
  
  const totalMessages = siteData.messages ? siteData.messages.length : 0;

  document.getElementById('dashTotalArticles').textContent = totalArticles;
  document.getElementById('dashTotalBooks').textContent = totalBooks;
  document.getElementById('dashTotalAudios').textContent = totalAudios;
  document.getElementById('dashTotalViews').textContent = totalViews;
  document.getElementById('dashTotalMessages').textContent = totalMessages;
}

function renderMessages() {
  const container = document.getElementById('messagesList');
  if (!siteData.messages || siteData.messages.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #777;">فی الحال کوئی نیا پیغام موجود نہیں ہے۔</p>';
    return;
  }
  
  // Show newest first
  const messages = [...siteData.messages].reverse();
  
  let html = '';
  messages.forEach(msg => {
    const dateObj = new Date(msg.date);
    const dateStr = dateObj.toLocaleDateString('ur-PK') + ' ' + dateObj.toLocaleTimeString('ur-PK');
    
    html += `
      <div class="message-card" style="background: var(--parchment-2); border: 1px solid #ccc; border-radius: 8px; padding: 1.5rem; position: relative;">
        <button class="btn btn-danger" style="position: absolute; left: 1rem; top: 1rem; padding: 5px 10px; font-size: 0.8rem;" onclick="deleteMessage('${msg.id}')">
          <i class="fas fa-trash"></i> حذف کریں
        </button>
        <h4 style="margin-bottom: 0.5rem; color: var(--ink);">نام: ${msg.name || 'نامعلوم'}</h4>
        <h5 style="margin-bottom: 1rem; color: var(--teal); font-weight: normal;">ای میل: ${msg.email || 'فراہم نہیں کی گئی'}</h5>
        <div style="background: rgba(255,255,255,0.5); padding: 1rem; border-radius: 4px; color: #333; line-height: 1.6; margin-bottom: 1rem;">
          ${msg.message.replace(/\\n/g, '<br>')}
        </div>
        <div style="font-size: 0.8rem; color: #888;">موصول ہوا: ${dateStr}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

window.deleteMessage = function(msgId) {
  if (confirm('کیا آپ واقعی یہ پیغام ڈیلیٹ کرنا چاہتے ہیں؟')) {
    siteData.messages = siteData.messages.filter(m => m.id !== msgId);
    saveDataToServer(() => {
      showStatus('پیغام ڈیلیٹ ہو گیا!', 'success');
      renderMessages();
      renderDashboard(); // update count
    });
  }
};
