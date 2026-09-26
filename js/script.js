const MAX_WORKS = 30;
const extensions = ["jpg", "jpeg", "png", "webp", "gif"];
const categoryNames = { ai: "AI", "3d": "3D PRINT", laser: "LASER", resin: "RESIN", stationery: "DIGITAL STATIONERY" };

let allWorks = [];
let visibleWorks = [];

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

  if (!items.length) {
    grid.innerHTML = `<div class="works-no-result">검색 결과가 없습니다.<br><small>작품명이나 태그를 다시 검색해보세요.</small></div>`;
    count.textContent = "";
    return;
  }

  items.forEach(item => {
    const card = document.createElement("article");
    card.className = "work-card";
    card.dataset.category = item.category;
    card.innerHTML = `
      <div class="work-image-box"><img class="work-image" src="${item.src}" alt="${escapeHtml(item.title)}" loading="lazy"></div>
      <div class="work-content">
        <div class="category">${categoryNames[item.category]}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <div class="work-tags">${item.tags.map(tag => `<span>#${escapeHtml(tag)}</span>`).join("")}</div>
        <p>${escapeHtml(item.description)}</p>
      </div>`;
    grid.appendChild(card);
  });

  count.textContent = `${items.length}개의 작품`;
  grid.scrollLeft = 0;
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
  const active = document.querySelector(".filter.active")?.dataset.filter || "all";
  const query = document.getElementById("workSearch")?.value.trim().toLowerCase() || "";

  visibleWorks = allWorks.filter(item => {
    const categoryMatch = active === "all" || item.category === active;
    const searchText = [item.title, item.description, ...item.tags, categoryNames[item.category]].join(" ").toLowerCase();
    return categoryMatch && (!query || searchText.includes(query));
  });

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
  const hasOverflow = grid.scrollWidth > grid.clientWidth + 4;
  prev.disabled = !hasOverflow || grid.scrollLeft <= 4;
  next.disabled = !hasOverflow || grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4;
}

function initSlider() {
  const grid = document.getElementById("works-grid");
  const prev = document.getElementById("worksPrev");
  const next = document.getElementById("worksNext");
  if (!grid) return;

  prev?.addEventListener("click", () => grid.scrollBy({ left: -getScrollAmount(), behavior: "smooth" }));
  next?.addEventListener("click", () => grid.scrollBy({ left: getScrollAmount(), behavior: "smooth" }));
  grid.addEventListener("scroll", updateArrowState, { passive: true });
  window.addEventListener("resize", updateArrowState);
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
