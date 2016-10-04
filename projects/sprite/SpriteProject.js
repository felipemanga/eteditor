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
        fileReader:"io.FileReader",

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
    },

    pasteFile:function(file, cb){
        var url = URL.createObjectURL(file, {});
        this.core.loadImage(url, (layer)=>{
            URL.revokeObjectURL(url);
            if(cb) cb();
        }, true);
    },

    pasteLink:function(cb, url){
        this.core.loadImage(url, (layer)=>{
            if(cb) cb();
        }, true);
    },

    $DIALOGUE:{
        cut:function(evt){
            var out = this.core.extract();
            var data = out.canvas.toDataURL("image/png");
            data = data.replace(/[^,]+,/, "");
            data = arrayToBlobURL(atob(data), 'clipboard', {type:"image/png"});
            evt.clipboardData.setData('text/plain', data);
            evt.preventDefault();
            this.core.clearLayer();
            this.core.activeLayer.redraw();
            this.core.push();
            this.pool.call("selectNone");
        },

        copy:function(evt){
            var out = this.core.extract();
            var data = out.canvas.toDataURL("image/png");
            data = data.replace(/[^,]+,/, "");
            data = arrayToBlobURL(atob(data), 'clipboard', {type:"image/png"});
            evt.clipboardData.setData('text/plain', data);
            evt.preventDefault();
        },

        paste:function(evt){
            var items = evt.clipboardData.items, i=0, next = ()=>{
                if(i>=items.length) return;
                var item = items[i++];
                if( item.kind == "file" && item.type.startsWith("image/") )
                    this.pasteFile( item.getAsFile(), next );
                else if( item.kind == "string" && item.type.startsWith("text/plain") )
                    item.getAsString( this.pasteLink.bind(this, next) );
                else next();
            };
            next();
            this.core.push();
        },

        maximized:function(){
            this.zoom = 1;
            this.zoomFit();
        },
        load:function(){
            this.toolStack = [];
            this.DOM = this.dialogue.DOM;
            this.core.DOM = this.dialogue.DOM;
            this.core.width = this.settings.width || 64;
            this.core.height = this.settings.height || 64;

            this.core.loadTools( projects.sprite.tools );
            this.pool.call("onLoadTools", this.core.tools);

    		this.core.addFrame(0, false, true);
    		this.core.addLayer(false, true);

            var DOM = this.dialogue.DOM;
            DOM.stack.style.top = Math.round(this.dialogue.height*0.5 - this.core.height*0.5)+"px";
            DOM.stack.style.left = Math.round(this.dialogue.width*0.5 - this.core.width*0.5)+"px";

            if( this.data ) this.core.loadImage( arrayToBlobURL(this.data, this.__uid) );
            else if( this.path ) this.core.loadImage( this.path );
    		else{
                this.core.push();
                this.onResizeCanvas();
            }
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

        this.core.overlays.forEach((o) => this.DOM.stack.appendChild( o.canvas ));
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

        dupLayer:function(){
            this.core.addLayer(true);
        },

        toggleActiveLayer:function(){
            this.core.toggleLayer(this.core.activeLayer);
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

        mergeActiveLayerUp:function(){
            var pos = this.core.layers.indexOf( this.core.activeLayer );
            if( pos == this.core.layers.length-1 ) return;
            pos = (pos+1) % this.core.layers.length;
            this.core.setLayer( this.core.layers[pos] );
            this.core.mergeLayer();
        },

        mergeActiveLayerDown:function(){
            this.core.mergeLayer();
        },

        zoomIn:function(){
            this.zoom *= 2;
            this.applyZoom();
        },

        zoomOut:function(){
            this.zoom *= 0.5;
            this.applyZoom();
        },

        zoom100:function(){
            this.zoom = 1;
            this.applyZoom();
        },

        zoomFit:function(){
            this.zoomFit();
        },

    	undo:function(){
    		this.core.undo();
    	},

    	redo:function(){
    		this.core.redo();
    	},

        endMove:function(){
            if( this.core.activeTool != this.core.tools.Move ) return;
            if(this.core.activeTool.deactivate) this.core.activeTool.deactivate();
            this.toolStack.pop();
            this.core.activeTool = null;
            this.core.setTool( this.toolStack.pop() );
            this.dragging = null;
        },

        endHand:function(){
            if( this.core.activeTool != this.core.tools.Hand ) return;
            if(this.core.activeTool.deactivate) this.core.activeTool.deactivate();
            this.toolStack.pop();
            this.core.activeTool = null;
            this.core.setTool( this.toolStack.pop() );
            this.dragging = null;
        },

        endDropper:function(){
            if( this.core.activeTool != this.core.tools.Dropper ) return;
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

        if( ext == "jpg" ) ext = "jpeg";

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
            frame.composite.clear();
			this.core.renderComposite( frame.composite, frame );
			gif.addFrame(frame.composite.canvas, {delay:delay});
		});

		gif.on('finished', function(blob, data){
			THIS.fileSaver.saveFile({
				name:THIS.path,
				data:new Blob([data.buffer])
			});
		});

		gif.render();
	},

	saveJPNG:function(ext){
		if( this.core.frames.length == 1 ){
            this.core.getComposite().clear();
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
            frame.composite.clear();
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
        if( this.dragging != this.DOM.stack ) return;
        this.DOM.stack.style.left = (parseInt(this.DOM.stack.style.left||"0") + (evt.x - this.dragOffsetX)) + "px";
        this.DOM.stack.style.top  = (parseInt(this.DOM.stack.style.top||"0") + (evt.y - this.dragOffsetY)) + "px";
        this.dragOffsetX = evt.x;
        this.dragOffsetY = evt.y;
    },

    onResizeCanvas:function(){
        this.zoom = 1;
        this.zoomFit();
    },

    zoomFit:function(){
        if( this.zoom == 1 ){
            this.zoom = Math.min(
                this.dialogue.width * 0.98 / this.core.width,
                (this.dialogue.height-40) / this.core.height
            );
        }else this.zoom = 1;
        this.applyZoom();

        var style  = this.DOM.stack.style;
        style.left = (this.dialogue.width*0.5  - (this.core.width  * this.zoom * 0.5)) + "px"
        style.top  = (this.dialogue.height*0.5 - (this.core.height * this.zoom * 0.5)) + "px"
    },

    applyZoom:function(){
        var zoom = this.zoom, transform = "scale(" + this.zoom + ")";
        this.core.redrawGridOverlay(this.zoom);
        
        this.core.layers.forEach( layer =>
            layer.canvas.style.transform = transform
        );

        var grid = this.core.gridOverlay;
        this.core.overlays.forEach((o)=>
            o.canvas.style.transform = o==grid? "scale(1)" : transform
        );
        
        this.DOM.stack.style.width = this.core.width * zoom + "px";
        this.DOM.stack.style.height = this.core.height * zoom + "px";

		if( parseInt( this.DOM.stack.style.left ) + this.core.width * zoom < 0 )
			this.DOM.stack.style.left = "0px";

		if( parseInt( this.DOM.stack.style.top ) + this.core.height * zoom < 0 )
			this.DOM.stack.style.top = "0px";
    },

    runTool:function( type ){
        if( this.dragging || !this.core.activeTool || !this.core.activeLayer || !this.core.activeTool[type] )
            return;

        var evt = this.coord;
		var ref = this.DOM.stack.getBoundingClientRect();
		ref.left += this.dialogue.window.scrollX;
		ref.top += this.dialogue.window.scrollY;

        var x = Math.floor( (evt.x - (ref.left||0)) / this.zoom );
        var y = Math.floor( (evt.y - (ref.top||0)) / this.zoom );

        if( this.core.activeTool[type]( this.core.activeLayer.data, x, y, evt.pressure ) )
            this.core.activeLayer.redraw();
    },

	disableTool:true,
    coord:null,
    prepareEvent:function(evt, type){
        /*
        var target = evt.target;
        var root = this.DOM.BODY;
        while( target ){
            if( target == root ) break;
            if( target == this.DOM.__ROOT__ ) return true;
            target = target.parent;
        }
        if( !target ) return true;
        */

        var coord = this.coord;
        if( !coord ) coord = this.coord = {
            x:0,
            y:0,
            pressure:0.5,
            touches:{},
            touchCount:0,
            scale:1,
            refDistance:0,
            isDragStart:false,
            distance:0
        };

        if( type != "pointer" ){
            if( evt.type.indexOf("down") == -1 ) evt.preventDefault();
            if( window.PointerEvent ) return true;
        }

        var touches = coord.touches, oldTouchCount = coord.touchCount;

        if( evt.pointerType == "touch" ){
            if( evt.type == "pointerleave" || evt.type == "pointerup" )
                touches = coord.touches = {};// delete touches[evt.pointerId];
            else
                touches[ evt.pointerId ] = evt;

            var keys = Object.keys(touches), count = keys.length;
            coord.touchCount = keys.length;
        }else coord.touchCount = 0;

        var pageCoord = evt;
        if( evt.touches ){
            touches = coord.touches = {};
            keys = [];
            for( var i=0; i<evt.touches.length; ++i ){
                touches[i] = evt.touches[i];
                keys[i] = i;
            }
            pageCoord = evt.touches[0];
            count = coord.touchCount = evt.touches.length;
        }
        // if( evt.type != "pointermove" ) console.log(evt.type, evt.pointerId, evt.buttons, keys);

        if( coord.touchCount == 2 ){
            var x=0, y=0, pageX=0, pageY=0;

            for( var k in touches ){
                x += touches[k].pageX;
                y += touches[k].pageY;
            }

            x /= count;
            y /= count;
            coord.touchCount = count;
            coord.pressure = 1;
            coord.x = x;
            coord.y = y;
            var curDist = distance(
                touches[keys[0]].pageX,
                touches[keys[0]].pageY,
                touches[keys[1]].pageX,
                touches[keys[1]].pageY
            );

            coord.isDragStart = oldTouchCount == 1;
            if( oldTouchCount == 1 ) coord.scale = 1;
            else coord.scale = (curDist / coord.distance) || 1;
            coord.distance = curDist;
        }else{
            if( !pageCoord ){
                pageCoord = {
                    pageX: this.dragOffsetX,
                    pageY: this.dragOffsetY
                };
            }
            coord.x = pageCoord.pageX;
            coord.y = pageCoord.pageY;
            if( type == "pointer" && evt.pointerType == "pen" ) coord.pressure = evt.pressure;
            else if( evt.buttons || evt.touches ) coord.pressure = 1;
            else coord.pressure = 0;
            coord.scale = 1;
            coord.distance = 0;
            coord.isDragStart = false;
        }

        return window.PointerEvent && type != "pointer"
    },

    pointerdown:function(evt, type){
        if( this.prepareEvent(evt, type) ) return false;
        this.disableTool = this.coord.isDragStart;
        if( this.coord.isDragStart ){
            this.core.applySnapshot( this.core.historyId );
            this.dragging = this.DOM.stack;
            this.disableTool = true;
        }else this.runTool("down");
        this.dragOffsetX = this.coord.x;
        this.dragOffsetY = this.coord.y;
    },

    pointermove:function(evt, type){
        if( this.prepareEvent(evt, type) ) return false;
        if( this.dragging || this.coord.touchCount == 2 ){
            this.drag(this.coord);
            this.zoom *= this.coord.scale;
            this.applyZoom();
        }else if( !this.disableTool ){
	        this.runTool("move");
        }
		this.runTool("over");
        this.dragOffsetX = this.coord.x;
        this.dragOffsetY = this.coord.y;
    },

    pointerup:function(evt, type){
        if( this.prepareEvent(evt, type) ) return false;
        if( !this.disableTool ){
            this.runTool("up");
            this.runTool("out");
        }
        this.disableTool = true;
        this.dragging = null;
        this.dragOffsetX = this.coord.x;
        this.dragOffsetY = this.coord.y;
    },

    pointerout:function(evt, type){
        if( this.prepareEvent(evt, type) ) return false;
        this.runTool("out");
    },

    $BODY:{
        mousewheel:function(evt){
            if( evt.wheelDelta > 0 ) this.zoom *= 2;
            else this.zoom *= 0.5;
            this.applyZoom();
			evt.preventDefault();
        },
        pointerdown:function(evt){
            return this.pointerdown(evt, "pointer");
        },
        pointermove:function(evt){
            return this.pointermove(evt, "pointer");
        },
        pointerup:function(evt){
            return this.pointerup(evt, "pointer");
        },
        pointerleave:function(evt){
            return this.pointerup(evt, "pointer");
            // this.prepareEvent(evt, "pointer");
        },
        pointerout:function(evt){
            return this.pointerout(evt, "pointer");
        },
        mousedown:function(evt){
            return this.pointerdown(evt, "mouse");
        },
        mousemove:function(evt){
            return this.pointermove(evt, "mouse");
        },
        mouseup:function(evt){
            return this.pointerup(evt, "mouse");
        },
        mouseout:function(evt){
            return this.pointerout(evt, "mouse");
        },
        touchstart:function(evt){
            return this.pointerdown(evt, "touch");

            if( window.PointerEvent ) return;
            this.log(evt);
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
            return this.pointermove(evt, "touch");

            if( window.PointerEvent ) return;
            this.log(evt);
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
            return this.pointerup(evt, "touch");

            if( window.PointerEvent ) return;
            this.log(evt);
            if( !this.disableTool ) this.runTool( {pageX:this.dragOffsetX, pageY:this.dragOffsetY}, "up");
            this.dragging = null;
            evt.preventDefault();
        }
    }
});

});
