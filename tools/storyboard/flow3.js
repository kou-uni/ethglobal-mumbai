(function(){
  var h=document.getElementById('hold'),pr=document.getElementById('pr'),hf=document.getElementById('hf'),root=document.getElementById('hero5'),st=document.getElementById('st');
  var C=2*Math.PI*98,t0=0,raf=0,lit=false,WAIT='Waiting for your hold…';
  pr.style.strokeDasharray=C;
  function set(p){pr.style.strokeDashoffset=C*(1-p);hf.style.transform='scale('+p+')'}
  function tick(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/3000);set(p);if(p<1){st.textContent='Holding… '+Math.ceil(3-p*3);raf=requestAnimationFrame(tick)}else{lit=true;root.classList.add('lit');st.textContent='A light is lit'}}
  function start(e){if(lit)return;e.preventDefault();cancelAnimationFrame(raf);t0=0;raf=requestAnimationFrame(tick)}
  function stop(){if(lit)return;cancelAnimationFrame(raf);set(0);st.textContent=WAIT}
  set(0);
  h.addEventListener('pointerdown',start);['pointerup','pointerleave','pointercancel'].forEach(function(n){h.addEventListener(n,stop)});
  h.addEventListener('contextmenu',function(e){e.preventDefault()});
  h.addEventListener('keydown',function(e){if((e.key===' '||e.key==='Enter')&&!e.repeat)start(e)});h.addEventListener('keyup',stop);
  document.getElementById('again').addEventListener('click',function(){lit=false;root.classList.remove('lit');set(0);st.textContent=WAIT});
})();
