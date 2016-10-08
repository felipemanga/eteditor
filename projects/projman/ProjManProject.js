need([
    "js.android.ETSign",
], function(){

CLAZZ("projects.projman.ProjManProject", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:RESOLVE("settings.projects.projman.ProjManProject.dialogue")
        }),
        settings:"settings",
        compressor:"io.compressors.IPNCCompressor",
        zipCompressor:"io.compressors.IZIPCompressor",
        fileReader:"io.FileReader",
        fileSaver:"io.FileSaver",
        data:"data",
        app:"app"
    },

    data:null,
    buildMeta:null,

    proportion:0.5,
    DOM:null,
    project:{
        name:"New Project",
        id:null,
        files:[
            {name:"style.css", data:"body {\n\tbackground-image: url(logo.jpg);\n}"},
            {name:"logo.jpg", data:"img/logo.png", cacheURL:true },
            {name:"index.html", data:"<html>\n\t<head>\n\t\t<link rel=\"stylesheet\" href=\"style.css\">\n\t</head>\n\t<body>\n\t\tHello world\n\t</body>\n</html>"}
        ]
    },

    libCache:null,
    dirty:false,
    ace:null,
    currentEditor:null,
    setEditor:function(name, file){
        if( this.currentEditor != name ){
            this.currentEditor = name;
            this.DOM.editor.forEach(
                (ed) => ed.style.display = ed.id == name ? "initial" : "none"
            );
        }

        if( this.currentFile && this.file != this.currentFile && this.currentEditor == "codeComponent" ){
            this.currentFile.selection = this.ace.getSelectionRange();
            this.currentFile.cursor = this.ace.getCursorPosition();
        }

        this.currentFile = file;

        if( name == "imageComponent" )
            this.DOM.imageComponent.style.backgroundImage = "url(" + file.cacheURL + ")";
        else if( name == "codeComponent" ){
            var ext = file.name.toLowerCase().replace(/^.*\.([a-z0-9]+)$/i, "$1");
            var mode = {
                js:"javascript",
                json:"json",
                txt:"plain_text",
                md:"markdown",
                css:"css",
                html:"html"
            }[ext] || "plain_text";

            this.ace.getSession().setMode("ace/mode/" + mode);
            this.ace.setValue( file.data||"" );
            if( this.currentFile.cursor )
            	this.ace.moveCursorToPosition( this.currentFile.cursor );
            if( this.currentFile.selection )
                this.ace.selection.setRange( this.currentFile.selection );
            this.ace.focus();
        }

		var DOM = this.DOM;

		setHeader("all", "initial", file);
		setHeader("image", name=="imageComponent"?"initial":"none", file);
		setHeader("code", name=="codeComponent"?"initial":"none", file);

		function setHeader(type, display, file ){
			var props = DOM[type + "Property"];
			if( !props ) return;
			props.forEach(prop => {
				prop.style.display = display;
				if( prop.tagName == "SPAN" ) prop = prop.querySelector("INPUT");
				var attrval = file[ prop.id ];
				if( prop.tagName == "INPUT" && prop.getAttribute("type") == "checkbox" ){
					if( attrval === true ) prop.checked = true;
					else prop.checked = false;
				}
			});
		}
    },

    $MENU:{
        clearPreview:function(){ this.clearPreview(); },

        focusFilter:function(){ this.DOM.filter.focus(); },

        SimpleHTML:function(){
            this.createHTML("embed", 1, (src) =>
                this.fileSaver.saveFile({
                    name: this.DOM.pageSelector.value,
                    data: src
                })
            );
        },

        AdvancedHTML:function(){
            this.createHTML("embed", 3, (src) =>
                this.fileSaver.saveFile({
                    name: this.DOM.pageSelector.value,
                    data: src
                })
            );
        },

        ZIP:function(){
            this.createHTML("extern", 0, (files) => {
                files.name = this.DOM.pageSelector.value.replace(/\.[a-zA-Z]*$/, ".zip");
                this.fileSaver.saveFile(files);
            });
        },

        Web:function(){
            var name = this.DOM.pageSelector.value.replace(/\.[a-zA-Z]*$/, "");
            this.createHTML("embed", 1, (src) => {
                var file = { name:name, data:new Blob([strToBuffer(src)]) };
                CLAZZ.get("onlineStorage").upload( file, (url)=>{
                    url = location.origin + location.pathname + "?app=" + encodeURIComponent(url);
                    DOC.removeChildren(this.DOM.shareVal);
                    DOC.create("span", this.DOM.shareVal, {text:"URL: "} );
                    DOC.create("a", this.DOM.shareVal, {text:url, href:url} );
                });
            });
        },

        AndroidAPK:function(){
            var THIS=this;
            getTemplate();
            return;

            function getTemplate(){
                if( !THIS.apkTemplate ){
                    DOC.getURL("projects/projman/templateapk", onGotTemplate, {binary:true});
                }else{
                    onGotTemplate(THIS.apkTemplate);
                }
            }

            function onGotTemplate(template){
                if( !THIS.apkTemplate ){
                    THIS.apkTemplate = new JSZip();
                    THIS.apkTemplate.loadAsync(template).then(createHTML);
                }else createHTML();
            }

            function createHTML(){
                THIS.createHTML("extern", 1, onGotHTML);
            }

            function onGotHTML(files){
                files.name = THIS.DOM.pageSelector.value.replace(/\.[a-zA-Z]*$/, ".apk");
                addTemplateFiles(files, THIS.apkTemplate);
            }

            function addTemplateFiles(files, template){
                files.forEach( file => file.name = "assets/www/" + file.name.replace(/\\/g, "/") );

                var count=0;
                var templateIndex = {};
                for( var name in template.files ){
                    var file = template.files[name];
                    if( file.dir ) continue;
                    count++;

                    file.async("uint8array").then((function(file, data){
                        templateIndex[file.name] = data;
                        count--;
                        if( !count ) processTemplate(files, templateIndex);
                    }).bind(THIS, file));
                };
            }

            function processTemplate(files, template){
                // var AMX = template["AndroidManifest.xml"];
                // var RES = template["resources.arsc"];
                // if( AMX ){
                //     try{
                //     var acc = (new js.android.ABXParse(AMX,RES)).toXMLString();
                //     console.log(acc);
                // debugger;
                //     }catch(e){ console.log(e.stack); }
                //     // template["AndroidManifest.xml"] = strToBuffer(acc);
                // }\

                var defTitle = "ET Debug App";
                var title = THIS.buildMeta.title || defTitle;
                title = title.substr(0, defTitle.length);
                if(title.length<defTitle.length) title += " ".repeat(defTitle.length - title.length);
                template["resources.arsc"].set( strToBuffer(title), 216 );

                for( var k in template )
                    files.push({name:k, data:template[k]});

                signAndSave(files);
            }

            function signAndSave(files){
                (new js.android.ETSign()).sign(files);

                files.forEach( file => THIS.zipCompressor.addFile(file.name, file.data) );

                THIS.zipCompressor.compress( files.name, file => THIS.fileSaver.saveFile(file) );
            }

        }
    },

    apkTemplate:null,

	$checkboxProperty:{
		change:function(evt){
			if(this.currentFile){
				this.currentFile[ evt.target.id ] = evt.target.checked;
                this.dirty = true;
            }
		}
	},

    expandedSection:null,

    $btnSectionExpand:{
        click:function(evt){
            var section = DOC.parentByTagName(evt.target, "section");
            this.expandedSection = section;

            DOC.toArray(this.DOM.MAIN.children).forEach((s) => {
                if( s == this.DOM.fileSection[0] ) return;
                s.className = s.className.replace(/Section( contracted)?/, s == section ? "Section" : "Section contracted");
            });
            section.querySelector(".btnSectionExpand").style.display = "none";
            section.querySelector(".btnSectionContract").style.display = "inline";
            this.resize();
        }
    },

    $btnSectionContract:{
        click:function(evt){ this.contract(); }
    },

    contract:function(){
        var section = this.expandedSection;
        if( !section ) return;
        DOC.toArray(this.DOM.MAIN.children).forEach((s) => {
            if( s == this.DOM.fileSection[0] ) return;
            s.className = s.className.replace(/Section( contracted)?/, "Section");
        });
        section.querySelector(".btnSectionExpand").style.display = "inline";
        section.querySelector(".btnSectionContract").style.display = "none";
        this.resize();
    },


    commit:function(){
        if( !this.currentFile || !this.currentEditor )
            return;

        if(this.currentEditor == "codeComponent"){
            var code = this.ace.getValue();
            if( code != this.currentFile.data )
                this.dirty = true;
            this.currentFile.data = code;
        }
    },

    chooseEditor:function(file){
        var editor = "";

        var ext = file.name.toLowerCase().replace(/^.*\.([a-z0-9]+)$/i, "$1");
        switch( ext ){
        case "png":
        case "jpg":
        case "gif":
            return "imageComponent";

        case "html":
        case "xml":
        case "mf":
        case "css":
        case "js":
        case "json":
        case "txt":
        case "md":
            return "codeComponent";
        }

        return "";
    },

    currentFile:null,
    openFile:function(file){
        if( this.currentFile == file ) return;
        this.commit();
        this.setEditor(this.chooseEditor(file), file);
    },

    autoSaveIH:null,
    autoSave:function(){
        this.commit();

        if( !this.dirty ) return;
        this.dirty = false;

        var code = JSON.stringify(this.project);
        if( this.settings.autoSave == code )
            return;

        this.settings.autoSave = code;
        this.app.call("saveSettings");
    },

    createHTML:function( embed, minimize, cb ){
        // embeds:
        // blob: files go in blob urls
        // extern: files go as side-cars
        // embed: everything in html

        this.commit();
        this.buildMeta = {};
        var fileName = this.DOM.pageSelector.value;
        var obj = this.project.files.find( (f) => f.name == fileName );
        if( !obj ){
            this.DOM.pageSelector.update();
            return;
        }

        DOC.removeChildren( this.DOM.preview );

        var src = obj.data;
        var srcHTML = src;
        var parsed = (new DOMParser()).parseFromString( src, "text/html" );

		var BASE64 = "", FSURL = "";
        var data = { JSON:{}, JS:{} };

        var m = {}, needsConverter = false;
        this.project.files.forEach(
            (f) => {
                if( embed == "blob" ){
                    m[f.name] = (f.cacheURL !== true && f.cacheURL) || f.data;
                }else{
                    m[f.name] = f.data;
                }
                if( f.storeFILE ){
					var a, jname = JSON.stringify(f.name);
					if( f.cacheURL ) a = f.raw();
					else a = f.data;
                    a = encbin(a);
    				if(BASE64.length){
                        BASE64 += ",\n";
                        FSURL += ",\n";
                    }
					BASE64 += jname + ":decbin(" + a + ")";
                    needsConverter = true;
                    var type = f.name.replace(/.*\.([a-z0-9]*)$/g, "$1").toLowerCase();
                    type = {
                        png:"image/png",
                        gif:"image/gif",
                        jpg:"image/jpeg"
                    }[type]||"";
                    if(type) type = ", {type:\"" + type + "\"}";
                    FSURL += jname + ":URL.createObjectURL(new Blob([FS.FILE[" + jname + "]]" + type + "))";
				}
                if( f.storeJSON ){
                    try{
                        data.JSON[f.name] = JSON.parse(f.data);
                    }catch(ex){
                        data.JSON[f.name] = ex.toString();
                    }
                }else if(f.name.match(/\.js$/i) ){
                    data.JS[f.name] = f.data;
                }
            }
        );

		var strdata = "var FS = {\nFILE:{\n" + BASE64 + "}\n };\n"
                + "FS.JSON = " + JSON.stringify(data.JSON) + ";\n"
                + "FS.URL = {\n" + FSURL + "\n};\n";

		strdata += decbin.toString() + "\n";

        data = strdata;

        function patchCSS(src){
            if( !src ) return src;
            var exp = /url\(([^)]+)\)/ig, match;
            while( (match=exp.exec(src)) ){
                if( match[1] in m ){
                    src = src.substr(0, match.index) + "url(" + m[match[1]] + ")" + src.substr(match.index + match[0].length);
                }
            }
            return src;
        }

        var dataScript = parsed.createElement("script"), files = [];
        var endScript = parsed.createElement("script");
        dataScript.textContent = data;
        parsed.head.insertBefore(dataScript, parsed.head.children[0]);

        if( embed != "extern" ){
            var needPatch = false;

            tags = Array.prototype.slice.call( parsed.querySelectorAll("img"), 0 );
            tags.forEach((img) => {
                var src = img.getAttribute("src");
                if( src in m ){
                    needPatch = true;
                    img.setAttribute( "data-src", src );
                    img.removeAttribute( "src" );
                }
            });

            if( needPatch ){
                dataScript.textContent += (function patchImages(){
                    var imgs = document.images;
                    for( var i=0, l=imgs.length; i<l; ++i )
                        if( imgs[i].dataset.src ) imgs[i].src = FS.URL[imgs[i].dataset.src];
                }).toString();                
                endScript.textContent = "patchImages()";
                parsed.body.appendChild(endScript);
            }

            tags = Array.prototype.slice.call( parsed.querySelectorAll("a"), 0 );
            tags.forEach((img) => {
                var src = img.getAttribute("href");
                if( src in m ) img.setAttribute( "href", m[src]  );
            });

            tags = Array.prototype.slice.call( parsed.querySelectorAll("link"), 0 );
            tags.forEach((tag) => {
                var src = tag.getAttribute("href");
                if( src in m ){
                    DOC.create("style", {
                        text: patchCSS(m[src]),
                        before: tag
                    });
                    tag.parentElement.removeChild(tag);
                }
            });

            tags = Array.prototype.slice.call( parsed.querySelectorAll("*"), 0 );
            tags.forEach((tag) => {
                var s = tag.getAttribute("style");
                if( s ) tag.setAttribute("style", patchCSS(s));
            });

        }else{
            var extdep = {};

            if( minimize ){
                tags = Array.prototype.slice.call( parsed.querySelectorAll("img"), 0 );
                // tags = tags.concat( Array.prototype.slice.call( parsed.querySelectorAll("script"), 0 ) );
                tags.forEach((img) => {
                    var src = img.getAttribute("src");
                    if( src in m ) extdep[src]=true;
                });

                tags = Array.prototype.slice.call( parsed.querySelectorAll("a"), 0 );
                tags = tags.concat( Array.prototype.slice.call( parsed.querySelectorAll("link"), 0 ) );
                tags.forEach((img) => {
                    var src = img.getAttribute("href");
                    if( src in m ) extdep[src]=true;
                });

                tags.forEach((tag) => {
                    var src = tag.getAttribute("href");
                    if( src in m ) extdep[src]=true;
                });
            }

            this.project.files.forEach((file)=>{
                if( file.name == "index.html" || (minimize && !file.storeEXTERN && !extdep[file.name]) ) return;
                var a;
                if( file.cacheURL ) a = file.raw();
                else a = file.data;
                files.push({name:file.name, data:strToBuffer(a)});
            });
        }

        tags = Array.prototype.slice.call( parsed.querySelectorAll("script"), 0 );
        if( !this.libCache ) this.libCache = {};
        var libs = [];
        var accSrc = ""; // "(function(){\n";
        tags.forEach((tag) => {
            if( tag == dataScript || tag == endScript ) return;

            var src = tag.getAttribute("src");

             if(src){
                if( src in m ){
                    if( embed == "extern" && !minimize ) return; 
                    accSrc += m[src] + "\n";
                }else{
                    if( src in this.libCache && embed == "blob" ){
                        tag.removeAttribute("src");
                        tag.textContent = this.libCache[src]+"\n";
                    }else{
                        if( embed == "blob" ){
                            DOC.getURL(src, (libsrc)=>this.libCache[src] = libsrc );
                            if( !/^https?:\/\/.*/i.test(src) ){
                                src = location.origin + location.pathname + src;
                            }
                        }
                        libs.push(src);
                    }
                }
            }

            accSrc += tag.textContent;
            DOC.remove(tag);
        });
        accSrc += "\n"; // "})();\n";
        console.log("Pre-Closure size:", accSrc.length);

        this.minimizeCode(accSrc, minimize, (src)=>{
            console.log("Final JS size:", src.length);
            var write = _write.bind(this);

            if( embed == "embed" ){
                var libcontainer = parsed.createElement("script");
                var libsLeft = libs.length;
                var acc = [];
                if( !libs.length ){
					dataScript.textContent += "\n" + src;
					write();
                }else libs.forEach((path, i) => DOC.getURL(path, (libsrc)=>{
                    acc[i] = libsrc;
                    libsLeft--;
                    if( !libsLeft ){
                        acc.push( dataScript.textContent, src );
                        dataScript.textContent = acc.join("\n;\n");
                        write();
                    }
                }));
            }else if( embed == "blob" || embed == "extern" ){
                libs.forEach((path) => {
                    var libcontainer = parsed.createElement("script");
                    libcontainer.src = path;
                    parsed.head.insertBefore(libcontainer, dataScript);
                });

                dataScript.textContent += "\n" + src;
                write();
            }

            function _write(){
                src = this.htmlToString(parsed);
                if( embed == "blob" || embed == "embed" ) cb(src);
                else{
                    if( embed == "extern" && !minimize ) files.push({name:"src_" + fileName, data:strToBuffer(srcHTML)});
                    files.push({name:"index.html", data:strToBuffer(src)});
                    cb(files);
                }
            }
        });
    },

    minimizeCode:function(code, mode, cb){
        if( !mode ){
            cb(code);
            return;
        }
        DOC.postURL('https://closure-compiler.appspot.com/compile', {
            js_code: code,
            compilation_level: mode==1?'SIMPLE_OPTIMIZATIONS':'ADVANCED_OPTIMIZATIONS',
            output_format: 'text',
            output_info: 'compiled_code'
        }, (src) => {
            console.log("Pre-PNC size:", src.length);
            if( mode == 3 ){
                this.compressor.clear();
                this.compressor.addFile("s.js", strToBuffer(src) );
                this.compressor.compress("__URL__", (files) => {
                    src = "var SOURCE_URL = URL.createObjectURL(new Blob([decbin(" + encbin(files[0].data) + ")], {type:'image/png'}));\n";
                    src += files[1].data.split('"__URL__"').join("SOURCE_URL");
                    cb(src);
                });
            }else{
                cb(src);
            }
        });
    },

    clearPreview:function(){
        DOC.removeChildren( this.DOM.preview );
    },

    refresh:function(){
        this.createHTML("blob", false, (src) => {
            if( this.expandedSection && this.expandedSection != this.DOM.previewSection )
                this.contract();

            DOC.create("iframe", this.DOM.preview, {
                src:arrayToBlobURL(src, "preview", {type:"text/html"}),
                width:"100%",
                height:"100%",
                style:{
                    width:  "100%",
                    height: "100%",
                    border: "none",
                    position: "absolute"
                }
            });
        });
    },

    htmlToString:function(e){
    	var close = false, a = "";
    	if( e.nodeType != e.DOCUMENT_NODE ){
            if( e.nodeName == "TITLE" ){
                this.buildMeta.title = e.textContent.trim();
            }
        	a = "<" + e.nodeName;
			forEach(e.attributes, (at) => {
                a += " " + at.name;
                if( at.value ) a += "=\"" + at.value +"\"";
			});
			a += ">";
			if(!e.nodeName) debugger;
            close = ["area", "base", "br", "col", "hr", "img", "input", "link", "meta", "param", "command", "keygen", "source"].indexOf(e.nodeName.toLowerCase()) == -1;
    	}else a = "<!DOCTYPE html>";


        forEach(e.childNodes, (c) => {
            if( c.nodeType == c.TEXT_NODE ) a += c.textContent;
            else a += this.htmlToString(c);
        });

        if(close) a += "</" + e.nodeName + ">";
        return a;
    },

    $btnShare:{
        click:function(){
            var src = JSON.stringify(this.project);
            var url = CLAZZ.get("onlineStorage").share("projman", src);
            url = location.origin + location.pathname + "?p=projman&os=" + url;
            DOC.removeChildren(this.DOM.shareVal);
            DOC.create("span", this.DOM.shareVal, {text:"URL: "} );
            DOC.create("a", this.DOM.shareVal, {text:url, href:url} );
        }
    },

    $btnNewFile:{
        click:function(){
            this.project.files.unshift({name:"rename.me", data:""});
            this.DOM.filter.value = "rename.me";
            this.DOM.docSet[0].update({ filter:(e) => e.name == "rename.me" });
        }
    },

    $btnUploadFile:{
        click:function(){
            this.project.files.unshift({name:"upload.me", data:""});
            this.DOM.filter.value = "upload.me";
            this.DOM.docSet[0].update({ filter:(e) => e.name == "upload.me" });
        }
    },

    $BODY:{
        dragover:function( evt ){
            console.log("over");
            if( evt.stopPropagation ) evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        },

        drop:function( evt ){
            console.log("drop");
            if( evt.stopPropagation ) evt.stopPropagation();
            evt.preventDefault();

            this.fileReader.onDropForEach(evt, (path, file, isDirectory) => {
                if( isDirectory ) return;
                this.fileReader.readAsArrayBuffer( file, (arr) => {
                    var file = { name:path, data:arr };
                    if( this.chooseEditor(file) == "codeComponent" ) file.data = bufferToStr(arr);
                    this.project.files.push(file);
                    this.DOM.docSet[0].update();
                });
            });
        }
    },

    $btnRefresh:{
        click:function(){
            this.refresh();
        }
    },

    $btnReloadImage:{
        click:function(){
            this.currentFile.reload( () => this.DOM.imageComponent.style.backgroundImage = "url(" + this.currentFile.cacheURL + ")" );
        }
    },

    $btnEditImage:{
        click:function(){
            var url = this.currentFile.data.trim();

            if( url == "" ){
                CLAZZ.get("onlineStorage").upload({name:this.currentFile.name, data:new Blob([""])}, (url)=>{
                    this.currentFile.data = url;
                    this.dirty = true;
                    openURL(url);
                })
            }else openURL(url);
            return;

            function openURL(url){
                var match = url.match(/^https:\/\/firebasestorage\.googleapis\.com\/(?:.*\/)*([^?]+)/i);
                if(match) url = decodeURIComponent(match[1]);
                window.open( location.origin + location.pathname + "?p=sprite&gs=" + url );
            }
        }
    },

    updateFileList:function(){
        this.DOM.docSet[0].update({ filter:null });
        this.DOM.pageSelector.update();
        this.DOM.filter.value = "";
    },

    $DESKTOP:{
        resize:function(){
            var area = this.dialogue.getAvailArea();
            this.dialogue.setSize(area.width, area.height);
            this.dialogue.moveTo(0,0);
        }
    },

    $DIALOGUE:{
        close:function(){
            if( this.autoSaveIH )
                clearInterval(this.autoSaveIH);
        },

        load:function(){
            this.DOM = this.dialogue.DOM;
            var area = this.dialogue.getAvailArea();
            this.dialogue.setSize(area.width, area.height);
            this.dialogue.moveTo(0,0);

            if( !this.data ) this.data = this.settings.autoSave;

            if( this.data && typeof this.data == "string" ){
                try{
                    this.project = JSON.parse(this.data);
                }catch(ex){
                    alert("Broken project file");
                }
            }
            if( !this.project || typeof this.project != "object" ) this.project = {};
            if( !this.project.files ) this.project.files = [];

            this.DOM.docSet[0].update({ filter:null });
            this.DOM.pageSelector.update({
                filter:(f) => /.html?/i.test(f.name)
            });

            this.ace = ace.edit( this.DOM.codeComponent );
		    this.ace.setTheme("ace/theme/monokai");
            this.ace.$blockScrolling = Infinity;
            this.ace.commands.addCommand({
                name: "replace",
                bindKey: {win: "Ctrl-Enter", mac: "Command-Option-Enter"},
                exec: () => this.refresh()
            });
            this.ace.commands.addCommand({
                name: "focusFilter",
                bindKey: {win: "Ctrl-p", mac: "Command-Option-p"},
                exec: () => this.DOM.filter.focus()
            });
            this.ace.commands.addCommand({
                name: "clearPreview",
                bindKey: {win: "Escape", mac: "Escape"},
                exec: () => this.clearPreview()
            });
            this.autoSaveIH = setInterval( this.autoSave.bind(this), 10000 );
        },

        resize:function(){
            this.resize();
        }
    },

    resize:function(){
        var fixed = Math.min(this.DOM.fileSection[0].getBoundingClientRect().right, 173);
        var sectionCount = 0;
        var proportion;

        DOC.toArray(this.DOM.MAIN.children).forEach((section) => {
            if( section == this.DOM.fileSection[0] || section.className.indexOf("contracted") != -1 ) return;
            sectionCount++;
        });

        var width = this.dialogue.width - fixed;
        var height = this.dialogue.height;
        var prop = Math.floor(width / sectionCount);

        DOC.toArray(this.DOM.MAIN.children).forEach((section) => {
            if( section == this.DOM.fileSection[0] ) return;
            if( section.className.indexOf("contracted") != -1 ) section.style.width = "0";
            else section.style.width = prop + "px";
        }); 

        if( this.ace )
            this.ace.resize(true);
    },

    $filter:{
        keyup:function(e){
            var value = e.target.value.toLowerCase().trim(), list = this.DOM.docSet[0];
            var filter = (e) => e.name.toLowerCase().indexOf( value ) != -1;
            try{
                var exp = new RegExp(value, "i");
                filter = (e) => exp.test( e.name );
            }catch(err){}
            list.update({ filter:filter });
            if(e.keyCode==13||e.key=="Enter"){
                list.update({ filter:filter });
                var value = list.values()[0];
                if(value) this.openFile(value);
                list.update({ filter:null });
                e.target.value = "";
            }
        }
    }
});

});
