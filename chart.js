var chartReady = false;
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(chartReadyCB);

function chartReadyCB(){
	chartReady = true;
}
