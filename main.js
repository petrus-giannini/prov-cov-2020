var theMap;
var theMarker;
var geojsonLayerCasi;
var geojsonLayerTrend;
var marker_coord = [41.957002,12.4844508];
// array dei giorni
var days;
var today;
// array dei dati
var data = {};
// coefficiente di opacità da moltiplicare al valore per ottenere maggiore visibilità della campitura
var opacityCoefficient = 1.8;
// handle intervallo animazione
var cron = null;
// intervallo animazione in millisecondi
var cron_millisecond = 250;

// parametri
// province
var data_url = "https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-province.json";
// grafici
var chartWitdth = 280;
var chartHeight = 140;
var colorCasi = '#FC4E2A';
var colorTrend = '#FC902A';
var colorConfini = '#FFAA22';


// restituisce una datta formattata come yyyy-mm-dd
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

//una data nel formato yyyy-mm-dd viene mostrata come dd/mm/yyyy
// se small == true allora dd/mm
function displayDate(datestring, small){
	var t = datestring.split("-");
	return t[2] + "/" + t[1] + (small ? "" : "/" + t[0]);
}

// stile del layer casi
function styleFeatureCasi(feat){
	var prov = feat.properties.COD_PROV;
	var pop = feat.properties.POP;
	var values = data[today];
	var value = values[prov];
	var op = value / pop * 100 * opacityCoefficient;
	return {
		fillColor: colorCasi,
		weight: 1,
		opacity: op/2, //.5,
		color: colorConfini,
// 		dashArray: '1 3',
		fillOpacity: op
	};
}

// stile del layer trend (non usato per ora)
function styleFeatureTrend(feat){
	var prov = feat.properties.COD_PROV;
	var pop = feat.properties.POP;
	var op = 0;
	if (today != days[0]){
		// data di ieri
		var y
		for (y=0; y<days.length; y++){
			if (days[y] == today){
				break;
			}
		}
		var values = data[today];
		var yvalues = data[days[y-1]];
		op = (values[prov] > 0 ? (values[prov] - yvalues[prov]) / values[prov] : 0);
	}
	return {
		fillColor: colorTrend,
		weight: 1,
		opacity: op/2, //.5,
		color: colorConfini,
//		dashArray: '1 3',
		fillOpacity: op
	};
}

// imposta il giorno corrente
function setDay(index){
	theDay = days[index];
	if (theDay) {
		today = theDay;
		if (geojsonLayerCasi){
    		geojsonLayerCasi.setStyle(styleFeatureCasi);
		}
		if (geojsonLayerTrend){
			geojsonLayerTrend.setStyle(styleFeatureTrend);
		}
		$('#lbl_last_update').html(displayDate(today));
	}
}

// imposta un giorno in avanti, da chiamare con un setinterval
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
            		// layer dei casi
            		geojsonLayerCasi = L.geoJSON(geojson, {
            			style : styleFeatureCasi
            		})
            		.bindPopup(function (layer) {
						return featureinfo(layer.feature.properties);
            		})
            		.bindTooltip(
        				function (layer) { return layer.feature.properties.DEN_UTS; },
        				{
//        					permanent : true
        				}
    				)
    				//.openTooltip()
            		
//            		.onEachFeature(function(feature, layer){
//            			layer.bindPopup(feature.properties.DEN_UTS,{
//            				permanent : true,
//            			})
//            		})
            		.addTo(theMap);


            		
//            		// layer del trend
//            		geojsonLayerTrend = L.geoJSON(geojson, {
//            			style : styleFeatureTrend
//            		})
//            		.bindPopup(function (layer) {
//						return featureinfo(layer.feature.properties);
//            		})
//            		.bindTooltip(function (layer) {
//						return layer.feature.properties.DEN_UTS;
//            		})
//            		;
            		
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
									window.cron = setInterval(forward, cron_millisecond);
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
        			
        		    var bases = {
    		            "Base 1" : baseLayer1,
    		            "Base 2" : baseLayer2,
    		        };
    		        var overlay = {
    		    		"Casi" : geojsonLayerCasi,
//    		    		"Trend" : geojsonLayerTrend,
    		        };

    		        var lControl = L.control.layers(
	        			bases, 
	        			overlay
		            ).addTo(theMap);

        			
        			if (theMarker != undefined) {
        				theMap.removeLayer(theMarker);
        	        }; 
    	        }
            });
			
    		days =  Object.keys(data).sort();
        	setDay(days.length-1);

		}
	});
	
    theMap = L.map('map', { zoomControl: false }).setView(marker_coord, 6); //41.8624,12.5198?z=16

    var baseLayer1 = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    	maxZoom: 19,
    	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    
    var baseLayer2 = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
	attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
    });
    
     
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
    
  
});
