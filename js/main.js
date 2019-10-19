// set dynamic width and height
var chartWidth = $('#chart-area').width(),
    chartHeight = Math.round(chartWidth * 0.75);

// SVG drawing area

var margin = { top: 40, right: 40, bottom: 60, left: 60 };

var width = chartWidth - margin.left - margin.right,
    height = chartHeight - margin.top - margin.bottom;

var svg = d3.select("#chart-area").append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// date parser
var formatDate = d3.timeFormat("%Y");
var parseDate = d3.timeParse("%Y");

// variable for the selected filter
var selectedFilter;


// initialize data
loadData();
var data;
var timePeriod;

// scales
var x = d3.scaleTime()
    .range([0, width]);

var y = d3.scaleLinear()
    .range([height, 0]);

// axes
var yAxis = d3.axisLeft()
    .scale(y);

var yAxisGroup = svg.append("g")
    .attr("class", "y-axis axis");

var xAxis = d3.axisBottom()
    .scale(x)
    .ticks(d3.timeYear.every(10));

var xAxisGroup = svg.append("g")
    .attr("class", "x-axis axis");

// load CSV file
function loadData() {
    d3.csv("data/fifa-world-cup.csv", function(error, csv) {

        csv.forEach(function(d) {
            // convert string to 'date object'
            d.YEAR = parseDate(d.YEAR);

            // convert numeric values to 'numbers'
            d.TEAMS = +d.TEAMS;
            d.MATCHES = +d.MATCHES;
            d.GOALS = +d.GOALS;
            d.AVERAGE_GOALS = +d.AVERAGE_GOALS;
            d.AVERAGE_ATTENDANCE = +d.AVERAGE_ATTENDANCE;
        });

        // store csv data in global variable
        data = csv.sort(function(a, b) { return a.YEAR - b.YEAR });

        // we need this time period for the slider
        timePeriod = data.map(d => +formatDate(d.YEAR))

        // selected value we filter for
        selectedFilter = d3.select("#chart-select").property("value");


        // add the line
        var line = svg.append("path")
            .datum(data)
            .attr('class', 'line')
            .attr("fill", "none")
            .style('stroke', '#dc143c')
            .style("stroke-width", 1.5)

        // using range slider
        $(".js-range-slider").ionRangeSlider({
            type: "double",
            min: d3.min(timePeriod),
            max: d3.max(timePeriod),
            grid: true,
            onStart: function() {
                // draw the visualization for the first time
                updateVisualization()
            },
            onChange: function(values) {
                // store csv data in the global variable
                data = csv.sort(function(a, b) { return a.YEAR - b.YEAR });

                // filter the data
                data = data.filter(d => d.YEAR > parseDate(values.from));
                data = data.filter(d => d.YEAR < parseDate(values.to));

                // update the visualization
                updateVisualization();
            }
        });
    });
}

// caled by the select box
function onSelect() {
    selectedFilter = d3.select("#chart-select").property("value");
    updateVisualization();
}

// variable to update our line
var updateLine = d3.line()
    .curve(d3.curveNatural)
    .x(function(d) { return x(d.YEAR) })
    .y(function(d) { return y(d[selectedFilter]) });

// tooltip
var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-8, 0])
    .html(d => selectedFilter + ": " + d[selectedFilter] + " | " + d.EDITION);
svg.call(tool_tip);


// render visualization
function updateVisualization() {

    // transition
    const t = d3.transition()
        .duration(800);

    // set the x and y domains
    y.domain([0, d3.max(data, d => d[selectedFilter])]);
    x.domain(d3.extent(data, d => d.YEAR));

    // draw the axes
    svg.select(".y-axis")
        .transition(t)
        .call(yAxis);
    svg.select(".x-axis")
        .transition(t)
        .attr("transform", "translate( 0 ," + height + ")")
        .call(xAxis);

    // change the line
    svg.select(".line")
        .transition(t)
        .attr("d", updateLine(data));

    // appends a circle for each datapoint 
    var circles = svg.selectAll("circle")
        .data(data);

    circles.enter()
        .append("circle")

        // update the circles
        .merge(circles)
        .attr("class", "dot")
        .on('mouseover', tool_tip.show)
        .on('click', d => showEdition(d))
        .on('mouseout', tool_tip.hide)
        .transition(t)
        .attr('stroke', '#dc143c')
        .attr('stroke-width', 2)
        .attr('fill', 'white')
        .attr("cx", function(d) { return x(d.YEAR) })
        .attr("cy", function(d) { return y(d[selectedFilter]) })
        .attr("r", 7);

    // exit
    circles.exit().remove();
}


// click on circles to show details for a specific FIFA World Cup
function showEdition(d) {
    $('#information').html('<div class = "card bg-danger text-white">' +
        '<h5 class = "card-header"><strong>' + d.EDITION + '</strong></h5>' +
        '<div class = "card-body">' +
        '<p class = "card-text">' + 'Location: ' + d.LOCATION + '</p>' +
        '<p class = "card-text">' + 'Winner: ' + d.WINNER + '</p>' +
        '<p class = "card-text">' + 'Year: ' + formatDate(d.YEAR) + '</p>' +
        '<p class = "card-text">' + 'Matches: ' + d.MATCHES + '</p>' +
        '<p class = "card-text">' + 'Teams: ' + d.TEAMS + '</p>' +
        '<p class = "card-text">' + 'Average Attendance: ' + d.AVERAGE_ATTENDANCE + '</p>' +
        '<p class = "card-text">' + 'Goals: ' + d.GOALS + '</p>' +
        '<p class = "card-text">' + 'Average Goals: ' + d.AVERAGE_GOALS + '</p>' +
        '</div>' +
        '</div>'
    );
}