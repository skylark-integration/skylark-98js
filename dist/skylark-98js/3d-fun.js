/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
!function(){var t;disable3D=function(){t&&(t(),t=null),$(".os-window").css({transform:""})},enable3D=function(){disable3D();var n=function(){var e=requestAnimationFrame(n);t=function(){cancelAnimationFrame(e)},$(".os-window").each(function(){var t=$(this),n=this,e=0,i=0;do{e+=n.offsetLeft,i+=n.offsetTop;const t=n.style.transform.match(/translate\((\d+)px, (\d+)px\)/);if(t){const[,n,o]=t;e+=parseFloat(n),i+=parseFloat(o)}n=n.offsetParent}while(n);t.css({transform:`perspective(4000px) rotateY(${-(e+(this.clientWidth-innerWidth)/2)/innerWidth/3}turn) rotateX(${(i+(this.clientHeight-innerHeight)/2)/innerHeight/3}turn)`,transformOrigin:"50% 50%",transformStyle:"preserve-3d"})})};n()},toggle3D=function(){t?disable3D():enable3D()},addEventListener("keydown",Konami.code(toggle3D))}();
//# sourceMappingURL=sourcemaps/3d-fun.js.map
