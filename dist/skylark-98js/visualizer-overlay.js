/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
define(["skylark-jquery","./win98"],function(e,t){window.monkey_patch_render=(e=>e.render());return class{constructor(e,t){this.visualizerCanvas=e,this.wrappyCanvas=document.createElement("canvas"),this.wrappyCtx=this.wrappyCanvas.getContext("2d"),this.overlayCanvases=[],this.animateFns=[],window.monkey_patch_render=(e=>e.audio&&e.renderer?(e.render(),void this.render(t)):e.render())}makeOverlayCanvas(e){const t=document.createElement("canvas"),a=t.getContext("2d");t.style.position="absolute",t.style.left="0",t.style.top="0",t.style.pointerEvents="none",t.style.mixBlendMode="color-dodge",t.style.willChange="opacity",t.className="visualizer-overlay-canvas",e.appendChild(t),this.overlayCanvases.push(t),this.animateFns.push(s=>{a.clearRect(0,0,t.width,t.height);const i=(e.classList.contains("doubled")?2:1)*(window.devicePixelRatio||1);t.width===e.clientWidth*i&&t.height===e.clientHeight*i||(t.width=e.clientWidth*i,t.height=e.clientHeight*i),t.style.width=e.clientWidth+"px",t.style.height=e.clientHeight+"px";const n=e.querySelectorAll("*");Array.from(n).map(e=>{const t=e.clientWidth,a=e.clientHeight;return{element:e,width:t,height:a,area:t*a}}).filter(({area:e})=>e>0).sort((e,t)=>t.area-e.area).forEach(({element:t,width:n,height:r,area:l})=>{const{offsetLeft:o,offsetTop:h}=function(e,t){let a=e,s=0,i=0;do{s+=a.offsetLeft,i+=a.offsetTop,a=a.offsetParent}while(a&&a!==t);return{offsetLeft:s,offsetTop:i}}(t,e);a.save(),a.scale(i,i),a.translate(o,h),s.stretch?a.drawImage(this.wrappyCanvas,0,0,n,r):a.drawImage(this.wrappyCanvas,0,0,n,r,0,0,n,r),l<900&&(a.globalCompositeOperation="destination-out",a.globalAlpha=.5,a.fillStyle="black",a.fillRect(0,0,n,r)),a.restore()})})}render(e){const{visualizerCanvas:t,wrappyCanvas:a,wrappyCtx:s,animateFns:i}=this,{width:n,height:r}=t;if(e.mirror){const e=()=>{s.drawImage(t,0,0,n,r,0,0,n,r)};a.width=2*n,a.height=2*r,s.save(),e(),s.translate(0,r),s.scale(1,-1),s.translate(0,-r),e(),s.translate(n,0),s.scale(-1,1),s.translate(-n,0),e(),s.translate(0,r),s.scale(1,-1),s.translate(0,-r),e(),s.restore()}else if(e.tile){a.width=2*n,a.height=2*r;for(let e=0;e<2;e++)for(let a=0;a<2;a++)s.drawImage(t,0,0,n,r,n*e,r*a,n,r)}else a.width=n,a.height=r,s.drawImage(t,0,0,n,r);i.forEach(t=>t(e))}cleanUp(){this.overlayCanvases.forEach(e=>{e.remove()}),window.monkey_patch_render=(e=>e.render())}fadeOutAndCleanUp(){this.fadeOut(),this.overlayCanvases[0].addEventListener("transitionend",()=>{this.cleanUp()})}fadeOut(){this.overlayCanvases.forEach(e=>{e.style.transition="opacity 1s cubic-bezier(0.125, 0.960, 0.475, 0.915)",e.style.opacity="0"})}fadeIn(){this.overlayCanvases.forEach(e=>{e.style.transition="opacity 0.2s ease",e.style.opacity="1"})}}});
//# sourceMappingURL=sourcemaps/visualizer-overlay.js.map
