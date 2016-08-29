CLAZZ("dialogues.PropertyBuilder", {
    build:function(target, key, meta, parent){
        if( !target || !meta || meta.dynamic ) return;

		function createMeta(){
			var value = target[key];
			if(meta.select){
				return ["select", { onchange:(evt) => target[key] = evt.target.value },
					meta.select.map( v => ["option", {value:v, text:v, selected:v==value} ] )
				];
			}

			if(meta.int){
				function updateRange(evt){
					var span = evt.target.parentNode.querySelector("span");
					var value = evt.target.value;
					value = parseInt(value);
					value += min;
					if( meta.int.nonlinear ) value *= value;
					value = Math.floor(value);
					target[key] = value;
					span.textContent = value;
				}

				var min = meta.int.min, max = meta.int.max;
				if( meta.int.nonlinear ){
					min = Math.sqrt(min);
					max = Math.sqrt(max);
				}

				return ["div",[
					["span", {className:"rangeLabel", text: value}],
					["input", {
                        className:"range",
                        onchange:updateRange,
                        type:"range",
                        value: value,
                        min:0,
                        max:max-min
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
