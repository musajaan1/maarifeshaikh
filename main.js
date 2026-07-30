let siteData = null;

document.addEventListener("DOMContentLoaded", () => {
  fetch('/api/data')
    .then(res => res.json())
    .then(data => {
      siteData = data;
      applyBackground();
      applyLogo();
      applyThemeColors();
      populateFooter();
      initApp();
    })
    .catch(err => {
      console.error("Failed to load data", err);
      document.getElementById('appRoot').innerHTML = '<div class="empty-message">ڈیٹا لوڈ کرنے میں مسئلہ ہے۔ برائے مہربانی سرور چیک کریں۔</div>';
    });
});

function updateSEO(title, description, keywords, articleData = null) {
  const baseTitle = "معارف شیخ - اسلامی مواد";
  const defaultDesc = "معارف شیخ - مستند اسلامی مواد، بیانات اور مضامین کا مجموعہ";
  const defaultKeywords = "اسلام, معارف, شیخ, بیانات, مضامین";

  document.getElementById('pageTitle').textContent = title ? `${title} | ${baseTitle}` : baseTitle;
  
  const metaDesc = document.getElementById('metaDescription');
  if (metaDesc) metaDesc.content = description || defaultDesc;

  const metaKw = document.getElementById('metaKeywords');
  if (metaKw) metaKw.content = keywords || defaultKeywords;

  const schemaScript = document.getElementById('seoSchema');
  if (schemaScript) {
    if (articleData) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": articleData.title || title,
        "description": description || defaultDesc,
        "author": {
          "@type": "Person",
          "name": articleData.author || "معارف شیخ"
        },
        "datePublished": articleData.date || "",
        "image": articleData.mediaUrl || ""
      };
      schemaScript.textContent = JSON.stringify(schema);
    } else {
      schemaScript.textContent = "";
    }
  }
}

function applyLogo() {
  const logoLink = document.getElementById('headerLogoLink');
  if (logoLink && siteData && siteData.logo) {
    logoLink.innerHTML = `<div class="logo-shine-wrapper"><img src="${siteData.logo}" alt="Logo" style="max-height: 75px; max-width: 300px; object-fit: contain; display: block; transition: transform 0.3s ease;"></div>`;
    
    // Add hover effect since we removed the logo-circle class
    logoLink.onmouseover = () => logoLink.style.transform = 'scale(1.05)';
    logoLink.onmouseout = () => logoLink.style.transform = 'scale(1)';
    logoLink.style.transition = 'transform 0.3s ease';
  }
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

function applyBackground() {
  const bg = siteData.background;
  if (!bg || !bg.value) return;

  if (bg.type === 'color' || bg.type === 'gradient') {
    document.body.style.background = bg.value;
  } else if (bg.type === 'image') {
    document.body.style.background = `url('${bg.value}') no-repeat center center fixed`;
    document.body.style.backgroundSize = 'cover';
  }
}

function populateFooter() {
  const footer = siteData.footer;
  if (!footer) return;

  const aboutText = document.getElementById("footerAboutText");
  if (aboutText) aboutText.textContent = footer.aboutText || "";

  const emailText = document.getElementById("footerEmailText");
  if (emailText) {
    emailText.textContent = footer.contactInfo?.email || "";
    emailText.href = "mailto:" + (footer.contactInfo?.email || "");
  }

  const phoneText = document.getElementById("footerPhoneText");
  if (phoneText) phoneText.textContent = footer.contactInfo?.phone || "";

  const copyrightText = document.getElementById("footerCopyrightText");
  if (copyrightText) copyrightText.textContent = footer.copyrightText || "";

  // Social Links
  const links = [
    { id: "footerFbLink", url: footer.socialLinks?.facebook },
    { id: "footerYtLink", url: footer.socialLinks?.youtube },
    { id: "footerWaLink", url: footer.socialLinks?.whatsapp },
    { id: "footerTwLink", url: footer.socialLinks?.twitter },
    { id: "footerIgLink", url: footer.socialLinks?.instagram }
  ];

  links.forEach(l => {
    const el = document.getElementById(l.id);
    if (el) {
      if (l.url) {
        el.href = l.url;
        el.style.display = 'inline-flex';
      } else {
        el.style.display = 'none';
      }
    }
  });

  // Dynamic Footer Categories
  const footerCatList = document.getElementById('footerCategoriesList');
  if (footerCatList && siteData.categories) {
    footerCatList.innerHTML = '';
    Object.keys(siteData.categories).forEach(catId => {
      const cat = siteData.categories[catId];
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" data-category="${catId}" class="footer-dyn-cat">${cat.title}</a>`;
      footerCatList.appendChild(li);
    });
    
    // Attach events to these new links
    document.querySelectorAll('.footer-dyn-cat').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const catId = e.currentTarget.dataset.category;
        if (catId && siteData.categories[catId]) {
          renderCategory(catId);
        }
      });
    });
  }
}

function initApp() {
  // Mobile Menu Toggle (in header, always visible)
  const menuToggle = document.getElementById("menuToggle");
  const navMenu = document.getElementById("navMenu");
  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }

  // SPA Router Elements
  const appRoot = document.getElementById("appRoot");
  const homeTemplate = document.getElementById("homeTemplate");
  const categoryTemplate = document.getElementById("categoryTemplate");
  const sectionTemplate = document.getElementById("sectionTemplate");
  const singleItemTemplate = document.getElementById("singleItemTemplate");
  const aboutTemplate = document.getElementById("aboutTemplate");
  const contactTemplate = document.getElementById("contactTemplate");

  let currentCategory = null;
  let currentSection = null;
  let currentHomeArticleIndex = 0;

  function renderHome() {
    window.scrollTo(0, 0);
    appRoot.innerHTML = "";
    appRoot.appendChild(homeTemplate.content.cloneNode(true));
    attachHomeEvents();
    
    // Populate News Ticker
    const tickerContainer = document.getElementById("homeNewsTicker");
    const tickerSection = document.querySelector(".news-ticker-section");
    if (tickerContainer && tickerSection) {
      const news = siteData.newsTicker || { items: [], settings: {} };
      const items = news.items || [];
      const settings = news.settings || { speed: 15, pauseOnHover: true, bgColor: '#16a085', textColor: '#ffffff' };
      
      const newsArr = items.map(item => {
        if (typeof item === 'string') return { type: 'text', content: item };
        return item;
      }).filter(n => n.content && n.content.trim() !== "");

      if (newsArr.length === 0) {
        tickerContainer.innerHTML = `<span class="ticker-item" dir="rtl">فی الحال کوئی تازہ ترین خبر موجود نہیں ہے۔</span>`;
      } else {
        tickerContainer.innerHTML = newsArr.map(n => {
          if (n.type === 'image') {
             return `<span class="ticker-item"><img src="${n.content}" style="height: 30px; vertical-align: middle;" alt="News"></span>`;
          }
          return `<span class="ticker-item" dir="rtl">${n.content}</span>`;
        }).join('');
      }

      // Apply Settings
      tickerSection.style.backgroundColor = settings.bgColor;
      tickerSection.style.color = settings.textColor;
      
      // Update animation speed and pause on hover via a dynamic style tag
      let dynStyle = document.getElementById('dynamicTickerStyles');
      if (!dynStyle) {
        dynStyle = document.createElement('style');
        dynStyle.id = 'dynamicTickerStyles';
        document.head.appendChild(dynStyle);
      }
      
      dynStyle.innerHTML = `
        .ticker-content {
          animation: marquee ${settings.speed}s linear infinite !important;
        }
        .ticker-content:hover {
          animation-play-state: ${settings.pauseOnHover ? 'paused' : 'running'} !important;
        }
      `;
    }

    // Populate Ads (Banner)
    const adSection = document.getElementById("homeBannerSection");
    let adsToRender = [];
    if (siteData.ads && siteData.ads.length > 0) {
      adsToRender = siteData.ads;
    } else if (siteData.adImage) {
      adsToRender = [{ image: siteData.adImage, link: '' }];
    }

    if (adsToRender.length > 0) {
      let slidesHtml = '';
      adsToRender.forEach((ad, idx) => {
        const activeClass = idx === 0 ? 'active' : '';
        const imgHtml = `<img src="${ad.image}" alt="اشتہار">`;
        const slideContent = ad.link ? `<a href="${ad.link}" target="_blank" style="width:100%; height:100%; display:block;">${imgHtml}</a>` : imgHtml;
        slidesHtml += `<div class="banner-slide ${activeClass}">${slideContent}</div>`;
      });
      adSection.innerHTML = `<div class="banner-placeholder" id="homeBannerPlaceholder">${slidesHtml}</div>`;
      
      if (adsToRender.length > 1) {
        let currentAdIdx = 0;
        const slides = adSection.querySelectorAll('.banner-slide');
        const interval = (siteData.adInterval || 5) * 1000;
        
        if (window.adCarouselInterval) clearInterval(window.adCarouselInterval);
        
        window.adCarouselInterval = setInterval(() => {
          slides[currentAdIdx].classList.remove('active');
          currentAdIdx = (currentAdIdx + 1) % slides.length;
          slides[currentAdIdx].classList.add('active');
        }, interval);
      }
    } else {
      adSection.innerHTML = '';
    }
    
    // Populate Home Article
    const homeArticles = (siteData.homeArticles || []).filter(a => a.status !== 'draft');
    const homeSection = document.getElementById("homeArticleSection");
    
    if (homeArticles.length > 0 && homeArticles[currentHomeArticleIndex]) {
      const homeArt = homeArticles[currentHomeArticleIndex];
      document.getElementById("homeArticleTitle").textContent = homeArt.title;
      document.getElementById("homeArticleExcerpt").textContent = homeArt.excerpt;
      document.getElementById("homeArticleAuthor").innerHTML = homeArt.author ? `<i class="fa-solid fa-pen"></i> ${homeArt.author}` : '';
      document.getElementById("homeArticleKalam").innerHTML = homeArt.kalam ? `<i class="fa-solid fa-quote-right"></i> کلام: ${homeArt.kalam}` : '';
      document.getElementById("homeArticleAwaz").innerHTML = homeArt.awaz ? `<i class="fa-solid fa-microphone"></i> آواز: ${homeArt.awaz}` : '';
      document.getElementById("homeArticleDate").innerHTML = homeArt.date ? `<i class="far fa-calendar-alt"></i> ${homeArt.date}` : '';
      
      const imgContainer = document.getElementById("homeArticleImage");
      if (homeArt.mediaUrl) {
        imgContainer.innerHTML = `<img src="${homeArt.mediaUrl}" alt="${homeArt.title}" style="width:100%; height:100%; object-fit:cover;">`;
      } else {
        imgContainer.innerHTML = `<i class="fa-solid fa-book-open" style="font-size: 3rem; color: var(--gold);"></i>`;
      }

      const readMoreBtn = document.getElementById("homeArticleReadMore");
      readMoreBtn.onclick = () => renderHomeSingleItem(currentHomeArticleIndex);
      
      // Setup Navigation
      const navDiv = document.getElementById("homeArticleNav");
      if (homeArticles.length > 1) {
        navDiv.style.display = "flex";
        
        const prevBtn = document.getElementById("homePrevBtn");
        const nextBtn = document.getElementById("homeNextBtn");
        const counter = document.getElementById("homeArticleCounter");
        
        counter.textContent = `مضمون ${currentHomeArticleIndex + 1} از ${homeArticles.length}`;
        
        // Disable "Next" if at the end (oldest)
        if (currentHomeArticleIndex >= homeArticles.length - 1) {
          nextBtn.style.opacity = "0.5";
          nextBtn.style.pointerEvents = "none";
        } else {
          nextBtn.style.opacity = "1";
          nextBtn.style.pointerEvents = "auto";
          nextBtn.onclick = () => {
            currentHomeArticleIndex++;
            renderHome();
          };
        }
        
        // Disable "Previous" if at the start (newest)
        if (currentHomeArticleIndex <= 0) {
          prevBtn.style.opacity = "0.5";
          prevBtn.style.pointerEvents = "none";
        } else {
          prevBtn.style.opacity = "1";
          prevBtn.style.pointerEvents = "auto";
          prevBtn.onclick = () => {
            currentHomeArticleIndex--;
            renderHome();
          };
        }
      } else {
        navDiv.style.display = "none";
      }
      
      // Trending Articles
      const trendingContainer = document.getElementById("trendingContainer");
      if (trendingContainer) {
        let allArticles = [];
        if (siteData.content) {
          Object.values(siteData.content).forEach(secItems => {
            secItems.forEach(i => {
              if (i.status !== 'draft') allArticles.push(i);
            });
          });
        }
        
        const topArticles = allArticles.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
        
        if (topArticles.length > 0) {
          let tHtml = `
            <div class="trending-section" style="margin-top: 4rem;">
              <h2 class="section-title"><i class="fa-solid fa-fire" style="color: #ef4444;"></i> مقبول ترین مضامین</h2>
              <div class="trending-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
          `;
          topArticles.forEach(ta => {
            // Find categoryId and sectionId for the item
            let catId = '', secId = '';
            for (const [key, items] of Object.entries(siteData.content)) {
              if (items.find(i => i.id === ta.id)) {
                const parts = key.split('_');
                catId = parts[0];
                secId = parts[1];
                break;
              }
            }
            
            tHtml += `
              <div class="list-item" style="cursor: pointer;" onclick="window.renderSingleItem('${catId}', '${secId}', '${ta.id}')">
                <div class="list-item-title">${ta.title}</div>
                <div class="list-item-meta">
                  <span><i class="fa-solid fa-eye"></i> ${ta.views || 0} ویوز</span>
                  ${ta.date ? `<span><i class="far fa-calendar-alt"></i> ${ta.date}</span>` : ''}
                </div>
              </div>
            `;
          });
          tHtml += `</div></div>`;
          trendingContainer.innerHTML = tHtml;
        }
      }
      
    } else {
      homeSection.style.display = 'none'; // Hide if no data
    }

    if (navMenu) navMenu.classList.remove("active");
    updateSEO(null, null, null);
  }

  function renderAbout() {
    window.scrollTo(0, 0);
    appRoot.innerHTML = "";
    appRoot.appendChild(aboutTemplate.content.cloneNode(true));
    attachGlobalEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (navMenu) navMenu.classList.remove("active");
    updateSEO("ہمارے بارے میں", "معارف شیخ کے بارے میں مزید جانیے", "about, ہمارے بارے میں");
  }

  function renderContact() {
    window.scrollTo(0, 0);
    appRoot.innerHTML = "";
    appRoot.appendChild(contactTemplate.content.cloneNode(true));
    attachGlobalEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (navMenu) navMenu.classList.remove("active");
    updateSEO("رابطہ کریں", "معارف شیخ سے رابطہ کریں", "contact, رابطہ");
  }

  function extractSeriesAndSubtitle(title) {
    const match = title.match(/^(.*?)(جلد|شمارہ|حصہ)(.*)$/);
    if (match) {
      const series = match[1].trim();
      const subtitle = (match[2] + match[3]).trim();
      return { series, subtitle };
    }
    return { series: '', subtitle: title };
  }

  function renderCategory(categoryId) {
    window.scrollTo(0, 0);
    appRoot.innerHTML = "";
    appRoot.appendChild(categoryTemplate.content.cloneNode(true));
    
    currentCategory = siteData.categories[categoryId];
    
    const breadcrumb = document.getElementById("catBreadcrumb");
    breadcrumb.innerHTML = `<a href="#" class="nav-home">ہوم</a> / ${currentCategory.title}`;
    
    const title = document.getElementById("catTitle");
    title.textContent = currentCategory.title;
    
    const container = document.getElementById("sectionGrid");
    
    // Group sections
    const groupedSections = {};
    const ungroupedSections = [];

    currentCategory.sections.forEach(sec => {
      const { series, subtitle } = extractSeriesAndSubtitle(sec.title);
      if (series) {
        if (!groupedSections[series]) groupedSections[series] = [];
        groupedSections[series].push({ ...sec, displayTitle: subtitle });
      } else {
        ungroupedSections.push({ ...sec, displayTitle: sec.title });
      }
    });

    // Render grouped sections
    Object.keys(groupedSections).forEach(series => {
      const groupDiv = document.createElement("div");
      groupDiv.className = "series-group";
      
      const groupTitle = document.createElement("h3");
      groupTitle.className = "series-title";
      groupTitle.textContent = series;
      groupDiv.appendChild(groupTitle);
      
      const grid = document.createElement("div");
      grid.className = "section-grid";
      
      let folderColor = '#fbbf24';
      if (currentCategory.seriesColors && currentCategory.seriesColors[series]) {
        folderColor = currentCategory.seriesColors[series];
      }

      groupedSections[series].forEach(sec => {
        const card = document.createElement("div");
        card.className = "section-card";
        card.innerHTML = `<i class="fa-solid fa-folder" style="color: ${folderColor};"></i> <span title="${sec.displayTitle}">${sec.displayTitle}</span>`;
        card.dataset.sectionId = sec.id;
        card.addEventListener("click", () => renderSection(categoryId, sec.id));
        grid.appendChild(card);
      });
      
      groupDiv.appendChild(grid);
      container.appendChild(groupDiv);
    });

    // Render ungrouped sections
    if (ungroupedSections.length > 0) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "series-group";
      
      const grid = document.createElement("div");
      grid.className = "section-grid";
      
      ungroupedSections.forEach(sec => {
        let folderColor = '#fbbf24';
        if (currentCategory.seriesColors && currentCategory.seriesColors[sec.title]) {
          folderColor = currentCategory.seriesColors[sec.title];
        }

        const card = document.createElement("div");
        card.className = "section-card";
        card.innerHTML = `<i class="fa-solid fa-folder" style="color: ${folderColor};"></i> <span title="${sec.displayTitle}">${sec.displayTitle}</span>`;
        card.dataset.sectionId = sec.id;
        card.addEventListener("click", () => renderSection(categoryId, sec.id));
        grid.appendChild(card);
      });
      
      groupDiv.appendChild(grid);
      container.appendChild(groupDiv);
    }

    attachGlobalEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (navMenu) navMenu.classList.remove("active");
    updateSEO(currentCategory.title, currentCategory.title + " کے متعلق مضامین اور مواد", currentCategory.title + ", معارف شیخ");
  }

  function renderSection(categoryId, sectionId) {
    window.scrollTo(0, 0);
    appRoot.innerHTML = "";
    appRoot.appendChild(sectionTemplate.content.cloneNode(true));
    
    currentCategory = siteData.categories[categoryId];
    const sectionObj = currentCategory.sections.find(s => s.id === sectionId);
    currentSection = sectionObj;
    
    document.getElementById("backBtn").addEventListener("click", () => {
      renderCategory(categoryId);
    });

    const breadcrumb = document.getElementById("secBreadcrumb");
    breadcrumb.innerHTML = `<a href="#" class="nav-home">ہوم</a> / <a href="#" class="nav-cat" data-category="${categoryId}">${currentCategory.title}</a> / ${currentSection.title}`;
    
    const title = document.getElementById("secTitle");
    title.textContent = currentSection.title;
    
    const itemList = document.getElementById("itemList");
    const dataKey = `${categoryId}_${sectionId}`;
    const items = (siteData.content[dataKey] || []).filter(a => a.status !== 'draft');
    
    // Pagination (Load More) logic
    let itemsToShow = 10;
    
    function renderList() {
      itemList.innerHTML = '';
      if (items.length === 0) {
        itemList.innerHTML = `<div class="empty-message">اس سیکشن میں فی الحال کوئی مواد شامل نہیں ہے، جلد شامل کیا جائے گا۔</div>`;
        return;
      }
      
      const currentItems = items.slice(0, itemsToShow);
      currentItems.forEach(item => {
        const div = document.createElement("div");
        div.className = "list-item";
        
        let contentHtml = '';
        
        const catType = currentCategory.type;
        
        if (catType === 'article') {
          contentHtml = `
            <div class="list-item-title">${item.title}</div>
            <div class="list-item-excerpt">${item.excerpt}</div>
            <div class="list-item-meta">
              ${item.author ? `<span><i class="fa-solid fa-pen"></i> ${item.author}</span>` : ''}
              ${item.kalam ? `<span><i class="fa-solid fa-quote-right"></i> کلام: ${item.kalam}</span>` : ''}
              ${item.awaz ? `<span><i class="fa-solid fa-microphone"></i> آواز: ${item.awaz}</span>` : ''}
              ${item.date ? `<span><i class="far fa-calendar-alt"></i> ${item.date}</span>` : ''}
            </div>
            <button class="btn-read-more" style="margin-top: auto; align-self: flex-end; border-radius: 50px; padding: 0.5rem 1.5rem;" onclick="window.renderSingleItem('${categoryId}', '${sectionId}', '${item.id}')">مزید پڑھیں <i class="fa-solid fa-arrow-left"></i></button>
          `;
        } else if (catType === 'post') {
          contentHtml = `
            ${item.mediaUrl ? `<img src="${item.mediaUrl}" alt="${item.title}" style="max-width: 100%; height: auto; object-fit: contain; border-radius: 8px; margin-bottom: 1rem;">` : ''}
            <div class="list-item-title">${item.title}</div>
            <div class="list-item-meta">
              ${item.date ? `<span><i class="far fa-calendar-alt"></i> ${item.date}</span>` : ''}
            </div>
          `;
        } else if (catType === 'book') {
          contentHtml = `
            <div class="list-item-title">${item.title}</div>
            <div class="list-item-excerpt">${item.excerpt}</div>
            <div class="list-item-meta">
              ${item.author ? `<span><i class="fa-solid fa-pen"></i> ${item.author}</span>` : ''}
              ${item.kalam ? `<span><i class="fa-solid fa-quote-right"></i> کلام: ${item.kalam}</span>` : ''}
              ${item.awaz ? `<span><i class="fa-solid fa-microphone"></i> آواز: ${item.awaz}</span>` : ''}
              ${item.date ? `<span><i class="far fa-calendar-alt"></i> ${item.date}</span>` : ''}
            </div>
            <button class="btn-read-more" style="margin-top: auto; align-self: flex-end; border-radius: 50px; padding: 0.5rem 1.5rem;" onclick="window.renderSingleItem('${categoryId}', '${sectionId}', '${item.id}')">مزید پڑھیں <i class="fa-solid fa-arrow-left"></i></button>
          `;
        } else if (catType === 'audio') {
          contentHtml = `
            <div class="list-item-title">${item.title}</div>
            <div class="list-item-meta" style="margin-bottom: 1rem;">
              ${item.author ? `<span><i class="fa-solid fa-pen"></i> ${item.author}</span>` : ''}
              ${item.kalam ? `<span><i class="fa-solid fa-quote-right"></i> کلام: ${item.kalam}</span>` : ''}
              ${item.awaz ? `<span><i class="fa-solid fa-microphone"></i> آواز: ${item.awaz}</span>` : ''}
              ${item.date ? `<span><i class="far fa-calendar-alt"></i> ${item.date}</span>` : ''}
            </div>
            ${item.mediaUrl ? `<audio controls style="width: 100%;" src="${item.mediaUrl}"></audio>` : ''}
          `;
        }
        
        div.innerHTML = contentHtml;
        itemList.appendChild(div);
      });
      
      if (itemsToShow < items.length) {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.className = 'btn-load-more';
        loadMoreBtn.innerHTML = 'مزید دیکھیں <i class="fa-solid fa-chevron-down"></i>';
        loadMoreBtn.onclick = () => {
          itemsToShow += 10;
          renderList();
        };
        itemList.appendChild(loadMoreBtn);
      }
    }
    
    renderList();

    attachGlobalEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateSEO(currentSection.title + ' - ' + currentCategory.title, currentSection.title + " سے متعلق مواد", currentSection.title + ", " + currentCategory.title);
  }

  function processContentFeatures(contentHtml) {
    if (!contentHtml) return { html: '', toc: '', timeline: '' };
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, 'text/html');
    
    // 1. Generate TOC
    const headings = doc.querySelectorAll('h2, h3');
    let tocHtml = '';
    headings.forEach((heading, index) => {
      let text = heading.textContent.trim();
      let id = heading.id;
      if (!id) {
        id = 'heading-' + index;
        heading.id = id;
      }
      const level = heading.tagName.toLowerCase();
      const className = level === 'h3' ? 'toc-h3' : 'toc-h2';
      tocHtml += `<li><a href="#${id}" class="${className}" onclick="window.scrollToHeading(event, '${id}')">${text}</a></li>`;
    });

    // 2. Generate Timeline
    let timelineHtml = '';
    let dateIndex = 0;
    const dateRegex = /\b(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})\b/g;
    
    const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    
    textNodes.forEach(node => {
      if (node.parentNode && (node.parentNode.tagName === 'SCRIPT' || node.parentNode.tagName === 'STYLE')) return;
      
      const text = node.nodeValue;
      if (dateRegex.test(text)) {
        dateRegex.lastIndex = 0;
        let match;
        let lastIndex = 0;
        const fragment = document.createDocumentFragment();
        
        while ((match = dateRegex.exec(text)) !== null) {
          const dateStr = match[0];
          const beforeStr = text.substring(lastIndex, match.index);
          
          if (beforeStr) {
            fragment.appendChild(document.createTextNode(beforeStr));
          }
          
          const id = 'timeline-date-' + dateIndex;
          const span = document.createElement('span');
          span.id = id;
          span.className = 'highlighted-date';
          span.textContent = dateStr;
          
          fragment.appendChild(span);
          timelineHtml += `<li><a href="#${id}" onclick="window.scrollToHeading(event, '${id}')"><i class="far fa-calendar-alt" style="margin-left:5px; color:var(--teal);"></i><span style="direction:ltr; display:inline-block;">${dateStr}</span></a></li>`;
          
          lastIndex = dateRegex.lastIndex;
          dateIndex++;
        }
        
        const afterStr = text.substring(lastIndex);
        if (afterStr) {
          fragment.appendChild(document.createTextNode(afterStr));
        }
        node.parentNode.replaceChild(fragment, node);
      }
    });
    
    return { html: doc.body.innerHTML, toc: tocHtml, timeline: timelineHtml };
  }

  window.scrollToHeading = function(e, id) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -140; // Offset for sticky navbar + breadcrumb
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  };

  function setupArticleSidebar(tocHtml, timelineHtml) {
    const sidebar = document.getElementById("articleSidebar");
    const tocList = document.getElementById("tocList");
    const timelineList = document.getElementById("timelineList");
    const sidebarTabs = document.getElementById("sidebarTabs");
    const tocTitle = document.getElementById("tocTitle");
    const timelineTitle = document.getElementById("timelineTitle");
    const tabToc = document.getElementById("tabToc");
    const tabTimeline = document.getElementById("tabTimeline");

    if (!tocHtml && !timelineHtml) {
      sidebar.style.display = 'none';
      return;
    }

    sidebar.style.display = 'block';

    if (tocHtml && timelineHtml) {
      sidebarTabs.style.display = 'flex';
      tocTitle.style.display = 'none';
      timelineTitle.style.display = 'none';
      
      tocList.innerHTML = tocHtml;
      timelineList.innerHTML = timelineHtml;
      
      tocList.style.display = 'block';
      timelineList.style.display = 'none';
      tabToc.classList.add('active');
      tabTimeline.classList.remove('active');
      
      tabToc.onclick = () => {
        tabToc.classList.add('active');
        tabTimeline.classList.remove('active');
        tocList.style.display = 'block';
        timelineList.style.display = 'none';
      };
      
      tabTimeline.onclick = () => {
        tabTimeline.classList.add('active');
        tabToc.classList.remove('active');
        timelineList.style.display = 'block';
        tocList.style.display = 'none';
      };
    } else if (tocHtml) {
      sidebarTabs.style.display = 'none';
      tocTitle.style.display = 'block';
      timelineTitle.style.display = 'none';
      tocList.style.display = 'block';
      timelineList.style.display = 'none';
      tocList.innerHTML = tocHtml;
    } else if (timelineHtml) {
      sidebarTabs.style.display = 'none';
      tocTitle.style.display = 'none';
      timelineTitle.style.display = 'block';
      tocList.style.display = 'none';
      timelineList.style.display = 'block';
      timelineList.innerHTML = timelineHtml;
    }
  }

  window.renderSingleItem = function(categoryId, sectionId, itemId) {
    window.scrollTo(0, 0);
    appRoot.innerHTML = "";
    appRoot.appendChild(singleItemTemplate.content.cloneNode(true));
    
    currentCategory = siteData.categories[categoryId];
    currentSection = currentCategory.sections.find(s => s.id === sectionId);
    
    const dataKey = `${categoryId}_${sectionId}`;
    const items = (siteData.content[dataKey] || []).filter(a => a.status !== 'draft');
    const item = items.find(i => i.id === itemId);
    
    document.getElementById("singleBackBtn").addEventListener("click", () => {
      renderSection(categoryId, sectionId);
    });

    const breadcrumb = document.getElementById("singleBreadcrumb");
    breadcrumb.innerHTML = `<a href="#" class="nav-home">ہوم</a> / <a href="#" class="nav-cat" data-category="${categoryId}">${currentCategory.title}</a> / <a href="#" onclick="window.renderSectionHandler('${categoryId}', '${sectionId}'); return false;">${currentSection.title}</a> / ${item.title}`;
    
    document.getElementById("singleTitle").textContent = item.title;
    
    const metaDiv = document.getElementById("singleMeta");
    metaDiv.innerHTML = `
      ${item.author ? `<span><i class="fa-solid fa-pen"></i> ${item.author}</span>` : ''}
      ${item.kalam ? `<span><i class="fa-solid fa-quote-right"></i> کلام: ${item.kalam}</span>` : ''}
      ${item.awaz ? `<span><i class="fa-solid fa-microphone"></i> آواز: ${item.awaz}</span>` : ''}
      ${item.date ? `<span><i class="far fa-calendar-alt"></i> ${item.date}</span>` : ''}
      <span><i class="fa-solid fa-eye"></i> ${item.views || 0} ویوز</span>
    `;
    
    const url = window.location.href;
    const shareHtml = `
      <div class="share-buttons">
        <button onclick="navigator.clipboard.writeText('${url}'); alert('لنک کاپی ہو گیا!');" class="share-btn share-copy" title="لنک کاپی کریں"><i class="fa-solid fa-link"></i></button>
        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}" target="_blank" class="share-btn share-tw" title="X (Twitter)"><i class="fa-brands fa-x-twitter"></i></a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="share-btn share-fb" title="فیس بک"><i class="fa-brands fa-facebook-f"></i></a>
        <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(item.title + ' - ' + url)}" target="_blank" class="share-btn share-wa" title="واٹس ایپ"><i class="fa-brands fa-whatsapp"></i></a>
      </div>
    `;
    
    let relatedHtml = '';
    const relatedItems = items.filter(i => i.id !== itemId).slice(0, 3);
    if (relatedItems.length > 0) {
      relatedHtml = `
        <div class="related-articles">
          <h3>متعلقہ مواد</h3>
          <div class="related-grid">
            ${relatedItems.map(ri => `
              <div class="list-item" style="cursor: pointer;" onclick="window.renderSingleItem('${categoryId}', '${sectionId}', '${ri.id}')">
                <div class="list-item-title">${ri.title}</div>
                <div class="list-item-meta">${ri.date ? `<span><i class="far fa-calendar-alt"></i> ${ri.date}</span>` : ''}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    let rawContent = item.fullContent || item.excerpt;
    let extraMediaHtml = '';
    
    if (currentCategory.type === 'book' && item.mediaUrl) {
       let embedUrl = item.mediaUrl;
       if (embedUrl.includes('drive.google.com') && embedUrl.includes('/view')) {
         embedUrl = embedUrl.replace('/view', '/preview');
       }
       if (embedUrl.includes('usp=sharing')) {
          embedUrl = embedUrl.replace('?usp=sharing', '').replace('&usp=sharing', '');
       }
       
       extraMediaHtml = `
         <div class="pdf-container" style="margin-top: 2rem; margin-bottom: 2rem; background: var(--parchment-2); padding: 1rem; border-radius: 12px; border: 1px solid var(--gold);">
           <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; flex-wrap: wrap; gap:10px;">
             <h3 style="margin:0; color:var(--ink);">آنلائن مطالعہ کریں:</h3>
             <a href="${item.mediaUrl}" target="_blank" class="btn-read-more" style="margin:0;"><i class="fa-solid fa-download"></i> کتاب ڈاؤن لوڈ کریں</a>
           </div>
           <iframe src="${embedUrl}" width="100%" height="800px" style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background: white;"></iframe>
         </div>
       `;
    }

    const { html: parsedContent, toc: tocHtml, timeline: timelineHtml } = processContentFeatures(rawContent);
    
    setupArticleSidebar(tocHtml, timelineHtml);
    
    document.getElementById("singleContent").innerHTML = parsedContent + extraMediaHtml + shareHtml + relatedHtml;

    attachGlobalEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Increment view count
    fetch('/api/increment-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'content', key: dataKey, id: itemId })
    }).catch(e => console.error(e));

    const kws = item.seoKeywords || item.author || currentCategory.title;
    updateSEO(item.seoTitle || item.title, item.seoDesc || item.excerpt, kws, item);
  }

  window.renderHomeSingleItem = function(index = 0) {
    window.scrollTo(0, 0);
    appRoot.innerHTML = "";
    appRoot.appendChild(singleItemTemplate.content.cloneNode(true));
    
    const homeArticles = (siteData.homeArticles || []).filter(a => a.status !== 'draft');
    const item = homeArticles[index] ? homeArticles[index] : null;
    if (!item) return renderHome();
    
    document.getElementById("singleBackBtn").addEventListener("click", () => {
      renderHome();
    });

    const breadcrumb = document.getElementById("singleBreadcrumb");
    breadcrumb.innerHTML = `<a href="#" class="nav-home">ہوم</a> / صفحہ اول کا مضمون`;
    
    document.getElementById("singleTitle").textContent = item.title;
    
    const metaDiv = document.getElementById("singleMeta");
    metaDiv.innerHTML = `
      ${item.author ? `<span><i class="fa-solid fa-pen"></i> ${item.author}</span>` : ''}
      ${item.kalam ? `<span><i class="fa-solid fa-quote-right"></i> کلام: ${item.kalam}</span>` : ''}
      ${item.awaz ? `<span><i class="fa-solid fa-microphone"></i> آواز: ${item.awaz}</span>` : ''}
      ${item.date ? `<span><i class="far fa-calendar-alt"></i> ${item.date}</span>` : ''}
      <span><i class="fa-solid fa-eye"></i> ${item.views || 0} ویوز</span>
    `;
    
    const url = window.location.href;
    const shareHtml = `
      <div class="share-buttons">
        <button onclick="navigator.clipboard.writeText('${url}'); alert('لنک کاپی ہو گیا!');" class="share-btn share-copy" title="لنک کاپی کریں"><i class="fa-solid fa-link"></i></button>
        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}" target="_blank" class="share-btn share-tw" title="X (Twitter)"><i class="fa-brands fa-x-twitter"></i></a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" class="share-btn share-fb" title="فیس بک"><i class="fa-brands fa-facebook-f"></i></a>
        <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(item.title + ' - ' + url)}" target="_blank" class="share-btn share-wa" title="واٹس ایپ"><i class="fa-brands fa-whatsapp"></i></a>
      </div>
    `;

    let rawContent = item.fullContent || item.excerpt;
    const { html: parsedContent, toc: tocHtml, timeline: timelineHtml } = processContentFeatures(rawContent);
    
    setupArticleSidebar(tocHtml, timelineHtml);
    
    document.getElementById("singleContent").innerHTML = parsedContent + shareHtml;

    // Increment view count for home article
    fetch('/api/increment-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'home', index: index })
    }).catch(e => console.error(e));

    // Setup Navigation
    const navDiv = document.getElementById("singleItemNav");
    if (navDiv && homeArticles.length > 1) {
      navDiv.style.display = "flex";
      
      const prevBtn = document.getElementById("singlePrevBtn");
      const nextBtn = document.getElementById("singleNextBtn");
      const counter = document.getElementById("singleArticleCounter");
      
      counter.textContent = `مضمون ${index + 1} از ${homeArticles.length}`;
      
      // Disable "Next" if at the end (oldest)
      if (index >= homeArticles.length - 1) {
        nextBtn.style.opacity = "0.5";
        nextBtn.style.pointerEvents = "none";
      } else {
        nextBtn.style.opacity = "1";
        nextBtn.style.pointerEvents = "auto";
        nextBtn.onclick = () => {
          renderHomeSingleItem(index + 1);
        };
      }
      
      // Disable "Previous" if at the start (newest)
      if (index <= 0) {
        prevBtn.style.opacity = "0.5";
        prevBtn.style.pointerEvents = "none";
      } else {
        prevBtn.style.opacity = "1";
        prevBtn.style.pointerEvents = "auto";
        prevBtn.onclick = () => {
          renderHomeSingleItem(index - 1);
        };
      }
    } else if (navDiv) {
      navDiv.style.display = "none";
    }

    attachGlobalEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const kws = item.seoKeywords || item.author || "صفحہ اول کا مضمون, معارف شیخ";
    updateSEO(item.seoTitle || item.title, item.seoDesc || item.excerpt, kws, item);
  }
  
  window.renderSectionHandler = function(c, s) {
    renderSection(c, s);
  }

  function attachHomeEvents() {
    const sBtn = document.getElementById("searchBtn");
    const sInput = document.getElementById("searchInputContainer");
    if (sBtn && sInput) {
      sBtn.addEventListener("click", () => {
        sInput.classList.toggle("active");
      });
    }

    const catContainer = document.getElementById("homeCategoryButtons");
    if (catContainer && siteData.categories) {
      catContainer.innerHTML = '';
      Object.keys(siteData.categories).forEach(catId => {
        const cat = siteData.categories[catId];
        let icon = 'fa-folder';
        if (cat.type === 'article') icon = 'fa-file-alt';
        else if (cat.type === 'post') icon = 'fa-pen-square';
        else if (cat.type === 'book') icon = 'fa-book';
        else if (cat.type === 'audio') icon = 'fa-headphones';
        
        // Some overrides for default categories
        if (catId === 'letters') icon = 'fa-envelope-open-text';
        if (catId === 'audio-books') icon = 'fa-podcast';
        if (catId === 'cat') icon = 'fa-music'; // the new category they created

        const a = document.createElement('a');
        a.href = "#";
        a.className = "cat-btn";
        a.dataset.category = catId;
        a.innerHTML = `<i class="fas ${icon}"></i> <span>${cat.title}</span>`;
        catContainer.appendChild(a);
      });
    }

    document.querySelectorAll(".cat-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const catId = e.currentTarget.dataset.category;
        if (catId && siteData.categories[catId]) {
          renderCategory(catId);
        }
      });
    });
  }

  function attachGlobalEvents() {
    document.querySelectorAll(".nav-home").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        renderHome();
      });
    });
    
    document.querySelectorAll(".nav-cat").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const catId = e.currentTarget.dataset.category;
        if (catId && siteData.categories[catId]) {
          renderCategory(catId);
        }
      });
    });
  }

  // Header Links (Logo, Site name)
  document.querySelectorAll(".logo-link, .site-name-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      renderHome();
    });
  });

  // Nav Links
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = e.currentTarget.getAttribute("href");
      if (href === "/") renderHome();
      else if (href === "/about") renderAbout();
      else if (href === "/contact") renderContact();
    });
  });

  // Footer static links
  document.querySelectorAll(".footer-links a[href^='/']").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = e.currentTarget.getAttribute("href");
      
      if (href === "/") {
        renderHome();
      } else if (href === "/about") {
        renderAbout();
      } else if (href === "/contact") {
        renderContact();
      }
    });
  });

  // Feedback Header Button & Modal Logic
  const headerBtn = document.getElementById('feedbackHeaderBtn');
  const modalOverlay = document.getElementById('feedbackModal');
  const closeBtn = document.getElementById('feedbackCloseBtn');
  const feedbackForm = document.getElementById('feedbackForm');
  const successMsg = document.getElementById('feedbackSuccessMessage');

  if (headerBtn && modalOverlay && closeBtn) {
    headerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modalOverlay.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
      successMsg.style.display = 'none';
      if(feedbackForm) feedbackForm.reset();
      if(feedbackForm) feedbackForm.style.display = 'block';
    });

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
        successMsg.style.display = 'none';
        if(feedbackForm) feedbackForm.reset();
        if(feedbackForm) feedbackForm.style.display = 'block';
      }
    });
  }

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('fbName') ? document.getElementById('fbName').value : '';
      const email = document.getElementById('fbEmail') ? document.getElementById('fbEmail').value : '';
      const message = document.getElementById('fbMessage') ? document.getElementById('fbMessage').value : '';
      
      const newMessage = {
        id: 'msg-' + Date.now(),
        name: name,
        email: email,
        message: message,
        date: new Date().toISOString()
      };
      
      if (!siteData.messages) {
        siteData.messages = [];
      }
      siteData.messages.push(newMessage);
      
      // Save to server
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData)
      })
      .then(res => res.json())
      .then(data => {
        feedbackForm.style.display = 'none';
        if(successMsg) successMsg.style.display = 'block';
        
        // Auto close after 3 seconds
        setTimeout(() => {
          if(modalOverlay) modalOverlay.classList.remove('active');
          successMsg.style.display = 'none';
          feedbackForm.reset();
          feedbackForm.style.display = 'block';
        }, 3000);
      })
      .catch(err => {
        console.error('Failed to send message', err);
        alert('پیغام بھیجنے میں مسئلہ ہے۔');
      });
    });
  }

  // Inline Header Search Logic
  const headerSearchContainer = document.getElementById('headerSearchContainer');
  const inlineSearchBtn = document.getElementById('inlineSearchBtn');
  const inlineSearchInput = document.getElementById('inlineSearchInput');
  const inlineSearchResults = document.getElementById('inlineSearchResults');

  function openInlineSearch() {
    if (headerSearchContainer) {
      setTimeout(() => inlineSearchInput && inlineSearchInput.focus(), 100);
    }
  }

  function closeInlineSearch() {
    if (headerSearchContainer) {
      if (inlineSearchInput) inlineSearchInput.value = '';
      if (inlineSearchResults) inlineSearchResults.style.display = 'none';
    }
  }

  function performInlineSearch() {
    const query = (inlineSearchInput.value || '').trim().toLowerCase();
    
    if (!query) {
      inlineSearchResults.style.display = 'none';
      return;
    }

    let results = [];
    
    function countOccurrences(text, searchStr) {
      if (!text) return 0;
      const matches = String(text).match(new RegExp(searchStr, 'gi'));
      return matches ? matches.length : 0;
    }

    function processItem(item, type, categoryId = null, sectionId = null, homeIndex = -1) {
      const c1 = countOccurrences(item.title, query);
      const c2 = countOccurrences(item.excerpt, query);
      const c3 = countOccurrences(item.author, query);
      const c4 = countOccurrences(item.fullContent, query);
      const c5 = countOccurrences(item.body, query);
      const c6 = countOccurrences(item.fullText, query);
      
      const totalCount = c1 + c2 + c3 + c4 + c5 + c6;
      if (totalCount > 0) {
        results.push({
          title: item.title,
          categoryId: categoryId,
          sectionId: sectionId,
          itemId: item.id,
          homeIndex: homeIndex,
          type: type,
          count: totalCount
        });
      }
    }

    if (siteData.content) {
      Object.keys(siteData.content).forEach(key => {
        const items = (siteData.content[key] || []).filter(a => a.status !== 'draft');
        const parts = key.split('_');
        items.forEach(item => processItem(item, 'content', parts[0], parts[1]));
      });
    }

    const hArticles = (siteData.homeArticles || []).filter(a => a.status !== 'draft');
    if (hArticles.length > 0) {
      hArticles.forEach((item, index) => {
        processItem(item, 'home', null, null, index);
      });
    } else if (siteData.homeArticle && siteData.homeArticle.status !== 'draft') {
      processItem(siteData.homeArticle, 'home', null, null, 0);
    }

    inlineSearchResults.style.display = 'block';

    if (results.length === 0) {
      inlineSearchResults.innerHTML = '<div style="padding: 15px; text-align: center; color: #777;">کوئی نتیجہ نہیں ملا۔</div>';
    } else {
      results.sort((a, b) => b.count - a.count); // Sort by occurrences descending
      let html = '<div style="display: flex; flex-direction: column;">';
      results.forEach(res => {
        const highlightTitle = (res.title || 'عنوان موجود نہیں').replace(new RegExp(query, 'gi'), match => `<mark>${match}</mark>`);
        const clickAction = res.type === 'home' 
          ? `window.renderHomeSingleItem(${res.homeIndex}); window.closeInlineSearch(); return false;`
          : `window.renderSingleItem('${res.categoryId}', '${res.sectionId}', '${res.itemId}'); window.closeInlineSearch(); return false;`;

        html += `
          <div class="inline-result-item">
            <a href="#" onclick="${clickAction}">
              <i class="fa-solid fa-file-alt" style="margin-left: 5px; font-size: 0.9em; color: var(--gold);"></i> ${highlightTitle}
            </a>
            <div style="font-size: 0.85rem; color: #666; margin-top: 5px;">
              یہ الفاظ اس مضمون میں <strong>${res.count} مرتبہ</strong> موجود ہیں
            </div>
          </div>
        `;
      });
      html += '</div>';
      inlineSearchResults.innerHTML = html;
    }
  }

  if (inlineSearchBtn && headerSearchContainer) {
    inlineSearchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performInlineSearch();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (headerSearchContainer.classList.contains('expanded')) {
        if (!headerSearchContainer.contains(e.target)) {
          closeInlineSearch();
        }
      }
    });

    if (inlineSearchInput) {
      // Real-time search
      inlineSearchInput.addEventListener('input', performInlineSearch);
      
      inlineSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          performInlineSearch();
        }
      });
    }
  }

  window.closeInlineSearch = closeInlineSearch;

  // Initial render
  renderHome();
}
