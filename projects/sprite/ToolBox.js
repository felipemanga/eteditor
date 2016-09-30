CLAZZ("projects.sprite.ToolBox", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:RESOLVE("settings.projects.sprite.ToolBox.dialogue")
        }),
        fileReader:"io.FileReader",
        core:"core",
        pool:"Pool",
        main:"main"
    },

    DOM:null,
	layerEls:null,

    CONSTRUCTOR:function(){
		this.layerEls = [];
        this.pool.add(this);
    },

    // onSave:null,
	$DIALOGUE:{
		load:function(){
            this.DOM = this.dialogue.DOM;
			var area = this.dialogue.getAvailArea();
			this.dialogue.moveTo(
                area.width-this.dialogue.width,
                area.height-this.dialogue.height-this.DOM.windowframeheader[0].clientHeight
            );
		}
	},

	call:function(name){
		var args = Array.prototype.slice.call(arguments);
		args.unshift( this.pool );
		return this.pool.call.bind.apply( this.pool.call, args );
	},

	onLoadTools:function(tools){
		DOC.removeChildren( this.DOM.tools );

        this.DOM.create("div", {
            text:DOC.TEXT("Filters"),
            onclick:this.toggleView("filtersview")
        }, this.DOM.tools);

        this.DOM.create("div", {
            text:DOC.TEXT("Frames"),
            onclick:this.toggleView("framesview")
        }, this.DOM.tools);

		this.DOM.create("div", {
			text:DOC.TEXT("Reference"),
			onclick:this.toggleReference.bind(this)
		}, this.DOM.tools);

        this.DOM.create("span", this.DOM.tools, {text:DOC.TEXT("Brushes:"), className:"label"});

		var toolA = null, toolB = null, THAT=this;
		Object.sort(tools).forEach( (k) => {
            var tool = tools[k];

			if( !toolA ) toolA = tool;
			else if( !toolB ) toolB = tool;

            this.DOM.create("div", {
                text:DOC.TEXT(k),
				id: "tool_" + k,
                onclick:this.call("setTool", tool)
            }, this.DOM.tools);

			var listener = {
					destroyToolListeners:function(){
						THAT.pool.remove(this);
					}
				};
			listener["start" + k] = this.call("setTool", tool);
            this.pool.add(listener);
		});

		this.main.toolStack = [toolB];
		this.pool.call("setTool", toolA);
	},

	onUpdateLayers:function( layers, active ){
		this.layerEls.forEach( l => DOC.remove(l) );
		if( !layers ){
			alert( (new Error()).stack );
			return;
		}
		if( active ){
			this.DOM.canvasWidth.value = this.core.width;
			this.DOM.canvasHeight.value = this.core.height;
		}
		layers.forEach( l =>{
			var el = this.createLayerElement(l);
			if( l == active ) this.onSetLayer( l, el );
		});
	},

    toggleView:function(view){
        return ()=>{
            if( this.main[view] )
                this.main[view].dialogue.toggleEnabled();
            else
                alert("view " + view + " not found.");
        };
    },

	prevBlobURL:null,
	hasRef:false,
	toggleReference:function(){
		this.hasRef = !this.hasRef;
		var THIS=this;
		if( this.hasRef ){
			DOC.create("input", {
				type:"file",
				onchange:function(e){
					if( !e.target.files.length ) return;
                    THIS.fileReader.readAsArrayBuffer(e.target.files[0], (data) => {
                    	if( THIS.prevBlobURL ) URL.revokeObjectURL( THIS.prevBlobURL );
                    	THIS.prevBlobURL = URL.createObjectURL( new Blob([data], {}) );
                        THIS.main.setReference( "url(" + THIS.prevBlobURL + ")" );
                    });
				}
			}).click();
		}else{
			THIS.main.setReference();
		}
	},


    $btnResample:{
        click:function(){
            this.pool.call("setCanvasSize",
                this.DOM.canvasWidth.value = parseInt(this.DOM.canvasWidth.value) || this.core.width,
                this.DOM.canvasHeight.value = parseInt(this.DOM.canvasHeight.value) || this.core.height,
				true
            );
        }
    },

    $btnCrop:{
        click:function(){
            this.pool.call("setCanvasSize",
                this.DOM.canvasWidth.value = parseInt(this.DOM.canvasWidth.value) || this.core.width,
                this.DOM.canvasHeight.value = parseInt(this.DOM.canvasHeight.value) || this.core.height
            );
        }
    },

    $canvasWidth:{
        change:function(){
			this.DOM.canvasWidth.value = parseInt(this.DOM.canvasWidth.value) || this.core.width;
			this.DOM.canvasHeight.value = parseInt(this.DOM.canvasHeight.value) || this.core.height;
        }
    },

    $canvasHeight:{
        change:function(){
			this.DOM.canvasWidth.value = parseInt(this.DOM.canvasWidth.value) || this.core.width;
			this.DOM.canvasHeight.value = parseInt(this.DOM.canvasHeight.value) || this.core.height;
        }
    },

    createLayerElement:function( layer ){
        var el = DOC.create("div", { id: layer.__uid, before:this.DOM.layerList.firstChild }, [
            ["button", { text:"▲", className:"layerCtrl up", onclick:this.call("moveLayer", layer, 1) }],
            ["button", { text:"▼", className:"layerCtrl down", onclick:this.call("moveLayer", layer, -1)}],
            ["button", { text:layer.enabled ? "●" : "◌", className:"layerCtrl enabled", onclick:this.call("toggleLayer", layer)}],
            ["span", {
                text:DOC.TEXT(layer.name),
                className:"layerLabel",
                onclick:this.call("setLayer", layer)
            }],
            ["button", { text:"†", className:"layerCtrl remove", onclick:this.call("removeLayer", layer) }]
        ]);

		this.layerEls.push(el);
		return el;
    },

	onSetTool:function(tool){
		var id = "#tool_"+(tool && tool.constructor.NAME);
		tool = this.DOM.tools.querySelector(id);
		var oldTool = this.DOM.tools.querySelector(".active");
		if( oldTool ) oldTool.className = "";
		if( tool ) tool.className = "active";
	},

    onSetLayer:function(layer, el){
		el.className = "active";
		this.DOM.inpLayerName.value = layer.name;

		var blending = layer.canvas.style.mixBlendMode || "normal";
		this.DOM.layerBlending.value = blending;

		var alpha = parseFloat(layer.canvas.style.opacity);
		if( isNaN(alpha) ) alpha = 1;
		this.DOM.inpLayerAlpha.value = alpha*100;
		this.DOM.inpLayerAlphaLabel.textContent = this.DOM.inpLayerAlpha.value;
    },

    onSelectRect:function(x,y,w,h){
        if( w == 0 || h == 0 ){
            w = this.core.width;
            h = this.core.height;
        }
        this.DOM.canvasWidth.value = w;
        this.DOM.canvasHeight.value = h;
    },

	onResize:function(w,h){
        debugger;
        this.DOM.canvasWidth.value = this.width;
        this.DOM.canvasHeight.value = this.height;
	},

	$inpLayerName:{
		change:function( evt ){
			var layer = this.core.activeLayer;
			if( layer ){
				layer.name = evt.target.value.trim() || "Layer";
				this.onUpdateLayers( this.core.layers, layer );
			}
		}
	},

    $inpLayerAlpha:{
        change:function(){
            this.call("setLayerAlpha", parseInt(this.DOM.inpLayerAlpha.value)/100 )();
            this.DOM.inpLayerAlphaLabel.textContent = this.DOM.inpLayerAlpha.value;
        }
    },

	$layerBlending:{
		change:function(){
			this.call( "setLayerBlending", this.DOM.layerBlending.value )();
		}
	},

    $btnAddLayer:{
        click:function(){
            this.core.addLayer();
        }
    },

    $btnDuplicateLayer:{
		click:function(){
			this.core.addLayer(true);
		}
    },

    $btnMergeLayer:{
		click:function(){
			this.call("mergeLayer")();
		}
    },

    $btnFlatten:{
		click:function(){
			this.call("flattenLayers")();
		}
    }
});
