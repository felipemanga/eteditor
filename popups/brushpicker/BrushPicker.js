CLAZZ("dialogues.BrushPicker", {
	EXTENDS:"Dialogue",
	canvas:null,
	context:null,
	defaults:null,

	CONSTRUCTOR:function( parent ){
		SUPER({
			show:false,
			width: 200,
			always_on_top: true,
			title:"Brushes"
		}, parent);
		this.defaults = {};
	},

	onLoad:function(){
		this.win.moveTo(0,50);
		
		var THIS=this;
		var DOM=this.DOM;
		var id=0;
		
		this.canvas = this.DOM.create("canvas");
		MAR.remove(this.canvas);
		this.context = this.canvas.getContext("2d");

		DOM.create("div", {
			onclick:THIS.setBrush.bind(THIS, 0),
			before:DOM.clear,
			className:"active",
			id:"b0"
		},[
			["span", { text:MAR.TEXT( "1 Pixel" ) }]
		]);

		dir("app/include/brushes", function( file ){
			if( /.+\.png$/i.test(file) ){
				++id;
				var src = "../brushes/" + file;

				DOM.create("div", {
					onclick:THIS.setBrush.bind(THIS, id),
					before:DOM.clear,
					id: "b" + id
				},[
					["img", { src:src, dataset:{src:"app/include/brushes/"+file}, id:"brush" + id }],
					["span", { text:MAR.TEXT( file.replace(/\.[a-z]+$/i, '') ) }]
				]);
			}
			return true;
		});
	},

	setBrush:function(id){
		var active = this.DOM.qs(".active");
		if( active ) active.className = "";
		
		active = this.DOM.qs("#b" + id);
		if(active) active.className = "active";
		else alert("b" + id);
		
		if( !id ){
			this.controller.brush = null;
			MAR.mergeTo( this.controller, this.defaults );
			return;
		}
		
		var img = this.DOM.byId("brush" + id);
		if( !img ){
			console.warn(id, " not found.");
			return;
		}

		try{
			
			MAR.mergeTo( this.controller, this.defaults );
			if( fs.existsSync(img.dataset.src + ".json") ){
				var settings = JSON.parse( fs.readFileSync( img.dataset.src + ".json") );
				for( k in settings ){
					if( !(k in this.defaults) ) this.defaults[k] = this.controller[k];
					this.controller[k] = settings[k];
				}
			}
		}catch(ex){
			alert(ex.stack);
		}

		this.canvas.width = img.naturalWidth;
		this.canvas.height = img.naturalHeight;
		this.context.drawImage( img, 0, 0 );

		this.controller.brush = this.context.getImageData( 0, 0, this.canvas.width, this.canvas.height );
	}

});
