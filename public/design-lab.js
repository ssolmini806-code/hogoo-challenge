(function(){
  var world=document.getElementById('world');
  var range=document.getElementById('threadRange');
  var path=document.getElementById('threadPath');
  var orb=document.getElementById('threadOrb');
  var next=document.getElementById('railNext');
  var notes=Array.from(document.querySelectorAll('.signal-notes li'));
  var stages=Array.from(document.querySelectorAll('.rail-stages li'));
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  var nextUrl=world.dataset.nextUrl||'/give-prologue.html';
  var progress=0;
  var dragging=false;
  var entering=false;
  var dragStartX=0;
  var dragStartProgress=0;

  function enterTest(){
    if(entering)return;
    entering=true;
    world.classList.add('is-entering');
    world.style.setProperty('--scene-scale','1.12');
    window.setTimeout(function(){window.location.href=nextUrl;},reduced.matches?0:950);
  }

  function setProgress(value){
    progress=Math.max(0,Math.min(1,value));
    range.value=Math.round(progress*100);
    world.style.setProperty('--p',progress.toFixed(3));
    world.style.setProperty('--progress-pct',(progress*100).toFixed(1)+'%');
    world.style.setProperty('--portal-alpha',(.08+progress*.36).toFixed(3));
    world.style.setProperty('--portal-haze',(progress*.12).toFixed(3));
    world.style.setProperty('--portal-spread',(12+progress*13).toFixed(1)+'%');
    world.style.setProperty('--portal-scale',(.88+progress*.18).toFixed(3));
    path.style.strokeDashoffset=String(100-progress*100);
    var point=path.getPointAtLength(path.getTotalLength()*progress);
    orb.setAttribute('cx',point.x.toFixed(2));
    orb.setAttribute('cy',point.y.toFixed(2));
    world.classList.toggle('has-progress',progress>.03);
    world.classList.toggle('is-ready',progress>.88);
    world.classList.toggle('reveal-kicker',progress>.10);
    world.classList.toggle('reveal-title-one',progress>.18);
    world.classList.toggle('reveal-title-two',progress>.34);
    world.classList.toggle('reveal-title-three',progress>.50);
    world.classList.toggle('reveal-description',progress>.68);
    notes.forEach(function(note){note.classList.toggle('is-on',progress>=Number(note.dataset.threshold));});
    var currentStage=0;
    stages.forEach(function(stage,index){if(progress>=Number(stage.dataset.stage))currentStage=index;});
    stages.forEach(function(stage,index){
      stage.classList.toggle('is-current',index===currentStage);
      stage.classList.toggle('is-passed',index<currentStage);
    });
    next.querySelector('span').textContent=progress>.88?'문을 열고 시작하기':'실을 따라가기';
  }

  world.addEventListener('pointerdown',function(event){
    if(event.target.closest('button,a,input'))return;
    event.preventDefault();
    dragging=true;
    dragStartX=event.clientX;
    dragStartProgress=progress;
    world.classList.add('is-dragging');
    world.setPointerCapture(event.pointerId);
  });
  world.addEventListener('pointermove',function(event){
    if(!reduced.matches&&event.pointerType!=='touch'){
      var nx=(event.clientX/innerWidth-.5)*2;
      var ny=(event.clientY/innerHeight-.5)*2;
      world.style.setProperty('--subject-x',(nx*-4.4).toFixed(2)+'px');
      world.style.setProperty('--subject-y',(ny*-3.3).toFixed(2)+'px');
      world.style.setProperty('--foreground-x',(nx*8).toFixed(2)+'px');
      world.style.setProperty('--foreground-y',(ny*6).toFixed(2)+'px');
    }
    if(dragging){
      var rect=world.getBoundingClientRect();
      var delta=(event.clientX-dragStartX)/(rect.width*.88);
      setProgress(dragStartProgress+delta);
    }
  },{passive:true});
  function endDrag(event){
    var shouldEnter=event&&event.type==='pointerup'&&progress>=.985;
    dragging=false;
    world.classList.remove('is-dragging');
    if(event&&world.hasPointerCapture(event.pointerId))world.releasePointerCapture(event.pointerId);
    if(shouldEnter)enterTest();
  }
  world.addEventListener('pointerup',endDrag);
  world.addEventListener('pointercancel',endDrag);
  world.addEventListener('selectstart',function(event){event.preventDefault();});
  world.addEventListener('dragstart',function(event){event.preventDefault();});
  range.addEventListener('input',function(){setProgress(Number(range.value)/100);});
  range.addEventListener('change',function(){if(progress>=.985)enterTest();});
  next.addEventListener('click',function(){
    if(progress<.88){
      var start=progress;
      var started=performance.now();
      function finish(now){
        var t=Math.min(1,(now-started)/600);
        setProgress(start+(1-start)*(1-Math.pow(1-t,3)));
        if(t<1)requestAnimationFrame(finish);else enterTest();
      }
      if(reduced.matches){setProgress(1);enterTest();}else requestAnimationFrame(finish);
      return;
    }
    enterTest();
  });
  setProgress(0);
})();
