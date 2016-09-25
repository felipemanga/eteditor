need([
	{FQCN:"GPU", URL:"js/gpu.js"},
	{FQCN:"ace", URL:"js/ace.js"}
], function(){

CLAZZ("projects.sprite.Filters", {
	INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:RESOLVE("settings.projects.sprite.Filters.dialogue")
        }),

		propertyBuilder:"dialogues.IPropertyBuilder",
		preprocessor:"preprocessor.IPreprocessor",
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
					this.addFilter( file.src )
				else if( file.match(/^(https?:\/\/)?[a-zA-Z0-9_./?&=+%]+$/) )
					DOC.getURL(file, (src) => this.addFilter( src, undefined, true ) );
				else{
					this.addFilter( file )
				}
			});
		},

		resize:function(){
			this.ace.resize(true);
		}
	},

	addFilter:function( src, clazz, remote ){
		// clazz = clazz || this.compile( src );
		if( !clazz ) return this.compile( src, (clazz) => this.addFilter( src, clazz, remote ) );

		var filter, file = this.getPath(clazz);

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
		console.warn(e.stack);
	},

	compile:function( code, cb ){
		var error = this.error.bind(this);
		try{
			if( code == undefined )
				code = this.ace.getValue();
				// code=this.DOM.TEXTAREA.value;

			this.preprocessor.run(code, function(code, syntax){
				try{
		            var errors = syntax.errors;
		            if (errors.length > 0) {
		            	debugger;
		            }else{
						var s = new Function( code );
						var clazz = s(console);
						if( typeof clazz == "function" ) cb( clazz );
		            }

				}catch(e){
					error(e);
				}
			})

		}catch(e){
			error(e);
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
		var meta = filter.meta, filterOpts=this.DOM.filterOpts;

		Object.sort( meta ).forEach( (k) => {
			this.meta[k] = (this.meta[k] != undefined ? this.meta[k] : filter[k]);
			this.propertyBuilder.build(this.meta, k, meta[k], filterOpts);
		});
	},

	getPath:function(clazz){
		return (clazz.fullName || clazz.name).replace(/\./g, "/") + ".js";
	},

	onSave:function(){
		this.compile(null, (clazz) => {
			try{
				var instance = new clazz();

				this.buildMenu( instance );

				this.addFilter(
					this.ace.getValue(),
					clazz
				);

				this.app.call("saveSettings");

				this.DOM.path.textContent = this.getPath(clazz);
			}catch(err){
				this.error(err);
				return;
			}
		});
	},

	$btnSave:{
		click:function(){
			this.onSave();
		}
	},

	$btnRun:{
		click:function(){
			this.compile(null, (clazz) => {
				this.DOM.path.textContent = "Running...";
				setTimeout(run.bind(this, clazz), 10);
			});

			function run( clazz ){
				var start = performance.now();
				try{
					var f = new clazz();
					if( this.meta ){
						for( var k in this.meta ){
							f[k] = this.meta[k];
						}
					}
					this.core.runFilter(f);
				}catch(err){
					this.error(err);
					return;
				}
				var t = (performance.now() - start);
				this.DOM.path.textContent = "Done in " + t + " ms.";
			}
		}
	}
});

});
