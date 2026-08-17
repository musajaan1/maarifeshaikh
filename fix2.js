const fs = require('fs');
let code = fs.readFileSync('admin/admin.js', 'utf8');
const search = `        const articleData = {
          title: document.getElementById('homeTitle').value,
          author: document.getElementById('homeAuthor').value,
      }
    });
  }`;
const replace = `        const articleData = {
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
          siteData.homeArticles.unshift(articleData);
        }

        saveDataToServer(() => {
          showStatus(isEditing ? 'ہوم پیج مضمون اپڈیٹ کر لیا گیا!' : 'نیا ہوم پیج مضمون شامل کر دیا گیا!', 'success', 'homeStatusMessage');
          fileInput.value = '';
          if (document.getElementById('homeImageUrl')) document.getElementById('homeImageUrl').value = '';
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
  }`;
fs.writeFileSync('admin/admin.js', code.replace(search, replace));
console.log('Fixed');
