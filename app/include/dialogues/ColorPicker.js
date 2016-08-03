CLAZZ("dialogues.ColorPicker", {
    EXTENDS:"Dialogue",

    color:null,
    tmpColor:null,
    ctx:null,
    data:null,

    menu:[
        "load"
    ],

    STATIC:{
        HEIGHT:500,
        WIDTH: 400
    },

    CONSTRUCTOR:function( parent ){
        SUPER({
            height:dialogues.ColorPicker.HEIGHT, 
            width:dialogues.ColorPicker.WIDTH, 
            resizable:false, 
            show:false, 
            always_on_top:true 
        }, parent);

        if( !dialogues.ColorPicker.color ){
            dialogues.ColorPicker.color = new Color();
            dialogues.ColorPicker.color.a = 0xFF;
        }
        this.color = dialogues.ColorPicker.color;
        this.tmpColor = new Color();
    },

    close:function(){
        SUPER();
        dialogues.ColorPicker.instance = null;
    },

    // not a child, but toggle anyway
    onToggleMenu:function(visible){
        if( visible ) this.show();
        else this.hide();
    },

    onLoad:function(){
        if( main.screenWidth > main.screenHeight )
            this.win.moveTo( main.screenWidth-this.win.appWindow.outerBounds.width, 0 );
        else
            this.win.moveTo( main.win.appWindow.outerBounds.width, main.screenHeight-this.win.appWindow.outerBounds.height );

        this.ctx = this.DOM.CANVAS.getContext("2d");
        this.data = this.ctx.getImageData( 0, 0, this.DOM.CANVAS.width, this.DOM.CANVAS.height );
        this.loadPalette();
    },

    loadPalette:function(){
        var path = main.settings.colorPickerPalette || "";
        var ext;
        try{
            ext = path.match(/\.([a-z]+)$/i);
            ext = ext && ext[1].toLowerCase();
        }catch(ex){
            console.warn(ex);
        }

        switch( ext ){
        case "asc": this.loadAdobeAsc( fs.readFileSync(path) ); break;

        case "pal": this.loadJascPal( fs.readFileSync(path, "utf-8") ); break;

        case "jpg":
        case "jpeg":
        case "png":
            MAR.create("img", {
                src: path,
                onload: this.loadImagePal.bind(this),
                onerror: this.loadColorWheel.bind(this)
            });
            break;

        default: this.loadColorWheel(); break;
        }
    },

    loadColorArray:function( arr ){
        var m = this.data.data;
        var x, y, w=this.data.width, h=this.data.height, r, g, b, color;
        var cells = Math.ceil( Math.sqrt(arr.length) );
        var cellSize = w/cells, cell=0;

        for( var cy=0; cy<cells; ++cy ){
            for( var cx=0; cx<cells; ++cx, ++cell ){
                color = arr[ cell ] || [0,0,0,0];
                for( y=0; y<cellSize; ++y ){
                    var oy = (y+cy*cellSize)*w;
                    for( x=0; x<cellSize; ++x ){
                        var i = (oy+x+cx*cellSize)*4;
                        m[i  ] = color[0];
                        m[i+1] = color[1];
                        m[i+2] = color[2];
                        m[i+3] = 0xFF;
                    }
                }
            }
        }

        this.ctx.putImageData( this.data, 0, 0 );
    },

    loadAdobeAsc:function( asc ){

    },

    loadJascPal:function( pal ){
        if( !/^JASC-PAL/i.test(pal) ){
            alert("Not a valid Jasc Palette file!");
            return this.loadColorWheel();
        }

        pal = pal.split(/\s*?\n\s*/g);
        var version = pal[1], length = parseInt(pal[2]);

        if( version != "0100" ){
            alert("Not a valid Jasc Palette file!");
            return this.loadColorWheel();
        }

        pal = pal.slice( 3, length+3 ).map( s => s.split(" ").map( n => parseInt(n) ) );

        this.loadColorArray(pal);    
    }, 

    loadImagePal:function( evt ){
        var img = evt.target;
        this.ctx.drawImage( img, 0, 0, this.data.width, this.data.height );
        this.data = this.ctx.getImageData( 0, 0, this.data.width, this.data.height );
    },

    loadColorWheel:function(){
        var m = this.data.data;
        var x, y, w=this.data.width, h=this.data.height, r, g, b, color = this.tmpColor;

        for( y=0; y<h; ++y ){
            var ry = h*0.5-y;
            for( x=0; x<w; ++x ){
                var rx = w*0.5-x;
                color.fromHSV( 
                    Math.atan2(rx, ry)/(Math.PI*2)+0.5, 
                    Math.max(0, Math.min(1, Math.sqrt( rx*rx + ry*ry )/(w*0.5) )), 
                    (this.DOM.lumSlider.value/100.0)||0
                );
                m[(y*w+x)*4  ] = color.r;
                m[(y*w+x)*4+1] = color.g;
                m[(y*w+x)*4+2] = color.b;
                m[(y*w+x)*4+3] = 0xFF;
            }
        }

        this.ctx.putImageData( this.data, 0, 0 );
    },

    sample:function(x, y){
        var c = dialogues.ColorPicker.color;
        c.fromData( this.data, x, y );
        this.DOM.fieldR.value = c.r;
        this.DOM.fieldG.value = c.g;
        this.DOM.fieldB.value = c.b;
        this.DOM.fieldA.value = c.a;
        var hex = this.DOM.fieldHex.value = c.toHex();
        this.DOM.BODY.style.backgroundColor = "#" + hex;
    },

    CANVAS:{
        mousedown:function(evt){
            this.sample(evt.offsetX, evt.offsetY);
        },
        touchdown:function(evt){
            this.sample(evt.offsetX, evt.offsetY);
        }
    },

    lumSlider:{
        change:function(){
            this.loadColorWheel();
        }
    },

    load:function(){
        this.DOM.filePicker.click();
    },

    filePicker:{
        change:function( evt ){
            if( !this.DOM.filePicker.files.length ) return;
            main.settings.colorPickerPalette = this.DOM.filePicker.files[0].path;
            this.loadPalette();
        }
    }
});