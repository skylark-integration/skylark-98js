/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
define(["skylark-jquery","./win98"],function(t,i){var e=t(".taskbar-time"),n=function(){e.text((new Date).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})),e.attr("title",(new Date).toLocaleString([],{weekday:"long",month:"long",day:"2-digit",minute:"2-digit",hour:"2-digit"})),setTimeout(n,1e3)};return n(),e});
//# sourceMappingURL=sourcemaps/$taskbar-time.js.map
