var rawxml;
var rawxsd;
var outjson;
var outhtml;
var inputxml;
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
			$('#results div#uniques').html('');
			$('#results span#label').html('');
			$('#results span#count').html('');
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
					
					rawxml = clean;
					var parser = new DOMParser();
					inputxml = parser.parseFromString(clean, "text/xml");
					outjson = xmlToJson(inputxml);
//					document.getElementById("converted").innerHTML = "<pre>" + JSON.stringify(outjson, null, 2) + "</pre>";
					
//					document.getElementById("parsed").innerHTML = parseWrapper(outjson);
					document.getElementById("parsed").innerHTML = parseWrapper(inputxml);
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
					
					var tempsel = [];
					var defsel = [];
					var attsel = [];
					for (var s in selectors) {
						for (var t in selectors[s]){
							if (s !== 'default') {
								tempsel.push(s+':'+selectors[s][t])
							} else {
								defsel.push(selectors[s][t])
							}
						}
					}
					defsel.sort();
					tempsel.sort();
					attsel.sort();
					tempsel = attsel.concat(defsel,tempsel);
					for (var t in tempsel) {
						$('#quickview').append('<option>'+tempsel[t]+'</option>')
					}
					
					$('#valuesearch').autocomplete({
						source: values,
						select: function (event, ui) {
							var c = 0;
							$('#accordion li.value:contains('+ui.item.label+')').each(function(){
								if ($(this).html() == ui.item.label) {
									$(this).parentsUntil('ul#accordion','ul').addClass('open').removeClass('closed');
									c++;
								}
							})
							$('#results span#label').html(ui.item.label);
							$('#results span#count').html(c);
							return false;
						},
					});
				}
				reader.onerror = function (evt) {
					document.getElementById("loaded").innerHTML = "error reading file";
				}
			}
			
		});
		
		$("input[type=file]#testxsd").change(function(){

			var file = document.getElementById("testxsd").files[0];
			if (file) {
				var reader = new FileReader();
				reader.readAsText(file, "UTF-8");
				reader.onload = function (evt) {
					var raw = evt.target.result;
					var clean = raw.replace(/\r?\n|\r|\t/g, "").replace(/>[ ]*</g, "><");
					
					rawxsd = clean;
					var parser = new DOMParser();
					var inputxsd = parser.parseFromString(clean, "text/xml");
					
					opts = {
						xml: rawxml,
						schema: rawxsd
					}
					
					if (!xmllint.validateXML(opts).errors) {
						$('#results #validation').html('<span class="valid">No XML validation errors reported.</span>');
					} else {
						var err = '';
						for (e in xmllint.validateXML(opts).errors) {
							err += '<span class="error">' + xmllint.validateXML(opts).errors[e] + '</span></br>';
						}
						$('#results #validation').html(err);
					}
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
	var uniques = [];
	$('#accordion li[name="'+evt.value+'"]').each(function(){
		$(this).children('ul').addClass('open').removeClass('closed').parentsUntil('ul#accordion','ul').addClass('open').removeClass('closed');
		if (uniques.indexOf($(this).children('ul.open').children('li.value').html()) < 0) {
			uniques.push($(this).children('ul.open').children('li.value').html())
		}
	})
	$('#results span#label').html(evt.value);
	$('#results span#count').html($('#accordion li[name="'+evt.value+'"]').length);
	$('#results div#uniques').html(createUniques(uniques));
	$('#quickview').val('');
}

function createUniques(val){
	$('#results div#uniques').html('');
	val = val.filter( Boolean );
	if (val.length > 0) {
		var out = '<span  class="head">The following unique values are found in your query:</span>';
		for (var v in val) {
			out += '<br/><span class="value">'+val[v]+'</span>';
		}
	} else {
		var out = '<span class="head">No immediate values found in your query.</span>';
	}
	return out;
}

function resetTree(evt){
	$('ul#accordion').children('li').children('ul').find('ul').addClass('closed');
	$('ul#accordion').children('li').children('ul').addClass('open');
	$('#results div#uniques').html('');
	$('#results span#label').html('');
	$('#results span#count').html('');
	return false;
}

function parseWrapper(json) {
	outhtml = '<ul id="accordion">';
	//parseContent(json)
	parseXML(json.firstChild)
	outhtml += '</ul>';
	return outhtml;
}

function parseXML(input){
	outhtml += '<li name="'+input.nodeName+'">'+input.nodeName+'<ul>';
	addSelector(input.nodeName);
	if (input.parentNode !== null) {
		if (input.hasAttributes()) {
			var att = '';
			for (i=0; i < input.attributes.length; i++) {
				att += '<li class="attribute" name="@'+input.attributes[i].nodeName+'">@'+input.attributes[i].nodeName+'<ul class="value attribute"><li class="value attribute">'+input.attributes[i].textContent+'</li></ul></li>'
				addSelector('@'+input.attributes[i].nodeName);
				addValue(input.attributes[i].textContent);
			}
			outhtml += att;
		}
	}
	if (input.hasChildNodes()) {
		for (var i=0; i < input.childNodes.length; i++){
			if (!input.childNodes[i].hasChildNodes()) {
				if (input.childNodes[i].textContent !== '') {
					outhtml += '<li class="value">'+input.childNodes[i].textContent+'</li>'
					addValue(input.childNodes[i].textContent);
				} else {
					parseXML(input.childNodes[i]);
				}
			} else {
				parseXML(input.childNodes[i]);
			}
		}
	}
	if (!input.hasChildNodes() && input.parentNode === null) {
		return;
	}
	outhtml += '</ul></li>'
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
				addSelector(o);
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

function parseXsd(input) {
	for (o in input) {
		if (typeof input[o] === "object" && input[o] !== null) {
			
		} else {
			
		}
	}
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
}

function addValue(v){
	if (values.indexOf(v) < 0) {
		values.push(v);
	}
}