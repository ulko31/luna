
(function(){
 var root=document.getElementById('ooops-sofe-tour');if(!root)return;
 var base='https://raw.githubusercontent.com/ulko31/sofe/main/images/';
 var slides=[
 ['Всё начинается с одного экрана','01 / Главная','Главная SOFE: быстрый вход в повседневные сценарии без перегруза цифрами.','main.png','Главная'],
 ['Планировать движение','02 / Тренировки','Переходим к тренировкам и смотрим реальные экраны продукта.','trainings.png','Тренировки'],
 ['Видеть свой прогресс','03 / Прогресс','Данные и результаты — часть общего пользовательского пути.','progress.png','Прогресс'],
 ['Искать новое','04 / Рецепты','Рецепты и новые идеи тоже живут внутри SOFE.','recipes.png','Рецепты'],
 ['Планировать дни','05 / Календарь','Привычки и активности можно увидеть в календаре.','calendar.png','Календарь']
 ];
 var chapterButtons=slides.map(function(s,i){return '<button type="button" class="chapter" data-chapter="'+i+'">'+s[4]+'</button>'}).join('');
 root.innerHTML='<div class="intro"><div><div class="eyebrow">OOOPS / INTERACTIVE PRODUCT STORY</div><h2>Знакомьтесь,<br><em>SOFE.</em></h2></div><p>Небольшая история о продукте: листайте реальные экраны или включите автоматический просмотр с маскотом.</p></div>'+
 '<div class="scene"><span class="num" id="st-num">01 / 05</span><div class="info"><span class="step-label" id="st-label"></span><h3 id="st-title"></h3><p id="st-body"></p><a target="_blank" rel="noopener noreferrer" href="https://sofe-jade.vercel.app/">Открыть настоящее приложение ↗</a></div>'+
 '<div class="phone"><img id="st-screen" loading="lazy" alt="Реальный экран SOFE"></div><img class="mascot" id="st-mascot" src="/assets/sofe-mascot-original.svg" alt="Оригинальный маскот SOFE"></div>'+
 '<div class="controls"><div class="chapters">'+chapterButtons+'</div><div class="actions"><button id="st-prev" type="button" aria-label="Назад">←</button><button id="st-play" type="button">▶ Смотреть</button><button id="st-next" type="button" aria-label="Вперёд">→</button></div></div><p class="note">Реальные интерфейсы и оригинальный маскот SOFE · интерактивная анимационная экскурсия, не 3D-видео.</p>';
 var one=function(id){return root.querySelector('#'+id)},index=0,timer=null;
 var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function show(n){index=(n+slides.length)%slides.length;var s=slides[index];one('st-num').textContent=String(index+1).padStart(2,'0')+' / 05';one('st-label').textContent=s[1];one('st-title').textContent=s[0];one('st-body').textContent=s[2];var im=one('st-screen');im.src=base+s[3];im.alt='SOFE / '+s[4];root.querySelectorAll('.chapter').forEach(function(b){b.setAttribute('aria-current',Number(b.getAttribute('data-chapter'))===index?'step':'false')});if(!reduced){im.classList.remove('enter');var m=one('st-mascot');m.classList.remove('tap');void im.offsetWidth;im.classList.add('enter');m.classList.add('tap');setTimeout(function(){m.classList.remove('tap')},800)}}
 function stop(){if(timer)clearInterval(timer);timer=null;one('st-play').textContent='▶ Смотреть'}
 root.querySelectorAll('.chapter').forEach(function(b){b.addEventListener('click',function(){stop();show(Number(b.getAttribute('data-chapter')))})});
 one('st-prev').addEventListener('click',function(){stop();show(index-1)});
 one('st-next').addEventListener('click',function(){stop();show(index+1)});
 one('st-play').addEventListener('click',function(){if(timer){stop()}else{show(index);one('st-play').textContent='Ⅱ Пауза';timer=setInterval(function(){show(index+1)},3200)}});
 if('IntersectionObserver' in window){var ob=new IntersectionObserver(function(entries){if(!entries[0].isIntersecting)stop()},{threshold:.02});ob.observe(root)}
 show(0);
})();
