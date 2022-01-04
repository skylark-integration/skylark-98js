/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
define(["skylark-jquery","./win98"],function(e,t){var i,n,s,o=[];const l=location.href.match(/98.js.org/)?location.href.match(/.*98.js.org/)[0]+"/":"/";return BrowserFS.configure({fs:"OverlayFS",options:{writable:{fs:"IndexedDB",options:{storeName:"C:"}},readable:{fs:"XmlHttpRequest",options:{index:l+"filesystem-index.json",baseUrl:l}}}},function(e){if(e)throw n=!0,o.length&&alert("The filesystem is not available. It failed to initialize."),o=[],e;i=!0;for(var t=0;t<o.length;t++)o[t]();o=[]}),setTimeout(function(){s=!0,o.length&&alert("The filesystem is not working."),o=[]},5e3),{withFilesystem:function(e){i?e():n?alert("The filesystem is not available. It failed to initialize."):s?alert("The filesystem is not working."):o.push(e)}}});
//# sourceMappingURL=sourcemaps/filesystem-setup.js.map
