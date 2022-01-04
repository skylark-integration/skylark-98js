/**
 * skylark-98js - A version of 98js.js that ported to running on skylarkjs
 * @author Hudaokeji, Inc.
 * @version v0.9.0
 * @link https://github.com/skylark-integration/skylark-98js/
 * @license MIT
 */
define(["skylark-jquery","./win98","./os-gui/$Window"],function(e,t,s){var o=new Audio("/audio/CHORD.WAV");window.showMessageBox=window.showMessageBox||(({title:t=window.defaultMessageBoxTitle||"Alert",message:n,messageHTML:i,buttons:a=[{label:"OK",value:"ok",default:!0}],iconID:l="warning",windowOptions:r={}})=>{let c,d;const u=new Promise((o,u)=>{c=new s(Object.assign({title:t,resizable:!1,innerWidth:400,maximizeButton:!1,minimizeButton:!1},r)),d=e("<div>").css({textAlign:"left",fontFamily:"MS Sans Serif, Arial, sans-serif",fontSize:"14px",marginTop:"22px",flex:1,minWidth:0,whiteSpace:"normal"}),i?d.html(i):n&&d.text(n).css({whiteSpace:"pre-wrap",wordWrap:"break-word"}),e("<div>").append(e("<img width='32' height='32'>").attr("src",`../../images/icons/${l}-32x32-8bpp.png`).css({margin:"16px",display:"block"}),d).css({display:"flex",flexDirection:"row"}).appendTo(c.$content),c.$content.css({textAlign:"center"});for(const e of a){const t=c.$Button(e.label,()=>{e.action&&e.action(),o(e.value),c.close()});e.default&&(t.addClass("default"),t.focus(),setTimeout(()=>t.focus(),0)),t.css({minWidth:75,height:23,margin:"16px 2px"})}c.on("focusin","button",t=>{e(t.currentTarget).addClass("default")}),c.on("focusout","button",t=>{e(t.currentTarget).removeClass("default")}),c.on("closed",()=>{o("closed")}),c.center()});u.$window=c,u.$message=d,u.promise=u;try{o.play()}catch(e){console.log(`Failed to play ${o.src}: `,e)}return u}),window.alert=(e=>{showMessageBox({message:e})})});
//# sourceMappingURL=sourcemaps/msgbox.js.map
