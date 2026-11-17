/* OOOPS editorial interactions — progressive enhancement */
(()=>{
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const line=document.createElement('div');line.className='oo-scroll-line';line.setAttribute('aria-hidden','true');document.body.prepend(line);
 let busy=false;
 function scrollLine(){const max=document.documentElement.scrollHeight-innerHeight;line.style.transform='scaleX('+(max>0?Math.max(0,Math.min(1,scrollY/max)):0)+')';busy=false}
 addEventListener('scroll',()=>{if(!busy){busy=true;requestAnimationFrame(scrollLine)}},{passive:true});scrollLine();
 const isCase=!!document.querySelector('main .hero .hero-top');
 if(isCase){
  document.body.classList.add('oo-case-page');
  const hero=document.querySelector('main .hero');
  if(hero){
    const m=document.createElement('div');m.className='oo-storyline';m.textContent='OOOPS! / PROJECT JOURNAL / DESIGN × DIGITAL';hero.insertBefore(m,hero.firstElementChild);
  }
  const index=document.querySelector('.index-row');
  if(index){
    index.setAttribute('aria-label','Разделы проекта');
    const links=[...index.querySelectorAll('a[href^="#"]')];
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){for(const a of links){const on=a.getAttribute('href')==='#'+e.target.id;a.style.background=on?'#d9fb45':'';a.style.borderRadius=on?'99px':'';a.style.padding=on?'6px 9px':'';a.setAttribute('aria-current',on?'location':'false')}}}},{rootMargin:'-25% 0px -55% 0px'});
      for(const a of links){let el=document.getElementById(a.hash.slice(1));if(el)observer.observe(el)}
    }
  }
  const display=document.querySelector('.gallery-display');
  if(display){
    const prev=document.getElementById('prev-image'),next=document.getElementById('next-image');
    display.tabIndex=0;display.setAttribute('aria-label','Галерея проекта, листайте стрелками');
    let x=null;display.addEventListener('touchstart',e=>{x=e.touches[0]?.clientX??null},{passive:true});
    display.addEventListener('touchend',e=>{if(x===null)return;const delta=(e.changedTouches[0]?.clientX??x)-x;if(Math.abs(delta)>55)(delta<0?next:prev)?.click();x=null},{passive:true});
    display.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){next?.click();e.preventDefault()}if(e.key==='ArrowLeft'){prev?.click();e.preventDefault()}});
  }
 }else{
   const work=document.getElementById('work');
   if(work){
    const title=work.querySelector('.section-head');
    if(title&&!title.querySelector('.oo-playground-label')){
      const m=document.createElement('div');m.className='oo-playground-label';m.textContent='Selected projects / Digital & Design';title.appendChild(m);
    }
    document.querySelectorAll('#work .project').forEach((card,i)=>{
      if(card.querySelector('.oo-project-no'))return;
      const t=card.querySelector('.project-copy');if(!t)return;
      const marker=document.createElement('span');marker.className='oo-project-no';marker.textContent='FILE / '+String(i+1).padStart(2,'0');marker.style.cssText='display:inline-block;font-size:11px;font-weight:900;letter-spacing:.14em;border-bottom:2px solid currentColor;padding-bottom:6px';t.prepend(marker);
    });
   }
 }
})();
