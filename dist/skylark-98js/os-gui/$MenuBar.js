/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
!function(exports){console.warn("$MenuBar.js is deprecated. Please use MenuBar.js instead. jQuery is no longer required for menu bars. For upgrading, see https://github.com/1j01/os-gui/blob/master/CHANGELOG.md");var xhr=new XMLHttpRequest;function $MenuBar(e){return console.warn("$MenuBar is deprecated. Use `new MenuBar(menus).element` instead."),jQuery(new MenuBar(e).element)}xhr.open("GET",document.currentScript.src.replace("$",""),!1),xhr.send(),eval(xhr.responseText),exports.$MenuBar=$MenuBar}(window);
//# sourceMappingURL=../sourcemaps/os-gui/$MenuBar.js.map
