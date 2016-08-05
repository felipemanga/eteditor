CLAZZ("popups.brushpicker.BrushPicker", {
	INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
				show:false,
				width: 200,
				always_on_top: true,
				title:"Brushes"
			},
		}),
		tool:INJECT("tool"),
		brushes:RESOLVE("settings.popups.brushpicker.brushes")
	},

	canvas:null,
	context:null,
	defaults:null,
	DOM:null,

	CONSTRUCTOR:function(){
		this.defaults = {};
	},

	enable:function(){
		this.dialogue.enable();
	},

	disable:function(){
		this.dialogue.disable();
	},

	$DIALOGUE:{
		load:function(){
			this.dialogue.moveTo(0,50);
			this.DOM = this.dialogue.DOM;

			var THIS=this;
			var DOM=this.dialogue.DOM;
			var id=0;

			this.canvas = this.DOM.create("canvas");
			DOC.remove(this.canvas);
			this.context = this.canvas.getContext("2d");

			DOM.create("div", {
				onclick:THIS.setBrush.bind(THIS, 0, null),
				before:DOM.clear,
				className:"active",
				id:"b0"
			},[
				["span", { text:DOC.TEXT( "1 Pixel" ) }]
			]);

			this.brushes.forEach(( file ) => {
				var ext = file.match( /.+\.([a-z]+)$/i )[1].toLowerCase();
				if( ext == "png" ){
					++id;

					DOM.create("div", {
						onclick:THIS.setBrush.bind(THIS, id, file),
						before:DOM.clear,
						id: "b" + id
					},[
						["img", { src:file, id:"brush" + id }],
						["span", { text:DOC.TEXT( file.replace(/\.[a-z]+$/i, '') ) }]
					]);
				}
			});
		}
	},

	setBrush:function(id, src){
		var active = this.DOM.qs(".active");
		if( active ) active.className = "";

		active = this.DOM.qs("#b" + id);
		if(active) active.className = "active";
		else alert("b" + id);

		if( !id ){
			this.tool.brush = null;
			DOC.mergeTo( this.tool, this.defaults );
			return;
		}

		var img = this.DOM.byId("brush" + id);
		if( !img ){
			console.warn(id, " not found.");
			return;
		}

		try{

			DOC.mergeTo( this.tool, this.defaults );

			/*
			if( fs.existsSync(img.dataset.src + ".json") ){
				var settings = JSON.parse( fs.readFileSync( img.dataset.src + ".json") );
				for( k in settings ){
					if( !(k in this.defaults) ) this.defaults[k] = this.tool[k];
					this.tool[k] = settings[k];
				}
			}
			*/
		}catch(ex){
			alert(ex.stack);
		}

		this.canvas.width = img.naturalWidth;
		this.canvas.height = img.naturalHeight;
		this.context.drawImage( img, 0, 0 );

		this.tool.brush = this.context.getImageData( 0, 0, this.canvas.width, this.canvas.height );
	}

});
