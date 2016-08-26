(function(){

var map = {}, nextPrefixId = 0;

DOC.resolve( "js.embedify", null, embedify )

function embedify(src, documentRoot){
    documentRoot = documentRoot || "";

    var parsed = (new DOMParser()).parseFromString( src, "text/html" );
    var children = Array.prototype.slice.call(parsed.body.childNodes, 0);
    var headScripts = Array.prototype.slice.call(parsed.head.querySelectorAll("script"));
    DOC.removeChildren( parsed.body );

    var classes = [];

    var styles = parsed.getElementsByTagName("style");
    Array.prototype.forEach.call(styles, (style) => {
        var prefix;
        var text = style.textContent.trim();
        if( text ){
            if( text in map )
                prefix = map[text];
            else{
                prefix = "EMBEDDED_CSS_" + (nextPrefixId++) + " ";
                processStyle( "." + prefix, text, documentRoot );
                map[text] = prefix;
            }
            classes.push(prefix);
        }
    });

    var links = parsed.getElementsByTagName("link");

    Array.prototype.forEach.call(links, (link) => {
        var prefix;
        var href = link.getAttribute("href");
        if( href ){
            if( href in map )
                prefix = map[href];
            else{
                prefix = "EMBEDDED_CSS_" + (nextPrefixId++) + " ";

                if( !href.match(/^[^:\/]+:\/\/.*/) )
                    href = documentRoot + href;

                DOC.getURL( href, (text) => processStyle( "." + prefix, text, documentRoot ) );
                map[href] = prefix;
            }
            classes.push(prefix);
        }
    });

    classes = classes.join(" ");

    return {
        body: parsed.body,
        classes,
        children,
        headScripts
    };
}

function processStyle( prefix, text, documentRoot ){
    var rules = text.split("}");
    for(var i=0, l=rules.length-1; i<l; ++i ){
        var match = rules[i].match(/^\s*([^{]*)\{([\s\S]*)/);
        if( !match ){
            console.warn("CSS Parse Error:", rules[i]);
            continue;
        }

        var selectors = match[1].split(",");
        for( var s=0, sl=selectors.length; s<sl; s++ )
            selectors[s] = prefix + selectors[s].replace(/^\s*body/i, "embed-body").replace(/^\s*html/i, "embed-html");

        var style = match[2];
        style = style.replace(/url\(([^)]+)\)/g, "url(" + documentRoot + "$1)");
        rules[i] = selectors.join(",") + "{" + style;
    }

    text = rules.join("}\n");

    DOC.create("style", document.head, {text:text});
}

})();
