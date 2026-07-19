(function(){
  function trackEvent(name, params) {
    if (typeof window.trackEvent === 'function') window.trackEvent(name, params || {});
    else if (typeof gtag === 'function') gtag('event', name, params || {});
  }
  function toast(m){
    var e=document.getElementById('snst');
    if(!e)return;
    e.textContent=m;
    e.classList.add('on');
    clearTimeout(e._t);
    e._t=setTimeout(function(){e.classList.remove('on')},3500);
  }
  function copy(u,m){
    if(navigator.clipboard){
      navigator.clipboard.writeText(u).then(function(){toast(m)}).catch(function(){fb(u,m)});
    }else{fb(u,m);}
  }
  function fb(u,m){
    var el=document.createElement('textarea');
    el.value=u;el.style.cssText='position:fixed;top:-999px;opacity:0';
    document.body.appendChild(el);el.select();
    try{document.execCommand('copy');}catch(e){}
    document.body.removeChild(el);toast(m);
  }
  window.snsX=function(){
    trackEvent('give_share_clicked', { channel: 'x', give_type: window.finalKey || null });
    window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(document.title)+'&url='+encodeURIComponent(location.href),'_blank','width=600,height=400,noopener');
  };
  window.snsThreads=function(){
    trackEvent('give_share_clicked', { channel: 'threads', give_type: window.finalKey || null });
    window.open('https://www.threads.net/intent/post?text='+encodeURIComponent(document.title+'\n\n'+location.href),'_blank','width=600,height=600,noopener');
  };
  window.snsKakao=function(){
    trackEvent('give_share_clicked', { channel: 'kakao', give_type: window.finalKey || null });
    if(navigator.share){navigator.share({title:document.title,url:location.href});}
    else{copy(location.href,'링크 복사 완료! 카카오톡에 붙여넣기 해주세요 💛');}
  };
  window.snsInsta=function(){
    trackEvent('give_share_clicked', { channel: 'insta', give_type: window.finalKey || null });
    if(navigator.share){
      navigator.share({title:document.title,url:location.href}).catch(function(){});
    }else{
      copy(location.href,'링크 복사 완료! 인스타 스토리에 붙여넣기 해주세요 📸');
    }
  };
  window.snsTiktok=function(){
    trackEvent('give_share_clicked', { channel: 'tiktok', give_type: window.finalKey || null });
    copy(location.href,'링크 복사 완료! 틱톡 앱에 붙여넣기 해주세요 🎵');
  };
  window.snsCopy=function(btn){
    trackEvent('give_share_clicked', { channel: 'copy', give_type: window.finalKey || null });
    var span=btn&&btn.querySelector('span');
    var orig=span?span.textContent:'링크 복사';
    copy(location.href,'링크가 복사되었어요 🔗');
    if(span){span.textContent='복사 완료!';setTimeout(function(){span.textContent=orig;},1500);}
  };
  document.addEventListener('click', function(event){
    var btn = event.target && event.target.closest ? event.target.closest('[data-share-action]') : null;
    if(!btn) return;
    var action = btn.getAttribute('data-share-action');
    if(action === 'x') window.snsX();
    else if(action === 'threads') window.snsThreads();
    else if(action === 'kakao') window.snsKakao();
    else if(action === 'insta') window.snsInsta();
    else if(action === 'tiktok') window.snsTiktok();
    else if(action === 'copy') window.snsCopy(btn);
  });
})();
