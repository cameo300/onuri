const MAX_WORKS = 30;
const extensions = ["jpg", "jpeg", "png", "webp", "gif"];
const categoryNames = { ai: "AI", "3d": "3D PRINT", laser: "LASER", resin: "RESIN", stationery: "DIGITAL STATIONERY" };

let allWorks = [];
let visibleWorks = [];
const MOBILE_WORKS_QUERY = window.matchMedia('(max-width: 650px)');
const MOBILE_PAGE_SIZE = 4;
let worksPage = 0;
function worksPageCount() {
  return Math.max(1, Math.ceil(visibleWorks.length / MOBILE_PAGE_SIZE));
}
function changeWorksPage(direction) {
  const grid = document.getElementById('works-grid');
  if (!grid) return;
  const next = Math.max(0, Math.min(worksPageCount() - 1, worksPage + direction));
  worksPage = next;
  grid.scrollTo({ left: next * grid.clientWidth,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  updateWorksPageLabel(visibleWorks.length);
  updateArrowState();
}
function cancelWorksTransition() {}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
  }[char]));
}

function titleFromFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/^work-\d+[-_]?/i, "")
    .replace(/[-_]+/g, " ")
    .trim() || "My Work";
}

/*
  fetch/HEAD를 사용하지 않습니다.
  Image()의 onload/onerror를 사용하므로
  HTML 파일을 직접 열어도 work-01.jpg 같은 이미지가 감지됩니다.
*/
function findImage(index) {
  return new Promise(resolve => {
    let extIndex = 0;
    const test = () => {
      if (extIndex >= extensions.length) {
        resolve(null);
        return;
      }
      const src = `image/work-${String(index).padStart(2, "0")}.${extensions[extIndex++]}`;
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = test;
      img.src = src;
    };
    test();
  });
}

/*
  work-01, work-02 처럼 번호가 아니라
  profile 같은 "이름"으로 된 이미지를 찾을 때 사용합니다.
  image/profile.jpg, image/profile.png ... 순서로 확인합니다.
*/
function findNamedImage(name) {
  return new Promise(resolve => {
    let extIndex = 0;
    const test = () => {
      if (extIndex >= extensions.length) {
        resolve(null);
        return;
      }
      const src = `image/${name}.${extensions[extIndex++]}`;
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = test;
      img.src = src;
    };
    test();
  });
}

/*
  홈(hero)과 연락처(contact) 영역의 프로필 사진을 채워 넣습니다.
  image/profile.jpg (또는 png/webp/gif) 파일 하나만 넣으면
  홈에서는 세로(3:4), 연락처에서는 가로(4:3) 비율로 자동으로 잘려서 보입니다.
  이미지가 없으면 기존 이니셜 아바타(HM)가 그대로 보입니다.
*/
async function loadProfilePhoto() {
  const src = await findNamedImage("profile");
  if (!src) return;

  const slots = [
    { imgId: "profilePhotoImg", fallbackId: "profileFallback" },
    { imgId: "contactPhotoImg", fallbackId: "contactFallback" }
  ];

  slots.forEach(({ imgId, fallbackId }) => {
    const img = document.getElementById(imgId);
    const fallback = document.getElementById(fallbackId);
    if (!img) return;
    img.src = src;
    img.style.display = "block";
    if (fallback) fallback.style.display = "none";
  });
}

async function loadWorks() {
  const grid = document.getElementById("works-grid");
  const empty = document.getElementById("works-empty");

  grid.innerHTML = "";
  allWorks = [];

  const checks = Array.from({ length: MAX_WORKS }, (_, i) => findImage(i + 1));
  const images = await Promise.all(checks);

  images.forEach((src, i) => {
    if (!src) return;
    const index = i + 1;
    const meta = (typeof worksMeta !== "undefined" && worksMeta[index]) || {};
    const category = categoryNames[meta.category] ? meta.category : "ai";
    allWorks.push({
      index,
      src,
      title: meta.title || titleFromFilename(src.split("/").pop()),
      category,
      tags: Array.isArray(meta.tags) ? meta.tags : [categoryNames[category]],
      description: meta.description || "나만의 디지털 메이킹 작품"
    });
  });

  if (!allWorks.length) {
    empty.style.display = "block";
    document.getElementById("works-count").textContent = "";
    return;
  }

  empty.style.display = "none";
  applyWorks();
}

function renderWorks(items) {
  const grid = document.getElementById("works-grid");
  const count = document.getElementById("works-count");
  grid.innerHTML = "";
  updateWorksPageLabel(items.length);

  if (!items.length) {
    grid.innerHTML = `<div class="works-no-result">검색 결과가 없습니다.<br><small>작품명이나 태그를 다시 검색해보세요.</small></div>`;
    count.textContent = "";
    return;
  }

  worksPage = Math.min(worksPage, Math.max(0, Math.ceil(items.length / MOBILE_PAGE_SIZE) - 1));
  // 모든 작품을 DOM에 유지하여 스와이프 중 인접 페이지도 함께 보입니다.
  let page = null;
  items.forEach((item, index) => {
    if (MOBILE_WORKS_QUERY.matches && index % MOBILE_PAGE_SIZE === 0) {
      page = document.createElement('div');
      page.className = 'works-mobile-page';
      page.setAttribute('role', 'group');
      page.setAttribute('aria-label', `${Math.floor(index / MOBILE_PAGE_SIZE) + 1} 페이지`);
      grid.appendChild(page);
    }
    const card = document.createElement("article");
    card.className = "work-card";
    card.dataset.category = item.category;
    card.innerHTML = `
      <div class="work-image-box"><img class="work-image" src="${item.src}" alt="${escapeHtml(item.title)}" loading="${MOBILE_WORKS_QUERY.matches ? 'eager' : 'lazy'}"></div>
      <div class="work-content">
        <div class="category">${categoryNames[item.category]}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <div class="work-tags">${item.tags.map(tag => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>
        <p>${escapeHtml(item.description)}</p>
      </div>`;
    (MOBILE_WORKS_QUERY.matches ? page : grid).appendChild(card);
  });

  count.textContent = `${items.length}개의 작품`;
  grid.scrollLeft = MOBILE_WORKS_QUERY.matches ? worksPage * grid.clientWidth : 0;
  fitWorkImages();
}

// 작품 이미지의 원본 비율을 유지하면서 이미지 영역 안에서 최대 크기로 맞춥니다.
function fitWorkImages() {
  document.querySelectorAll('.work-image').forEach(img => {
    const box = img.closest('.work-image-box');
    if (!box) return;
    const fit = () => {
      const boxRatio = box.clientWidth / box.clientHeight;
      const imageRatio = img.naturalWidth / img.naturalHeight;
      img.style.width = '';
      img.style.height = '';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      // contain으로 비율을 유지하며 가로/세로 중 제한되는 축을 기준으로 자동 조정합니다.
      if (imageRatio > boxRatio) {
        img.style.width = '100%';
        img.style.height = 'auto';
      } else {
        img.style.width = 'auto';
        img.style.height = '100%';
      }
    };
    if (img.complete) fit();
    else img.addEventListener('load', fit, { once: true });
  });
}

function applyWorks() {
  cancelWorksTransition();
  const active = document.querySelector(".filter.active")?.dataset.filter || "all";
  const query = document.getElementById("workSearch")?.value.trim().toLowerCase() || "";

  visibleWorks = allWorks.filter(item => {
    const categoryMatch = active === "all" || item.category === active;
    const searchText = [item.title, item.description, ...item.tags, categoryNames[item.category]].join(" ").toLowerCase();
    return categoryMatch && (!query || searchText.includes(query));
  });

  worksPage = 0;
  renderWorks(visibleWorks);
  updateArrowState();
}

function initFilters() {
  document.querySelectorAll(".filter").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      applyWorks();
    });
  });
}

function initSearch() {
  document.getElementById("workSearch")?.addEventListener("input", applyWorks);
}

function getScrollAmount() {
  const grid = document.getElementById("works-grid");
  const card = grid.querySelector(".work-card");
  if (!card) return grid.clientWidth;
  const gap = parseFloat(getComputedStyle(grid).gap) || 12;
  const visible = window.innerWidth <= 650 ? 2 : 6;
  return (card.getBoundingClientRect().width + gap) * visible;
}

function updateArrowState() {
  const grid = document.getElementById("works-grid");
  const prev = document.getElementById("worksPrev");
  const next = document.getElementById("worksNext");
  if (!grid || !prev || !next) return;
  if (MOBILE_WORKS_QUERY.matches) {
    prev.disabled = worksPage === 0 || !visibleWorks.length;
    next.disabled = !visibleWorks.length || worksPage >= worksPageCount() - 1;
    return;
  }
  const hasOverflow = grid.scrollWidth > grid.clientWidth + 4;
  prev.disabled = !hasOverflow || grid.scrollLeft <= 4;
  next.disabled = !hasOverflow || grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4;
}

// 모바일은 4개씩 페이징하고 PC는 기존 가로 슬라이더를 사용합니다.
function updateWorksPageLabel(total) {
  const label = document.getElementById('worksPageStatus');
  if (!label) return;
  label.hidden = !MOBILE_WORKS_QUERY.matches || !total;
  label.textContent = total ? `${worksPage + 1} / ${Math.ceil(total / MOBILE_PAGE_SIZE)} 페이지` : '';
  const controls = document.getElementById('worksMobileControls');
  if (controls) controls.hidden = !MOBILE_WORKS_QUERY.matches || !total;
  const mobilePrev = document.getElementById('worksMobilePrev');
  const mobileNext = document.getElementById('worksMobileNext');
  if (mobilePrev) mobilePrev.disabled = worksPage === 0;
  if (mobileNext) mobileNext.disabled = !total || worksPage >= Math.ceil(total / MOBILE_PAGE_SIZE) - 1;
}

function initSlider() {
  const grid = document.getElementById("works-grid");
  const prev = document.getElementById("worksPrev");
  const next = document.getElementById("worksNext");
  if (!grid) return;

  // 별도 CSS/HTML 수정 없이 모바일 2열 × 2행을 적용합니다.
  const style = document.createElement('style');
  style.textContent = `
    #worksPageStatus { text-align: center; margin: 12px 0; font-size: 0.85rem; }
    #worksPageStatus[hidden] { display: none !important; }
    #worksMobileControls { display: flex !important; align-items: center; justify-content: center; gap: 18px; margin: 18px 0; }
    #worksMobileControls[hidden] { display: none !important; }
    #worksMobileControls #worksPageStatus { margin: 0; min-width: 100px; }
    #worksMobileControls button {
      display: inline-flex !important; align-items: center; justify-content: center;
      width: 48px; height: 48px; padding: 0; border: 1px solid #555;
      border-radius: 50%; background: #fff; color: #222; cursor: pointer;
      position: static; opacity: 1; visibility: visible; touch-action: manipulation;
    }
    #worksMobileControls button:disabled { opacity: 0.35; cursor: default; }
    #worksMobileControls button:focus-visible { outline: 3px solid #2699a5; outline-offset: 3px; }
    #worksMobileControls svg { display: block; width: 24px; height: 24px; }

    @media (max-width: 650px) {
      #works-grid {
        display: flex !important;
        grid-template-columns: none !important;
        gap: 0 !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        scroll-snap-type: x mandatory;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-x pan-y;
        scrollbar-width: none;
        align-items: stretch;
      }
      #works-grid::-webkit-scrollbar { display: none; }
      #works-grid .works-mobile-page {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, auto);
        gap: 12px;
        flex: 0 0 100%;
        min-width: 0;
        box-sizing: border-box;
        scroll-snap-align: start;
        align-content: start;
        padding: 0 6px;
      }
      #works-grid .work-card {
        width: 100% !important; min-width: 0 !important; max-width: none !important;
        box-sizing: border-box;
      }
      #works-grid .work-image-box { aspect-ratio: 1 / 1; }
      #works-grid .works-no-result { grid-column: 1 / -1; }
    }
  `;
  document.head.appendChild(style);
  const label = document.createElement('div');
  label.id = 'worksPageStatus';
  label.setAttribute('role', 'status');
  label.setAttribute('aria-live', 'polite');
  label.hidden = true;
  const controls = document.createElement('div');
  controls.id = 'worksMobileControls';
  controls.hidden = true;
  const createArrow = (id, name, path, direction) => {
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.setAttribute('aria-label', name);
    button.setAttribute('aria-controls', 'works-grid');
    button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${path}" /></svg>`;
    button.addEventListener('click', () => changeWorksPage(direction));
    return button;
  };
  controls.appendChild(createArrow('worksMobilePrev', '이전 작품 페이지', 'M15 5l-7 7 7 7', -1));
  controls.appendChild(label);
  controls.appendChild(createArrow('worksMobileNext', '다음 작품 페이지', 'M9 5l7 7-7 7', 1));
  grid.insertAdjacentElement('afterend', controls);
  const viewport = document.createElement('div');
  viewport.style.overflow = 'hidden';
  viewport.style.width = '100%';
  grid.parentNode.insertBefore(viewport, grid);
  viewport.appendChild(grid);

  const move = direction => {
    if (MOBILE_WORKS_QUERY.matches) changeWorksPage(direction);
    else grid.scrollBy({ left: direction * getScrollAmount(), behavior: "smooth" });
  };
  prev?.addEventListener('click', () => move(-1));
  next?.addEventListener('click', () => move(1));

  grid.addEventListener('scroll', () => {
    if (MOBILE_WORKS_QUERY.matches && grid.clientWidth) {
      worksPage = Math.max(0, Math.min(worksPageCount() - 1, Math.round(grid.scrollLeft / grid.clientWidth)));
      updateWorksPageLabel(visibleWorks.length);
    }
    updateArrowState();
  }, { passive: true });
  MOBILE_WORKS_QUERY.addEventListener('change', () => {
    worksPage = 0;
    renderWorks(visibleWorks);
    updateArrowState();
  });
  let previousWidth = grid.clientWidth;
  window.addEventListener('resize', () => {
    if (MOBILE_WORKS_QUERY.matches && previousWidth !== grid.clientWidth) {
      grid.scrollTo({ left: worksPage * grid.clientWidth, behavior: 'instant' });
    }
    previousWidth = grid.clientWidth;
    fitWorkImages();
    updateArrowState();
  });
}

function initMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
}

document.getElementById("shareBtn")?.addEventListener("click", async () => {
  const shareData = {
    title: "김현미 | Digital Maker · AI Instructor",
    text: "AI로 상상하고, 디지털 기술로 만들어갑니다.",
    url: location.href
  };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch (e) {}
  } else {
    await navigator.clipboard?.writeText(location.href);
    alert("디지털 명함 주소가 복사되었습니다.");
  }
});

initFilters();
initSearch();
initSlider();
initMenu();
loadProfilePhoto();
loadWorks();
