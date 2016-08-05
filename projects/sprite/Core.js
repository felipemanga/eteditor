CLAZZ("projects.sprite.Core", {
	INJECT:{
		app:"app",
		main:"main",
		pool:"Pool",
		color:"PrimaryColor"
	},

    tools:null,
    activeLayer:null,
    activeTool:null,
    color:null,

	selection:null,
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
		Object.keys(toolset).forEach(k => {
			this.tools[ k ] = CLAZZ.get(toolset[k].fullName, {
				pool:this.pool,
				core:this,
				main:this.main
			});
		});

		this.pool.call("onLoadTools", this.tools);
	},

	createLayer:function( hidden ){
		return new projects.sprite.Layer( this, hidden );
	},

    setLayer:function(layer, noUndo){
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

		if( this.layers )
			this.renderComposite(this.layers.composite, this.layers );

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
		this.pool.call("onUpdateLayers", this.layers, layer, layer );
		this.pool.call("onUpdateFrames", this.frames, this.layers );
	},

	removeLayer:function(layer){
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

		for( var i=0; i<this.frames.length; ++i ){
			var layers = this.frames[i];

			layer = this.createLayer();

			layers.push( layer );

			if( duplicate ){
				layer.context.drawImage( layers[dup].canvas,0,0 );
				layer.read();
			}

			if( this.frames[i] == this.layers )
				layer = this.frames[i][ this.frames[i].length-1 ];
		}

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
		return this.composite;
	},

    renderComposite:function( composite, layers ){
		composite = composite || this.getComposite();
		layers = layers || this.layers;

		var opMap = this.opMap;
        composite.canvas.width = this.width;
        composite.canvas.height = this.height;
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

	setTool:function( tool ){
		var oldTool = this.activeTool;
		if( tool == oldTool ) return;

        if( oldTool && oldTool.deactivate ) oldTool.deactivate();
		this.activeTool = tool;
		if( tool.activate ) this.activeTool.activate();
		this.pool.call("onSetTool", tool);
	},

    setCanvasSize:function(width, height, stretch){
		if(this.selection) this.selection.enabled = false;

        var composite = this.getComposite();
        composite.canvas.width = this.width;
        composite.canvas.height = this.height;
        this.width = width;
        this.height = height;

		this.frames.forEach( frame => {

			frame.forEach( layer => {
				layer.canvas.width = width;
				layer.canvas.height = height;

				if(stretch){
					layer.pixelResize();
					// composite.context.putImageData( layer.data, 0, 0 );
					// layer.context.drawImage( composite.canvas, 0, 0, width, height );
				}else{
					layer.redraw();
					layer.invalidate();
					layer.read();
				}
			});

		});

		this.history = [];
		this.historyId = -1;

		this.push();

		this.pool.call("onUpdateLayers", this.layers, this.activeLayer);
    },

    loadImage:function( path ){
        MAR.create("img", {
            src:path,
            onload: evt => {
				var img = evt.target;
				this.setCanvasSize( img.width, img.height );
				this.activeLayer.context.drawImage(img,0,0);
				this.activeLayer.read();
				this.push();
			}
        });
    },

    runFilter:function(filter){
        if( !this.activeLayer ) return;

        // if( typeof filter == "string" )
        //    filter = this.filters[name];

        if( filter.activate && !filter.activate( this.activeLayer ) )
            return;

        var w=this.width, h=this.height, i=0, color = this.color, d=this.activeLayer.data.data;
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
		this.pool.call("onUpdateLayers", this.layers, layer);
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
