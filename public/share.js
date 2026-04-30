(function(){
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
    window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(document.title)+'&url='+encodeURIComponent(location.href),'_blank','width=600,height=400,noopener');
  };
  window.snsThreads=function(){
    window.open('https://www.threads.net/intent/post?text='+encodeURIComponent(document.title+'\n\n'+location.href),'_blank','width=600,height=600,noopener');
  };
  window.snsKakao=function(){
    if(navigator.share){navigator.share({title:document.title,url:location.href});}
    else{copy(location.href,'링크 복사 완료! 카카오톡에 붙여넣기 해주세요 💛');}
  };
  window.snsInsta=function(){
    copy(location.href,'링크 복사 완료! 인스타 스토리에 붙여넣기 해주세요 📸');
  };
  window.snsTiktok=function(){
    copy(location.href,'링크 복사 완료! 틱톡 앱에 붙여넣기 해주세요 🎵');
  };
})();
