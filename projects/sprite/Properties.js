CLAZZ("projects.sprite.Properties", {
    INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:RESOLVE("settings.projects.sprite.Properties.dialogue")
        }),
        core:"core",
        pool:"Pool",
        parent:"parent"
    },

	layerEls:null,

    CONSTRUCTOR:function(){
		this.layerEls = [];
        this.pool.add(this);
    },

    // onSave:null,

    onLoad:function(){
        var area = this.dialogue.getAvailArea();
        this.dialogue.moveTo( area.width-this.dialogue.width, area.height-this.dialogue.height );
    },

	call:function(name){
		var args = Array.prototype.slice.call(arguments);
		args.unshift( this.pool );
		return this.pool.call.bind.apply( this.pool.call, args );
	},

	onLoadTools:function(tools){
		MAR.removeChildren( this.DOM.tools );

        this.DOM.create("div", {
            text:MAR.TEXT("Filters"),
            onclick:this.toggleView.bind(this, "filtersview")
        }, this.DOM.tools);

        this.DOM.create("div", {
            text:MAR.TEXT("Frames"),
            onclick:this.toggleView.bind(this, "framesview")
        }, this.DOM.tools);

		this.DOM.create("div", {
			text:MAR.TEXT("Reference"),
			onclick:this.toggleReference.bind(this)
		}, this.DOM.tools);

        this.DOM.create("span", this.DOM.tools, {text:MAR.TEXT("Brushes:"), className:"label"});

		var toolA = null, toolB = null, THAT=this;
		Object.sort(tools).forEach( (k) => {
            var tool = tools[k];

			if( !toolA ) toolA = tool;
			else if( !toolB ) toolB = tool;

            this.DOM.create("div", {
                text:MAR.TEXT(k),
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

		this.parent.toolStack = [toolB];
		this.pool.call("setTool", toolA);
	},

	onUpdateLayers:function( layers, active ){
		this.layerEls.forEach( l => MAR.remove(l) );
		if( !layers ){
			alert( (new Error()).stack );
			return;
		}
		if( active ){
			this.DOM.canvasWidth.value = this.parent.core.width;
			this.DOM.canvasHeight.value = this.parent.core.height;
		}
		layers.forEach( l =>{
			var el = this.createLayerElement(l);
			if( l == active ) this.onSetLayer( l, el );
		});
	},

    onClose:function(){
        this.win.hide();
    },

    toggleView:function(view){
		if( this.parent[view] )
			this.parent[view].toggleEnabled();
		else
			alert("view " + view + " not found.");
    },

	hasRef:false,
	toggleReference:function(){
		this.hasRef = !this.hasRef;
		var THIS=this;
		if( this.hasRef ){
			MAR.create("input", {
				type:"file",
				onchange:function(e){
					if( !e.target.files.length ) return;
					THIS.parent.setReference( e.target.files[0].path );
				}
			}).click();
		}else{
			THIS.parent.setReference();
		}
	},


    btnResample:{
        click:function(){
            this.pool.call("setCanvasSize",
                this.DOM.canvasWidth.value = parseInt(this.DOM.canvasWidth.value) || this.parent.width,
                this.DOM.canvasHeight.value = parseInt(this.DOM.canvasHeight.value) || this.parent.height,
				true
            );
        }
    },

    btnCrop:{
        click:function(){
            this.pool.call("setCanvasSize",
                this.DOM.canvasWidth.value = parseInt(this.DOM.canvasWidth.value) || this.parent.width,
                this.DOM.canvasHeight.value = parseInt(this.DOM.canvasHeight.value) || this.parent.height
            );
        }
    },

    canvasWidth:{
        change:function(){
			this.DOM.canvasWidth.value = parseInt(this.DOM.canvasWidth.value) || this.parent.width;
			this.DOM.canvasHeight.value = parseInt(this.DOM.canvasHeight.value) || this.parent.height;
        }
    },

    canvasHeight:{
        change:function(){
			this.DOM.canvasWidth.value = parseInt(this.DOM.canvasWidth.value) || this.parent.width;
			this.DOM.canvasHeight.value = parseInt(this.DOM.canvasHeight.value) || this.parent.height;
        }
    },

    createLayerElement:function( layer ){
        var el = MAR.create("div", { id: layer.__uid, before:this.DOM.layerList.firstChild }, [
            ["button", { text:"▲", className:"layerCtrl up", onclick:this.call("moveLayer", layer, 1) }],
            ["button", { text:"▼", className:"layerCtrl down", onclick:this.call("moveLayer", layer, -1)}],
            ["button", { text:layer.enabled ? "●" : "◌", className:"layerCtrl enabled", onclick:this.call("toggleLayer", layer)}],
            ["span", {
                text:MAR.TEXT(layer.name),
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

	onResize:function(w,h){
        this.properties.DOM.canvasWidth.value = this.width;
        this.properties.DOM.canvasHeight.value = this.height;
	},

	inpLayerName:{
		change:function( evt ){
			var layer = this.parent.core.activeLayer;
			if( layer ){
				layer.name = evt.target.value.trim() || "Layer";
				this.onUpdateLayers( this.parent.core.layers, layer );
			}
		}
	},

    inpLayerAlpha:{
        change:function(){
            this.call("setLayerAlpha", parseInt(this.DOM.inpLayerAlpha.value)/100 )();
            this.DOM.inpLayerAlphaLabel.textContent = this.DOM.inpLayerAlpha.value;
        }
    },

	layerBlending:{
		change:function(){
			this.call( "setLayerBlending", this.DOM.layerBlending.value )();
		}
	},

    btnAddLayer:{
        click:function(){
            this.parent.addLayer();
        }
    },

    btnDuplicateLayer:{
		click:function(){
			this.parent.addLayer(true);
		}
    },

    btnMergeLayer:{
		click:function(){
			this.call("mergeLayer")();
		}
    },

    btnFlatten:{
		click:function(){
			this.call("flattenLayers")();
		}
    }
});
