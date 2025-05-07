// script.js: 한 섹션씩 부드럽게 스크롤 + 캔버스 파티클 애니메이션 (모바일 지원)

/**
 * SECTION SCROLL SETUP
 */
// 모든 섹션과 헤더 요소를 선택
const sections = document.querySelectorAll('section');
const header = document.querySelector('header');
let currentSection = 0;            // 현재 활성 섹션 인덱스
let isScrolling = false;           // 스크롤 애니메이션 중복 방지 플래그
const scrollDuration = 700;        // 스크롤 애니메이션 지속시간 (ms)
const swipeThreshold = 50;         // 모바일 스와이프 최소 거리
let touchStartY = 0;               // 터치 시작 Y 좌표

/**
 * CANVAS & PARTICLE ANIMATION SETUP
 */
// 캔버스 및 컨텍스트 가져오기
const canvas = document.getElementById('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];                // 파티클 객체 배열
const textString = "Dev DeΩm";    // 텍스트 문자열
let textPoints = [];               // 텍스트 픽셀 맵 좌표
let animationId;                   // requestAnimationFrame ID

/**
 * 뷰포트 크기에 따른 기본 폰트 사이즈 반환
 */
function getBaseFontSize() {
  return window.innerWidth < 768 ? 60 : 100;
}

/**
 * 캔버스 크기를 윈도우 전체로 설정하고
 * 애니메이션 중이면 텍스트 맵 및 파티클 재초기화
 */
function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (canvas.style.opacity === '1') {
    textPoints = createTextMap();
    initializeParticles();
  }
}

/**
 * 캔버스에 텍스트를 그리고
 * 흰색 픽셀 좌표를 샘플링하여 particle 목표 좌표 생성
 */
function createTextMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const fontSize = getBaseFontSize();
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(textString, canvas.width/2, canvas.height/2);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const points = [];
  // 일정 간격(6px)으로 샘플링
  for (let y = 0; y < canvas.height; y += 6) {
    for (let x = 0; x < canvas.width; x += 6) {
      const idx = (y * canvas.width + x) * 4;
      if (data[idx] > 128) points.push({ x, y });
    }
  }
  return points;
}

/**
 * 파티클 객체 생성자
 * 각 파티클은 랜덤 시작 위치에서 목표 지점으로 이동
 */
function Particle(x, y) {
  this.x = Math.random() * canvas.width;
  this.y = Math.random() * canvas.height;
  this.targetX = x;
  this.targetY = y;
  this.vx = 0;
  this.vy = 0;
  this.size = Math.random() * 2 + 1;

  // 물리 기반 업데이트
  this.update = function() {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    const force = Math.min(dist / 10, 0.2);
    const angle = Math.atan2(dy, dx);
    this.vx += Math.cos(angle) * force;
    this.vy += Math.sin(angle) * force;
    this.vx *= 0.9;
    this.vy *= 0.9;
    this.x += this.vx;
    this.y += this.vy;
  };

  // 캔버스에 원 형태로 파티클 그리기
  this.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  };
}

/**
 * 파티클 배열 초기화
 */
function initializeParticles() {
  particles = [];
  textPoints.forEach(p => particles.push(new Particle(p.x, p.y)));
}

/**
 * 애니메이션 루프: 캔버스 클리어 후 파티클 업데이트 및 렌더
 */
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  animationId = requestAnimationFrame(animateParticles);
}

/**
 * 파티클 애니메이션 시작
 */
function startParticles() {
  textPoints = createTextMap();
  initializeParticles();
  canvas.style.opacity = '1';
  animateParticles();
}

/**
 * 파티클 애니메이션 정지 및 캔버스 클리어
 */
function stopParticles() {
  cancelAnimationFrame(animationId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.opacity = '0';
}

/**
 * #home 섹션이 뷰포트에 완전히 보일 때만 애니메이션 토글
 */
const homeSection = document.getElementById('home');
if (homeSection && canvas) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio === 1) startParticles();
      else stopParticles();
    });
  }, { root: null, rootMargin: '0px', threshold: 1.0 });
  observer.observe(homeSection);
}

/**
 * 초기 섹션 인덱스 계산
 */
function initCurrentSection() {
  const pos = window.pageYOffset + header.offsetHeight;
  const idx = Array.from(sections).findIndex(sec => pos >= sec.offsetTop && pos < sec.offsetTop + sec.offsetHeight);
  currentSection = idx < 0 ? 0 : idx;
}

/**
 * 주어진 인덱스로 부드럽게 스크롤
 */
function scrollToSection(idx) {
  if (idx < 0 || idx >= sections.length) return;
  isScrolling = true;
  const target = sections[idx].offsetTop - header.offsetHeight;
  window.scrollTo({ top: target, behavior: 'smooth' });
  setTimeout(() => {
    currentSection = idx;
    isScrolling = false;
  }, scrollDuration);
}

/**
 * 이벤트 바인딩: 로드, 리사이즈, 휠, 터치, 내비게이션
 */
window.addEventListener('load', () => {
  initCurrentSection();
  resizeCanvas();
  scrollToSection(currentSection);
});

window.addEventListener('resize', resizeCanvas, { passive: true });

window.addEventListener('wheel', e => {
  e.preventDefault();
  if (isScrolling) return;
  if (e.deltaY > 0) scrollToSection(currentSection + 1);
  else scrollToSection(currentSection - 1);
}, { passive: false });

window.addEventListener('touchstart', e => { touchStartY = e.changedTouches[0].clientY; }, { passive: true });

window.addEventListener('touchend', e => {
  if (isScrolling) return;
  const d = touchStartY - e.changedTouches[0].clientY;
  if (d > swipeThreshold) scrollToSection(currentSection + 1);
  else if (d < -swipeThreshold) scrollToSection(currentSection - 1);
}, { passive: true });

document.querySelectorAll('nav a[href^="#"]').forEach(a =>
  a.addEventListener('click', e => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const idx = Array.from(sections).findIndex(sec => sec.id === id);
    if (idx !== -1) scrollToSection(idx);
  })
);