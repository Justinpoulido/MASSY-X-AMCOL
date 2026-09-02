import '@phosphor-icons/web/regular/style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

const lenis = reduceMotion() ? null : new Lenis();

if(lenis){
  lenis.on("scroll",ScrollTrigger.update);
  gsap.ticker.add(function(time){
    lenis.raf(time*1000);
  });
  gsap.ticker.lagSmoothing(0);
}

function reduceMotion(){
  return !!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

/**
 * Hero WebGL layer: a low-poly industrial supply network behind the product cards.
 * Metaphor — nodes (stock/brands) linked into one responsive partner grid.
 */
function initHeroNetwork(){
  var host=document.querySelector(".hero-visual");
  var canvas=document.querySelector(".hero-webgl");
  if(!host||!canvas||reduceMotion())return null;
  if(!window.WebGLRenderingContext)return null;

  var width=host.clientWidth||1;
  var height=host.clientHeight||1;
  var renderer=new THREE.WebGLRenderer({
    canvas:canvas,
    alpha:true,
    antialias:true,
    powerPreference:"low-power"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.setSize(width,height,false);
  renderer.setClearColor(0x000000,0);

  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(42,width/height,0.1,100);
  camera.position.set(0,0.15,5.4);

  var group=new THREE.Group();
  scene.add(group);

  var nodeCount=48;
  var positions=new Float32Array(nodeCount*3);
  var colors=new Float32Array(nodeCount*3);
  var cyan=new THREE.Color(0x3eb4d9);
  var orange=new THREE.Color(0xef6e36);
  var ink=new THREE.Color(0xb7d2df);

  for(var i=0;i<nodeCount;i++){
    var angle=(i/nodeCount)*Math.PI*2;
    var radius=1.1+((i%5)*0.28)+((i*7)%3)*0.12;
    var x=Math.cos(angle)*radius*((i%2===0)?1:0.78);
    var y=Math.sin(angle*1.35)*0.72+((i%7)-3)*0.12;
    var z=((i%4)-1.5)*0.55;
    positions[i*3]=x;
    positions[i*3+1]=y;
    positions[i*3+2]=z;
    var tint=i%5===0?orange:(i%3===0?cyan:ink);
    colors[i*3]=tint.r;
    colors[i*3+1]=tint.g;
    colors[i*3+2]=tint.b;
  }

  var nodeGeo=new THREE.BufferGeometry();
  nodeGeo.setAttribute("position",new THREE.BufferAttribute(positions,3));
  nodeGeo.setAttribute("color",new THREE.BufferAttribute(colors,3));
  var nodes=new THREE.Points(nodeGeo,new THREE.PointsMaterial({
    size:0.065,
    vertexColors:true,
    transparent:true,
    opacity:0.92,
    depthWrite:false,
    sizeAttenuation:true
  }));
  group.add(nodes);

  var linePositions=[];
  var maxDist=1.55;
  for(var a=0;a<nodeCount;a++){
    for(var b=a+1;b<nodeCount;b++){
      var dx=positions[a*3]-positions[b*3];
      var dy=positions[a*3+1]-positions[b*3+1];
      var dz=positions[a*3+2]-positions[b*3+2];
      var dist=Math.sqrt(dx*dx+dy*dy+dz*dz);
      if(dist<maxDist&&(a+b)%2===0){
        linePositions.push(
          positions[a*3],positions[a*3+1],positions[a*3+2],
          positions[b*3],positions[b*3+1],positions[b*3+2]
        );
      }
    }
  }
  var lineGeo=new THREE.BufferGeometry();
  lineGeo.setAttribute("position",new THREE.Float32BufferAttribute(linePositions,3));
  var lines=new THREE.LineSegments(lineGeo,new THREE.LineBasicMaterial({
    color:0x3eb4d9,
    transparent:true,
    opacity:0.22
  }));
  group.add(lines);

  var ringMat=new THREE.MeshBasicMaterial({
    color:0x3eb4d9,
    transparent:true,
    opacity:0.28,
    side:THREE.DoubleSide
  });
  var ringA=new THREE.Mesh(new THREE.TorusGeometry(2.15,0.012,8,96),ringMat);
  ringA.rotation.x=Math.PI*0.58;
  ringA.rotation.y=0.35;
  group.add(ringA);

  var ringB=new THREE.Mesh(
    new THREE.TorusGeometry(1.45,0.01,8,80),
    new THREE.MeshBasicMaterial({color:0xef6e36,transparent:true,opacity:0.24,side:THREE.DoubleSide})
  );
  ringB.rotation.x=Math.PI*0.42;
  ringB.rotation.z=-0.4;
  group.add(ringB);

  var core=new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.22,0),
    new THREE.MeshBasicMaterial({color:0xef6e36,transparent:true,opacity:0.55,wireframe:true})
  );
  group.add(core);

  host.classList.add("has-webgl");

  var pointer={x:0,y:0,tx:0,ty:0};
  var visible=true;
  var running=true;
  var frameId=0;
  var clock=new THREE.Clock();
  var track=host.closest(".hero")||host;

  function onPointer(event){
    var rect=track.getBoundingClientRect();
    pointer.tx=((event.clientX-rect.left)/rect.width)*2-1;
    pointer.ty=-(((event.clientY-rect.top)/rect.height)*2-1);
  }

  function resize(){
    width=host.clientWidth||1;
    height=host.clientHeight||1;
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width,height,false);
  }

  function tick(){
    if(!running)return;
    frameId=requestAnimationFrame(tick);
    if(!visible)return;

    var t=clock.getElapsedTime();
    pointer.x+=(pointer.tx-pointer.x)*0.06;
    pointer.y+=(pointer.ty-pointer.y)*0.06;

    ringA.rotation.z=t*0.08;
    ringB.rotation.y=-t*0.12;
    core.rotation.x=t*0.35;
    core.rotation.y=t*0.5;
    group.rotation.y=pointer.x*0.18+t*0.035;
    group.rotation.x=pointer.y*0.1;
    group.position.x=pointer.x*0.18;
    group.position.y=pointer.y*0.12;

    renderer.render(scene,camera);
  }

  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){visible=entry.isIntersecting;});
  },{threshold:0.08});
  io.observe(host);

  var ro=typeof ResizeObserver!=="undefined"?new ResizeObserver(resize):null;
  if(ro)ro.observe(host);
  else window.addEventListener("resize",resize);

  track.addEventListener("pointermove",onPointer);
  document.addEventListener("visibilitychange",function(){
    if(document.hidden){running=false;cancelAnimationFrame(frameId);}
    else if(!running){running=true;clock.getDelta();tick();}
  });

  tick();
  return {renderer:renderer};
}

(function(){
  "use strict";
  var reduce=reduceMotion();
  var views={},links=[].slice.call(document.querySelectorAll(".navlink"));
  var loadedAssets={};
  document.querySelectorAll(".view").forEach(function(view){views[view.id.replace("v-","")]=view;});

  initHeroNetwork();

  function hasTargets(targets){
    if(!targets)return false;
    if(typeof targets==="string")return !!document.querySelector(targets);
    if(typeof targets.length==="number")return targets.length>0;
    return !!targets;
  }

  function entrance(targets,vars){
    if(reduce||!hasTargets(targets))return;
    gsap.from(targets,Object.assign({
      opacity:0,
      y:28,
      duration:0.9,
      ease:"power3.out",
      clearProps:"transform"
    },vars||{}));
  }

  function animateHero(){
    if(reduce)return;
    var tl=gsap.timeline({defaults:{ease:"power3.out"}});
    tl.from(".hero-copy .eyebrow",{opacity:0,y:14,x:-16,duration:0.7},0)
      .from(".hero h1",{opacity:0,y:44,duration:1.1},0.09)
      .from(".hero-copy > p",{opacity:0,y:30,duration:0.9},0.21)
      .from(".hero-actions .btn",{opacity:0,y:22,duration:0.8,stagger:0.075},0.32)
      .from(".hero-note",{opacity:0,y:10,duration:0.7},0.5)
      .from(".hero-visual",{opacity:0,scale:0.96,duration:1.2},0.16)
      .from(".float-card",{opacity:0,scale:0.72,rotation:-10,duration:1.3,stagger:0.14,ease:"back.out(1.4)"},0.42)
      .from(".catalog-badge",{opacity:0,y:18,duration:0.8},0.86)
      .from(".visual-label",{opacity:0,x:-12,duration:0.7},0.64);

    document.querySelectorAll(".float-card").forEach(function(card,index){
      gsap.to(card,{
        y:9,
        duration:2.6+index*0.32,
        yoyo:true,
        repeat:-1,
        ease:"sine.inOut",
        delay:0.56+index*0.18
      });
    });
    gsap.to(".orbit-one",{rotation:360,duration:90,repeat:-1,ease:"none"});
    gsap.to(".orbit-two",{rotation:-360,duration:70,repeat:-1,ease:"none"});
    gsap.to(".pulse-dot",{
      scale:1.45,
      opacity:0.55,
      duration:2.2,
      yoyo:true,
      repeat:-1,
      ease:"sine.inOut"
    });
  }

  function animateFitScores(scope){
    scope.querySelectorAll(".fit-score i").forEach(function(bar,index){
      var score=(bar.style.getPropertyValue("--score")||getComputedStyle(bar).getPropertyValue("--score")).trim();
      if(!score)return;
      gsap.fromTo(bar,{"--score":"0%"},{
        "--score":score,
        duration:1.1,
        delay:0.18+index*0.07,
        ease:"power3.out"
      });
    });
  }

  function animateViewContent(name){
    var view=views[name];
    if(!view||reduce||view.dataset.animated)return;
    view.dataset.animated="true";
    var intro=view.querySelector(".section-intro, .split-intro");
    if(intro)entrance(intro,{y:20,duration:0.8});
    var handlers={
      overview:function(){
        entrance(view.querySelectorAll(".proof-strip > div"),{stagger:0.085,delay:0.11,duration:0.8});
        entrance(view.querySelectorAll(".benefit"),{stagger:0.095,delay:0.26,y:34});
        entrance(view.querySelector(".photo-band"),{scale:1.05,duration:1.3,delay:0.38,ease:"power3.out"});
      },
      products:function(){
        entrance(view.querySelector(".showcase-tabs"),{y:16,duration:0.7});
        entrance(view.querySelector(".showcase-panel.active .showcase-copy"),{x:-20,y:0,duration:0.85,delay:0.08});
        entrance(view.querySelector(".showcase-panel.active .showcase-visual"),{scale:0.97,duration:1,delay:0.14,ease:"power3.out"});
        entrance(view.querySelector(".catalog-callout"),{y:22,delay:0.52,duration:0.8});
      },
      brands:function(){
        entrance(view.querySelector(".brands-intro"),{y:20,duration:0.8});
        entrance(view.querySelector(".brand-proof"),{y:18,duration:0.8,delay:0.08});
        entrance(view.querySelector(".brand-network"),{y:0,duration:1,delay:0.18});
        entrance(view.querySelector(".brand-footnote"),{delay:0.32,duration:0.8});
        runCounts(view);
      },
      services:function(){
        entrance(view.querySelector(".service-image"),{x:-28,y:0,duration:1,delay:0.09});
        entrance(view.querySelectorAll(".accordion-item"),{stagger:0.065,delay:0.18,x:20,y:0});
        entrance(view.querySelectorAll(".photo-band, .service-footer"),{stagger:0.11,delay:0.42});
      },
      fit:function(){
        entrance(view.querySelectorAll(".fit-row"),{stagger:0.055,delay:0.13,x:-18,y:0,duration:0.75});
        animateFitScores(view);
        entrance(view.querySelectorAll(".focus-grid article"),{stagger:0.085,delay:0.48,y:28});
      },
      "why-now":function(){
        entrance(view.querySelector(".lead-time-panel"),{scale:0.98,duration:0.9,delay:0.09});
        entrance(view.querySelectorAll(".pressure-card"),{stagger:0.095,delay:0.23});
        entrance(view.querySelector(".vmi-stage"),{y:30,delay:0.43,duration:0.9});
        entrance(view.querySelectorAll(".vmi-stage li"),{stagger:0.07,delay:0.56,x:16,y:0,duration:0.75});
      },
      partnership:function(){
        entrance(view.querySelector(".photo-band"),{delay:0.09});
        entrance(view.querySelectorAll(".model-card"),{stagger:0.085,delay:0.18,y:34});
        entrance(view.querySelector(".partnership-banner"),{delay:0.52,duration:0.9});
      },
      roadmap:function(){
        entrance(view.querySelectorAll(".timeline article"),{stagger:0.095,delay:0.13,y:36});
        entrance(view.querySelector(".closing"),{scale:0.97,delay:0.58,duration:0.9,ease:"power3.out"});
      }
    };
    if(handlers[name])handlers[name]();
  }

  function setupRevealObserver(){
    var items=document.querySelectorAll(".reveal");
    if(!items.length)return;
    if(reduce){
      items.forEach(function(item){item.classList.add("revealed");});
      return;
    }
    gsap.set(items,{opacity:0,y:26});
    ScrollTrigger.batch(items,{
      start:"top 88%",
      once:true,
      onEnter:function(batch){
        batch.forEach(function(el){el.classList.add("revealed");});
        gsap.to(batch,{
          opacity:1,
          y:0,
          duration:0.9,
          stagger:0.08,
          ease:"power3.out",
          clearProps:"transform"
        });
        batch.forEach(function(el){
          var inner=el.querySelector(".photo-band-inner");
          if(inner&&inner.children.length){
            gsap.from(inner.children,{
              opacity:0,
              y:18,
              duration:0.8,
              stagger:0.075,
              delay:0.14,
              ease:"power3.out",
              clearProps:"transform"
            });
          }
        });
      }
    });
  }

  function preloadView(name){
    if(loadedAssets[name])return;
    loadedAssets[name]=true;
    document.querySelectorAll('img[data-preload-view="'+name+'"]').forEach(function(image){
      var preload=new Image(); preload.src=image.currentSrc||image.src;
    });
  }

  function activate(name){
    if(!views[name])return;
    links.forEach(function(link){link.classList.toggle("active",link.dataset.view===name);});
    links.forEach(function(link){link.toggleAttribute("aria-current",link.dataset.view===name);});
    runCounts(views[name]);
    animateViewContent(name);
    preloadView(name);
    var header=document.querySelector("header");
    var offset=-(header?header.getBoundingClientRect().height+18:20);
    if(lenis)lenis.scrollTo(views[name],{offset:offset});
    else views[name].scrollIntoView({block:"start",behavior:reduce?"auto":"smooth"});
  }

  function setupSectionObserver(){
    if(!("IntersectionObserver" in window))return;
    var observer=new IntersectionObserver(function(entries){
      var visible=entries.filter(function(entry){return entry.isIntersecting;}).sort(function(a,b){return b.intersectionRatio-a.intersectionRatio;})[0];
      if(!visible)return;
      var name=visible.target.id.replace("v-","");
      links.forEach(function(link){link.classList.toggle("active",link.dataset.view===name);link.toggleAttribute("aria-current",link.dataset.view===name);});
      runCounts(visible.target);
      animateViewContent(name);
      preloadView(name);
    },{rootMargin:"-28% 0px -58% 0px",threshold:[0.05,.2,.45]});
    Object.keys(views).forEach(function(name){observer.observe(views[name]);});
  }

  document.addEventListener("click",function(event){
    var accordionHead=event.target.closest("[data-accordion]");
    if(accordionHead){
      var item=accordionHead.closest(".accordion-item"),group=accordionHead.closest(".service-list");
      var wasOpen=item.classList.contains("open");
      if(group)group.querySelectorAll(".accordion-item.open").forEach(function(open){open.classList.remove("open");});
      if(!wasOpen){
        item.classList.add("open");
        if(!reduce){
          var body=item.querySelector(".accordion-body p");
          if(body){
            gsap.fromTo(body,{opacity:0,y:8},{opacity:1,y:0,duration:0.45,ease:"power3.out"});
          }
        }
      }
      return;
    }
    var target=event.target.closest("[data-view],[data-goto]");
    if(!target)return;
    event.preventDefault();
    activate(target.dataset.view||target.dataset.goto);
    if(target.dataset.scrollTarget){
      var destination=document.getElementById(target.dataset.scrollTarget);
      if(destination)requestAnimationFrame(function(){
        if(lenis)lenis.scrollTo(destination,{offset:-20});
        else destination.scrollIntoView({block:"start",behavior:"auto"});
      });
    }
  });

  function runCounts(scope){
    scope.querySelectorAll("[data-count]").forEach(function(el){
      if(el.dataset.counted)return;
      el.dataset.counted="true";
      var end=Number(el.dataset.count),suffix=el.dataset.suffix||"";
      if(reduce){el.textContent=end+suffix;return;}
      var counter={n:0};
      gsap.to(counter,{
        n:end,
        duration:1.2,
        ease:"power3.out",
        onUpdate:function(){
          el.textContent=Math.round(counter.n)+suffix;
        }
      });
    });
  }

  function setupProductShowcase(){
    var root=document.querySelector("[data-showcase]");
    if(!root)return;
    var tabs=[].slice.call(root.querySelectorAll("[data-showcase-tab]"));
    var panels=[].slice.call(root.querySelectorAll(".showcase-panel"));
    var order=tabs.map(function(tab){return tab.dataset.showcaseTab;});
    var current=order[0];
    var activeIndex=null;
    var switching=false;

    function activePanel(){
      return root.querySelector(".showcase-panel.active");
    }

    function clearFocus(panel){
      if(!panel)return;
      panel.querySelectorAll(".is-active").forEach(function(el){el.classList.remove("is-active");});
      panel.querySelectorAll(".is-dimmed").forEach(function(el){el.classList.remove("is-dimmed");});
      panel.querySelectorAll(".showcase-connectors path").forEach(function(path){path.classList.remove("is-active");});
      activeIndex=null;
    }

    function focusDetail(panel,index){
      if(!panel)return;
      activeIndex=index;
      var features=panel.querySelector(".showcase-features");
      var hotspots=panel.querySelector(".showcase-hotspots");
      var connectors=panel.querySelector(".showcase-connectors");
      var mobile=panel.querySelector(".showcase-mobile-callouts");
      if(features){
        features.classList.add("is-dimmed");
        features.querySelectorAll("[data-feature]").forEach(function(item){
          item.classList.toggle("is-active",Number(item.dataset.feature)===index);
        });
      }
      if(hotspots){
        hotspots.classList.add("is-dimmed");
        hotspots.querySelectorAll("[data-hotspot]").forEach(function(item){
          item.classList.toggle("is-active",Number(item.dataset.hotspot)===index);
        });
      }
      if(connectors){
        connectors.classList.add("is-dimmed");
        connectors.querySelectorAll("path").forEach(function(path){
          path.classList.toggle("is-active",Number(path.dataset.line)===index);
        });
      }
      if(mobile){
        mobile.querySelectorAll("[data-callout]").forEach(function(item){
          item.classList.toggle("is-active",Number(item.dataset.callout)===index);
        });
      }
    }

    function drawConnectors(panel){
      var visual=panel&&panel.querySelector(".showcase-visual");
      var svg=panel&&panel.querySelector(".showcase-connectors");
      if(!panel||!visual||!svg)return;
      if(window.matchMedia("(max-width:1000px)").matches){
        svg.innerHTML="";
        return;
      }
      var vRect=visual.getBoundingClientRect();
      var width=Math.max(1,Math.round(vRect.width));
      var height=Math.max(1,Math.round(vRect.height));
      svg.setAttribute("viewBox","0 0 "+width+" "+height);
      svg.setAttribute("width",width);
      svg.setAttribute("height",height);
      var html="";
      panel.querySelectorAll("[data-feature]").forEach(function(feature){
        var index=Number(feature.dataset.feature);
        var hotspot=panel.querySelector('[data-hotspot="'+index+'"]');
        if(!hotspot)return;
        var fRect=feature.getBoundingClientRect();
        var hRect=hotspot.getBoundingClientRect();
        var x1=0;
        var y1=fRect.top+fRect.height/2-vRect.top;
        var x2=hRect.left+hRect.width/2-vRect.left;
        var y2=hRect.top+hRect.height/2-vRect.top;
        if(y1<0||y1>height)y1=y2;
        var cx=(x1+x2)/2;
        html+='<path data-line="'+index+'" d="M '+x1.toFixed(1)+" "+y1.toFixed(1)+" C "+cx.toFixed(1)+" "+y1.toFixed(1)+", "+cx.toFixed(1)+" "+y2.toFixed(1)+", "+x2.toFixed(1)+" "+y2.toFixed(1)+'"/>';
      });
      svg.innerHTML=html;
      if(activeIndex!==null){
        svg.classList.add("is-dimmed");
        var activePath=svg.querySelector('[data-line="'+activeIndex+'"]');
        if(activePath)activePath.classList.add("is-active");
      }else{
        svg.classList.remove("is-dimmed");
      }
    }

    function selectProduct(id,options){
      options=options||{};
      if(!order.includes(id)||(id===current&&!options.force)||switching)return;
      var nextPanel=root.querySelector('.showcase-panel[data-product="'+id+'"]');
      var prevPanel=activePanel();
      if(!nextPanel)return;
      switching=true;
      current=id;

      tabs.forEach(function(tab){
        var on=tab.dataset.showcaseTab===id;
        tab.classList.toggle("active",on);
        tab.setAttribute("aria-selected",on?"true":"false");
        tab.tabIndex=on?0:-1;
      });

      var settled=false;
      function showNext(){
        if(settled)return;
        settled=true;
        panels.forEach(function(panel){
          var on=panel.dataset.product===id;
          panel.classList.toggle("active",on);
          if(on)panel.removeAttribute("hidden");
          else panel.setAttribute("hidden","");
          panel.classList.remove("is-switching");
        });
        clearFocus(nextPanel);
        requestAnimationFrame(function(){
          drawConnectors(nextPanel);
          if(!reduce){
            gsap.from(nextPanel.querySelector(".showcase-copy"),{
              opacity:0,
              x:-18,
              duration:0.65,
              ease:"power3.out"
            });
            gsap.from(nextPanel.querySelector(".showcase-orbit"),{
              opacity:0,
              scale:0.94,
              duration:0.8,
              ease:"power3.out"
            });
            gsap.from(nextPanel.querySelectorAll(".hotspot"),{
              opacity:0,
              scale:0.7,
              duration:0.55,
              stagger:0.06,
              delay:0.18,
              ease:"power3.out"
            });
          }
          switching=false;
        });
      }

      if(prevPanel&&prevPanel!==nextPanel&&!reduce){
        prevPanel.classList.add("is-switching");
        var out=gsap.timeline({onComplete:showNext});
        out.to(prevPanel.querySelector(".showcase-copy"),{
          opacity:0,
          x:-12,
          duration:0.28,
          ease:"power2.in"
        },0);
        out.to(prevPanel.querySelector(".showcase-orbit"),{
          opacity:0,
          scale:0.96,
          duration:0.28,
          ease:"power2.in"
        },0);
      }else{
        showNext();
      }
    }

    root.addEventListener("click",function(event){
      var tab=event.target.closest("[data-showcase-tab]");
      if(tab){
        event.preventDefault();
        selectProduct(tab.dataset.showcaseTab);
        return;
      }
      if(event.target.closest(".showcase-prev")){
        event.preventDefault();
        var prevIndex=(order.indexOf(current)-1+order.length)%order.length;
        selectProduct(order[prevIndex]);
        return;
      }
      if(event.target.closest(".showcase-next")){
        event.preventDefault();
        var nextIndex=(order.indexOf(current)+1)%order.length;
        selectProduct(order[nextIndex]);
        return;
      }
      var feature=event.target.closest("[data-feature]");
      if(feature){
        event.preventDefault();
        focusDetail(activePanel(),Number(feature.dataset.feature));
        return;
      }
      var hotspot=event.target.closest("[data-hotspot]");
      if(hotspot){
        event.preventDefault();
        focusDetail(activePanel(),Number(hotspot.dataset.hotspot));
      }
    });

    root.addEventListener("keydown",function(event){
      var tab=event.target.closest("[data-showcase-tab]");
      if(!tab)return;
      var index=order.indexOf(tab.dataset.showcaseTab);
      if(event.key==="ArrowRight"||event.key==="ArrowDown"){
        event.preventDefault();
        var next=tabs[(index+1)%tabs.length];
        next.focus();
        selectProduct(next.dataset.showcaseTab);
      }else if(event.key==="ArrowLeft"||event.key==="ArrowUp"){
        event.preventDefault();
        var prev=tabs[(index-1+tabs.length)%tabs.length];
        prev.focus();
        selectProduct(prev.dataset.showcaseTab);
      }
    });

    root.addEventListener("focusin",function(event){
      var feature=event.target.closest("[data-feature]");
      var hotspot=event.target.closest("[data-hotspot]");
      if(feature)focusDetail(activePanel(),Number(feature.dataset.feature));
      if(hotspot)focusDetail(activePanel(),Number(hotspot.dataset.hotspot));
    });

    document.addEventListener("click",function(event){
      if(root.contains(event.target))return;
      clearFocus(activePanel());
      var panel=activePanel();
      if(panel){
        var svg=panel.querySelector(".showcase-connectors");
        if(svg)svg.classList.remove("is-dimmed");
      }
    });

    window.addEventListener("resize",function(){
      drawConnectors(activePanel());
    });

    tabs.forEach(function(tab,index){tab.tabIndex=index===0?0:-1;});
    selectProduct(current,{force:true});
  }

  function setupBrandFocusView(){
    var openButton=document.querySelector("[data-brand-focus-open]");
    var modal=document.getElementById("brand-focus-modal");
    var focusBody=document.querySelector("[data-brand-focus-body]");
    var fitWrapper=document.querySelector("[data-brand-fit-wrapper]");
    var closeButtons=document.querySelectorAll("[data-brand-focus-close]");
    var fitButton=document.querySelector("[data-brand-focus-fit]");
    var home=document.querySelector("[data-brand-network-home]");
    var stage=home?home.querySelector(".brand-network-stage"):null;
    if(!openButton||!modal||!focusBody||!fitWrapper||!home||!stage)return;

    var lastFocused=null;

    function fitNetworkToViewport(){
      if(modal.hidden)return;

      stage.style.transform="none";
      stage.style.left="0px";
      stage.style.top="0px";
      stage.style.width="1240px";
      stage.style.height="900px";
      stage.style.transformOrigin="0 0";
      void stage.offsetWidth;

      var horizontalMargin=window.innerWidth<=650?24:40;
      var verticalMargin=window.innerWidth<=650?20:32;
      var availableWidth=Math.max(1,fitWrapper.clientWidth-horizontalMargin);
      var availableHeight=Math.max(1,fitWrapper.clientHeight-verticalMargin);
      var stageRect=stage.getBoundingClientRect();
      var measured=[].slice.call(stage.querySelectorAll(".brand-node,.brand-hub,.brand-guide-rings"));
      var bounds=measured.reduce(function(box,element){
        var rect=element.getBoundingClientRect();
        return {
          left:Math.min(box.left,rect.left-stageRect.left),
          top:Math.min(box.top,rect.top-stageRect.top),
          right:Math.max(box.right,rect.right-stageRect.left),
          bottom:Math.max(box.bottom,rect.bottom-stageRect.top)
        };
      },{left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity});
      if(!isFinite(bounds.left)){
        bounds={left:0,top:0,right:stage.offsetWidth,bottom:stage.offsetHeight};
      }
      var networkWidth=bounds.right-bounds.left;
      var networkHeight=bounds.bottom-bounds.top;
      var scaleX=availableWidth/networkWidth;
      var scaleY=availableHeight/networkHeight;
      var scale=Math.min(scaleX,scaleY);
      scale=Math.max(.5,Math.min(scale*0.94,1.75));
      var left=(fitWrapper.clientWidth-(networkWidth*scale))/2-(bounds.left*scale);
      var top=(fitWrapper.clientHeight-(networkHeight*scale))/2-(bounds.top*scale);

      stage.style.left=left.toFixed(1)+"px";
      stage.style.top=top.toFixed(1)+"px";
      stage.style.transform="scale("+scale.toFixed(4)+")";
    }

    function openFocus(){
      lastFocused=document.activeElement;
      modal.hidden=false;
      document.body.classList.add("modal-open","brand-focus-open");
      fitWrapper.appendChild(stage);
      window.requestAnimationFrame(function(){
        window.requestAnimationFrame(function(){
          fitNetworkToViewport();
          var close=modal.querySelector(".brand-focus-close");
          if(close)close.focus();
        });
      });
    }

    function closeFocus(){
      if(modal.hidden)return;
      home.appendChild(stage);
      stage.style.removeProperty("width");
      stage.style.removeProperty("height");
      stage.style.removeProperty("transform");
      stage.style.removeProperty("transform-origin");
      stage.style.removeProperty("left");
      stage.style.removeProperty("top");
      modal.hidden=true;
      document.body.classList.remove("modal-open","brand-focus-open");
      if(lastFocused&&lastFocused.focus)lastFocused.focus();
    }

    openButton.addEventListener("click",openFocus);
    closeButtons.forEach(function(button){button.addEventListener("click",closeFocus);});
    if(fitButton)fitButton.addEventListener("click",function(){
      window.requestAnimationFrame(fitNetworkToViewport);
    });
    modal.addEventListener("click",function(event){
      if(event.target.hasAttribute("data-brand-focus-close"))closeFocus();
    });
    document.addEventListener("keydown",function(event){
      if(event.key==="Escape"&&!modal.hidden)closeFocus();
    });
    window.addEventListener("resize",fitNetworkToViewport);
    window.addEventListener("orientationchange",function(){
      window.setTimeout(fitNetworkToViewport,160);
    });
  }

  if(!reduce){
    gsap.timeline({defaults:{ease:"power3.out"}})
      .from("header .header-collaboration",{opacity:0,x:-20,duration:0.8},0)
      .from(".navlink",{opacity:0,y:-8,duration:0.65,stagger:0.04},0.12)
      .from(".status-button",{opacity:0,scale:0.92,duration:0.7},0.42);
  }

  animateHero();
  runCounts(views.overview);
  animateViewContent("overview");
  setupRevealObserver();
  setupSectionObserver();
  setupProductShowcase();
  setupBrandFocusView();
  preloadView("products");
  ScrollTrigger.refresh();
})();
