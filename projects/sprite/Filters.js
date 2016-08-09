need([
	{FQCN:"esprima", URL:"js/esprima.js"},
	{FQCN:"ace", URL:"js/ace.js"}
], function(){

CLAZZ("projects.sprite.Filters", {
	INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:RESOLVE("settings.projects.sprite.Filters.dialogue")
        }),
		app:"app",
		core:"core",
		pool:"Pool",
		filterList:RESOLVE("settings.projects.sprite.filters")
	},

	id:0,
	DOM:null,
	filters:null,
	ace:null,

	$DIALOGUE:{
		load:function(){
			this.filters = {};
			this.DOM = this.dialogue.DOM;
			var THIS=this;
			var DOM=this.DOM;
			var pending = 0;
			this.setTab( DOM.tabHeader[0] );
			this.ace = ace.edit( DOM.codeComponent );
		    this.ace.setTheme("ace/theme/monokai");
		    this.ace.getSession().setMode("ace/mode/javascript");

			this.filterList.forEach(( file ) => {
				if( typeof file != "string" )
					this.addFilter( file.url, file.src )
				else
					DOC.getURL(file, (src) => this.addFilter( file, src, undefined, true ) );
			});
		},

		resize:function(){
			this.ace.resize(true);
		}
	},

	addFilter:function( file, src, clazz, remote ){
		clazz = clazz || this.compile( src );
		if( !clazz ) return true;

		var filter;

		if( !this.filters[file] ){
			var el = this.DOM.create("div", this.DOM.filters, {
				onclick:this.openFilter.bind(this, file),
				text:DOC.TEXT( file.replace(/.*?\/|\.[a-z]+$/ig, '') )
			});

			filter = this.filters[file] = {
				url:file,
				src:src,
				getClazz:() => clazz,
				setClazz:(c) => clazz = c,
				getEl:() => el
			};
		}else{
			filter = this.filters[file];
			filter.setClazz( clazz );
			filter.src = src;
		}

		var pos = this.filterList.findIndex(
			(desc) => desc == file || desc.url == file
		);

		if( Object.keys(this.filters).length == 1 )
			filter.getEl().click();

		if( remote ) filter = filter.url;

		if( pos != -1 ) this.filterList[pos] = filter;
		else this.filterList.push(filter);
	},

	openFilter:function(id){
		var filter = this.filters[id];
		this.DOM.path.textContent = filter.url;
		// this.DOM.TEXTAREA.value = filter.src;
		this.ace.setValue( filter.src );
		var clazz = filter.getClazz();
		var inst = clazz ? new clazz() : null;
		this.meta = null;
		this.buildMenu( inst );
	},

	error:function(e){
		if( e.index != undefined ){
			// this.DOM.TEXTAREA.focus();
			// this.DOM.TEXTAREA.selectionStart = this.DOM.TEXTAREA.selectionEnd = e.index;
			this.ace.focus();
			this.ace.navigateTo( e.line, 0 );
		}
		this.DOM.path.textContent = e.description || e.message || e.toString();
	},

	compile:function( code ){
		try{
			if( code == undefined )
				code = this.ace.getValue();
				// code=this.DOM.TEXTAREA.value;

			syntax = esprima.parse(code, {
                tolerant: true,
                loc: true
            });
            errors = syntax.errors;
            if (errors.length > 0) {
            	debugger;
            }else{
				var clazz = eval( code );
				return clazz;
            }
		}catch(e){
			this.error(e);
		}
		return null;
	},

	setTab:function(current){
		var headers = this.DOM.bar.querySelectorAll(".tabHeader");
		for( var i=0, header; header=headers[i]; ++i ){
			var tab = this.DOM[header.dataset.tab];
			var state = header == current ? "initial" : "none";
			if( tab ) tab.style.display = state;
			header.className = header.className.replace(/ active|$/, header == current ? " active" : "");
		}
	},

	$tabHeader:{
		click:function(evt){
			this.setTab(evt.target);
		}
	},

	meta:null,
	buildMenu:function( filter ){
		DOC.removeChildren( this.DOM.filterOpts );
		this.meta = this.meta || {};
		if( !filter || !filter.meta ) return;
		var meta = filter.meta;
		var DOM=this.DOM, filterOpts=this.DOM.filterOpts, THIS=this;

		function updateMeta(k, m, evt){
			THIS.meta[k] = evt.target.value;
			if( m.int ) THIS.meta[k] = parseInt(THIS.meta[k]);
		}

		function createMeta(k){
			var m=meta[k];
			var value = (THIS.meta[k] != undefined ? THIS.meta[k] : filter[k]);
			if(m.select){
				return ["select", {onchange:updateMeta.bind(THIS, k, m)},
					m.select.map( v => ["option", {value:v, text:v, selected:v==value} ] )
				];
			}
			if(m.int){
				function updateRange(evt){
					var span = evt.target.parentNode.querySelector("span");
					span.textContent = evt.target.value;
					updateMeta.call(THIS, k, m, evt);
				}

				return ["div",[
					["span", {className:"rangeLabel", text: value}],
					["input", {className:"range", onchange:updateRange, type:"range", value: value, min:m.int.min, max:m.int.max}]
				]];
			}
			return ["div", {text:JSON.stringify(m)}];
		}

		Object.sort( meta ).forEach( (k) => {
			DOM.create("div", {className:"optionContainer"}, filterOpts, [
				["div", {className:"optionLabel", text:DOC.TEXT(k)}],
				createMeta( k )
			]);
		});
	},

	onSave:function(){
		try{
			var clazz = this.compile();
			if( !clazz ) return;

			var instance = new clazz();

			this.buildMenu( instance );

			var path = (clazz.fullName || clazz.name).replace(/\./g, "/") + ".js";

			this.addFilter(
				path,
				// this.DOM.TEXTAREA.value,
				this.ace.getValue(),
				clazz
			);

			this.app.call("saveSettings");

			this.DOM.path.textContent = path;
		}catch(err){
			this.error(err);
			return;
		}
	},

	$btnSave:{
		click:function(){
			this.onSave();
		}
	},

	$btnRun:{
		click:function(){
			var clazz = this.compile();
			if( !clazz ) return;
			this.DOM.path.textContent = "Running...";
			var THIS=this;
			setTimeout(function(){
				var start = performance.now();
				try{
					var f = new clazz();
					if( THIS.meta ){
						for( var k in THIS.meta ){
							f[k] = THIS.meta[k];
						}
					}
					THIS.core.runFilter(f);
				}catch(err){
					THIS.error(err);
					return;
				}
				var t = (performance.now() - start) / 1000;
				THIS.DOM.path.textContent = "Done in " + t + " seconds.";
			}, 10);
		}
	}
});

});
