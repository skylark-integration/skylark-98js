/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
define(["skylark-jquery","./win98","./os-gui/$Window"],function(e,n,t){var o=0,i=e(window);function r(n){var t=e(n);e("body").addClass("loading-program"),o+=1,t.on("load",function(){--o<=0&&e("body").removeClass("loading-program");try{console.assert(n.contentWindow.document===n.contentDocument)}catch(e){return void console.warn(`[enhance_iframe] iframe integration is not available for '${n.src}'`)}if(window.themeCSSProperties&&applyTheme(themeCSSProperties,n.contentDocument.documentElement),n.contentDocument.addEventListener("mousedown",e=>{var t=function(){if(n.contentWindow&&n.contentWindow.jQuery&&n.contentWindow.jQuery("body").trigger("pointerup"),n.contentWindow){const e=new n.contentWindow.MouseEvent("mouseup",{button:0});n.contentWindow.dispatchEvent(e);const t=new n.contentWindow.MouseEvent("mouseup",{button:2});n.contentWindow.dispatchEvent(t)}o()};function o(){i.off("mouseup blur",t),n.contentDocument.removeEventListener("mouseup",o)}i.on("mouseup blur",t),n.contentDocument.addEventListener("mouseup",o)}),c(n),n.contentDocument.querySelector("#error #livewebInfo.available")){var r=document.createElement("div");r.style.position="absolute",r.style.left="0",r.style.right="0",r.style.top="0",r.style.bottom="0",r.style.background="#c0c0c0",r.style.color="#000",r.style.padding="50px",n.contentDocument.body.appendChild(r),r.innerHTML='<a target="_blank">Save this url in the Wayback Machine</a>',r.querySelector("a").href="https://web.archive.org/save/https://98.js.org/"+n.src.replace(/.*https:\/\/98.js.org\/?/,""),r.querySelector("a").style.color="blue"}var a=e(n.contentWindow);a.on("pointerdown click",function(t){n.$window&&n.$window.focus(),e(".menu-button").trigger("release"),e(".menu-popup").hide()}),a.on("pointerdown",function(n){t.css("pointer-events","all"),e("body").addClass("drag")}),a.on("pointerup",function(n){e("body").removeClass("drag"),t.css("pointer-events","")}),n.contentWindow.close=function(){n.$window&&n.$window.close()},n.contentWindow.showMessageBox=(e=>showMessageBox({title:e.title||n.contentWindow.defaultMessageBoxTitle,...e}))}),t.css({minWidth:0,minHeight:0,flex:1,border:0})}function c(e){for(const n of["keyup","keydown","keypress"])e.contentWindow.addEventListener(n,t=>{const o=new KeyboardEvent(n,{target:e,view:e.ownerDocument.defaultView,bubbles:!0,cancelable:!0,key:t.key,keyCode:t.keyCode,which:t.which,code:t.code,shiftKey:t.shiftKey,ctrlKey:t.ctrlKey,metaKey:t.metaKey,altKey:t.altKey,repeat:t.repeat});e.dispatchEvent(o)||t.preventDefault()},!0)}return e(window).on("pointerdown",function(n){e("body").addClass("drag")}),e(window).on("pointerup dragend blur",function(n){"blur"===n.type&&document.activeElement.tagName.match(/iframe/i)||(e("body").removeClass("drag"),e("iframe").css("pointer-events",""))}),{enhance_iframe:r,proxy_keyboard_events:c,make_iframe_window:function(n){void 0==n.resizable&&(n.resizable=!0);var o=new t(n),i=o.$iframe=e("<iframe>").attr({src:n.src});return r(i[0]),o.$content.append(i),(o.iframe=i[0]).$window=o,i.on("load",function(){o.show(),o.focus()}),o.$content.css({display:"flex",flexDirection:"column"}),o.center(),o.hide(),o}}});
//# sourceMappingURL=sourcemaps/iframe-windows.js.map