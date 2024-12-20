// 캔버스 파티클 애니메이션
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 캔버스 크기 설정
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

let particles = [];
const textString = "Dev Deom";
let textPoints = [];
let animationId;

/**
 * 현재 윈도우 크기에 따라 텍스트 사이즈 결정
 */
function getBaseFontSize() {
    if (window.innerWidth < 768) {
        return 60;
    } else {
        return 100;
    }
}

/**
 * 텍스트를 캔버스에 그린 뒤 픽셀 데이터를 이용해 파티클 위치 맵을 생성
 */
function createTextMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fontSize = getBaseFontSize();
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(textString, canvas.width / 2, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const points = [];

    for (let y = 0; y < canvas.height; y += 6) {
        for (let x = 0; x < canvas.width; x += 6) {
            const index = (y * canvas.width + x) * 4;
            if (data[index] > 128) {
                points.push({ x, y });
            }
        }
    }

    return points;
}

/**
 * 파티클 객체 생성자
 * @param {number} x 목표 x 좌표
 * @param {number} y 목표 y 좌표
 */
function Particle(x, y) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.targetX = x;
    this.targetY = y;
    this.vx = 0;
    this.vy = 0;
    this.size = Math.random() * 2 + 1;
    this.color = 'white';

    this.update = function () {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = Math.min(distance / 10, 0.2);
        const angle = Math.atan2(dy, dx);

        this.vx += Math.cos(angle) * force;
        this.vy += Math.sin(angle) * force;
        this.vx *= 0.9;
        this.vy *= 0.9;
        this.x += this.vx;
        this.y += this.vy;
    };

    this.draw = function () {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    };
}

/**
 * 파티클 초기화
 */
function initializeParticles() {
    particles = [];
    for (let i = 0; i < textPoints.length; i++) {
        particles.push(new Particle(textPoints[i].x, textPoints[i].y));
    }
}

/**
 * 애니메이션
 */
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle) => {
        particle.update();
        particle.draw();
    });
    animationId = requestAnimationFrame(animate);
}

/**
 * 파티클 애니메이션 시작
 */
function startAnimation() {
    textPoints = createTextMap();
    initializeParticles();
    animate();
    canvas.style.opacity = 1;
}

/**
 * 파티클 애니메이션 정지
 */
function stopAnimation() {
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.opacity = 0;
}

// 초기 캔버스 숨김
canvas.style.opacity = 0;

// Intersection Observer 설정
const homeSection = document.getElementById('home');

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 1.0 // 섹션 전체가 보여질 때만 활성화
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            startAnimation(); // 섹션 전체가 화면에 보일 때 애니메이션 시작
        } else {
            stopAnimation(); // 섹션이 화면에서 벗어나면 애니메이션 중지
        }
    });
}, observerOptions);

observer.observe(homeSection);

// 윈도우 리사이즈 시 캔버스 크기 재조정
window.addEventListener('resize', () => {
    resizeCanvas();
    if (canvas.style.opacity === '1') {
        // 캔버스가 보이는 상태라면 맵을 재생성
        textPoints = createTextMap();
        initializeParticles();
    }
});

// 섹션 애니메이션을 위한 Intersection Observer
const contentObserverOptions = {
    threshold: 0.1
};

const contentObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, contentObserverOptions);

// 모든 animate-on-scroll 요소 관찰
const animatedElements = document.querySelectorAll('.animate-on-scroll, .section-content');
animatedElements.forEach(el => contentObserver.observe(el));

/**
 * 네비게이션 링크 클릭 시 부드러운 스크롤 구현
 */
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);

        if (target) {
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

/**
 * 마우스 스크롤 시 부드럽게 섹션으로 이동하는 기능
 */
let isScrolling = false;
const sections = document.querySelectorAll('section');
const totalSections = sections.length;
let currentSection = 0;

function scrollToSection(index) {
    if (index >= 0 && index < totalSections) {
        isScrolling = true;
        const headerHeight = document.querySelector('header').offsetHeight;
        const target = sections[index];
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        setTimeout(() => {
            isScrolling = false;
            currentSection = index;
        }, 750);
    }
}

let lastScrollTop = 0; // 마지막 스크롤 위치 저장
const buffer = 50; // 섹션을 벗어난 것으로 간주하는 거리

window.addEventListener('wheel', function (e) {
    if (isScrolling) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const headerHeight = document.querySelector('header').offsetHeight;

    const currentSectionTop = sections[currentSection].offsetTop - headerHeight;
    const nextSectionTop = sections[currentSection + 1] ? sections[currentSection + 1].offsetTop - headerHeight : Infinity;
    const prevSectionTop = sections[currentSection - 1] ? sections[currentSection - 1].offsetTop - headerHeight : -Infinity;

    // 스크롤 다운: 현재 섹션의 하단을 벗어나면 다음 섹션으로
    if (e.deltaY > 0 && scrollTop > currentSectionTop + buffer && scrollTop < nextSectionTop) {
        if (currentSection < totalSections - 1) {
            scrollToSection(currentSection + 1);
        }
    }
    // 스크롤 업: 현재 섹션의 상단을 벗어나면 이전 섹션으로
    else if (e.deltaY < 0 && scrollTop < currentSectionTop - buffer && scrollTop > prevSectionTop) {
        if (currentSection > 0) {
            scrollToSection(currentSection - 1);
        }
    }

    lastScrollTop = scrollTop; // 마지막 스크롤 위치 업데이트
});

