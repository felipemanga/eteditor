CLAZZ("projects.sprite.Filters", {
	EXTENDS:"Dialogue",
	CONSTRUCTOR:function( parent ){
		SUPER({
			width:800,
			show:false,
			always_on_top: true,
			title:"Filters"
		}, parent);
	},
	
	onClose:function(){
		SUPER();
		this.enabled = false;
	},

	id:0,	
	onLoad:function(){
		this.win.moveTo(0,0);
		var THIS=this;
		var DOM=this.DOM;
		var path = "app/include/projects/sprite/filters/";
		dir(path, function( file ){
			if( /.+\.js/i.test(file) ){
				var clazz = THIS.compile( fs.readFileSync(path + file, "utf-8") );
				if( !clazz ) return true;
				
				THIS.id++;
				DOM.create("div", DOM.filters, {
					onclick:THIS.openFilter.bind(THIS, path + file, THIS.id),
					id:"filter" + THIS.id,
					text:MAR.TEXT( file.replace(/\.[a-z]+$/i, '') )
				});
				// THIS.parent.filters[clazz.NAME] = clazz;
			}
			return true;
		});
		this.setTab( DOM.tabHeader[0] );
	},
	
	openFilter:function(path, id){
		this.DOM.path.textContent = path;
		this.DOM.TEXTAREA.value = fs.readFileSync(path, "utf-8");
		var clazz = this.compile();
		var inst = clazz ? new clazz() : null;
		this.meta = null;
		this.buildMenu( inst );
	},

	error:function(e){
		if( e.index != undefined ){
			this.DOM.TEXTAREA.focus();
			this.DOM.TEXTAREA.selectionStart = this.DOM.TEXTAREA.selectionEnd = e.index;
		}
		this.DOM.path.textContent = e.description || e.message || e.toString();
	},

	compile:function( code ){
		try{
			if( code == undefined )
				code=this.DOM.TEXTAREA.value;
			
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
	
	tabHeader:{
		click:function(evt){
			this.setTab(evt.target);
		}
	},
	
	meta:null,
	buildMenu:function( filter ){
		MAR.removeChildren( this.DOM.filterOpts );
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
					["div", {className:"optionLabel", text:MAR.TEXT(k)}],
					createMeta( k )
				]);
			});
			
	},
	
	onSave:function(){
		var path = "app/include/projects/sprite/filters/";
		try{
			var clazz = this.compile();
			if( !clazz ) return;
			
			var instance = new clazz();
			
			this.buildMenu( instance );

			var file = (clazz.NAME || clazz.name);
			path += file + ".js";
			if( !this.parent.filters[file] ){
				this.parent.filters[file] = instance;
				var id = this.id++;
				this.DOM.create("div", this.DOM.filters, {
						onclick:this.openFilter.bind(this, path, id),
						id:"filter" + id,
						text:MAR.TEXT( file )
					});
			}
		}catch(err){
			this.error(err);
			return;
		}

		fs.writeFileSync( path, this.DOM.TEXTAREA.value );
		this.DOM.path.textContent = path;
	},
	
	btnSave:{
		click:function(){
			this.onSave();
		}
	},
	
	btnRun:{
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
					THIS.parent.core.runFilter(f);
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