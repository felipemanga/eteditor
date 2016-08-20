CLAZZ("dialogues.PropertyBuilder", {
    build:function(target, key, meta, parent){
        if( !target || !meta || meta.dynamic ) return;

        function updateMeta(evt){
			target[key] = evt.target.value;
			if( meta.int ) target[key] = parseInt(target[key]);
		}

		function createMeta(){
			var value = target[key];
			if(meta.select){
				return ["select", { onchange:updateMeta },
					meta.select.map( v => ["option", {value:v, text:v, selected:v==value} ] )
				];
			}

			if(meta.int){
				function updateRange(evt){
					var span = evt.target.parentNode.querySelector("span");
					span.textContent = evt.target.value;
					updateMeta(evt);
				}

				return ["div",[
					["span", {className:"rangeLabel", text: value}],
					["input", {
                        className:"range",
                        onchange:updateRange,
                        type:"range",
                        value: value,
                        min:meta.int.min,
                        max:meta.int.max
                    }]
				]];
			}

			return ["div", {text:JSON.stringify(meta)}];
		}

        return DOC.create("div", {className:"optionContainer"}, parent, [
            ["div", {
                className:"optionLabel",
                text:DOC.TEXT(meta.label || key)
            }],
            createMeta( key )
        ]);
    }
});
