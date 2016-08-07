need([
    "projects.sprite.Core",
    "projects.sprite.ToolBox",
    "projects.sprite.Frames",
    "projects.sprite.Filters",
	{FQCN:"GIF", URL:"js/gif.js"}
], function(){

CLAZZ("projects.sprite.SpriteProject", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:RESOLVE("settings.projects.sprite.SpriteProject.dialogue")
        }),
        fileSaver:"io.FileSaver",
        colorpicker:"popups.colorpicker.IColorPicker",
        app:"app",
        pool:"Pool",
        settings:RESOLVE("settings.projects.sprite.SpriteProject"),
		path:"path",
        data:"data"
    },

    data:null,
    DOM:null,
    core:null,
    toolbox:null,
    framesview:null,
    filtersview:null,

    toolStack:null,
    zoom:1,
	path:null,

    CONSTRUCTOR:function(){
        this.pool.add(this);
        this.core = CLAZZ.get("projects.sprite.Core", {
            Pool:this.pool,
            main:this,
            parent:this.dialogue
        });

        var ctx = {
            Pool: this.pool,
            parent: this.dialogue,
            main:this,
            core:this.core
        };

        this.toolbox = CLAZZ.get("projects.sprite.ToolBox", ctx);
        this.framesview = CLAZZ.get("projects.sprite.Frames", ctx);
        this.filtersview = CLAZZ.get("projects.sprite.Filters", ctx);

        this.core.loadTools( projects.sprite.tools );
    },

    $DIALOGUE:{
        load:function(){
            this.toolStack = [];
            this.DOM = this.dialogue.DOM;
            this.core.DOM = this.dialogue.DOM;
            this.core.width = this.settings.width || 64;
            this.core.height = this.settings.height || 64;

            this.pool.call("onLoadTools", this.core.tools);

    		this.core.addFrame(0, false, true);
    		this.core.addLayer(false, true);

            if( this.data ) this.core.loadImage( arrayToBlobURL(this.data, this.__uid) );
            else if( this.path ) this.core.loadImage( this.path );
    		else this.core.push();

            var DOM = this.dialogue.DOM;
            DOM.stack.style.top = Math.round(this.dialogue.height*0.5 - this.core.height*0.5)+"px";
            DOM.stack.style.left = Math.round(this.dialogue.width*0.5 - this.core.width*0.5)+"px";
        }
    },

	layers:null,

	onUpdateLayers:function( layers, active ){
		this.layers = layers;
		DOC.removeChildren( this.DOM.stack );
		layers.forEach(l => {
			if( !l.enabled ) return;
			this.DOM.stack.appendChild( l.canvas );
			l.canvas.style.opacity = l.alpha;
			l.canvas.style.mixBlendMode = l.blend;
		});

		this.updateOnionSkins( this.core.frames );
	},

	updateOnionSkins:function( frames ){
		frames.forEach(frame => {
			if( !frame.composite ){
				console.warn("Missing frame composite!");
				return;
			}
			DOC.remove( frame.composite );
			if( frame != this.layers && frame.composite.canvas.style.display != "none" )
				this.DOM.stack.appendChild( frame.composite.canvas );
		});

		this.applyZoom();
	},

	onUpdateFrames:function( frames, layers ){
		if( this.layers != layers )
			this.onUpdateLayers( layers, this.core.activeLayer );
		else
			this.updateOnionSkins( frames );
	},

	onResize:function(){
		this.DOM.stack.style.top = Math.round(this.win.appWindow.innerBounds.height*0.5 - this.height*0.5)+"px";
		this.DOM.stack.style.left = Math.round(this.win.appWindow.innerBounds.width*0.5 - this.width*0.5)+"px";
	},

    $MENU:{
    	X:function(){
    		if( this.toolStack.length >= 2 ){
    			var current = this.toolStack.pop();
    			var next = this.toolStack.pop();
    			this.toolStack.push( current );
    			this.core.setTool( next );
    		}
    	},

        layerAbove:function(){
            var pos = this.core.layers.indexOf( this.core.activeLayer );
            pos = (pos+1) % this.core.layers.length;
            this.core.setLayer( this.core.layers[pos] );
        },

        layerBelow:function(){
            var pos = this.core.layers.indexOf( this.core.activeLayer );
            pos = pos-1;
            if( pos < 0 ) pos = this.core.layers.length - 1 + pos%this.core.layers.length;
            this.core.setLayer( this.core.layers[pos] );
        },

        nextFrame:function(){
            var pos = this.core.frames.indexOf( this.core.layers );
            pos = (pos+1) % this.core.frames.length;
            this.core.setFrame( this.core.frames[pos] );
        },

        prevFrame:function(){
            var pos = this.core.frames.indexOf( this.core.layers );
            pos = pos-1;
            if( pos < 0 ) pos = this.core.frames.length - 1 + pos%this.core.frames.length;
            this.core.setFrame( this.core.frames[pos] );
        },

        moveActiveLayerUp:function(){
            this.moveLayer( this.core.activeLayer, 1 );
        },

        moveActiveLayerDown:function(){
            this.moveLayer( this.core.activeLayer, -1 );
        },

    	undo:function(){
    		this.core.undo();
    	},

    	redo:function(){
    		this.core.redo();
    	},

        endHand:function(){
            if( this.core.activeTool != this.core.tools.Hand )
            return;
            if(this.core.activeTool.deactivate) this.core.activeTool.deactivate();
            this.toolStack.pop();
            this.core.activeTool = null;
            this.core.setTool( this.toolStack.pop() );
            this.dragging = null;
        },

        endDropper:function(){
            if( this.core.activeTool != this.core.tools.Dropper )
            return;
            if(this.core.activeTool.deactivate) this.core.activeTool.deactivate();
            this.toolStack.pop();
            this.core.activeTool = null;
            this.core.setTool( this.toolStack.pop() );
            this.dragging = null;
        },

        save:function(){
        	this.save();
        },

        saveAs:function(){
        	this.path = "";
        	this.save();
        }
    },

    save:function( path ){
		if( !this.core.layers.length )
            return false;

    	if( path ){
            if( path.target ) debugger;
			if( path.ext ) this.path = "sprite." + path.ext;
    		else this.path = path;
		}

		if( !this.path )
			return this.fileSaver.requestFormat([
				{ext:"png", name:""},
				{ext:"gif", name:""},
				{ext:"jpg", name:""}
			], this.save.bind(this))

		var ext = this.path.match(/\.([a-z]+)$/i);
		if( !ext ){
			if( this.core.frames.length > 1 ){
				this.path += ".gif";
				ext = "gif";
			}else{
				this.path += ".png";
				ext = "png";
			}
        }
        else ext = ext[1].toLowerCase();

		if( ext == "png" || ext == "jpeg" )
			this.saveJPNG(ext);
		else if( ext == "gif" )
			this.saveGIF();
    },

	saveGIF:function(){
		var gif = new GIF({
			workerScript:"js/gif.worker.js",
			width: this.core.width,
			height: this.core.height
		});

		var delay = 1000 / (this.core.fps || 1), THIS=this;

		this.core.frames.forEach(frame => {
			this.core.renderComposite( frame.composite, frame );
			gif.addFrame(frame.composite.canvas, {delay:delay});
		});

		gif.on('finished', function(blob, data){
			var acc = "";
			for( var i=0; i<data.length; ++i )
				acc += String.fromCharCode( data[i] );

			THIS.fileSaver.saveFile({
				name:THIS.path,
				data:acc
			});
		});

		gif.render();
	},

	saveJPNG:function(ext){
		if( this.core.frames.length == 1 ){
			this.fileSaver.saveFile({
				name:this.path,
				data:this.core.renderComposite().canvas.toDataURL("image/" + ext)
			});
			return;
		}

		var width = this.core.width, height = this.core.height;
		var outw = Math.sqrt( width * height * this.core.frames.length );
		var cols = Math.floor(outw / this.core.width);
		var rows = Math.ceil(this.core.frames.length / cols);
		var outh = rows * this.core.height;
		outw = cols * this.core.width;

		var comp = this.DOM.create("canvas", {width:outw, height:outh});
		DOC.remove(comp);
		var ctx = comp.getContext("2d");
		var arr = {};

		this.core.frames.forEach( (frame, i) => {
			var x = (i%cols)*width, y = Math.floor(i/cols)*height;
			this.core.renderComposite( frame.composite, frame );
			ctx.drawImage( frame.composite.canvas, x, y );
			arr[(frame.name || 'frame')+i] = {
				frame:{
					x:x,
					y:y,
					w:width,
					h:height
				},
				rotated:false,
				trimmed:false,
				spriteSourceSize:{
					x:0,
					y:0,
					w:width,
					h:height
				},
				sourceSize:{
					w:width,
					h:height
				}
			};
		} );

		this.fileSaver.saveFile([
			{
				name:this.path + ".json",
				data:JSON.stringify({frames:arr})
			},
			{
				name:this.path,
				data:comp.toDataURL("image/" + ext)
			}
		]);
	},

	clearToolHnd:0,
    onSetTool:function(tool){
		if( !tool ) return;

		this.toolStack.push( tool );

        if( this.toolStack.length > 3 ) this.toolStack.shift();

		this.DOM.activeTool.textContent = DOC.TEXT( tool.constructor.NAME || tool.constructor.name );
		this.DOM.activeTool.style.display = "initial";

		if( this.clearToolHnd ) clearTimeout( this.clearToolHnd );
		this.clearToolHnd = setTimeout(() => this.DOM.activeTool.style.display = "none", 2000);
    },

	setReference:function(path){
        if( path ) this.DOM.stack.style.backgroundImage = path;
		else this.DOM.stack.style.backgroundImage = "";
		this.DOM.stack.style.backgroundSize = path ? "contain" : "initial";
	},

    moveLayer:function( layer, direction ){
        var pos = this.core.layers.indexOf(layer);
        var tpos = pos + direction;
        if( tpos < 0 || tpos >= this.core.layers.length ) return;
		this.core.setLayerIndex( layer, tpos );
    },

    addLayer:function( duplicate, noUndo ){
    	var current = this.core.activeLayer;
    	if( duplicate && !current ) return;

		this.core.addLayer( duplicate, noUndo );
    },


    dragging:null,
    dragOffsetX:0,
    dragOffsetY:0,
    dragDistance:0,


    startDrag:function(evt){
        this.dragging = evt.target;
        this.dragOffsetX = evt.pageX;
        this.dragOffsetY = evt.pageY;
    },

    drag:function(evt){
        if( evt.buttons == 0 || !this.dragging )
            return this.dragging = null;

        if( this.dragging == this.DOM.stack ){
            this.DOM.stack.style.left = (parseInt(this.DOM.stack.style.left||"0") + (evt.pageX - this.dragOffsetX)) + "px";
            this.DOM.stack.style.top  = (parseInt(this.DOM.stack.style.top||"0") + (evt.pageY - this.dragOffsetY)) + "px";
            this.dragOffsetX = evt.pageX;
            this.dragOffsetY = evt.pageY;
        }
    },

    applyZoom:function(){
        var zoom = this.zoom, transform = "scale(" + this.zoom + ")";
        Array.prototype.slice.call(this.DOM.stack.children).forEach( layer =>
            layer.style.transform = transform
        );

        this.core.selection.canvas.style.transform = transform;

        this.DOM.stack.style.width = this.core.width * zoom + "px";
        this.DOM.stack.style.height = this.core.height * zoom + "px";

		if( parseInt( this.DOM.stack.style.left ) + this.core.width * zoom < 0 )
			this.DOM.stack.style.left = "0px";

		if( parseInt( this.DOM.stack.style.top ) + this.core.height * zoom < 0 )
			this.DOM.stack.style.top = "0px";
    },

    getTouchCenter:function( list ){
        var x=0, y=0, pageX=0, pageY=0;

        for( var i=0; i<list.length; ++i ){
            x += list[i].pageX;
            y += list[i].pageY;
        }

        x /= list.length;
        y /= list.length;

        pageX = x;
        pageY = y;

        x = Math.round( (pageX - parseInt(this.DOM.stack.style.left) ) / this.zoom - 0.1 );
        y = Math.round( (pageY - parseInt(this.DOM.stack.style.top) ) / this.zoom - 0.1 );

        return {
            x:x,
            y:y,
            pageX:pageX,
            pageY:pageY
        };
    },

    runTool:function(evt, type){
        if( this.dragging || !this.core.activeTool || !this.core.activeLayer || !this.core.activeTool[type] )
            return;
		var ref = this.DOM.stack.getBoundingClientRect();
		ref.left += this.dialogue.window.scrollX;
		ref.top += this.dialogue.window.scrollY;

        var x = Math.floor( (evt.pageX - (ref.left||0)) / this.zoom );
        var y = Math.floor( (evt.pageY - (ref.top||0)) / this.zoom );

		var w = 1;
        if( evt.pointerType == "pen" ){
        	w = evt.pressure;
        	console.log(w);
        }

        if( this.core.activeTool[type]( this.core.activeLayer.data, x, y, w ) )
            this.core.activeLayer.redraw();
    },

	disableTool:false,

    $WINDOW:{
        mousewheel:function(evt){
            if( evt.wheelDelta > 0 ) this.zoom *= 2;
            else this.zoom *= 0.5;
            this.applyZoom();
			evt.preventDefault();
        },
        pointerdown:function(evt){
        	if( evt.pointerType != "pen" ) return;
            this.runTool(evt, "down");
			this.dragOffsetX = evt.pageX;
			this.dragOffsetY = evt.pageY;
			evt.preventDefault();
        },
        pointermove:function(evt){
        	if( evt.pointerType != "pen" ) return;
            this.runTool(evt, "move");
			this.dragOffsetX = evt.pageX;
			this.dragOffsetY = evt.pageY;
			evt.preventDefault();
        },
        pointerup:function(evt){
        	if( evt.pointerType != "pen" ) return;
            this.runTool(evt, "move");
			this.dragOffsetX = evt.pageX;
			this.dragOffsetY = evt.pageY;
			evt.preventDefault();
        },
        mousedown:function(evt){
            this.runTool(evt, "down");
			this.dragOffsetX = evt.pageX;
			this.dragOffsetY = evt.pageY;
        },
        mousemove:function(evt){
            if( evt.buttons != 0 )
                this.runTool(evt, "move");
            this.drag(evt);
        },
        mouseup:function(evt){
            this.dragging = null;
            this.runTool(evt, "up");
        },
        touchstart:function(evt){
            var center = this.getTouchCenter( evt.touches );
            this.dragOffsetX = center.pageX;
            this.dragOffsetY = center.pageY;

            if( evt.touches.length == 2 ){
                this.core.applySnapshot( this.core.historyId );
                this.dragDistance = distance( evt.touches[0].clientX, evt.touches[0].clientY, evt.touches[1].clientX, evt.touches[1].clientY );
                this.dragging = this.DOM.stack;
				this.disableTool = true;
            }else if( evt.touches.length == 1 ){
                this.runTool(evt.touches[0], "down");
				this.disableTool = false;
            }
            evt.preventDefault();
        },

        touchmove:function(evt){
            var center = this.getTouchCenter( evt.touches );

            if( evt.touches.length == 2 ){
                var d = distance( evt.touches[0].clientX, evt.touches[0].clientY, evt.touches[1].clientX, evt.touches[1].clientY );

                var oldZoom = this.zoom;
                this.zoom *= d / this.dragDistance;
                this.zoom = Math.min( 32, Math.max(1, this.zoom||1));

                this.dragOffsetX -= (this.core.width*oldZoom - this.core.width*this.zoom)/2;
                this.dragOffsetY -= (this.core.height*oldZoom - this.core.height*this.zoom)/2;

                this.DOM.stack.style.left = (parseInt(this.DOM.stack.style.left) + center.pageX - this.dragOffsetX) + "px";
                this.DOM.stack.style.top  = (parseInt(this.DOM.stack.style.top) +  center.pageY - this.dragOffsetY) + "px";
                this.applyZoom();
                this.dragDistance = d;
                evt.preventDefault();
            }else if( evt.touches.length == 1 && !this.disableTool ){
                this.runTool(evt.touches[0], "move");
            }
            this.dragOffsetX = center.pageX;
            this.dragOffsetY = center.pageY;
        },

        touchend:function(evt){
            if( !this.disableTool ) this.runTool( {pageX:this.dragOffsetX, pageY:this.dragOffsetY}, "up");
            this.dragging = null;
            evt.preventDefault();
        }
    }
});

});
