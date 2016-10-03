(function(){
    
var backup = {error:console.error, warn:console.warn, log:console.log};
var errlog = document.createElement("div");
errlog.style.position = "absolute";
errlog.style.top = errlog.style.left = 0;
errlog.style.background = "white";

function L(style){
    var div=document.createElement("div");
    // div.textContent = ex.stack.toString();
    for( var k in style )
        div.style[k] = style[k];
    
    var txt = [];
    for( var i=1; i<arguments.length; ++i ){
        var val = arguments[i];
        if( val ){
            if( typeof val == "object" ){
                if( val instanceof Error ){
                    val=val.stack;
                }
            }
            val = val.toString();
            val = val.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")
        }
        txt[txt.length] = val;
    }
    
    div.innerHTML = txt.join(" ");
    
    errlog.appendChild(div);
    if(!errlog.parentNode && document.body )
        document.body.appendChild(errlog);
}

console.log = L.bind(self, {});
console.warn = L.bind(self, {backgroundColor:"yellow"});
window.onerror = console.error = L.bind(self, {backgroundColor:"yellow", color:"red"});

})();