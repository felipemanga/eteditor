(function(){

var FrameElement = CLAZZ({
	el:null,
	dom:null,
	ctrl:null,
	frame:null,

	CONSTRUCTOR:function(ctrl, frame){
		this.ctrl = ctrl;
		this.frame = frame;

		ctrl.pool.add(this);

		this.el = DOC.create(
			"div",
			ctrl.DOM.frames,
			{className:"frameElement" + (frame == ctrl.current?" active":"")},
			[
				["div", {className:"frameIndicator", text:(frame == ctrl.current?"▼":"▬")}]
			].concat(
			frame.map( layer => [
				"div",
				{className:"frameLayerElement", text:"*"}
			]),
			[
				["div", {
					className:"onionSkinIndicator",
					text:( frame.composite.canvas.style.display == "none" ? "ʘ" : "֍" )
				}]
			])
		);

		this.dom = DOC.index( this.el, null, this );
	},

	$frameIndicator:{
		click:function(){
			this.ctrl.pool.call("setFrame", this.frame, true);
		}
	},

	$onionSkinIndicator:{
		click:function(){
			if( this.frame.composite.canvas.style.display == "none" )
				this.frame.composite.canvas.style.display = "block";
			else
				this.frame.composite.canvas.style.display = "none";

			this.dom.onionSkinIndicator[0].textContent = ( this.frame.composite.canvas.style.display == "none" ? "ʘ" : "֍" );
			this.frame.composite.clear();
			this.ctrl.pool.call("renderComposite", this.frame.composite, this.frame );
			this.ctrl.pool.call("updateOnionSkins", this.ctrl.frames);
		}
	},

	purgeFrames:function(){
		this.ctrl.pool.remove(this);
		DOC.remove(this.el);
	}
});

CLAZZ("projects.sprite.Frames", {
	INJECT:{
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:RESOLVE("settings.projects.sprite.Frames.dialogue")
        }),
		core:"core",
		pool:"Pool"
	},

	frames:null,
	current:null,
	hnd:-1,
	context:null,
	DOM:null,

	CONSTRUCTOR:function(){
		this.pool.add(this);
	},

	$DIALOGUE:{
		load:function(){
			this.DOM = this.dialogue.DOM;
			this.dialogue.moveTo(210, 50);
			this.context = this.dialogue.DOM.cnvPreview.getContext('2d');
		}
	},

	onUpdateFrames:function( frames, current ){
		this.DOM.inpFrameRate.value = this.core.fps;
		this.pool.call("purgeFrames");
		this.current = current;
		this.frames = frames;
		frames.forEach( frame => new FrameElement(this, frame) );

		var core = this.core;
		this.DOM.cnvPreview.width = core.width;
		this.DOM.cnvPreview.height = core.height;

		this.check();
	},

	onFocus:function(){
		this.check();
	},

	stop:function(){
		if( this.hnd != -1 ){
			clearInterval( this.hnd );
			this.hnd = -1;
			return;
		}
	},

	play:function(){
		if( this.hnd != -1 ) this.stop();

		var core = this.core;
		this.frames.forEach( frame =>{
			frame.composite.clear();
			core.renderComposite( frame.composite, frame ); 
		});

		this.DOM.cnvPreview.width = core.width;
		this.DOM.cnvPreview.height = core.height;
		this.hnd = setInterval(this.previewNextFrame.bind(this), 1000/(this.core.fps||1) );
		this.previewNextFrame();
	},

	check:function(){
		if( this.hnd != -1 ) this.play();
		else{
			this.previewPos = this.frames.indexOf( this.current ) - 1;
			this.current.composite.clear();
			this.core.renderComposite( this.current.composite, this.current );
			this.previewNextFrame();
		}
	},

	previewPos:-1,

	previewNextFrame:function(pos){
		if( !this.frames || !this.frames.length ) return;

		if( pos === undefined ) pos = this.previewPos + 1;
		pos = pos % this.frames.length;

		if( this.previewPos == pos ) return;

		this.previewPos = pos;

		var core = this.core;
		this.context.clearRect(0, 0, core.width, core.height);
		this.context.drawImage( this.frames[pos].composite.canvas, 0, 0 );
	},

	$btnTogglePlay:{
		click:function(){
			if( this.hnd != -1 ) this.stop();
			else this.play();
		}
	},

	$inpFrameRate:{
		change:function(){
			var fps = parseInt(this.DOM.inpFrameRate.value)||1;
			this.DOM.inpFrameRate.value = fps;
			this.core.fps = fps;
			this.check();
		}
	},

	$btnAddFrame:{
		click:function(){
			this.pool.call("addFrame", this.frames.indexOf(this.current)+1, false );
		}
	},

	dupFrame:function(){
		this.pool.call("addFrame", this.frames.indexOf(this.current)+1, true );
	},

	$btnDupFrame:{
		click:function(){
			this.dupFrame();
		}
	},

	$btnDelFrame:{
		click:function(){
			this.pool.call("removeFrame", this.current);
		}
	}
});

})();
