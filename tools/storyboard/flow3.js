(function(){
  var L=document.getElementById('ledger'),W=document.getElementById('hero5'),st=document.getElementById('st'),bar=document.getElementById('lbar'),h=document.getElementById('lh');
  var lis=W.querySelectorAll('.st5 li'),t0=0,raf=0;
  function steps(n){for(var i=0;i<lis.length;i++){lis[i].className=i<n?'ok':i===n?'now':'';lis[i].querySelector('em').textContent=i<n?'✓':i+1}}
  function state(s){L.setAttribute('data-s',s);W.classList.toggle('lit',s==='lit');W.classList.toggle('dn',s==='no');bar.style.width='0';
    st.textContent=s==='lit'?'A light is lit':s==='no'?'Nothing was signed':'Waiting for your Ledger…';steps(s==='review'?4:s==='lit'?5:3)}
  function tick(t){if(!t0)t0=t;var p=Math.min(1,(t-t0)/3000);bar.style.width=(p*100)+'%';if(p<1)raf=requestAnimationFrame(tick);else state('lit')}
  function start(e){e.preventDefault();cancelAnimationFrame(raf);t0=0;raf=requestAnimationFrame(tick)}
  function stop(){if(L.getAttribute('data-s')!=='review')return;cancelAnimationFrame(raf);bar.style.width='0'}
  document.getElementById('lsee').addEventListener('click',function(){state('review')});
  document.getElementById('lno').addEventListener('click',function(){state('no')});
  h.addEventListener('pointerdown',start);['pointerup','pointerleave','pointercancel'].forEach(function(n){h.addEventListener(n,stop)});
  h.addEventListener('contextmenu',function(e){e.preventDefault()});
  document.getElementById('again').addEventListener('click',function(){state('ask')});
})();
