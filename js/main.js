var outjson;
var outhtml;
var names = {};
var selectors = {};
var values = [];

function init() {
	
	$(document).ready(function(){
		
		$("input[type=file]#inputfile").click(function(){
			$(this).val("");
			$('#quickview').html('');
			$('#valuesearch').html('');
			$('#parsed').html('');
			selectors = {};
			values = [];
			names = {};
		});

		$("input[type=file]#inputfile").change(function(){
//			alert($(this).val());
			
			
			var file = document.getElementById("inputfile").files[0];
			if (file) {
				var reader = new FileReader();
				reader.readAsText(file, "UTF-8");
				reader.onload = function (evt) {
					var raw = evt.target.result;
					var clean = raw.replace(/\r?\n|\r|\t/g, "").replace(/>[ ]*</g, "><");

					
//					document.getElementById("loaded").innerHTML = clean;
					
					var parser = new DOMParser();
					var inputxml = parser.parseFromString(clean, "text/xml");
					outjson = xmlToJson(inputxml);
//					document.getElementById("converted").innerHTML = "<pre>" + JSON.stringify(outjson, null, 2) + "</pre>";
					
					document.getElementById("parsed").innerHTML = parseWrapper(outjson);
//					console.log(selectors)
					
					$('ul#accordion').children('li').children('ul').find('ul').addClass('closed');
					$('ul#accordion').children('li').children('ul').addClass('open');
					
					$('ul#accordion').find('li').click(function(e){
						if ($(e.target).children('ul').hasClass('open')) {
							$(e.target).find('ul').removeClass('open').addClass('closed');
						} else {
							$(e.target).children('ul').removeClass('closed').addClass('open');
						}
						e.stopImmediatePropagation();
					})
					
					for (var s in selectors) {
						for (var t in selectors[s]){
							if (s !== 'default') {
								$('#quickview').append('<option>'+s+':'+selectors[s][t]+'</option>')
							} else {
								$('#quickview').append('<option>'+selectors[s][t]+'</option>')
							}
						}
					}
					
					$('#valuesearch').autocomplete({
						source: values,
						select: function (event, ui) {        
							$('#accordion li.value:contains('+ui.item.label+')').each(function(){
								$(this).parentsUntil('ul#accordion','ul').addClass('open').removeClass('closed');
							})
							$('#results span#label').html(ui.item.label);
							$('#results span#count').html($('#accordion li.value:contains('+ui.item.label+')').length);
							return false;
						},
					});
				}
				reader.onerror = function (evt) {
					document.getElementById("loaded").innerHTML = "error reading file";
				}
			}
			
		});
	});
	return;
}

function quickView(evt) {
	$('#accordion li:not(.value):contains('+evt.value+')').each(function(){
		$(this).children('ul').addClass('open').removeClass('closed').parentsUntil('ul#accordion','ul').addClass('open').removeClass('closed');
	})
	$('#results span#label').html(evt.value);
	$('#results span#count').html(names[evt.value]);
	$('#quickview').val('');
}

function parseWrapper(json) {
	outhtml = '<ul id="accordion">';
	parseContent(json)
	outhtml += '</ul>';
	return outhtml;
}

function parseContent(input) {
	for (o in input) {
		if (typeof input[o] === "object" && input[o] !== null) {
			addSelector(o);
			if (Object.keys(input[o]).length > 0) {
				if (o !== '#text') {
					outhtml += '<li>'+o+'<ul>';
					parseContent(input[o])
				} else {
					outhtml += '<li class="value">'+input[o]+'</li>';
					addValue(input[o]);
				}
			}
		} else {
			if (o !== '#text') {
				outhtml += '<li>'+o+'<ul><li class="value">'+input[o]+'</li></ul></li>';
				addValue(input[o]);
			} else {
				outhtml += '<li class="value">'+input[o]+'</li>';
				addValue(input[o]);
			}
		}
	}
	outhtml += '</ul></li>'
}

function addSelector(o){
	if (o.indexOf(':') > -1) {
		var arr = o.split(':');
	} else {
		var arr = ['default',o]
	}
	if (arr[1] == '@attributes') {
		return;
	}
	if ($.isNumeric(arr[1])) {
		return;
	}
	if (selectors.hasOwnProperty(arr[0])) {
		if (selectors[arr[0]].indexOf(arr[1]) < 0) {
			selectors[arr[0]].push(arr[1]);
		}
	} else {
		selectors[arr[0]] = [arr[1]];
	}
	if (names.hasOwnProperty(o)) {
		names[o] = names[o] + 1;
	} else {
		names[o] = 1;
	}
}

function addValue(v){
	if (values.indexOf(v) < 0) {
		values.push(v);
	}
}