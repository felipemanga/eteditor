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
        onlineStorage:"onlineStorage",

        data:"data",
        store:"io.Store",
        fileReader:"io.FileReader",
        fileSaver:"io.FileSaver"
    },

    data:null,
    DOM:null,
    code:null,
    log:null,
    openConsole:false,
    autoUpdateConsole:false,
    logVal:function( val ){
        if( val && val.toString )
            return val.toString();
        return JSON.stringify(val);
    },

    console:{
        log:function(){
            var args = Array.prototype.splice.call(arguments, 0);
            console.log.apply( console, args );
            this.openConsole = true;
            this.log.push( args.map(this.logVal.bind(this)).join(" ") );
            if( this.autoUpdateConsole ) this.updateConsole();
        },
        warn:function(){
            var args = Array.prototype.splice.call(arguments, 0);
            console.warn.apply( console, args );
            this.openConsole = true;
            this.log.push( args.map(this.logVal.bind(this)).join(" ") );
            if( this.autoUpdateConsole ) this.updateConsole();
        },
        error:function(){
            var args = Array.prototype.splice.call(arguments, 0);
            console.error.apply( console, args );
            this.openConsole = true;
            this.log.push( args.map(this.logVal.bind(this)).join(" ") );
            if( this.autoUpdateConsole ) this.updateConsole();
        }
    },

    updateConsole:function(){
        this.log.forEach( (e) => DOC.create("p", {text:e}, this.DOM.console) );
        this.log = [];
        if( this.openConsole )
        	this.DOM.console.style.display = "initial";
    },

    preprocess:function(src, cb){
        var match, exp = /^\s*#include\s+"([^"]+)"$/mg;
        var files = [], offset = 0, CONSOLE = this.console;

        do{
            match = exp.exec(src);
            if( match ) files.push(match);
        }while( match );

        function shift(){
            if( !files.length ){
                done();
                return;
            }

            var file = files.shift();
            DOC.getURL(file[1], function( ret, state ){
                if( state != 200 ){
                    CONSOLE.error("Server returned " + state + " on include " + file);
                }else{
                    var start = file.index + offset, end = start + file[0].length;
                    src = src.substr(0, start) + ret + src.substr(end);
                    offset += ret.length - file[0].length;
                }
                shift();
            }, {anystate:true});
        }

        function done(){
            src = "var console = arguments[0];\n" + src;
            cb(src);
        }

        if( files.length ) shift();
        else done();
    },

    eval:function(){
        this.preprocess( this.code.getValue(), (src) => {
            var ret;
            this.openConsole = false;
            this.autoUpdateConsole = false;
            var delta = "Error: ";
            try{
                var func = new Function(src);
                var start = performance.now();
                ret = func(this.console);
                delta = Math.round(performance.now() - start) + "ms | ";
            }catch(e){
                ret = e;
            }

            this.DOM.retVal.textContent = delta + this.logVal( ret );

            this.updateConsole();
            this.autoUpdateConsole = true;
        } );
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
                clearInterval(this.autoSaveIH);
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
            this.code.setValue( this.data || (this.settings.autoSave == undefined ? this.example : this.settings.autoSave) );

            this.code.commands.addCommand({
                name: "replace",
                bindKey: {win: "Ctrl-Enter", mac: "Command-Option-Enter"},
                exec: () => this.eval()
            });

            setTimeout( () => this.dialogue.toggleMaximized(), 100 );
            this.code.focus();

            this.autoSaveIH = setInterval( this.autoSave.bind(this), 10000 );
        },

        resize:function(){
            this.code.resize(true);
        }
    },

    toggleConsole:function(){
        if( this.DOM.console.style.display == "none" ){
            this.DOM.console.style.display = "initial";
        }else{
            this.DOM.console.style.display = "none";
            DOC.removeChildren( this.DOM.console );
        }
    },

    $btnConsole:{
        click:function(){
            this.toggleConsole();
        }
    },

    $btnEval:{
    	click:function(){
            this.eval();
    	}
    },

    $btnShare:{
        click:function(){
            var src = this.code.getValue();
            var url = this.onlineStorage.share("ide", src);
            url = location.origin + location.pathname + "?p=ide&os=" + url;
            // window.open( url );
            DOC.create("span", this.DOM.retVal, {text:"URL: "} );
            DOC.create("a", this.DOM.retVal, {text:url, href:url} );
        }
    },

    example:[
        '#include "js/webclgl/WebCLGLWork.class.js"',
        '#include "js/webclgl/WebCLGLVertexFragmentProgram.class.js"',
        '#include "js/webclgl/WebCLGLUtils.class.js"',
        '#include "js/webclgl/WebCLGLKernel.class.js"',
        '#include "js/webclgl/WebCLGLFor.class.js"',
        '#include "js/webclgl/WebCLGLBuffer.class.js"',
        '#include "js/webclgl/WebCLGL.class.js"',
        '',
        '// FILL ARRAYS A AND B',
        'var _length = 64*64, num = 0.01, start, cpu = [], gpu, arrayA = [], arrayB = [];',
        'for(var n = 0; n < _length; n++) {',
        '    arrayA.push(Math.random()/2.0);',
        '    arrayB.push(Math.random()/2.0);',
        '}',
        '',
        'start = performance.now();',
        '',
        '// PERFORM A + B + SIMPLE NUM WITH GPU',
        'gpu = gpufor(',
        '    { "float* A": arrayA, "float* B": arrayB, "float num": num }, ',
        '    "n",',
        '    "float sum = A[n]+B[n]+num;"+',
        '    "return sum;"',
        ')[0]; // return range is from 0.0 to 1.0',
        '',
        'console.log( "GPU Time:", performance.now() - start );',
        '',
        'start = performance.now();',
        '// PERFORM A + B + SIMPLE NUM WITH CPU',
        'for(var n = 0; n < _length; n++)',
        '    cpu[n] = arrayA[n]+arrayB[n]+num;',
        '',
        'console.log( "CPU Time:", performance.now() - start );',
        '',
        'for(var n = 0; n < _length; n++)',
        '    cpu[n] -= gpu[n];',
        '',
        'console.log( "Error:", cpu.join(" ") );'
    ].join("\n")

});

});
