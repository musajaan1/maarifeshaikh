const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Update showCategoryContent
const searchCategory = `function showCategoryContent(catId, catTitle) {
  currentCategory = catId;
  const contentDiv = document.getElementById('category-content');
  const cat = siteData.categories[catId];
  if (!cat) return;

  let html = \`<div class="header-area">
    <h2 class="section-title">\${catTitle}</h2>
  </div>
  <div class="section-cards">\`;

  if (cat.sections && cat.sections.length > 0) {
    cat.sections.forEach(sec => {
      const color = getCategoryColor(catId, sec.title);
      html += \`
        <div class="section-card" onclick="showSectionContent('\${catId}', '\${sec.id}', '\${sec.title}', '\${color}')">
          <div class="card-icon" style="background-color: \${color}22; color: \${color};">
            <i class="fas fa-folder-open"></i>
          </div>
          <h3 class="card-title">\${sec.title}</h3>
          <div class="card-meta">تفصیلات کے لیے کلک کریں</div>
        </div>
      \`;
    });
  } else {
    html += \`<div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: #777;">
      <i class="fas fa-folder-open" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
      <p>اس کیٹیگری میں کوئی سیکشن موجود نہیں ہے۔</p>
    </div>\`
  }
  html += \`</div>\`;
  
  contentDiv.innerHTML = html;
}`;

const replaceCategory = `function showCategoryContent(catId, catTitle) {
  currentCategory = catId;
  const contentDiv = document.getElementById('category-content');
  const cat = siteData.categories[catId];
  if (!cat) return;

  let html = \`<div class="header-area">
    <h2 class="section-title">\${catTitle}</h2>
  </div>
  <div class="section-cards">\`;

  if (cat.sections && cat.sections.length > 0) {
    // Only show root sections (where parent_id is null/undefined)
    const rootSections = cat.sections.filter(sec => !sec.parent_id);
    if (rootSections.length > 0) {
      rootSections.forEach(sec => {
        const color = getCategoryColor(catId, sec.title);
        html += \`
          <div class="section-card" onclick="showSectionContent('\${catId}', '\${sec.id}', '\${sec.title}', '\${color}')">
            <div class="card-icon" style="background-color: \${color}22; color: \${color};">
              <i class="fas fa-folder-open"></i>
            </div>
            <h3 class="card-title">\${sec.title}</h3>
            <div class="card-meta">تفصیلات کے لیے کلک کریں</div>
          </div>
        \`;
      });
    } else {
      html += \`<div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: #777;">
        <i class="fas fa-folder-open" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
        <p>اس کیٹیگری میں کوئی مین سیکشن موجود نہیں ہے۔</p>
      </div>\`
    }
  } else {
    html += \`<div style="grid-column: 1/-1; text-align:center; padding: 3rem; color: #777;">
      <i class="fas fa-folder-open" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
      <p>اس کیٹیگری میں کوئی سیکشن موجود نہیں ہے۔</p>
    </div>\`
  }
  html += \`</div>\`;
  
  contentDiv.innerHTML = html;
}`;

const searchSection = `function showSectionContent(catId, secId, secTitle, color) {
  const contentDiv = document.getElementById('category-content');
  const cat = siteData.categories[catId];
  const items = cat.items ? cat.items.filter(item => item.sectionId === secId) : [];

  const { series, subtitle } = extractSeriesAndSubtitle(secTitle);
  const displayTitle = subtitle ? \`\${series} <br><span style="font-size:0.6em; opacity:0.8;">\${subtitle}</span>\`: series;

  let html = \`
    <div class="header-area">
      <h2 class="section-title">\${displayTitle}</h2>
      <div class="breadcrumb" onclick="showCategoryContent('\${catId}', '\${cat.title}')">
        <i class="fas fa-arrow-right"></i> واپس \${cat.title}
      </div>
    </div>
  \`;

  if (items.length > 0) {
    html += \`<div class="items-grid">\`;
    items.forEach((item, index) => {
      html += createItemHTML(item, index, color);
    });
    html += \`</div>\`;
  } else {
    html += \`<div style="text-align:center; padding: 3rem; color: #777;">
      <i class="fas fa-box-open" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
      <p>اس سیکشن میں ابھی کوئی مواد نہیں ہے۔</p>
    </div>\`
  }

  contentDiv.innerHTML = html;
}`;

const replaceSection = `function showSectionContent(catId, secId, secTitle, color, parentCatTitle = '', parentSecId = '') {
  const contentDiv = document.getElementById('category-content');
  const cat = siteData.categories[catId];
  
  // Find child sections of THIS section
  const childSections = cat.sections ? cat.sections.filter(sec => sec.parent_id === secId) : [];
  
  // Find items of THIS section
  const items = cat.items ? cat.items.filter(item => item.sectionId === secId) : [];

  const { series, subtitle } = extractSeriesAndSubtitle(secTitle);
  const displayTitle = subtitle ? \`\${series} <br><span style="font-size:0.6em; opacity:0.8;">\${subtitle}</span>\`: series;

  let breadcrumbHTML = \`
      <div class="breadcrumb" onclick="showCategoryContent('\${catId}', '\${cat.title}')">
        <i class="fas fa-arrow-right"></i> واپس \${cat.title}
      </div>
  \`;
  if (parentSecId) {
     breadcrumbHTML = \`
      <div class="breadcrumb" onclick="showSectionContent('\${catId}', '\${parentSecId}', '\${parentCatTitle}', '\${color}')">
        <i class="fas fa-arrow-right"></i> واپس \${parentCatTitle}
      </div>
    \`;
  }

  let html = \`
    <div class="header-area">
      <h2 class="section-title">\${displayTitle}</h2>
      \${breadcrumbHTML}
    </div>
  \`;

  // Render Child Sections as folders first
  if (childSections.length > 0) {
    html += \`<div class="section-cards" style="margin-bottom: 2rem;">\`;
    childSections.forEach(sec => {
      const childColor = getCategoryColor(catId, sec.title);
      html += \`
        <div class="section-card" onclick="showSectionContent('\${catId}', '\${sec.id}', '\${sec.title}', '\${childColor}', '\${secTitle}', '\${secId}')">
          <div class="card-icon" style="background-color: \${childColor}22; color: \${childColor};">
            <i class="fas fa-folder-open"></i>
          </div>
          <h3 class="card-title">\${sec.title}</h3>
          <div class="card-meta">تفصیلات کے لیے کلک کریں</div>
        </div>
      \`;
    });
    html += \`</div>\`;
  }

  // Then render items
  if (items.length > 0) {
    if (childSections.length > 0) { html += \`<h3 style="margin: 1rem 0; color: var(--primary-dark);">مواد</h3>\`; }
    html += \`<div class="items-grid">\`;
    items.forEach((item, index) => {
      html += createItemHTML(item, index, color);
    });
    html += \`</div>\`;
  } else if (childSections.length === 0) {
    html += \`<div style="text-align:center; padding: 3rem; color: #777;">
      <i class="fas fa-box-open" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
      <p>اس سیکشن میں ابھی کوئی مواد نہیں ہے۔</p>
    </div>\`
  }

  contentDiv.innerHTML = html;
}`;

if (code.includes(searchCategory) && code.includes(searchSection)) {
  code = code.replace(searchCategory, replaceCategory);
  code = code.replace(searchSection, replaceSection);
  fs.writeFileSync('main.js', code);
  console.log("main.js updated successfully");
} else {
  console.log("Searches not found.");
  console.log("searchCategory found:", code.includes(searchCategory));
  console.log("searchSection found:", code.includes(searchSection));
}
