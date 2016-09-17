CLAZZ({
	PROVIDES:{
		"popups.brushpicker.IElement":"implements"
	},

	INJECT:{
		parent:"parent",
		context:"context",
		data:"data"
	},

	el:null,
	DOM:null,
	cfg:null,

	CONSTRUCTOR:function(){
		var file = this.data.match( /(.+\.)([a-z]+)$/i );
		var ext = file[2].toLowerCase(), image;
		if( ext == "png" || ext == "jpg" ){
			image = this.data;
			this.cfg = {};
		}else{
			image = file[1] + "png";
			DOC.getURL( this.data, (cfg) => this.cfg = JSON.parse(cfg) );
		}

		var el = DOC.create("div", this.parent,{
				className: "brush"
			},[
			["img", { src:image }],
			["span", { text:DOC.TEXT( image.replace(/.*?\/|\.[a-z]+$/ig, '') ) }]
		]);
		this.DOM = DOC.index(el, null, this);
		this.el = el;
	},

	$brush:{
		click:function(){
			if( !this.cfg ){
				alert(this.data + " not loaded.");
				return;
			}

			var others = this.el.parentNode.querySelectorAll(".brush.active");
			for( var i=0, l=others.length; i<l; ++i ){
				var other = others[i];
				other.className = other.className.replace(/\s*active\s*/g, " ");
			}

			this.context.setBrush( this.DOM.IMG, this.cfg );
			this.el.className = "brush active";
		}
	}
});

CLAZZ("popups.brushpicker.BrushPicker", {
	INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
				enabled:false,
				show:false,
				width: 200,
				always_on_top: true,
				title:"Brushes",
				hide_only:true
			},
		}),

		propertyBuilder:"dialogues.IPropertyBuilder",
		tool:INJECT("tool"),
		brushes:RESOLVE("settings.popups.brushpicker.brushes")
	},

	canvas:null,
	context:null,
	defaults:null,
	DOM:null,
	active:null,

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
			this.dialogue.moveTo(128,0);
			this.DOM = this.dialogue.DOM;

			var THIS=this;
			var DOM=this.dialogue.DOM;
			var id=0;

			this.canvas = this.DOM.create("canvas");
			DOC.remove(this.canvas);
			this.context = this.canvas.getContext("2d");

			var el = DOM.create("div", DOM.list, {
				className:"brush active",
			},[
				["span", { text:DOC.TEXT( "1 Pixel" ) }]
			]);

			el.onclick = THIS.setBrush.bind(THIS, 0, null, el);
			DOM.list.update({ctx:this});
		}
	},


	setBrush:function( img, cfg, evt ){
		if( this.active != img ){
			this.active = img;
			DOC.mergeTo( this.tool, this.defaults );

			DOC.removeChildren(this.DOM.properties);

			if( cfg ){
				for( k in cfg ){
					if( !(k in this.defaults) ) this.defaults[k] = this.tool[k];
					this.tool[k] = cfg[k];
				}
			}

			if( !img ){
				this.tool.brush = null;
				return;
			}

			if( this.tool.meta ){
				Object.sort( this.tool.meta ).forEach( (k) =>
					this.propertyBuilder
						.build(this.tool, k, this.tool.meta[k], this.DOM.properties)
						.addEventListener( "change", this.setBrush.bind(this, img, cfg) )
				);
			}

			if( cfg ){
				if( cfg.meta ){
					Object.sort( cfg.meta ).forEach( (k) =>
						this.propertyBuilder
							.build(this.tool, k, cfg.meta[k], this.DOM.properties)
							.addEventListener( "change", this.setBrush.bind(this, img, cfg) )
					);
				}
			}
		}

		var scale = this.tool.bscale/100;
		if( isNaN(scale) ) scale=1;

		if( Math.round(img.naturalWidth * scale <= 1) || Math.round(img.naturalHeight * scale <= 1) ){
			this.tool.brush = null;
		}else{
			this.canvas.width = Math.round(img.naturalWidth * scale);
			this.canvas.height = Math.round(img.naturalHeight * scale);
			this.context.drawImage( img, 0, 0, this.canvas.width, this.canvas.height );

			this.tool.brush = this.context.getImageData( 0, 0, this.canvas.width, this.canvas.height );
		}
	}

});
