const fs = require('fs');

let adminHtml = fs.readFileSync('admin/index.html', 'utf8');
adminHtml = adminHtml.replace(/<script src="\/admin\/admin\.js.*?"><\/script>/, '<script src="/admin/admin.js?v=' + Date.now() + '"></script>');
fs.writeFileSync('admin/index.html', adminHtml);

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/<script src="\/main\.js.*?"><\/script>/, '<script src="/main.js?v=' + Date.now() + '"></script>');
fs.writeFileSync('index.html', indexHtml);

// Fix indentation rendering in admin.js
let adminJs = fs.readFileSync('admin/admin.js', 'utf8');
adminJs = adminJs.replace(/const isSub = !!sec\.parent_id;[\s\S]*?div\.innerHTML = `/m, `const isSub = !!sec.parent_id;
      const marginStyle = isSub ? 'margin-right: 3rem; border-right: 3px solid #fbbf24; padding-right: 15px; background-color: rgba(251, 191, 36, 0.05); border-radius: 4px;' : '';
      const prefix = isSub ? '<span style="color: #fbbf24; margin-left: 8px; font-weight: bold;">↳</span> ' : '';
      const parentName = isSub ? \` <span style="font-size: 0.8rem; color: #888;">(سب-سیکشن)</span>\` : '';

      div.innerHTML = \``);
fs.writeFileSync('admin/admin.js', adminJs);
