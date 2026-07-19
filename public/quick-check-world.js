(function(){
  'use strict';
  var key=document.body.dataset.quickCheck;
  if(!key)return;
  var eventName={hogoo:'hogoo:answer',refusal:'refusal:answer',relationship:'risk:answer'}[key];
  function track(name,params){if(typeof window.trackEvent==='function')window.trackEvent(name,Object.assign({test:key},params||{}));}
  window.addEventListener('DOMContentLoaded',function(){
    track('quick_check_view');
    var start=document.getElementById('startTestBtn');
    if(start)start.addEventListener('click',function(){track('quick_check_start');},{once:true});
  },{once:true});
  if(eventName)window.addEventListener(eventName,function(event){
    var detail=event.detail||{};
    var position=Number(detail.questionIndex||0)+1;
    var total=Number(detail.total||0);
    if(position===1||position===Math.ceil(total/2))track('quick_check_progress',{question:position,total:total});
    if(total&&position===total)track('quick_check_complete',{total:total});
  });
})();
