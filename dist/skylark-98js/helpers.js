/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
define(["skylark-jquery","./win98"],function(n,t){Math.PI,Math.PI,n(window);const e=location.href.match(/98.js.org/)?location.href.match(/.*98.js.org/)[0]+"/":"/";return{Cursor:function(n){return"url(images/cursors/"+n[0]+".png) "+n[1].join(" ")+", "+n[2]},DESKTOP_ICON_SIZE:32,TASKBAR_ICON_SIZE:16,TITLEBAR_ICON_SIZE:16,getIconPath:function(n,t){return e+"images/icons/"+n+"-"+t+"x"+t+".png"},Canvas:function(n,t){var e,o=(e="canvas",document.createElement(e)),i=o.getContext("2d");if(i.imageSmoothingEnabled=!1,i.mozImageSmoothingEnabled=!1,i.webkitImageSmoothingEnabled=!1,n&&t)o.width=n,o.height=t;else{var r=n;r&&(o.width=r.width,o.height=r.height,i.drawImage(r,0,0))}return o.ctx=i,o},mustHaveMethods:function(n,t){for(const e of t)if("function"!=typeof n[e])throw console.error("Missing method",e,"on object",n),new TypeError("missing method "+e);return!0},windowInterfaceMethods:["close","minimize","unminimize","bringToFront","getTitle","getIconAtSize","focus","blur","onFocus","onBlur","onClosed"],file_name_from_path:function(n){return n.split("\\").pop().split("/").pop()},file_extension_from_path:function(n){return(n.match(/\.(\w+)$/)||[,""])[1]}}});
//# sourceMappingURL=sourcemaps/helpers.js.map
