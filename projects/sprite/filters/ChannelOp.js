CLAZZ("projects.sprite.filters.ChannelOp", {
    mode:"clamp",
    min: 0,
    max: 255,
    channel: "rgb",

    meta:{
        mode:{select:["clamp", "noise"]},
        min:{int:{min:0, max:255}},
        max:{int:{min:0, max:255}},
        channel:{select:["rgb", "rgba", "r", "g", "b", "a"]}
    },

    run:null,
    channelArray:null,
    activate:function(){
        this.channelArray = this.channel.split("");
        this.run = this[ this.mode ];
        return true;
    },

    clamp:function( color ){
        for( var i=0, arr=this.channelArray; i<arr.length; ++i ){
            color[ arr[i] ] = Math.max( this.min, Math.min( this.max, color[ arr[i] ] ) );
        }
    },

    noise:function( color ){
        for( var i=0, arr=this.channelArray; i<arr.length; ++i ){
            color[ arr[i] ] = Math.round( Math.random() * (this.max - this.min) + this.min );
        }
    }
});