const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Fix renderCategory (only show root sections)
const searchCategory = `currentCategory.sections.forEach(sec => {
      const { series, subtitle } = extractSeriesAndSubtitle(sec.title);`;
const replaceCategory = `currentCategory.sections.filter(sec => !sec.parent_id).forEach(sec => {
      const { series, subtitle } = extractSeriesAndSubtitle(sec.title);`;

// 2. Fix renderSection (show child sections and update breadcrumb)
const searchSection = `    const itemList = document.getElementById("itemList");
    const dataKey = \`\${categoryId}_\${sectionId}\`;
    const items = (siteData.content[dataKey] || []).filter(a => a.status !== 'draft');`;

const replaceSection = `    const itemList = document.getElementById("itemList");
    
    // --- NESTED SECTIONS LOGIC START ---
    // Handle Breadcrumb for Nested Section
    const breadcrumb = document.getElementById("secBreadcrumb");
    if (currentSection.parent_id) {
       const parentSec = currentCategory.sections.find(s => s.id === currentSection.parent_id);
       if (parentSec) {
         breadcrumb.innerHTML = \`<a href="#" class="nav-home">ہوم</a> <span class="bc-sep"><i class="fas fa-chevron-left"></i></span> <a href="#" class="nav-cat" data-category="\${categoryId}">\${currentCategory.title}</a> <span class="bc-sep"><i class="fas fa-chevron-left"></i></span> <a href="#" onclick="window.renderSection('\${categoryId}', '\${parentSec.id}')" style="color:var(--gold);">\${parentSec.title}</a> <span class="bc-sep"><i class="fas fa-chevron-left"></i></span> \${currentSection.title}\`;
       }
    }
    
    // Find Child Sections
    const childSections = currentCategory.sections.filter(sec => sec.parent_id === sectionId);
    if (childSections.length > 0) {
       let subHtml = '<div class="series-group"><div class="section-grid">';
       childSections.forEach(sec => {
         let folderColor = '#fbbf24';
         if (currentCategory.seriesColors && currentCategory.seriesColors[sec.title]) {
           folderColor = currentCategory.seriesColors[sec.title];
         }
         const displayTitle = extractSeriesAndSubtitle(sec.title).subtitle || sec.title;
         subHtml += \`<div class="section-card" onclick="window.renderSection('\${categoryId}', '\${sec.id}')">
            <i class="fa-solid fa-folder" style="color: \${folderColor};"></i> <span title="\${displayTitle}">\${displayTitle}</span>
         </div>\`;
       });
       subHtml += '</div></div>';
       
       const subContainer = document.createElement('div');
       subContainer.innerHTML = subHtml;
       itemList.parentNode.insertBefore(subContainer, itemList);
    }
    // --- NESTED SECTIONS LOGIC END ---

    const dataKey = \`\${categoryId}_\${sectionId}\`;
    const items = (siteData.content[dataKey] || []).filter(a => a.status !== 'draft');`;

if (code.includes(searchCategory) && code.includes(searchSection)) {
  code = code.replace(searchCategory, replaceCategory);
  code = code.replace(searchSection, replaceSection);
  
  // Expose renderSection to window if not already
  if (!code.includes('window.renderSection = renderSection;')) {
      code = code.replace('function renderSection(categoryId, sectionId) {', 'window.renderSection = renderSection;\n  function renderSection(categoryId, sectionId) {');
  }

  fs.writeFileSync('main.js', code);
  console.log("main.js updated successfully");
} else {
  console.log("Searches not found.");
  console.log("searchCategory found:", code.includes(searchCategory));
  console.log("searchSection found:", code.includes(searchSection));
}
