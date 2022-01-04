/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
define(["skylark-jquery","./win98"],function(e,t){function s(t){s.all_tasks.push(this),this.$window=t;const i=this.$task=e("<button class='task toggle'/>").appendTo(e(".tasks")),n=e("<span class='title'/>");let o;this.updateTitle=(()=>{n.text(t.getTitle())}),this.updateIcon=(()=>{const e=o;(o=t.getIconAtSize(16))?e?e.replaceWith(o):i.prepend(o):e&&e.remove()}),this.updateTitle(),this.updateIcon(),t.on("title-change",this.updateTitle),t.on("icon-change",this.updateIcon),t.setMinimizeTarget(i[0]),i.append(o,n),i.on("pointerdown",function(e){e.preventDefault()}),i.on("click",function(){i.hasClass("selected")?(t.minimize(),t.blur()):(t.unminimize(),t.bringToFront(),t.focus())}),t.onFocus(()=>{i.addClass("selected")}),t.onBlur(()=>{i.removeClass("selected")}),t.onClosed(()=>{i.remove();const e=s.all_tasks.indexOf(this);-1!==e&&s.all_tasks.splice(e,1)}),t.is&&t.is(":visible")&&t.focus()}return s.all_tasks=[],s});
//# sourceMappingURL=sourcemaps/Task.js.map
