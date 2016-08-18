need([
    {FQCN:"esprima", URL:"js/esprima.js"},
	{FQCN:"ace", URL:"js/ace.js"}
], function(){

CLAZZ("projects.ide.IDEProject", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:RESOLVE("settings.projects.ide.IDEProject.dialogue")
        }),

        settings:"settings",
        app:"app",

        store:"io.Store",
        fileReader:"io.FileReader",
        fileSaver:"io.FileSaver"
    },

    DOM:null,
    code:null,
    log:null,
    openConsole:false,

    logVal:function( val ){
        if( val && typeof val == "object" )
            return val.toString();
        return JSON.stringify(val);
    },

    console:{
        log:function(){
            var args = Array.prototype.splice.call(arguments, 0);
            console.log.apply( console, args );
            this.openConsole = true;
            this.log.push( args.map(this.logVal.bind(this)).join(" ") );
        },
        warn:function(){
            var args = Array.prototype.splice.call(arguments, 0);
            console.warn.apply( console, args );
            this.openConsole = true;
            this.log.push( args.map(this.logVal.bind(this)).join(" ") );
        },
        error:function(){
            var args = Array.prototype.splice.call(arguments, 0);
            console.error.apply( console, args );
            this.openConsole = true;
            this.log.push( args.map(this.logVal.bind(this)).join(" ") );
        }
    },

    eval:function(){
        var ret;
        this.openConsole = false;
        try{
            var src = "var console = arguments[0];\n";
            src += this.code.getValue();
            var func = new Function(src);
            var start = performance.now();
            ret = func(this.console);
        }catch(e){
            ret = e;
        }
        var delta = Math.round(performance.now() - start);

        this.DOM.retVal.textContent = delta + "ms | " + this.logVal( ret );

       	this.log.forEach( (e) => DOC.create("p", {text:e}, this.DOM.console) );
        this.log = [];

        if( this.openConsole )
        	this.DOM.console.style.display = "initial";
    },

    autoSaveIH:null,
    autoSave:function(){
        var code = this.code.getValue();
        if( this.settings.autoSave == code )
            return;

        this.settings.autoSave = code;
        this.app.call("saveSettings");
    },

    $DIALOGUE:{
        close:function(){
            if( this.autoSaveIH )
                clearInterval(autoSaveIH);
        },

        load:function(){
            this.log = [];

            var console = this.console;
            this.console = {};
            for( var k in console )
                this.console[k] = console[k].bind(this);

            this.DOM = this.dialogue.DOM;
            this.code = ace.edit( this.DOM.codeComponent );
		    this.code.setTheme("ace/theme/monokai");
		    this.code.getSession().setMode("ace/mode/javascript");
            this.code.setValue( this.settings.autoSave || "" );

            this.code.commands.addCommand({
                name: "replace",
                bindKey: {win: "Ctrl-Enter", mac: "Command-Option-Enter"},
                exec: () => this.eval()
            });

            this.code.focus();

            this.autoSaveIH = setInterval( this.autoSave.bind(this), 10000 );
        },

        resize:function(){
            this.code.resize(true);
        }
    },

    $btnConsole:{
        click:function(){
            if( this.DOM.console.style.display == "none" ){
                this.DOM.console.style.display = "initial";
            }else{
                this.DOM.console.style.display = "none";
                DOC.removeChildren( this.DOM.console );
            }
        }
    },

    $btnEval:{
    	click:function(){
            this.eval();
    	}
    }

});

});
