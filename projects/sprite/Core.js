CLAZZ("projects.sprite.Core", {
	INJECT:{
		app:"app",
		main:"main",
		pool:"Pool",
		color:"PrimaryColor"
	},

	overlays:null,

	gridOverlay:null,
	toolOverlay:null,
	selection:null,
    tools:null,
    activeLayer:null,
    activeTool:null,
    color:null,
	mirror:false,

    layers:null,
	frames:null,
	fps:30,
    width:0,
    height:0,
    historyId:-1,
    history:null,

	composite:null,

	DOM:null,

	opMap:{
		"normal" : "source-over"
	},

	CONSTRUCTOR:function( ){
		this.pool.silence("onUpdateLayers");
		this.pool.silence("onUpdateFrames");
		this.pool.add(this);
        if( !this.color ) this.color = new js.Color(0,0,0,0xFF);
        this.tools   = {};
		this.frames  = [];
        this.history = [];
        this.layers  = [];
		this.overlays = [];
	},

	mask:function( x, y ){
		if( !this.activeLayer
			|| x < 0
			|| y < 0
			|| x >= this.width
			|| y >= this.height
			) return 0;
		if( !this.selection || !this.selection.enabled ) return 1;
		return this.selection.data.data[(y*this.width+x)*4+3]/255;
	},

	loadTools:function( toolset ){
        this.tools = {};
		
		this.gridOverlay = CLAZZ.get("projects.sprite.Layer", {core:this});
		this.gridOverlay.canvas.className += "grid";
		this.gridOverlay.enabled = false;
		this.overlays.push(this.gridOverlay);

		this.toolOverlay = CLAZZ.get("projects.sprite.Layer", {core:this});
		this.toolOverlay.canvas.className += "tool";
		this.overlays.push(this.toolOverlay);

		Object.keys(toolset).forEach(k => {
			this.tools[ k ] = CLAZZ.get(toolset[k].fullName, {
				Pool:this.pool,
				core:this,
				main:this.main,
				parent:this.main.dialogue
			});
		});
	},

	createLayer:function( hidden ){
		var layer = CLAZZ.get("projects.sprite.Layer", {
			core:this
		});
		if( hidden ) layer.hide();

		return layer;
	},

    setLayer:function(layer, noUndo){
		if( layer && this.layers.indexOf(layer) == -1 )
			debugger;

        this.activeLayer = layer;

        if( noUndo !== true )
            this.push();

		this.pool.call("onUpdateLayers", this.layers, layer);
    },

	setFrame:function(frame, noUndo){
		var pos = 0;
		if( this.activeLayer ){
			pos = this.layers.indexOf( this.activeLayer );
			if( pos == -1 ) pos = 0;
		}

		if( this.layers ){			
			this.layers.composite.clear();
			this.renderComposite(this.layers.composite, this.layers );
		}

		this.layers = frame;
		this.setLayer( frame[pos] );
		this.pool.call("onUpdateFrames", this.frames, this.layers );
	},

	setLayerBlending:function(mode){
		if( !this.activeLayer ) return;
		this.activeLayer.canvas.style.mixBlendMode = mode;
		this.activeLayer.blend = mode;
	},

    setLayerAlpha:function(a){
        if( !this.activeLayer ) return;
		if( isNaN(a) ) a = 1;
		this.activeLayer.alpha = a;
        this.activeLayer.canvas.style.opacity = a;
    },

	setLayerIndex:function(layer, index){
		if( !this.frames.length || !layer ) return;
		var pos = this.layers.indexOf(layer);
		if( index == pos || pos == -1 ) return;
		// if( index > pos ) index--;

		this.frames.forEach(function(frame){
			frame.splice( pos, 1 );
			frame.splice( index, 0, layer );
		});

        this.push();
		this.pool.call("onUpdateLayers", this.layers, this.activeLayer, layer );
		this.pool.call("onUpdateFrames", this.frames, this.layers );
	},

	removeLayer:function(layer){
		if( layer === undefined ) layer = this.activeLayer;
		if( !this.frames.length || !layer ) return;
		var pos = this.layers.indexOf(layer);
		if( pos == -1 ) return;

		this.frames.forEach( frame => frame.splice( pos, 1 ) );

		if( this.layers.length == 0 ) this.addLayer( false, true );

        this.setLayer( this.layers[pos-1] || this.layers[0] );
		this.pool.call("onUpdateFrames", this.frames, this.layers );
	},

	addLayer:function(duplicate, noUndo){
		var layer = null;
		var dup = this.layers.indexOf(this.activeLayer);
		var currentFrame = this.layers;

		for( var i=0; i<this.frames.length; ++i ){
			var layers = this.layers = this.frames[i];
			var newlayer = this.createLayer();

			layers.push( newlayer );

			if( duplicate ){
				newlayer.context.drawImage( layers[dup].canvas,0,0 );
				newlayer.read();
			}

			if( this.frames[i] == currentFrame )
				layer = newlayer;
		}

		this.layers = currentFrame;

		if( layer == null )
			debugger;

		this.setLayer(layer, noUndo);

		this.pool.call("onUpdateFrames", this.frames, this.layers );
	},

	removeFrame:function(frame){
		var i = this.frames.indexOf(frame);
		if( i == -1 ) return;
		this.frames.splice(i, 1);

		if( this.frames.length == 0 ) this.addFrame(0, false, true);
		if( i >= this.frames.length ) i = this.frames.length-1;

		if( this.layers == frame ){
			this.setFrame( this.frames[i] );
		}else{
			this.push();
			this.pool.call("onUpdateFrames", this.frames, this.layers );
		}
	},

	addFrame:function(pos, duplicate, noUndo){
		var layers, active;

		if( this.layers ){
			layers = this.layers.concat();
			for( var i=0; i<layers.length; ++i ){
				var layer = layers[i] = this.createLayer();
				var src = this.layers[i];
				layer.name = src.name;
				layer.alpha = src.alpha;
				layer.blend = src.blend;
				layer.enabled = src.enabled;

				if( this.layers[i] == this.activeLayer )
					active = layers[i];
				if( !duplicate ) continue;

				layer.context.drawImage( src.canvas, 0, 0 );
				layer.read();
			}
		}else{
			layers = [ active = this.createLayer() ];
		}

		layers.composite = this.createLayer(true);
		layers.composite.canvas.style.display = "none";
		layers.composite.canvas.style.mixBlendMode = "multiply";
        layers.composite.canvas.style.opacity = 0.5;

		this.frames.splice( pos, 0, layers );
		this.layers = layers;
		this.setLayer( active, noUndo );
		this.pool.call("onUpdateFrames", this.frames, this.layers );
	},

	getComposite:function(){
		if( !this.composite )
			this.composite = this.createLayer(true);
		
		var composite = this.composite;
		if( composite.canvas.width != this.width || composite.canvas.height != this.height ){
			composite.canvas.width = this.width;
			composite.canvas.height = this.height;
			composite.invalidate();
		}

		return this.composite;
	},

    renderComposite:function( composite, layers ){
		composite = composite || this.getComposite();
		layers = layers || this.layers;

		composite.clear();

		var opMap = this.opMap;
        layers.forEach(function(layer, i){
            if( layer.enabled ){
                var a = layer.alpha;
                if( a == 0 ) return;
                composite.context.globalAlpha = a;
                composite.context.globalCompositeOperation  = i && (opMap[layer.blend]||layer.blend);
                composite.context.drawImage( layer.canvas, 0, 0 );
            }
        });

		return composite;
    },

	clearLayer:function(layer){
		layer = layer||this.activeLayer;
		if( !layer ) return;
		var i, d=layer.data.data, l=d.length, a;
		if( this.selection.enabled ){
			for( i=3; i<l; i+=4 )
				d[i] = (d[i]/255)*(1-this.selection.data.data[i]/255)*255;
		}else{
			for( i=0; i<l; ){
				d[i++] = 0;
				d[i++] = 0;
				d[i++] = 0;
				d[i++] = 0;
			}
		}
	},

	extract:function(layer, out){
		layer = layer||this.activeLayer;
		if( !layer ) return;
		if( !out && !this.selection.enabled ) return layer;

		out = out || this.getComposite();
		var i, IL=layer.data.data, OL=out.data.data, l=IL.length, a;

		if( this.selection.enabled ){
			var sa = this.selection.data.data;
			for( i=0; i<l; ){
				a = sa[i+3]/255;
				OL[i] = IL[i++]*a;
				OL[i] = IL[i++]*a;
				OL[i] = IL[i++]*a;
				OL[i] = IL[i++]*a;
			}
		}else{
			OL.set(IL);
		}
		out.redraw();
		return out;
	},

	setTool:function( tool ){
		var oldTool = this.activeTool;
		if( tool == oldTool ) return;

        if( oldTool && oldTool.deactivate ) oldTool.deactivate();
		
		this.toolOverlay.context.clearRect(0,0,this.width,this.height);
		this.activeTool = tool;
		if( tool.activate ) this.activeTool.activate();
		this.pool.call("onSetTool", tool);
	},

	selectOffsetX:0,
	selectOffsetY:0,
	selectWidth:0,
	selectHeight:0,
	onSelectRect:function(x,y,w,h){
		this.selectOffsetY = y;
		this.selectOffsetX = x;
		this.selectWidth  = w;
		this.selectHeight = h;
	},

    setCanvasSize:function(width, height, stretch){
		if(this.selection)
			this.selection.enabled = false;

		var gridOverlay = this.gridOverlay;
		this.overlays.forEach((o)=>{
			if( o != gridOverlay ){
				o.canvas.width = width;
				o.canvas.height = height;
				o.invalidate();
			}
		});

        var composite = this.getComposite();
        composite.canvas.width = this.width;
        composite.canvas.height = this.height;
        this.width = width;
        this.height = height;
		if( this.selectWidth == 0 ) this.selectWidth = width;
		if( this.selectHeight == 0 ) this.selectHeight = height;

		this.frames.forEach( frame => {

			frame.forEach( layer => {
				layer.canvas.width = width;
				layer.canvas.height = height;

				if(stretch){
					layer.pixelResize();
					// composite.context.putImageData( layer.data, 0, 0 );
					// layer.context.drawImage( composite.canvas, 0, 0, width, height );
				}else{
					layer.context.putImageData(
						layer.data,
						-this.selectOffsetX,
						-this.selectOffsetY,
						0, 0,
						this.selectWidth + this.selectOffsetX,
						this.selectHeight + this.selectOffsetY
					);
// 					layer.redraw();
					layer.invalidate();
					layer.read();
				}
			});
		});

		this.onSelectRect(0,0,0,0);

		this.history = [];
		this.historyId = -1;

		this.push();

		this.pool.call("onUpdateLayers", this.layers, this.activeLayer);
		this.pool.call("onResizeCanvas");
    },

	redrawGridOverlay:function(zoom){
		var gridOverlay = this.gridOverlay, width=this.width, height=this.height;
		if( zoom <= 4 || gridOverlay.enabled == false ){
			gridOverlay.canvas.style.display = "none";
			return;
		}

		gridOverlay.canvas.style.display = "initial";
		var gw = Math.floor(width * zoom), gh = Math.floor(height * zoom);


		if( gridOverlay.width != gw || gridOverlay.height != gh ){
			gridOverlay.canvas.width = gw;
			gridOverlay.canvas.height = gh;
			gridOverlay.invalidate();
		}

		var d=gridOverlay.data.data;
		d.fill(0);
		for( var y=0; y<height; ++y ){
			var yw = Math.floor(y*zoom*gw);
			for( var x=0; x<gw; ++x ){
				d[(yw+x)*4+3] = 255;
			}
		}
		for( var y=0; y<gh*gw; y+=zoom ){
			d[Math.floor(y)*4+3] = 255;
		}
		gridOverlay.redraw();
	},

    loadImage:function( path, cb, nopush ){
        DOC.create("img", {
            crossOrigin: "Anonymous",
            onerror: evt => {
            	console.warn(evt);
				if(cb) cb(false);
            },
            onload: evt => {
				var img = evt.target;
				if( this.width != img.width || this.height != img.height )
					this.setCanvasSize( img.width, img.height );
				this.activeLayer.context.drawImage(img,0,0);
				this.activeLayer.read();
				if(!nopush) this.push();
				if(cb) cb(this.activeLayer);
			}
        }).src = path;
    },

    runFilter:function(filter){
        if( !this.activeLayer ) return;

        // if( typeof filter == "string" )
        //    filter = this.filters[name];

        if( filter.activate && !filter.activate( this.activeLayer ) )
            return;

		var d=this.activeLayer.data.data;

		if( typeof filter.kernel == "function" ){
			var gpu = new GPU();
			var kernel = gpu.createKernel(filter.kernel, { mode:filter.mode=="cpu"?"cpu":"gpu" });
			var constants = {
				width: this.width,
				height: this.height,
				stride: this.width*4
			};

			if( filter.meta ){
				for( var k in filter.meta ){
					var m = filter.meta[k];
					if( m.select ) constants[k] = m.select.indexOf(filter[k]);
					if( m.int || m.dynamic ) constants[k] = filter[k]|0;
				}
			}

			kernel.constants(constants);
			kernel.dimensions([d.length]);

			d.set( kernel(d) );
		}

		if( typeof filter.run == "function" ){
			var w=this.width, h=this.height, i=0, color = this.color;
			for( var y=0; y<h; ++y ){
				for( var x=0; x<w; ++x ){
					color.r = d[i];
					color.g = d[i+1];
					color.b = d[i+2];
					color.a = d[i+3];
					filter.run( color, x, y, w, h, d, i );
					d[i++] = color.r;
					d[i++] = color.g;
					d[i++] = color.b;
					d[i++] = color.a;
				}
			}
		}

        this.activeLayer.redraw();
        this.push();
    },


    mergeLayer:function( noUndo ){
		var top = this.activeLayer;
		if( !top ) return;
		var topId = this.layers.indexOf(top);
		if( topId <= 0 ) return;
		var bottom = this.layers[ topId-1 ];

		if( top.enabled ){
			var a = parseFloat( top.canvas.style.opacity );
			if( isNaN(a) ) a = 1;
			if( a == 0 ) return;
			var oldGA = bottom.context.globalAlpha;
			var oldGCO = bottom.context.globalCompositeOperation;
			bottom.context.globalAlpha = a;
			bottom.context.globalCompositeOperation  = (a && top.canvas.style.mixBlendMode != "normal" ? top.canvas.style.mixBlendMode:"source-over")
			bottom.context.drawImage( top.canvas, 0, 0 );
			bottom.context.globalAlpha = oldGA;
			bottom.context.globalCompositeOperation = oldGCO;
		}

		this.removeLayer(top);

		if( !noUndo ){
			bottom.read();
			this.push();
		}
    },

    flattenLayers:function(){
    	if( !this.layers.length ) return;

		while( this.layers.length > 1 ){
			this.activeLayer = this.layers[1];
			this.mergeLayer(true);
		}
		this.layers[0].read();
		this.setLayer( this.layers[0] );
    },

    toggleLayer:function( layer ){
        layer.enabled = !layer.enabled;
        this.push({"activeLayer.enabled":layer.enabled});
		this.pool.call("onUpdateLayers", this.layers, this.activeLayer);
    },

    applySnapshot:function(id){
        if( id < 0 ) id = 0;
        if( id >= this.history.length ) id = this.history.length-1;
        this.historyId = id;

        var snapshot = this.history[ id ], THIS=this;
        if( !snapshot ) return;
		var data = snapshot.data;

		snapshot = this.makeSnapshot(snapshot);
        this.frames = snapshot.frames;
        this.layers = snapshot.layers;
        this.setLayer( snapshot.activeLayer, true );
        if( this.activeLayer && data ){
            this.activeLayer.data.data.set( data );
            this.activeLayer.redraw();
        }

        this.pool.call("onUpdateLayers", this.layers, this.activeLayer );
        this.pool.call("onUpdateFrames", this.frames, this.layers );
    },

    pop:function(){
        this.applySnapshot( this.historyId-1 );
    },

    historyCommit:true,

	makeSnapshot:function( src ){
        var frames = src.frames.map( f =>{
			var copy = f.concat();
			copy.composite = f.composite;
			return copy;
		});

		var framePos = src.frames.indexOf( src.layers )
        var layerPos = src.frames[ framePos ].indexOf( src.activeLayer );
        var activeLayer = frames[framePos][layerPos];

		// console.log("SNAP");
		return {
			frames: frames,
			layers: frames[ framePos ],
			activeLayer: activeLayer,
			width: src.width,
			height: src.height
		};
	},

    push:function(){
        if( this.historyId != this.history.length-1 ){
            this.history.splice( this.historyId+1, this.history.length );
        }

        var data;

        if( this.activeLayer )
            data = new Uint8ClampedArray( this.activeLayer.data.data );


		var ss = this.makeSnapshot(this);

		ss.collapse = 1;
		ss.data = data;

        this.history.push(ss);
        this.historyCommit = false;

        if( this.history.length > 20 ){
            var walk = 10;
            for( var i=0; i<walk; ++i ){
                var ss = this.history[i];
                if( ss.collapse == this.history[i+1].collapse && (ss.collapse == this.history[i+2].collapse || i==walk-2) ){
                    ss.collapse *= 2 ;
                    this.history.splice( i+1, 1 );
                    break;
                }
            }
            if( i==walk )
                this.history.shift();
        }
        this.historyId = this.history.length-1;
    },

    commit:function(){
        this.historyCommit = true;
    },

    undo:function(){
        this.pop();
    },

    redo:function(){
        this.applySnapshot( this.historyId+1 );
    }
});
