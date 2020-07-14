// The code for the chart is wrapped inside a function that
// automatically resizes the chart
function makeResponsive() {

///////////////////////////////////
// Configure SVG and Chart Sizes
///////////////////////////////////

// Select the area for the SVG
let svgArea = d3.select("#scatter").select("svg");

// Clear svg is not empty
if (!svgArea.empty()) {
  svgArea.remove();
};

// Set SVG dimensions
let svgWidth = window.innerWidth*0.7;
let svgHeight = window.innerHeight*0.7;

//Configure the chart margins relative to SVG size
let chartMargin = {
  top: 25,
  bottom: 100,
  right: 10,
  left: 100
};

// Configure chart height and width
let height = svgHeight - chartMargin.top - chartMargin.bottom;
let width = svgWidth - chartMargin.left - chartMargin.right;

// Append SVG element
let svg = d3
  .select("#scatter")
  .append("svg")
  .attr("height", svgHeight)
  .attr("width", svgWidth);

// Append group element
let chartGroup = svg.append("g")
  .attr("transform", `translate(${chartMargin.left}, ${chartMargin.top})`);

///////////////////////////////////
// Initialize plot
///////////////////////////////////
let selXaxis = "poverty";
let selYaxis = "healthcare";

///////////////////////////////////
// Create all required functions
///////////////////////////////////

// Create a function that will scale x-axis
function xScale(jourData, selXaxis) {
    let xLinearScale = d3.scaleLinear()
      .domain([Math.floor(d3.min(jourData, d => d[selXaxis]) * 0.9), Math.ceil(d3.max(jourData, d => d[selXaxis])*1.1)])
      .range([0, width]);

    return xLinearScale;
};

// function used for updating xAxis var upon click on axis label
function renderXaxes(newXScale, xAxis) {
  let bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
};

// Create a function that will scale y-axis
function yScale(jourData, selYaxis) {
  let yLinearScale = d3.scaleLinear()
    .domain([Math.floor(d3.min(jourData, d => d[selYaxis])*0.9), Math.ceil(d3.max(jourData, d => d[selYaxis])*1.1)])
    .range([height, 0]);

  return yLinearScale;
};

// function used for updating yAxis var upon click on axis label
function renderYaxes(newYScale, yAxis) {
  let leftAxis = d3.axisLeft(newYScale);

  yAxis.transition()
    .duration(1000)
    .call(leftAxis);

  return yAxis;
};

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, circlesLabels, newXScale, newYScale, selXAxis, selYAxis) {

  circlesLabels.transition()
    .duration(1000)
    .attr("x", d => newXScale(d[selXaxis]))
    .attr("y", d => newYScale(d[selYaxis]));

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[selXaxis]))
    .attr("cy", d => newYScale(d[selYaxis]));

  return circlesGroup;
  return circlesLabels;
};

// function used for updating circles group with new tooltip
function updateToolTip(selXaxis, selYaxis, circlesGroup) {

  let xlabel;
  let ylabel;

  switch(selXaxis) {
    case "poverty":
      xlabel = "Poverty (%): "
      break;
    case "age":
      xlabel = "Median age: "
      break;
    case "income":
      xlabel = "Median household income ($USD): "
      break;
    default:
      xlabel = "Error in X";
  };

  switch(selYaxis) {
    case "obesity":
      ylabel = "Obesity: "
      break;
    case "smokes":
      ylabel = "Smokers: "
      break;
    case "healthcare":
      ylabel = "Lacks healthcare: "
      break;
    default:
      ylabel = "Error in Y";
  };

  let toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-5, 60])
    .html(function(d) {
      return (`<b>${d.state}</b><br>${xlabel}${d[selXaxis]}<br>${ylabel}${d[selYaxis]}%`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data);
  })
    // onmouseout event
    .on("mouseout", function(data) {
      toolTip.hide(data);
    });

  return circlesGroup;
};  


///////////////////////////////////
// Read CSV and create plot
///////////////////////////////////
d3.csv("assets/data/data.csv").then(function(jourData, err) {
  if (err) throw err;

    // format desired data
    jourData.forEach(function(data) {
      data.poverty = +data.poverty;
      data.healthcare = +data.healthcare;
      data.age = +data.age;
      data.income = +data.income;
      data.obesity = +data.obesity;
      data.smokes = +data.smokes;
    });

    //Create x and y linear scales
    let xLinearScale = xScale(jourData,selXaxis)
    let yLinearScale = yScale(jourData,selYaxis)

    // create axes
    let bottomAxis = d3.axisBottom(xLinearScale);
    let leftAxis = d3.axisLeft(yLinearScale);

    // append axes
    let xAxis= chartGroup.append("g")
      .classed("x-axis",true)
      .attr("transform", `translate(0, ${height})`)
      .call(bottomAxis);

    let yAxis= chartGroup.append("g")
      .classed("y-axis",true)
      .call(leftAxis);

    //append initial circles
    const radius = 15;
    let circlesGroup = chartGroup.selectAll("circle")
      .data(jourData)
      .enter()
      .append("circle")
      .classed("stateCircle", true)
      .attr("cx", d => xLinearScale(d.poverty))
      .attr("cy", d => yLinearScale(d.healthcare))
      .attr("r", radius);

    // start a state label group
    let stateGroup = chartGroup.append("g");

    let circlesLabels = stateGroup.selectAll("text")
      .data(jourData)
      .enter()
      .append("text")
      .classed("stateText", true)
      .text(d=> d.abbr)
      .attr("x", d => xLinearScale(d.poverty))
      .attr("y", d => yLinearScale(d.healthcare))
      .attr("font-size",radius*0.8);

    let xLabelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

    let povertyLabel = xLabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") // value to grab for event listener
    .classed("active", true)
    .text("In poverty (%)");

    let ageLabel = xLabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age") // value to grab for event listener
    .classed("inactive", true)
    .text("Age (median)");

    let incomeLabel = xLabelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("value", "income") // value to grab for event listener
    .classed("inactive", true)
    .text("Household Income (median)");

    let yLabelsGroup = chartGroup.append("g")
    .attr("transform",`translate(${chartMargin.left},0)`);

    let healthcareLabel = yLabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - chartMargin.left-60)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .attr("value", "healthcare") // value to grab for event listener
    .classed("active", true)
    .text("Lacks Healthcare (%)");

    let smokeLabel = yLabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - chartMargin.left-80)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .attr("value", "smokes") // value to grab for event listener
    .classed("inactive", true)
    .text("Smokes (%)");

    let obeseLabel = yLabelsGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - chartMargin.left-100)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .attr("value", "obesity") // value to grab for event listener
    .classed("inactive", true)
    .text("Obese (%)");

    // updateToolTip function above csv import
    circlesGroup = updateToolTip(selXaxis, selYaxis, circlesGroup);

    // x axis labels event listener
  xLabelsGroup.selectAll("text")
  .on("click", function() {

    // get value of selection
    let Xvalue = d3.select(this).attr("value");
    if (Xvalue !== selXaxis) {

      // Get value of selected x-axis
      selXaxis = Xvalue;

      // updates x scale for new data
      xLinearScale = xScale(jourData, selXaxis);

      // updates x axis with transition
      xAxis = renderXaxes(xLinearScale, xAxis);

      // updates circles with new x values
      circlesGroup = renderCircles(circlesGroup, circlesLabels, xLinearScale, yLinearScale, selXaxis, selYaxis);

      // updates tooltips with new info
      circlesGroup = updateToolTip(selXaxis, selYaxis, circlesGroup);

      // changes classes to change bold text
      switch(selXaxis) {
        case "poverty":
          povertyLabel
            .classed("active", true)
            .classed("inactive", false);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
          break;
        case "age":
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          ageLabel
            .classed("active", true)
            .classed("inactive", false);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
          break;
        case "income":
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", true)
            .classed("inactive", false);
          break;
        default:
          povertyLabel
            .classed("active", false)
            .classed("inactive", true);
          ageLabel
            .classed("active", false)
            .classed("inactive", true);
          incomeLabel
            .classed("active", false)
            .classed("inactive", true);
      };
    }});

  // y axis labels event listener
  yLabelsGroup.selectAll("text")
  .on("click", function() {

    // get value of selection
    let Yvalue = d3.select(this).attr("value");
    if (Yvalue !== selYaxis) {

      // Get value of selected y-axis
      selYaxis = Yvalue;

      // updates x scale for new data
      yLinearScale = yScale(jourData, selYaxis);
      console.log(yLinearScale)

      // updates y axis with transition
      yAxis = renderYaxes(yLinearScale, yAxis);

      // updates circles with new y values
      circlesGroup = renderCircles(circlesGroup, circlesLabels, xLinearScale, yLinearScale, selXaxis, selYaxis);

      // updates tooltips with new info
      circlesGroup = updateToolTip(selXaxis, selYaxis, circlesGroup);

      // changes classes to change bold text
      switch(selYaxis) {
        case "healthcare":
          healthcareLabel
            .classed("active", true)
            .classed("inactive", false);
          smokeLabel
            .classed("active", false)
            .classed("inactive", true);
          obeseLabel
            .classed("active", false)
            .classed("inactive", true);
          break;
        case "smokes":
          healthcareLabel
            .classed("active", false)
            .classed("inactive", true);
          smokeLabel
            .classed("active", true)
            .classed("inactive", false);
          obeseLabel
            .classed("active", false)
            .classed("inactive", true);
          break;
        case "obesity":
          healthcareLabel
            .classed("active", false)
            .classed("inactive", true);
          smokeLabel
            .classed("active", false)
            .classed("inactive", true);
          obeseLabel
            .classed("active", true)
            .classed("inactive", false);
          break;
        default:
          healthcareLabel
            .classed("active", false)
            .classed("inactive", true);
          smokeLabel
            .classed("active", false)
            .classed("inactive", true);
          obeseLabel
            .classed("active", false)
            .classed("inactive", true);
      };
    }});


  }).catch(function(error) {
    console.log(error);
  });
  
} //end of responsive function

// When the browser loads, makeResponsive() is called.
makeResponsive();

// When the browser window is resized, makeResponsive() is called.
d3.select(window).on("resize", makeResponsive);
