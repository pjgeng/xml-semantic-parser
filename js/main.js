var outjson;

function init() {
	
	$(document).ready(function(){
		$("input[type=file]#inputfile").click(function(){
			$(this).val("");
		});

		$("input[type=file]#inputfile").change(function(){
			alert($(this).val());
			
			
			var file = document.getElementById("inputfile").files[0];
			if (file) {
				var reader = new FileReader();
				reader.readAsText(file, "UTF-8");
				reader.onload = function (evt) {
					var raw = evt.target.result;
					var clean = raw.replace(/\r?\n|\r|\t/g, "").replace(/>[ ]*</g, "><");

					
					document.getElementById("loaded").innerHTML = clean;
					
					var parser = new DOMParser();
					var inputxml = parser.parseFromString(clean, "text/xml");
					outjson = xmlToJson(inputxml);
					document.getElementById("converted").innerHTML = "<pre>" + JSON.stringify(outjson, null, 2) + "</pre>";
					
					parseContent(outjson)
					
				}
				reader.onerror = function (evt) {
					document.getElementById("loaded").innerHTML = "error reading file";
				}
			}
			
		});
	});
	
	return;
}

function parseContent(input) {
	for (o in input) {
		console.log(o)
		if (typeof input[o] === "object" && input[o] !== null) {
			if (Object.keys(input[o]).length > 0) {
				parseContent(input[o])
			}
		}
	}
}