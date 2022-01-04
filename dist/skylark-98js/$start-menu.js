/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
define(["skylark-jquery","./win98","./os-gui/$Window"],function(n,t,e){var d=n(".start-menu");d.hide();var o=function(){s.removeClass("selected"),d.attr("hidden","hidden"),d.hide()},i=function(){d.is(":hidden")?(s.addClass("selected"),d.attr("hidden",null),d.slideDown(100),d.css({zIndex:++e.Z_INDEX+5001})):o()},s=n(".start-button");return s.on("pointerdown",function(){i()}),n("body").on("pointerdown",function(t){0===n(t.target).closest(".start-menu, .start-button").length&&o()}),n(window).on("keydown",function(n){27===n.which&&o()}),d});
//# sourceMappingURL=sourcemaps/$start-menu.js.map
