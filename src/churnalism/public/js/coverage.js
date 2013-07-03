function drawChart(data){
    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('date', 'Date');
    for (var i = 0; i < data.sources.length; ++i) {
      dataTable.addColumn('number', data.sources[i]);
    }
    dataTable.addRows(data.dates.length);
    for (var i = 0; i < data.dates.length; ++i) {
      dataTable.setCell(i, 0, new Date(data.dates[i]));
    }
    for (var source = 0; source < data.sources.length; ++source) {
      for (var date = 0; date < data.dates.length; ++date) {
        dataTable.setCell(date,source+1, data.counts[source][date]);
      }
    }
    new google.visualization.DateFormat({'pattern':'MMM yyyy'}).format(dataTable,0);
    var ac = new google.visualization.AreaChart(document.getElementById('visualisation'));
    ac.draw(dataTable, {
      title : 'Index Coverage',
      isStacked: true,
      width: '100%',
      height: 600,
      vAxis: {title: "Articles"},
      hAxis: {title: "Date"}
    });
}

google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(function(){$.getJSON('/coverage/',drawChart);});
