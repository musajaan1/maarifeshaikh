const fs = require('fs');
let code = fs.readFileSync('admin/admin.js', 'utf8');

// Replace renderSectionsList
const search1 = `function renderSectionsList() {
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
    div.dataset.id = sec.id;
    div.innerHTML = \`
      <div style="display: flex; align-items: center; gap: 1rem; cursor: grab;" class="sort-handle">
        <i class="fas fa-grip-lines" style="color: #aaa; font-size: 1.2rem;"></i>
      </div>
      <div class="manage-item-info" style="flex: 1;">
        <strong>\${sec.title}</strong>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-submit" style="width: auto; background-color: var(--gold);" onclick="editSection('\${catId}', '\${sec.id}')">
          <i class="fas fa-edit"></i> ترمیم کریں
        </button>
        <button class="btn-delete" onclick="deleteSection('\${catId}', '\${sec.id}')">
          <i class="fas fa-trash"></i> حذف کریں
        </button>
      </div>
    \`;
    list.appendChild(div);
  });

  if (typeof Sortable !== 'undefined') {`;

const replace1 = `function renderSectionsList() {
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

  const parentSelect = document.getElementById('newSectionParent');
  if (parentSelect) {
    parentSelect.innerHTML = '<option value="">-- مین سیکشن (کوئی نہیں) --</option>';
    sections.forEach(s => {
        parentSelect.appendChild(new Option(s.title, s.id));
    });
  }

  const topLevel = sections.filter(s => !s.parent_id);
  const childrenMap = {};
  sections.forEach(s => {
      if (s.parent_id) {
          if (!childrenMap[s.parent_id]) childrenMap[s.parent_id] = [];
          childrenMap[s.parent_id].push(s);
      }
  });

  window.toggleSubsections = function(id) {
     const el = document.getElementById('children-of-' + id);
     const icon = document.getElementById('icon-of-' + id);
     if (el) {
         if (el.style.display === 'none') {
             el.style.display = 'block';
             if(icon) icon.className = 'fas fa-chevron-up';
         } else {
             el.style.display = 'none';
             if(icon) icon.className = 'fas fa-chevron-down';
         }
     }
  };

  const renderItem = (sec, container, depth = 0) => {
    const div = document.createElement('div');
    div.className = 'manage-item';
    div.dataset.id = sec.id;
    div.style.marginLeft = (depth * 2) + 'rem';
    if (depth > 0) div.style.borderRight = '3px solid var(--gold)';
    
    const hasChildren = childrenMap[sec.id] && childrenMap[sec.id].length > 0;
    let expandIcon = '<span style="display:inline-block; width:24px;"></span>';
    if (hasChildren) {
        expandIcon = \`<i id="icon-of-\${sec.id}" class="fas fa-chevron-up" style="cursor: pointer; padding: 5px; color: var(--teal);" onclick="toggleSubsections('\${sec.id}')"></i>\`;
    }
    
    div.innerHTML = \`
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <i class="fas fa-grip-lines sort-handle" style="color: #aaa; cursor:grab;"></i>
        \${expandIcon}
      </div>
      <div class="manage-item-info" style="flex: 1;">
        <strong>\${sec.title}</strong>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn-submit" style="width: auto; background-color: var(--gold);" onclick="editSection('\${catId}', '\${sec.id}')">
          <i class="fas fa-edit"></i> ترمیم کریں
        </button>
        <button class="btn-delete" onclick="deleteSection('\${catId}', '\${sec.id}')">
          <i class="fas fa-trash"></i> حذف کریں
        </button>
      </div>
    \`;
    container.appendChild(div);
    
    if (hasChildren) {
        const childrenContainer = document.createElement('div');
        childrenContainer.id = 'children-of-' + sec.id;
        childrenContainer.style.display = 'block';
        container.appendChild(childrenContainer);
        childrenMap[sec.id].forEach(child => {
           renderItem(child, childrenContainer, depth + 1);
        });
    }
  };
  
  topLevel.forEach(sec => renderItem(sec, list, 0));

  if (typeof Sortable !== 'undefined') {`;

// Replace editSection
const search2 = `window.editSection = function(catId, secId) {
  const sec = siteData.categories[catId].sections.find(s => s.id == secId);
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
  
  if (seriesData.series) {`;

const replace2 = `window.editSection = function(catId, secId) {
  const sec = siteData.categories[catId].sections.find(s => s.id == secId);
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
  
  const parentSelect = document.getElementById('editSectionParent');
  if (parentSelect) {
    parentSelect.innerHTML = '<option value="">-- مین سیکشن (کوئی نہیں) --</option>';
    siteData.categories[catId].sections.forEach(s => {
        if (s.id !== secId) { // Prevent selecting itself as parent
            const opt = new Option(s.title, s.id);
            if (s.id === sec.parent_id) opt.selected = true;
            parentSelect.appendChild(opt);
        }
    });
  }
  
  if (seriesData.series) {`;

// We also need to find addSectionBtn
const search3 = `  document.getElementById('addSectionBtn').addEventListener('click', () => {
    const catId = manageSecCategorySelect.value;
    const nameInput = document.getElementById('newSectionName');
    const colorInput = document.getElementById('newSectionColor');
    const secName = nameInput.value.trim();
    const color = colorInput ? colorInput.value : '#fbbf24';

    if (!secName || !catId) {
      showStatus('کیٹیگری اور سیکشن کا نام درج کرنا ضروری ہے', 'error');
      return;
    }

    const secId = 'sec_' + Date.now();
    siteData.categories[catId].sections.push({ id: secId, title: secName });`;

const replace3 = `  document.getElementById('addSectionBtn').addEventListener('click', () => {
    const catId = manageSecCategorySelect.value;
    const nameInput = document.getElementById('newSectionName');
    const colorInput = document.getElementById('newSectionColor');
    const parentSelect = document.getElementById('newSectionParent');
    const secName = nameInput.value.trim();
    const color = colorInput ? colorInput.value : '#fbbf24';
    const parentId = parentSelect ? parentSelect.value : '';

    if (!secName || !catId) {
      showStatus('کیٹیگری اور سیکشن کا نام درج کرنا ضروری ہے', 'error');
      return;
    }

    const secId = 'sec_' + Date.now();
    const newSecObj = { id: secId, title: secName };
    if (parentId) newSecObj.parent_id = parentId;
    siteData.categories[catId].sections.push(newSecObj);`;

const search4 = `  document.getElementById('editSectionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const catId = document.getElementById('editSectionCatId').value;
    const secId = document.getElementById('editSectionId').value;
    const newTitle = document.getElementById('editSectionNameInput').value.trim();
    const newColor = document.getElementById('editSectionColorInput').value;
    
    if (!newTitle) {
      showStatus('سیکشن کا نام خالی نہیں ہو سکتا', 'error');
      return;
    }

    const sec = siteData.categories[catId].sections.find(s => s.id === secId);
    if (sec) {
      const oldTitle = sec.title;
      sec.title = newTitle;
      
      const seriesData = extractSeriesAndSubtitle(newTitle);
      const series = seriesData.series || newTitle;
      if (!siteData.categories[catId].seriesColors) {
        siteData.categories[catId].seriesColors = {};
      }
      siteData.categories[catId].seriesColors[series] = newColor;`;

const replace4 = `  document.getElementById('editSectionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const catId = document.getElementById('editSectionCatId').value;
    const secId = document.getElementById('editSectionId').value;
    const newTitle = document.getElementById('editSectionNameInput').value.trim();
    const newColor = document.getElementById('editSectionColorInput').value;
    const parentSelect = document.getElementById('editSectionParent');
    const parentId = parentSelect ? parentSelect.value : '';
    
    if (!newTitle) {
      showStatus('سیکشن کا نام خالی نہیں ہو سکتا', 'error');
      return;
    }

    const sec = siteData.categories[catId].sections.find(s => s.id === secId);
    if (sec) {
      const oldTitle = sec.title;
      sec.title = newTitle;
      if (parentId) {
          sec.parent_id = parentId;
      } else {
          delete sec.parent_id;
      }
      
      const seriesData = extractSeriesAndSubtitle(newTitle);
      const series = seriesData.series || newTitle;
      if (!siteData.categories[catId].seriesColors) {
        siteData.categories[catId].seriesColors = {};
      }
      siteData.categories[catId].seriesColors[series] = newColor;`;


if (code.includes(search1)) {
    code = code.replace(search1, replace1);
    console.log("search1 success");
} else { console.log("search1 failed"); }

if (code.includes(search2)) {
    code = code.replace(search2, replace2);
    console.log("search2 success");
} else { console.log("search2 failed"); }

if (code.includes(search3)) {
    code = code.replace(search3, replace3);
    console.log("search3 success");
} else { console.log("search3 failed"); }

if (code.includes(search4)) {
    code = code.replace(search4, replace4);
    console.log("search4 success");
} else { console.log("search4 failed"); }

fs.writeFileSync('admin/admin.js', code);
