CLAZZ("projects.projman.ProjManProject", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
                frame:false,
                title:" "
            }
        }),
        settings:"settings",
        data:"data",
        app:"app"
    },

    proportion:0.5,
    DOM:null,
    project:{
        files:[
            {name:"style.css", data:"body { background-image: url(cat.jpg); }"},
            {name:"cat.jpg", data:"http://placekitten.com/300/300"},
            {name:"index.html", data:"<html>\n\t<head>\n\t\t<link rel=\"stylesheet\" href=\"style.css\">\n\t</head>\n\t<body>\n\t\tHello world\n\t</body>\n</html>"}
        ]
    },

    dirty:false,
    ace:null,
    currentEditor:null,
    setEditor:function(name){
        if( this.currentEditor == name )
            return;
        this.currentEditor = name;
        this.DOM.editor.forEach(
            (ed) => ed.style.display = ed.id == name ? "initial" : "none"
        );
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

    currentFile:null,
    openFile:function(file){
        this.commit();

        this.currentFile = file;

        var editor = "";

        var ext = file.name.toLowerCase().replace(/^.*\.([a-z0-9]+)$/i, "$1");
        switch( ext ){
        case "png":
        case "jpg":
        case "gif":
            this.DOM.imagePreview.src = file.data;
            editor = "imagePreview";
            break;

        case "html":
        case "css":
        case "js":
        case "json":
        case "txt":
        case "md":
            var mode = {
                js:"javascript",
                json:"json",
                txt:"plain_text",
                md:"markdown",
                css:"css",
                html:"html"
            }[ext] || "text";

            this.ace.getSession().setMode("ace/mode/" + mode);
            this.ace.setValue( file.data );
            editor = "codeComponent";
            break;
        }

        this.setEditor(editor);
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

    refresh:function(){
        this.commit();

        var fileName = this.DOM.pageSelector.value;
        var obj = this.project.files.find( (f) => f.name == fileName );
        if( !obj ){
            this.DOM.pageSelector.update();
            return;
        }

        DOC.removeChildren( this.DOM.preview );

        var src = obj.data;
        var parsed = (new DOMParser()).parseFromString( src, "text/html" );

        var m = {};
        this.project.files.forEach( (f) => m[f.name] = f.data );

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

        var tags = Array.prototype.slice.call( parsed.querySelectorAll("img"), 0 );
        tags.forEach((img) => {
            var src = img.getAttribute("src");
            if( src in m ) img.setAttribute( "src", m[src]  );
        });

        tags = Array.prototype.slice.call( parsed.querySelectorAll("script"), 0 );
        tags.forEach((tag) => {
            var src = tag.getAttribute("src");
            if( src in m ){
                tag.removeAttribute("src");
                tag.textContent = m[src];
            }
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

        src = new XMLSerializer().serializeToString(parsed);

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
    },

    $btnNewFile:{
        click:function(){
            this.project.files.unshift({name:"rename.me", data:""});
            this.DOM.filter.value = "rename.me";
            this.DOM.docSet[0].update({ filter:(e) => e.name == "rename.me" });
        }
    },

    $btnRefresh:{
        click:function(){
            this.refresh();
        }
    },

    updateFileList:function(){
        this.DOM.docSet[0].update({ filter:null });
        this.DOM.pageSelector.update();
        this.DOM.filter.value = "";
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
            this.autoSaveIH = setInterval( this.autoSave.bind(this), 10000 );
        },

        resize:function(){
            var fixed = Math.min(this.DOM.fileSection[0].getBoundingClientRect().right, 173);

            var width = this.dialogue.width - fixed;
            var height = this.dialogue.height;
            var prop = this.proportion * width;
            this.DOM.codeSection.forEach((cs) => {
                cs.style.width = prop + "px";
            });

            prop = (width - prop) + "px";
            this.DOM.previewSection.forEach((ps) => {
                ps.style.width = prop;
            });

            if( this.ace )
                this.ace.resize(true);
        }
    },

    $filter:{
        change:function(e){
            var value = e.target.value.toLowerCase().trim();
            this.DOM.docSet[0].update({ filter:(e) => e.name.toLowerCase().indexOf( value ) != -1 });
        }
    }
});
