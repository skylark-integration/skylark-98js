/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
define(["skylark-jquery","skylark-browserfs","./win98"],function(e,t,i){var s,n,o,l=[];const a=location.href.match(/98.js.org/)?location.href.match(/.*98.js.org/)[0]+"/":"/";return t.configure({fs:"OverlayFS",options:{writable:{fs:"IndexedDB",options:{storeName:"C:"}},readable:{fs:"XmlHttpRequest",options:{index:a+"filesystem-index.json",baseUrl:a}}}},function(e){if(e)throw n=!0,l.length&&alert("The filesystem is not available. It failed to initialize."),l=[],e;s=!0;for(var t=0;t<l.length;t++)l[t]();l=[]}),setTimeout(function(){o=!0,l.length&&alert("The filesystem is not working."),l=[]},5e3),{withFilesystem:function(e){s?e():n?alert("The filesystem is not available. It failed to initialize."):o?alert("The filesystem is not working."):l.push(e)}}});
//# sourceMappingURL=sourcemaps/filesystem-setup.js.map
