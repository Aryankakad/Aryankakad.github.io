/* Two celestial atmospheres: a granulated sun by day and totality by night.
   Textures are cached once per scene. No image assets or dependencies. */
(() => {
  'use strict';
  const canvas = document.querySelector('#flow');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  let width=0,height=0,frame=0,last=0,time=0,dark=false;
  let corona=null, sun=null;
  const themePlates = Object.create(null);
  // Deterministic texture: theme changes never reshuffle or jump the composition.
  const noise = n => {const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};

  function buildCorona() {
    // A continuous radiance field removes the evenly spaced "sunburst" spokes.
    // Generated once per theme; animation only composites this cached plate.
    const plate=document.createElement('canvas');plate.width=800;plate.height=800;
    const c=plate.getContext('2d');
    if(!c)return plate;
    const image=c.createImageData(800,800),pixels=image.data;
    const count=4096,field=new Float32Array(count);
    const smoothNoise=(x,seed,period)=>{
      const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);
      return noise(i%period+seed)*(1-u)+noise((i+1)%period+seed)*u;
    };
    for(let i=0;i<count;i++){
      const u=i/count;
      field[i]=.44*smoothNoise(u*37,10,37)+.30*smoothNoise(u*113,90,113)+.17*smoothNoise(u*347,560,347)+.09*smoothNoise(u*991,2000,991);
    }
    for(let y=0;y<800;y++)for(let x=0;x<800;x++){
      const dx=(x-400)/140,dy=(y-400)/140;
      const radius=Math.hypot(dx,dy);
      if(radius<.97||radius>2.84)continue;
      const a=Math.atan2(dy,dx),q=Math.max(0,radius-1);
      const curved=a+.025*Math.sin(radius*3.1+a*5)+.012*Math.sin(radius*6-a*3);
      const u=((curved/TAU+1)%1)*count;
      const i=Math.floor(u),f=u-i;
      const filament=field[i]*(1-f)+field[(i+1)%count]*f;
      const streamers=Math.pow(Math.abs(Math.cos(a+.2)),5);
      const inner=.62*Math.exp(-q*12);
      const outer=(.17+streamers*.25)*Math.exp(-q*(2.8-streamers*.65));
      const structure=.57+filament*.83;
      const edge=Math.min(1,(2.84-radius)*2.5);
      // Fine photographic grain, fixed in space with no temporal shimmer.
      let hash=Math.imul(x+1,374761393)^Math.imul(y+1,668265263);
      hash=Math.imul(hash^(hash>>>13),1274126177);
      const grain=((hash>>>0)/4294967295-.5)*.018*Math.exp(-q*2);
      const intensity=Math.max(0,(inner+outer)*structure*edge+grain);
      const offset=(y*800+x)*4;
      pixels[offset]=dark?244:150;
      pixels[offset+1]=dark?236:125;
      pixels[offset+2]=dark?220:92;
      pixels[offset+3]=Math.min(255,intensity*(dark?245:164));
    }
    c.putImageData(image,0,0);
    return plate;
  }

  function buildSun() {
    const plate=document.createElement('canvas');plate.width=600;plate.height=600;
    const c=plate.getContext('2d');
    if(!c)return plate;
    const image=c.createImageData(600,600),pixels=image.data;
    const value=(x,y,seed)=>{
      const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
      const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
      const a=noise(ix+iy*173+seed),b=noise(ix+1+iy*173+seed);
      const d=noise(ix+(iy+1)*173+seed),e=noise(ix+1+(iy+1)*173+seed);
      return (a*(1-u)+b*u)*(1-v)+(d*(1-u)+e*u)*v;
    };
    for(let y=0;y<600;y++)for(let x=0;x<600;x++){
      const dx=(x-300)/125,dy=(y-300)/125,r=Math.hypot(dx,dy);
      const offset=(y*600+x)*4;
      if(r>1){
        const glow=.15*Math.exp(-(r-1)*5)+.025*Math.exp(-(r-1)*1.7);
        pixels[offset]=226;pixels[offset+1]=161;pixels[offset+2]=68;
        pixels[offset+3]=Math.round(glow*255*Math.max(0,Math.min(1,(2.4-r)*2)));
        continue;
      }
      const depth=Math.sqrt(Math.max(0,1-r*r));
      // Foreshortened granules, multiscale convection, and limb darkening.
      const gx=dx/(.72+depth*.28),gy=dy/(.72+depth*.28);
      const cells=value(gx*85+90,gy*85+90,18);
      const detail=value(gx*180+180,gy*180+180,341);
      const convection=value(gx*12+20,gy*12+20,82);
      const texture=(cells-.5)*.15+(detail-.5)*.065+(convection-.5)*.12;
      const brightness=.52+.48*Math.pow(depth,.55)+texture;
      // Restrained paired sunspots, with diffuse penumbrae.
      const spot=Math.exp(-((dx-.28)**2/.0008+(dy+.2)**2/.0018));
      const penumbra=Math.exp(-((dx-.28)**2/.003+(dy+.2)**2/.004));
      const satellite=Math.exp(-((dx-.36)**2/.0003+(dy+.15)**2/.0007));
      const shade=1-.35*spot-.07*penumbra-.22*satellite;
      pixels[offset]=Math.min(255,(226+brightness*29)*shade);
      pixels[offset+1]=Math.min(255,(83+brightness*111)*shade);
      pixels[offset+2]=Math.min(255,(17+brightness*66)*shade);
      pixels[offset+3]=Math.round(Math.min(1,(1-r)*125)*255);
    }
    c.putImageData(image,0,0);return plate;
  }

  function drawSun(cx,cy,r){
    ctx.save();ctx.translate(cx,cy);ctx.rotate(time*.0015);
    const scale=r/125;
    ctx.drawImage(sun,-300*scale,-300*scale,600*scale,600*scale);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0,0,width,height);
    const mobile=innerWidth<=700;
    const r=mobile?Math.min(width*.23,95):Math.min(width*.134,205);
    const cx=mobile?width*.5:width*.785;
    const cy=mobile?height*.5:Math.min(height*.44,405);
    if(!dark){drawSun(cx,cy,r);return}
    const breath=1+Math.sin(time*.11)*.008;
    // The corona rotates almost imperceptibly; the occluding body stays steady.
    ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.sin(time*.024)*.025);
    const scale=r/175*breath;
    ctx.drawImage(corona,-500*scale,-500*scale,1000*scale,1000*scale);ctx.restore();
    // The chromosphere has uneven brightness and a few tiny prominences.
    for(let i=0;i<180;i++){
      const a=i/180*TAU;
      const strength=.28+.42*Math.pow(Math.sin(a*3+.7),2);
      ctx.strokeStyle=dark?`rgba(255,231,194,${strength})`:`rgba(166,121,67,${strength*.65})`;
      ctx.lineWidth=.65;ctx.beginPath();ctx.arc(cx,cy,r,a,a+TAU/180+.002);ctx.stroke();
    }
    for(const [a,lift] of [[2.45,.018],[4.18,.012],[.37,.009]]){
      ctx.strokeStyle=dark?'rgba(226,132,106,.52)':'rgba(171,89,64,.28)';ctx.lineWidth=.8;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(a-.016)*r,cy+Math.sin(a-.016)*r);
      ctx.quadraticCurveTo(cx+Math.cos(a)*r*(1+lift),cy+Math.sin(a)*r*(1+lift),cx+Math.cos(a+.016)*r,cy+Math.sin(a+.016)*r);ctx.stroke();
    }
    // The moon remains a silhouette; faint shading gives it weight and depth.
    const surface=ctx.createRadialGradient(cx-r*.35,cy-r*.3,0,cx,cy,r);
    surface.addColorStop(0,dark?'#121316':'#242729');
    surface.addColorStop(.78,dark?'#101114':'#202426');
    surface.addColorStop(1,dark?'#0d0e11':'#191d20');
    ctx.fillStyle=surface;ctx.beginPath();ctx.arc(cx,cy,r*.995,0,TAU);ctx.fill();
    // Low-contrast limb sheen keeps the sphere from reading as a flat cutout.
    ctx.strokeStyle=dark?'rgba(255,233,199,.045)':'rgba(255,242,214,.09)';ctx.lineWidth=.7;
    ctx.beginPath();ctx.arc(cx-r*.001,cy-r*.001,r*.985,Math.PI*.95,Math.PI*1.58);ctx.stroke();
    // A small diamond-ring glint: smooth light, no flare spikes or flashing.
    const a=-.7+Math.sin(time*.045)*.08;
    const gx=cx+Math.cos(a)*r,gy=cy+Math.sin(a)*r;
    const glint=ctx.createRadialGradient(gx,gy,0,gx,gy,r*.19);
    glint.addColorStop(0,dark?'rgba(255,243,215,.88)':'rgba(255,229,170,.8)');
    glint.addColorStop(.08,dark?'rgba(255,225,170,.55)':'rgba(222,175,101,.44)');
    glint.addColorStop(.35,dark?'rgba(246,192,118,.10)':'rgba(190,132,65,.10)');
    glint.addColorStop(1,'rgba(190,132,65,0)');
    ctx.fillStyle=glint;ctx.fillRect(gx-r*.2,gy-r*.2,r*.4,r*.4);
  }
  function refresh(){
    dark=document.documentElement.dataset.theme==='dark';
    if(dark)corona=themePlates.dark||(themePlates.dark=buildCorona());
    else sun=themePlates.sun||(themePlates.sun=buildSun());
    const bloom=document.querySelector('#botanical-bloom');
    if(bloom){const source='assets/queen-of-night-engraved.png';if(bloom.getAttribute('src')!==source)bloom.setAttribute('src',source)}
    draw();
  }
  function resize(){
    const mobile=innerWidth<=700;
    const sky=document.querySelector('.hero-sky');
    if(mobile&&sky){
      if(canvas.parentElement!==sky)sky.append(canvas);
      const bounds=sky.getBoundingClientRect();
      width=Math.max(1,bounds.width);height=300;
    }else{
      if(canvas.parentElement!==document.body)document.body.insertBefore(canvas,document.body.firstChild);
      width=innerWidth;height=innerHeight;
    }
    canvas.classList.toggle('mobile-sky',mobile);
    // CSS display dimensions must match drawing coordinates, independently of DPR.
    // Explicit sizing also prevents percentage heights stretching across the page.
    canvas.style.position=mobile?'absolute':'fixed';
    canvas.style.width=`${width}px`;
    canvas.style.height=`${height}px`;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!corona&&!sun)refresh();else draw();
  }
  function tick(stamp){
    if(stamp-last>=66){time+=Math.min((stamp-last)/1000,.1);last=stamp;draw()}
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(frame);frame=0;last=performance.now();
    if(!document.hidden&&!motion.matches)frame=requestAnimationFrame(tick);else draw();
  }
  window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  window.portfolioBackground={refresh};resize();sync();
})();
