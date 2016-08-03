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
		
		this.el = MAR.create(
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
		
		this.dom = MAR.index( this.el, null, this );
	},
	
	frameIndicator:{
		click:function(){
			this.ctrl.pool.call("setFrame", this.frame, true);
		}
	},
	
	onionSkinIndicator:{
		click:function(){
			if( this.frame.composite.canvas.style.display == "none" )
				this.frame.composite.canvas.style.display = "block";
			else
				this.frame.composite.canvas.style.display = "none";
			
			this.dom.onionSkinIndicator[0].textContent = ( this.frame.composite.canvas.style.display == "none" ? "ʘ" : "֍" );
			this.ctrl.pool.call("renderComposite", this.frame.composite, this.frame );
			this.ctrl.pool.call("updateOnionSkins", this.ctrl.frames);
		}
	},
	
	purgeFrames:function(){
		this.ctrl.pool.remove(this);
		MAR.remove(this.el);
	}
});
	
CLAZZ("projects.sprite.Frames", {
	EXTENDS:"Dialogue",
	frames:null,
	current:null,
	hnd:-1,
	context:null,
	
	CONSTRUCTOR:function( parent ){
		SUPER({
			show:false,
			width:600,
			height:235,
			always_on_top: true,
			title:"Frames"
		}, parent);
	},
	
	onLoad:function(){
		this.win.moveTo(210, 50);
		this.context = this.DOM.cnvPreview.getContext('2d');
	},
	
	onUpdateFrames:function( frames, current ){
		this.DOM.inpFrameRate.value = this.parent.core.fps;

		this.pool.call("purgeFrames");
		this.current = current;
		this.frames = frames;
		frames.forEach( frame => new FrameElement(this, frame) );

		var core = this.parent.core;
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
		
		var core = this.parent.core;
		this.frames.forEach( frame => core.renderComposite( frame.composite, frame ) );
		this.DOM.cnvPreview.width = core.width;
		this.DOM.cnvPreview.height = core.height;
		this.hnd = setInterval(this.previewNextFrame.bind(this), 1000/(this.parent.core.fps||1) );
		this.previewNextFrame();
	},
	
	check:function(){
		if( this.hnd != -1 ) this.play();
		else{
			this.previewPos = this.frames.indexOf( this.current ) - 1;
			this.parent.core.renderComposite( this.current.composite, this.current );
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
		
		var core = this.parent.core;
		this.context.clearRect(0, 0, core.width, core.height);
		this.context.drawImage( this.frames[pos].composite.canvas, 0, 0 );
	},
	
	btnTogglePlay:{
		click:function(){
			if( this.hnd != -1 ) this.stop();
			else this.play();
		}
	},
	
	inpFrameRate:{
		change:function(){
			var fps = parseInt(this.DOM.inpFrameRate.value)||1;
			this.DOM.inpFrameRate.value = fps;
			this.parent.core.fps = fps;
			this.check();
		}
	},

	btnAddFrame:{
		click:function(){
			this.pool.call("addFrame", this.frames.indexOf(this.current)+1, false );
		}
	},
	
	dupFrame:function(){
		this.pool.call("addFrame", this.frames.indexOf(this.current)+1, true );
	},
	
	btnDupFrame:{
		click:function(){
			this.dupFrame();
		}
	},
	
	btnDelFrame:{
		click:function(){
			this.pool.call("removeFrame", this.current);
		}
	}
});

})();