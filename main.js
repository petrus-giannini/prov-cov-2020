var data_url = "https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-province.json";
var theMap;
var theMarker;
var geojsonLayer;
var marker_coord = [41.957002,12.4844508];
// array dei giorni
var days;
var today;
// array dei dati
var data = {};
// coefficiente di opacità da moltiplicare al valore per ottenere maggiore visibilità della campitura
var opacityCoefficient = 3;
// handle intervallo
var cron = null;;

function featureinfo(prop){
	var Provincia = prop.DEN_UTS;
	var Popolazione = prop.POP;
	var Value = data[days[days.length-1]][prop.COD_PROV];
	var values = []; 
	
	var Panel = $("<div />")
		.append(
			$('<p />').html(
				"Provincia di <strong>" + Provincia + "</strong><br />Popolazione: " + (Popolazione).toLocaleString("it") + "<br />" + 
				"Casi al " + displayDate(formatDate(new Date())) + ": " + (Value).toLocaleString("it") + " (" + (Math.round((Value*100/Popolazione)*100)/100).toLocaleString("it") + "%)"
			)
		);

	if (chartReady == true){
		
		// primo grafico, andamento totale dei casi
		var arCasi = [['Giorno', 'Casi', { role: 'style' }]];
    	for(var i=0; i<days.length; i++){
    		arCasi.push([displayDate(days[i], true), data[days[i]][prop.COD_PROV], '#FC4E2A']);
    	}
		var chartdata = google.visualization.arrayToDataTable(arCasi);

        var options = {
        	'title' : 'Totale dei casi',
			'width' : 420,
			'height' : 200,
			'legend' : 'none',
			'backgroundColor' : '#eee'
		};

        var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
        chart.draw(chartdata, options);

        $("#chart_div").detach().appendTo(Panel);

        // secondo grafico, andamento differenziale 
		var arCasi2 = [['Giorno', 'trend %', { role: 'style' }]];
    	for(var i=1; i<days.length; i++){
    		// aumento: oggi meno ieri
    		var increase = data[days[i]][prop.COD_PROV] - data[days[i-1]][prop.COD_PROV];
    		// percentuale dell'aumento sui casi totali
    		var trend = (increase / data[days[i]][prop.COD_PROV]) * 100;
    		
    		arCasi2.push([displayDate(days[i], true), trend, '#FC902A']);
    	}
		var chartdata2 = google.visualization.arrayToDataTable(arCasi2);

        var options2 = {
        	'title' : 'Differenza rispetto al giorno precedente, percentuale su numero totale casi (trend)',
			'width' : 420,
			'height' : 200,
			'legend' : 'none',
			'backgroundColor' : '#eee',
			'vAxis' : {format: '#\'%\''}
		};

        var chart2 = new google.visualization.ColumnChart(document.getElementById('chart_div2'));
        chart2.draw(chartdata2, options2);

        $("#chart_div2").detach().appendTo(Panel);
	}
	
	return Panel[0];
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

function displayDate(datestring, small){
	// una data nel formato yyyy-mm-dd viene mostrata come dd/mm/yyyy
	var t = datestring.split("-");
	return t[2] + "/" + t[1] + (small ? "" : "/" + t[0]);
}

function styleFeature(feat){
	var prov = feat.properties.COD_PROV;
	var pop = feat.properties.POP;
	var values = data[today];
	var value = values[prov];
	var op = value / pop * 100 * opacityCoefficient;
	return {
		fillColor: '#FC4E2A',
		weight: 1,
		opacity: .5,
		color: 'gray',
		dashArray: '1 3',
		fillOpacity: op
	};
}

function setDay(index){
	theDay = days[index];
	if (theDay) {
		today = theDay;
		if (geojsonLayer){
    		geojsonLayer.setStyle(styleFeature);
		}
		$('#lbl_last_update').html(displayDate(today));
	}
}

function forward(){
	days =  Object.keys(data).sort();
	var index = days.indexOf(today);
	if (index == days.length-1){
		index = -1;
	}
	$('#time-slider').slider('value', index+1);
}

$(function(){

	// carica dati
	$.ajax({
		url : data_url,
		error : function(){},
		success : function(remotedata){
        	theMarker = new L.marker(marker_coord, {draggable:'false'}).bindPopup("Attedere prego").addTo(theMap).openPopup();

			var theData = JSON.parse(remotedata);
			for (var i=0; i<theData.length; i++){
				// verifica se esiste il giorno
				var theDate = theData[i].data.substring(0, 10);
				if (!data[theDate]) {
					data[theDate] = {};				
				}
				data[theDate][theData[i].codice_provincia] = theData[i].totale_casi;
			}
			
			$.ajax({
            	url : "provincie.json",
            	error : function(){alert("error getting geojson")},
            	success : function(geojson){
            		geojsonLayer = L.geoJSON(geojson, {
            			style : styleFeature
            		})
            		.bindPopup(function (layer) {
						return featureinfo(layer.feature.properties);
            		})
            		.bindTooltip(function (layer) {
						return layer.feature.properties.DEN_UTS;
            		})
            		.addTo(theMap);

                    L.Control.theBox({ position: 'topleft' }).addTo(theMap);
                    if (today){
                    	$('#lbl_last_update').html(displayDate(today));
                    }

        			$('#time-slider').slider({
        				value : days.length-1,
        				min : 0,
        				max : days.length-1,
        				step : 1,
						create: function() {
							$('#time-slider-handle').text(">").click(function(){
								if (cron == null){
									window.cron = setInterval(forward, 500);
									$(this).text("||");
								} else {
									window.clearInterval(cron);
									cron = null;
									$(this).text(">");
								}
							});
						},
        				slide : function(event, ui){
        					setDay(ui.value);
        				},
        				change: function( event, ui ) {
        					setDay(ui.value);
        				}
        			});
        			
        			if (theMarker != undefined) {
        				theMap.removeLayer(theMarker);
        	        };                        	}
            });
			
    		days =  Object.keys(data).sort();
        	setDay(days.length-1);

		}
	});
	
    theMap = L.map('map', { zoomControl: false }).setView(marker_coord, 6); //41.8624,12.5198?z=16

    // lo stesso progetto mapbox usato per Maja
//                 var baseLayer1 = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
//                 	maxZoom: 20,
//                 	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
//                 }).addTo(theMap);

    var baseLayer1 = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    	maxZoom: 19,
    	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    
    var baseLayer2 = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>'
		,maxZoom: 18
		,id: 'mapbox.dark'
		,accessToken: 'pk.eyJ1IjoicGdpYW5uaW5pIiwiYSI6ImRlZDU2ODU1M2I5YTc4MTYwNjRlYjU5MThkZDVhNjA1In0.ba6tiXy4z8trtgIP4lXeIA'
	}).addTo(theMap);
    
//                 var baseLayer2 = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
//                 	maxZoom: 20,
//                 	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
//                 });
    
    var bases = {
        "Base 1" : baseLayer1,
        "Base 2" : baseLayer2,
    };

//                 var overlay = {
//                 }
// 				L.control.mousePosition().addTo(theMap);
     
    // controllo watermark
    L.Control.Watermark = L.Control.extend({
        onAdd: function(map) {
            var img = L.DomUtil.create('img');

            img.src = 'beingthere.jpg';
            img.style.width = '80px';

            return img;
        },

        onRemove: function(map) {
            // Nothing to do here
        }
    });
    L.control.watermark = function(opts) {
        return new L.Control.Watermark(opts);
    };
    L.control.watermark({ position: 'topright' }).addTo(theMap);
    
    var lControl = L.control.layers(
        bases 
//                    , overlay
    ).addTo(theMap);
  
});