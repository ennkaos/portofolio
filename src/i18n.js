const STORAGE_KEY = 'portfolio-lang';

const translations = {
  en: {
    metaDesc: 'Alexandru Florin Bucur — Software Engineer, Web Developer, Graphic Designer, Solution Architect & Business Analyst. From a seed of an idea to something extraordinary.',
    loading: 'Planting the seed...',
    heroSubtitle: 'Alexandru Florin Bucur',
    heroTitle: 'Software Engineer <em>·</em> Web Developer <em>·</em> Graphic Designer <em>·</em> Solution Architect <em>·</em> Business Analyst',
    heroMeta: 'every great thing begins with a seed of an <em>idea</em>',
    scrollHint: 'scroll to grow',
    planted: 'the <em>idea</em> was planted',
    education: 'BSc Economic Informatics — Transilvania University of Brașov <em>(2018–2021)</em>',
    maturity: 'university behind me — time to build my <em>own</em> things',
    grown: 'with time, effort and experience the <em>idea</em> grew — 4+ years building enterprise solutions',
    tree: 'the seed became a <em>strong</em> tree',
    flowerHint: 'Click on the pools to dive in',
    poolPrivacy: 'Many projects are protected by privacy laws and NDAs — I cannot display them publicly',
    cvLabel: 'CV',
    cvOpen: 'Open CV',
    cvClose: 'Close CV',
    aboutRole: 'Software Engineer · Web Developer · Graphic Designer · Solution Architect · Business Analyst',
    aboutLangs: 'Romanian (native) · Italian (C1–C2) · English (C1–C2)',
    aboutText: 'Software Engineer, Web Developer, Graphic Designer, Solution Architect & Business Analyst with 4+ years developing enterprise web applications for banking and public institutions in Italy. Backend with Java, frontend with Angular & React. Building scalable platforms, batch systems, and internal portals. Skilled in using <strong>AI for marketing and business analysis</strong>.',
    aboutFrontend: 'Frontend:',
    aboutBackend: 'Backend:',
    aboutTools: 'Tools:',
    aboutAI: 'AI:',
    aboutAISkills: 'Marketing automation, business analysis, data-driven insights',
    aboutExp: 'Web Application Developer',
    aboutExpAt: 'Avanade Italy (2022–Present)',
    aboutExpDetail: 'Credem Bank batch systems · ItaloTreno portal (React) · Dynamic form engine (Angular) · Fleet management & HR portals for Italian Ministry',
    aboutEdu: 'BSc Economic Informatics',
    aboutEduAt: 'Transilvania University of Brașov (2018–2021)',
    projectsTitle: 'Projects',
    projectsHint: 'Click on the pools in the grass to dive in — each opens a GitHub repo.',
    projectsPrivacy: 'Many of my projects are protected by privacy laws and NDAs, so I cannot display them publicly.',
    projectsMore: 'There are many other projects I cannot show here.',
    viewGitHub: 'View all on GitHub',
    contactTitle: 'Contact',
  },
  it: {
    metaDesc: 'Alexandru Florin Bucur — Ingegnere Software, Sviluppatore Web, Graphic Designer, Solution Architect & Business Analyst. Da un seme di idea a qualcosa di straordinario.',
    loading: 'Piantando il seme...',
    heroSubtitle: 'Alexandru Florin Bucur',
    heroTitle: 'Ingegnere Software <em>·</em> Sviluppatore Web <em>·</em> Graphic Designer <em>·</em> Solution Architect <em>·</em> Business Analyst',
    heroMeta: 'ogni grande cosa inizia da un seme di <em>idea</em>',
    scrollHint: 'scorri per far crescere',
    planted: 'l\'<em>idea</em> è stata piantata',
    education: 'Laurea in Informatica Economica — Università Transilvania di Brașov <em>(2018–2021)</em>',
    maturity: 'università alle spalle — tempo di costruire le <em>mie</em> cose',
    grown: 'con tempo, impegno ed esperienza l\'<em>idea</em> è cresciuta — oltre 4 anni a costruire soluzioni enterprise',
    tree: 'il seme è diventato un <em>albero</em> forte',
    flowerHint: 'Clicca sulle pozze nell\'erba per immergerti — ognuna apre un repo GitHub.',
    poolPrivacy: 'Molti progetti sono protetti da leggi sulla privacy e NDA — non posso mostrarli pubblicamente.',
    cvLabel: 'CV',
    cvOpen: 'Apri CV',
    cvClose: 'Chiudi CV',
    aboutRole: 'Ingegnere Software · Sviluppatore Web · Graphic Designer · Solution Architect · Business Analyst',
    aboutLangs: 'Rumeno (madrelingua) · Italiano (C1–C2) · Inglese (C1–C2)',
    aboutText: 'Ingegnere Software, Sviluppatore Web, Graphic Designer, Solution Architect & Business Analyst con oltre 4 anni di esperienza nello sviluppo di applicazioni web enterprise per banche e istituzioni pubbliche in Italia. Backend con Java, frontend con Angular e React. Costruisco piattaforme scalabili, sistemi batch e portali interni. Competente nell\'uso di <strong>IA per marketing e business analysis</strong>.',
    aboutFrontend: 'Frontend:',
    aboutBackend: 'Backend:',
    aboutTools: 'Strumenti:',
    aboutAI: 'IA:',
    aboutAISkills: 'Automazione marketing, business analysis, insight basati sui dati',
    aboutExp: 'Sviluppatore di Applicazioni Web',
    aboutExpAt: 'Avanade Italy (2022–Oggi)',
    aboutExpDetail: 'Sistemi batch Credem Bank · portale ItaloTreno (React) · motore form dinamici (Angular) · gestione flotte e portali HR per Ministero italiano',
    aboutEdu: 'Laurea in Informatica Economica',
    aboutEduAt: 'Università Transilvania di Brașov (2018–2021)',
    projectsTitle: 'Progetti',
    projectsHint: 'Clicca sulle pozze nell\'erba per immergerti — ognuna apre un repo GitHub.',
    projectsPrivacy: 'Molti dei miei progetti sono protetti da leggi sulla privacy e NDA, quindi non posso mostrarli pubblicamente.',
    projectsMore: 'Ci sono molti altri progetti che non posso mostrare qui.',
    viewGitHub: 'Vedi tutto su GitHub',
    contactTitle: 'Contatti',
  },
  ro: {
    loading: 'Plantăm sămânța...',
    heroSubtitle: 'Alexandru Florin Bucur',
    heroTitle: 'Inginer Software <em>·</em> Dezvoltator Web <em>·</em> Graphic Designer <em>·</em> Solution Architect <em>·</em> Business Analyst',
    heroMeta: 'orice lucru mare începe cu o sămânță de <em>idee</em>',
    scrollHint: 'derulează pentru a crește',
    planted: '<em>ideea</em> a fost plantată',
    education: 'Licență Informatică Economică — Universitatea Transilvania din Brașov <em>(2018–2021)</em>',
    maturity: 'universitatea în urmă — timpul să-mi construiesc lucrurile <em>mele</em>',
    grown: 'cu timp, efort și experiență <em>ideea</em> a crescut — peste 4 ani construind soluții enterprise',
    tree: 'sămânța a devenit un <em>copac</em> puternic',
    flowerHint: 'Apasă pe bălțile din iarbă pentru a te scufunda — fiecare deschide un repo GitHub.',
    poolPrivacy: 'Multe proiecte sunt protejate de legi privind confidențialitatea și NDA — nu le pot afișa public.',
    cvLabel: 'CV',
    cvOpen: 'Deschide CV',
    cvClose: 'Închide CV',
    aboutRole: 'Inginer Software · Dezvoltator Web · Graphic Designer · Solution Architect · Business Analyst',
    aboutLangs: 'Română (nativ) · Italiană (C1–C2) · Engleză (C1–C2)',
    aboutText: 'Inginer Software, Dezvoltator Web, Graphic Designer, Solution Architect & Business Analyst cu peste 4 ani de experiență în dezvoltarea aplicațiilor web enterprise pentru bănci și instituții publice din Italia. Backend cu Java, frontend cu Angular și React. Construiesc platforme scalabile, sisteme batch și portale interne. Competent în utilizarea <strong>IA pentru marketing și business analysis</strong>.',
    aboutFrontend: 'Frontend:',
    aboutBackend: 'Backend:',
    aboutTools: 'Instrumente:',
    aboutAI: 'IA:',
    aboutAISkills: 'Automatizare marketing, business analysis, insight bazate pe date',
    aboutExp: 'Dezvoltator Aplicații Web',
    aboutExpAt: 'Avanade Italy (2022–Prezent)',
    aboutExpDetail: 'Sisteme batch Credem Bank · portal ItaloTreno (React) · motor formulare dinamice (Angular) · management flotă și portale HR pentru Ministerul Italian',
    aboutEdu: 'Licență Informatică Economică',
    aboutEduAt: 'Universitatea Transilvania din Brașov (2018–2021)',
    projectsTitle: 'Proiecte',
    projectsHint: 'Apasă pe bălțile din iarbă pentru a te scufunda — fiecare deschide un repo GitHub.',
    projectsPrivacy: 'Multe din proiectele mele sunt protejate de legi privind confidențialitatea și NDA, deci nu le pot afișa public.',
    projectsMore: 'Există multe alte proiecte pe care nu le pot arăta aici.',
    viewGitHub: 'Vezi toate pe GitHub',
    contactTitle: 'Contact',
  },
};

export function t(key) {
  return translations[getLang()]?.[key] ?? key;
}

export function getLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && translations[stored]) return stored;
  return 'en';
}

export function setLang(code) {
  if (!translations[code]) return;
  localStorage.setItem(STORAGE_KEY, code);
  applyTranslations(code);
}

function _setHtmlLang(code) {
  document.documentElement.lang = code === 'ro' ? 'ro' : code === 'it' ? 'it' : 'en';
}

export function applyTranslations(lang = getLang()) {
  const t = translations[lang];
  if (!t) return;

  _setHtmlLang(lang);
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && t.metaDesc) metaDesc.content = t.metaDesc;

  const set = (sel, key, attr = 'textContent') => {
    const el = document.querySelector(sel);
    if (el) {
      if (attr === 'innerHTML') el.innerHTML = t[key];
      else el[attr] = t[key];
    }
  };

  set('.loader-text', 'loading');
  set('.hero-subtitle', 'heroSubtitle');
  set('.hero-title', 'heroTitle', 'innerHTML');
  set('.hero-meta', 'heroMeta', 'innerHTML');
  set('.scroll-hint-text', 'scrollHint');
  set('.planted-text', 'planted', 'innerHTML');
  set('.education-text', 'education', 'innerHTML');
  set('.maturity-text', 'maturity', 'innerHTML');
  set('.grown-text', 'grown', 'innerHTML');
  set('.tree-text', 'tree', 'innerHTML');
  set('#flower-hint', 'flowerHint');
  set('#pool-privacy-hint', 'poolPrivacy');
  set('.about-drawer-label', 'cvLabel');

  const drawerTrigger = document.getElementById('about-drawer-trigger');
  if (drawerTrigger) {
    const isOpen = document.getElementById('about-drawer')?.classList.contains('open');
    drawerTrigger.setAttribute('aria-label', isOpen ? t.cvClose : t.cvOpen);
  }

  set('.about-role', 'aboutRole');
  set('.about-langs', 'aboutLangs');
  set('.about-text', 'aboutText', 'innerHTML');

  const frontendEl = document.querySelector('.about-skills:not(.about-skills-ai)');
  const skillsEls = document.querySelectorAll('.about-skills');
  if (skillsEls[0]) skillsEls[0].innerHTML = `<strong>${t.aboutFrontend}</strong> Angular, React, Three.js, GSAP, Vite, Redux, RxJS, TypeScript, JavaScript, HTML5, CSS3, SASS`;
  if (skillsEls[1]) skillsEls[1].innerHTML = `<strong>${t.aboutBackend}</strong> Java, Spring Boot, Node.js, Express, Hibernate, REST APIs, C#`;
  if (skillsEls[2]) skillsEls[2].innerHTML = `<strong>${t.aboutTools}</strong> Git, Agile/Scrum, Webpack`;
  if (skillsEls[3]) skillsEls[3].innerHTML = `<strong>${t.aboutAI}</strong> ${t.aboutAISkills}`;

  const expEl = document.querySelector('.about-exp');
  if (expEl) expEl.innerHTML = `<strong>${t.aboutExp}</strong> — ${t.aboutExpAt}<br><span class="about-exp-detail">${t.aboutExpDetail}</span>`;

  const eduEl = document.querySelector('.about-edu');
  if (eduEl) eduEl.innerHTML = `<strong>${t.aboutEdu}</strong> — ${t.aboutEduAt}`;

  const projTitle = document.querySelector('#projects .content-title');
  if (projTitle) projTitle.textContent = t.projectsTitle;
  set('.projects-hint', 'projectsHint');
  set('.projects-privacy', 'projectsPrivacy');
  const moreEl = document.querySelector('.projects-more');
  if (moreEl) moreEl.innerHTML = `${t.projectsMore} <a href="https://github.com/ennkaos" target="_blank" rel="noopener noreferrer" class="content-link">${t.viewGitHub}</a>`;

  const contactTitle = document.querySelector('#contact .content-title');
  if (contactTitle) contactTitle.textContent = t.contactTitle;
}
