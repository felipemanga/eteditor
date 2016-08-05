CLAZZ("popups.colorpicker.ColorPicker", {
    PROVIDES:{
        "popups.colorpicker.IColorPicker":"singleton"
    },

    INJECT:{
        color:"PrimaryColor",
        tmpColor:"Color",
        settings:RESOLVE("settings.popups.colorpicker"),
        dialogue:INJECT("dialogues.IDialogue", {
            controller:INJECT("this"),
            cfg:{
                menu:{
                    "load":{}
                },
                width:400,
                height:500,
                resizable:false,
                show:false,
                always_on_top:true,
                hide_only:true
            }
        })
    },

    ctx:null,
    data:null,
    DOM:null,

    $DIALOGUE:{
        load:function(){
            this.DOM = this.dialogue.DOM;
            var area = this.dialogue.getAvailArea();
            if( area.width > area.height )
                this.dialogue.moveTo( area.width-this.dialogue.width, 0 );
            else
                this.dialogue.moveTo( 200, area.height-this.height );

            this.ctx = this.DOM.CANVAS.getContext("2d");
            this.data = this.ctx.getImageData( 0, 0, this.DOM.CANVAS.width, this.DOM.CANVAS.height );
            this.loadPalette();
        },

        // not a child, but toggle anyway
        toggleMenu:function(visible){
            if( visible ) this.dialogue.show();
            else this.dialogue.hide();
        },
    },

    loadPalette:function(){
        var path = this.settings.palette || "";
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
            DOC.create("img", {
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
        var c = this.color;
        c.fromData( this.data, x, y );
        this.DOM.fieldR.value = c.r;
        this.DOM.fieldG.value = c.g;
        this.DOM.fieldB.value = c.b;
        this.DOM.fieldA.value = c.a;
        var hex = this.DOM.fieldHex.value = c.toHex();
        this.DOM.BODY.style.backgroundColor = "#" + hex;
    },

    $CANVAS:{
        mousedown:function(evt){
            this.sample(evt.offsetX, evt.offsetY);
        },
        touchdown:function(evt){
            this.sample(evt.offsetX, evt.offsetY);
        }
    },

    $lumSlider:{
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
            this.settings.palette = this.DOM.filePicker.files[0].path;
            this.loadPalette();
        }
    }
});
