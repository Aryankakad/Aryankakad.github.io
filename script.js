const projects = [
  {
    title: 'Mission Mimosa',
    category: 'ROBOT LEARNING · VISUO-TACTILE MANIPULATION',
    intro: 'Can a sense of touch help a robot manipulate the world more reliably? Mission Mimosa explores this question on the SO-101, combining visual observations with tactile sensing.',
    highlights: [
      'FlexiTac sensing and LeFlexiTac integration bring contact observations into the LeRobot workflow.',
      'Explores ACT, diffusion, B-Spline policies, and SmolVLA for manipulation.',
      'The build log follows the setup, sensors, policy integration, and comparisons between vision-only and visuo-tactile observations.'
    ],
    links: [
      ['Read the project', 'https://zademahi238.github.io/mission-mimosa/#/'],
      ['View source', 'https://github.com/zademahi238/mission-mimosa']
    ]
  },
  {
    title: 'Hacky Arm',
    category: 'TELEOPERATION · PHYSICAL & MUJOCO',
    intro: 'My build of an encoder-based, 3D-printed leader arm, demonstrated with a physical follower and in MuJoCo. The original hardware and software foundation comes from Matheshwaran Pitchai’s open-source leader arm, with LeRobot integration.',
    highlights: [
      'Six AS5600 magnetic encoders connect through a TCA9548A multiplexer to an ESP32, using the upstream hardware and firmware design.',
      'The physical teleoperation clip shows this leader driving a real follower arm.',
      'The MuJoCo clip shows the same physical interface driving a simulated follower. These are manual teleoperation demonstrations.'
    ],
    links: [
      ['hacky_arm repository', 'https://github.com/Aryankakad/hacky_arm']
    ]
  }
];
const dialog = document.querySelector('#project-dialog');
document.querySelectorAll('[data-project]').forEach(card => card.addEventListener('click', () => {
  const project = projects[Number(card.dataset.project)];
  document.querySelector('#dialog-title').textContent = project.title;
  document.querySelector('#dialog-category').textContent = project.category;
  document.querySelector('#dialog-intro').textContent = project.intro;
  const highlights = document.querySelector('#dialog-highlights');
  highlights.replaceChildren(...project.highlights.map(text => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));
  const links = document.querySelector('#dialog-links');
  links.replaceChildren(...project.links.map(([label, href]) => {
    const link = document.createElement('a');
    link.className = 'primary-link';
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label + ' ↗';
    return link;
  }));
  const media = document.querySelector('#dialog-media');
  media.replaceChildren();
  if (Number(card.dataset.project) === 0) {
    const video = document.createElement('video');
    video.src = 'assets/mimosa-demo.mp4'; video.poster = 'assets/mimosa-lab.jpg';
    video.controls = true; video.playsInline = true; video.preload = 'metadata';
    media.append(video);
  } else {
    for (const [source, poster, caption] of [
      ['assets/hacky_arm_teleop.mp4', 'assets/hacky_arm_teleop.jpg', 'Physical teleoperation'],
      ['assets/hacky_arm_mujoco_teleop.mp4', 'assets/hacky_arm_mujoco_teleop.jpg', 'MuJoCo teleoperation']
    ]) {
      const figure = document.createElement('figure');
      const video = document.createElement('video');
      video.src = source; video.poster = poster;
      video.controls = true; video.playsInline = true; video.preload = 'none';
      video.setAttribute('aria-label', caption + ' — Hacky Arm');
      const label = document.createElement('figcaption'); label.textContent = caption;
      figure.append(video, label); media.append(figure);
    }
  }
  dialog.showModal();
}));
dialog.addEventListener('close', () => { dialog.querySelectorAll('video').forEach(video => video.pause()); });
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => {
  const r = dialog.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
});

const themeToggle=document.querySelector('#theme-toggle');
function updateTheme(){const dark=document.documentElement.dataset.theme==='dark';themeToggle.setAttribute('aria-label',`Switch to ${dark?'light':'dark'} mode`);themeToggle.setAttribute('aria-pressed',String(dark));themeToggle.querySelector('.theme-label').textContent=dark?'Light':'Dark';document.querySelector('meta[name="theme-color"]').content=dark?'#121316':'#fcf8ef';}
themeToggle.addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('portfolio-theme',document.documentElement.dataset.theme)}catch(e){}updateTheme();window.portfolioBackground?.refresh();});updateTheme();
document.querySelector('#year').textContent=new Date().getFullYear();
const menu=document.querySelector('#menu-toggle'),nav=document.querySelector('nav');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  document.querySelectorAll('[data-category]').forEach(card => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
  });
}));

// Reading preference, independent of the color theme.
const fontSelect=document.querySelector('#font-select');
fontSelect.value=document.documentElement.dataset.font||'original';
fontSelect.addEventListener('change',()=>{
  document.documentElement.dataset.font=fontSelect.value;
  try{localStorage.setItem('portfolio-font',fontSelect.value)}catch(e){}
});
