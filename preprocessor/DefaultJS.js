CLAZZ("preprocessor.DefaultJS", {
    run:function(src, cb, CONSOLE){
        var match, exp = /^\s*#include\s+"([^"]+)"$/mg;
        var files = [], offset = 0;
        CONSOLE = CONSOLE || self.console;

        do{
            match = exp.exec(src);
            if( match ) files.push(match);
        }while( match );

        function shift(){
            if( !files.length ){
                done();
                return;
            }

            var file = files.shift();
            DOC.getURL(file[1], function( ret, state ){
                if( state != 200 ){
                    CONSOLE.error("Server returned " + state + " on include " + file);
                }else{
                    var start = file.index + offset, end = start + file[0].length;
                    src = src.substr(0, start) + ret + src.substr(end);
                    offset += ret.length - file[0].length;
                }
                shift();
            }, {anystate:true});
        }

        function done(){
            src = "var console = arguments[0] || self.console;\n" + src;
            var syntax = esprima.parse(src, {
                tolerant: true,
                loc: true
            });
            var expr = syntax.body[ syntax.body.length-1 ];
            if( expr.type == "ExpressionStatement" || expr.type == "FunctionDeclaration" ){
                var lines = src.split("\n");
                var line = lines[ expr.loc.start.line-1 ];
                line = line.substr(0, expr.loc.start.column) + " return " + line.substr(expr.loc.start.column);
                lines[ expr.loc.start.line-1 ] = line;
                src = lines.join("\n");
            }
            cb(src, syntax);
        }

        if( files.length ) shift();
        else done();
    }
});
