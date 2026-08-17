const fs = require('fs');
let code = fs.readFileSync('admin/admin.js', 'utf8');

// 1. Update Section Creation
const createSearch = `    const colorInput = document.getElementById('newSectionColor');
    const secName = nameInput.value.trim();
    const color = colorInput ? colorInput.value : '#fbbf24';

    if (!secName || !catId) {
      showStatus('کیٹگری منتخب کریں اور سیکشن کا نام درج کریں۔', 'error');
      return;
    }

    const secId = 'sec_' + Date.now();
    siteData.categories[catId].sections.push({ id: secId, title: secName });`;

const createReplace = `    const colorInput = document.getElementById('newSectionColor');
    const parentInput = document.getElementById('newSectionParent');
    const secName = nameInput.value.trim();
    const color = colorInput ? colorInput.value : '#fbbf24';
    const parentId = parentInput ? parentInput.value : '';

    if (!secName || !catId) {
      showStatus('کیٹگری منتخب کریں اور سیکشن کا نام درج کریں۔', 'error');
      return;
    }

    const secId = 'sec_' + Date.now();
    const newSection = { id: secId, title: secName };
    if (parentId) {
      newSection.parent_id = parentId;
    }
    siteData.categories[catId].sections.push(newSection);`;

code = code.replace(createSearch, createReplace);

// 2. Update renderSectionsList (Parent Dropdown & Nested Rendering)
const renderSearch = `  function renderSectionsList() {
    const list = document.getElementById('sectionsManageList');
    if (!list) return;
    list.innerHTML = '';
    
    const catId = document.getElementById('manageSecCategorySelect').value;
    if (!catId || !siteData.categories[catId]) return;
    
    const sections = siteData.categories[catId].sections || [];
    
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
        <div class="manage-item-actions">
          <button class="btn-edit" onclick="editSection('\${catId}', '\${sec.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" onclick="deleteSection('\${catId}', '\${sec.id}')"><i class="fas fa-trash"></i></button>
        </div>
      \`;
      list.appendChild(div);
    });`;

const renderReplace = `  function renderSectionsList() {
    const list = document.getElementById('sectionsManageList');
    if (!list) return;
    list.innerHTML = '';
    
    const catId = document.getElementById('manageSecCategorySelect').value;
    if (!catId || !siteData.categories[catId]) return;
    
    const sections = siteData.categories[catId].sections || [];
    
    // Populate the Parent Dropdowns
    const parentOptions = '<option value="">-- مین سیکشن (کوئی نہیں) --</option>' + 
      sections.filter(s => !s.parent_id).map(s => \`<option value="\${s.id}">\${s.title}</option>\`).join('');
    
    const newSecParent = document.getElementById('newSectionParent');
    if (newSecParent) newSecParent.innerHTML = parentOptions;
    const editSecParent = document.getElementById('editSectionParent');
    if (editSecParent) editSecParent.innerHTML = parentOptions;
    
    // Sort sections for display: Top level first, then its children
    let sortedSections = [];
    sections.filter(s => !s.parent_id).forEach(parent => {
      sortedSections.push(parent);
      sortedSections.push(...sections.filter(s => s.parent_id === parent.id));
    });
    // Add any orphans just in case
    sections.forEach(s => { if (!sortedSections.includes(s)) sortedSections.push(s); });
    
    sortedSections.forEach(sec => {
      const div = document.createElement('div');
      div.className = 'manage-item';
      div.dataset.id = sec.id;
      
      const isSub = !!sec.parent_id;
      const marginStyle = isSub ? 'margin-right: 3rem; border-right: 3px solid #fbbf24; padding-right: 15px; background-color: rgba(251, 191, 36, 0.05); border-radius: 4px;' : '';
      const prefix = isSub ? '<span style="color: #fbbf24; margin-left: 8px; font-weight: bold;">↳</span> ' : '';
      const parentName = isSub ? \` <span style="font-size: 0.8rem; color: #888;">(سب-سیکشن)</span>\` : '';

      div.innerHTML = \`
        <div style="display: flex; align-items: center; gap: 1rem; cursor: grab;" class="sort-handle">
          <i class="fas fa-grip-lines" style="color: #aaa; font-size: 1.2rem;"></i>
        </div>
      <div class="manage-item-info" style="flex: 1; \${marginStyle}">
        <strong>\${prefix}\${sec.title}\${parentName}</strong>
      </div>
        <div class="manage-item-actions">
          <button class="btn-edit" onclick="editSection('\${catId}', '\${sec.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" onclick="deleteSection('\${catId}', '\${sec.id}')"><i class="fas fa-trash"></i></button>
        </div>
      \`;
      list.appendChild(div);
    });`;

code = code.replace(renderSearch, renderReplace);

// 3. Update editSection (Populate edit form with parent)
const editSearch = `  const sec = siteData.categories[catId].sections.find(s => s.id == secId);
  if (sec) {
    document.getElementById('editSectionId').value = secId;
    document.getElementById('editSectionNameInput').value = sec.title;
    
    // Find color from series if available
    const seriesData = extractSeriesAndSubtitle(sec.title);
    const series = seriesData.series || sec.title;
    const currentColor = getCategoryColor(catId, series);
    document.getElementById('editSectionColorInput').value = currentColor;

    document.getElementById('editSectionModal').style.display = 'flex';
  }`;

const editReplace = `  const sec = siteData.categories[catId].sections.find(s => s.id == secId);
  if (sec) {
    document.getElementById('editSectionId').value = secId;
    document.getElementById('editSectionNameInput').value = sec.title;
    
    // Find color from series if available
    const seriesData = extractSeriesAndSubtitle(sec.title);
    const series = seriesData.series || sec.title;
    const currentColor = getCategoryColor(catId, series);
    document.getElementById('editSectionColorInput').value = currentColor;
    const editSecParent = document.getElementById('editSectionParent');
    if (editSecParent) {
      editSecParent.value = sec.parent_id || '';
      // Disable selecting itself as parent
      Array.from(editSecParent.options).forEach(opt => {
        opt.disabled = (opt.value === secId);
      });
    }

    document.getElementById('editSectionModal').style.display = 'flex';
  }`;

code = code.replace(editSearch, editReplace);


// 4. Update Save Edit Section
const saveEditSearch = `  const secId = document.getElementById('editSectionId').value;
  const newName = document.getElementById('editSectionNameInput').value.trim();
  const color = document.getElementById('editSectionColorInput').value;

  if (!newName) {
    showStatus('سیکشن کا نام درج کریں۔', 'error');
    return;
  }

  const sec = siteData.categories[catId].sections.find(s => s.id == secId);
  if (sec) {
    sec.title = newName;`;

const saveEditReplace = `  const secId = document.getElementById('editSectionId').value;
  const newName = document.getElementById('editSectionNameInput').value.trim();
  const color = document.getElementById('editSectionColorInput').value;
  const parentSelect = document.getElementById('editSectionParent');
  const newParentId = parentSelect ? parentSelect.value : '';

  if (!newName) {
    showStatus('سیکشن کا نام درج کریں۔', 'error');
    return;
  }

  const secIndex = siteData.categories[catId].sections.findIndex(s => s.id == secId);
  if (secIndex !== -1) {
    siteData.categories[catId].sections[secIndex].title = newName;
    if (newParentId) {
      siteData.categories[catId].sections[secIndex].parent_id = newParentId;
    } else {
      delete siteData.categories[catId].sections[secIndex].parent_id;
    }
    const sec = siteData.categories[catId].sections[secIndex];`;

code = code.replace(saveEditSearch, saveEditReplace);

fs.writeFileSync('admin/admin.js', code);
console.log('Fixed admin.js without destroying UTF-8 chars');
