var chartReady = false;
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(chartReadyCB);

function chartReadyCB(){
	chartReady = true;
}

function featureinfo(prop){
	var Provincia = prop.DEN_UTS;
	var Popolazione = prop.POP;
	var Value = data[days[days.length-1]][prop.COD_PROV];
	var values = []; 
	
	var Panel = $("<div />");

	if (chartReady == true){
		
		// primo grafico, andamento totale dei casi
		var arCasi = [['Giorno', 'Casi', { role: 'style' }]];
    	for(var i=0; i<days.length; i++){
    		arCasi.push([displayDate(days[i], true), data[days[i]][prop.COD_PROV], colorCasi]);
    	}
		var chartdata = google.visualization.arrayToDataTable(arCasi);

        var options = {
        	'title' : 'Totale dei casi',
			'width' : chartWitdth,
			'height' : chartHeight,
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
    		
    		arCasi2.push([displayDate(days[i], true), trend, colorTrend]);
    	}
		var chartdata2 = google.visualization.arrayToDataTable(arCasi2);

        var options2 = {
        	'title' : 'Differenza rispetto al giorno precedente, percentuale su numero totale casi (trend)',
			'width' : chartWitdth,
			'height' : chartHeight,
			'legend' : 'none',
			'backgroundColor' : '#eee',
			'vAxis' : {format: '#\'%\''}
		};

        var chart2 = new google.visualization.ColumnChart(document.getElementById('chart_div2'));
        chart2.draw(chartdata2, options2);

        $("#chart_div2").detach().appendTo(Panel);
	}
	
	Panel.append(
		$('<p />').html(
				"Provincia di <strong>" + Provincia + "</strong><br />Popolazione: " + (Popolazione).toLocaleString("it") + "<br />" + 
				"Casi al " + displayDate(formatDate(new Date())) + ": " + (Value).toLocaleString("it") + " (" + (Math.round((Value*100/Popolazione)*100)/100).toLocaleString("it") + "%)"
			)
		);
	
	return Panel[0];
}
