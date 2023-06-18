// Load the CSV data
d3.csv("data/insurance.csv").then(function (data) {
  // Convert string values to numeric if needed
  data.forEach(function (d) {
    d.age = +d.age;
    d.charges = +d.charges;
    if (d.bmi < 18.5) d.bmiCategory = "under";
    else if (d.bmi < 25) d.bmiCategory = "normal";
    else if (d.bmi < 30) d.bmiCategory = "over";
    else if (d.bmi < 35) d.bmiCategory = "obesity";
    else d.bmiCategory = "extreme";
  });

  function createViolinPlot(data) {
    // console.log(data);
    var margin = {top: 40, right: 40, bottom: 40, left: 40},
      width = 360 - margin.left - margin.right,
      height = 360 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3
      .select("#violin-plot")
      .append("svg")
      // .attr("width", width + margin.left + margin.right)
      .attr("width", "100%")
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Build and Show the Y scale
    var y = d3
      .scaleLinear()
      .domain([0, 70000]) // Note that here the Y scale is set manually
      .range([height, 0]);
    svg.append("g").call(d3.axisLeft(y));

    // Build and Show the X scale. It is a band scale like for a boxplot: each group has an dedicated RANGE on the axis. This range has a length of x.bandwidth
    var x = d3
      .scaleBand()
      .range([0, width])
      .domain(["southeast", "southwest", "northeast", "northwest"])
      .padding(0.05); // This is important: it is the space between 2 groups. 0 means no padding. 1 is the maximum.
    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    // Features of the histogram
    var histogram = d3
      .histogram()
      .domain(y.domain())
      .thresholds(y.ticks(20)) // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
      .value((d) => d);
    console.log(data);
    // Replace d3.nest() with d3.group()
    const groupedData = d3.group(data, (d) => d.region);

    const sumstat = Array.from(groupedData, ([key, values]) => {
      let input = values.map((g) => g.charges);

      let binsGenerator = d3.histogram();
      let bins = binsGenerator(input);
      return {key: key, value: bins};
    });

    console.log(sumstat);

    // console.log(sumstat);
    // What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
    var maxNum = 0;
    for (i in sumstat) {
      allBins = sumstat[i].value;
      console.log("allBins", allBins);
      lengths = allBins.map(function (a) {
        return a.length;
      });
      longuest = d3.max(lengths);
      if (longuest > maxNum) {
        maxNum = longuest;
      }
    }

    // The maximum width of a violin must be x.bandwidth = the width dedicated to a group
    var xNum = d3
      .scaleLinear()
      .range([0, x.bandwidth()])
      .domain([-maxNum, maxNum]);

    // Add the shape to this svg!
    svg
      .selectAll("myViolin")
      .data(sumstat)
      .enter() // So now we are working group per group
      .append("g")
      .attr("transform", function (d) {
        return "translate(" + x(d.key) + " ,0)";
      }) // Translation on the right to be at the group position
      .append("path")
      .datum(function (d) {
        return d.value;
      }) // So now we are working bin per bin
      .style("stroke", "black")
      .style("stroke-width", 0.5)
      .style("fill", "salmon")
      .style("opacity", 0.75)
      .attr(
        "d",
        d3
          .area()
          .x0(function (d) {
            return xNum(-d.length);
          })
          .x1(function (d) {
            return xNum(d.length);
          })
          .y(function (d) {
            return y(d.x0);
          })
          .curve(d3.curveCatmullRom) // This makes the line smoother to give the violin appearance. Try d3.curveStep to see the difference
      );
  }

  // Scatter plot
  const svg = d3
    .select("#scatter-plot")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%");
  const containerWidth = +svg.style("width").replace("px", "");
  const containerHeight = +svg.style("height").replace("px", "");

  const margin = {top: 40, right: 40, bottom: 40, left: 50};
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.age))
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.charges))
    .range([height, 0]);

  const xAxis = d3
    .axisBottom(xScale)
    .tickSize(-height)
    .ticks(6)
    .tickFormat(d3.format("d"));
  const yAxis = d3.axisLeft(yScale).tickSize(-width);

  const circleSize = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.bmi)) // 데이터에서 최소 및 최대 BMI 값을 계산합니다.
    .range([0, 15]); // 원하는 원 크기의 최소 및 최대 값을 설정합니다.

  const scatterPlot = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  scatterPlot
    .append("clipPath")
    .attr("id", "scatterPlotClip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", height);

  scatterPlot
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)
    .attr("class", "x-axis");

  scatterPlot.append("g").call(yAxis).attr("class", "y-axis");

  const scatterTooltip = d3
    .select("#scatter-plot")
    .append("div")
    .style("position", "absolute")
    // .style("visibility", "hidden")
    .style("opacity", 0)
    .style("background-color", "white")
    .style("color", "black")
    .style("border", "1px solid black")
    .style("padding", "5px")
    .style("font-size", "12px");

  const showTooltip = function (event, d) {
    // console.log(1);
    // console.log(d.age);
    scatterTooltip.html(`
                Age: ${d.age}<br>
                Sex: ${d.sex}<br>
                BMI Level: ${d.bmiCategory}<br>
                BMI: ${d.bmi}<br>
                Children: ${d.children}<br>
                Smoker: ${d.smoker}<br>
                Region: ${d.region}<br>
                Charges: ${d.charges}<br>
            `);
    //   return scatterTooltip.style("visibility", "visible");
    return scatterTooltip
      .style("opacity", 1)
      .style("top", event.y - 10 + "px")
      .style("left", event.x + 10 + "px");
  };

  const hideTooltip = function () {
    return scatterTooltip.style("opacity", 0);
  };

  scatterPlot
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => xScale(d.age))
    .attr("cy", (d) => yScale(d.charges))
    // .attr("r", 3)
    .attr("r", (d) => circleSize(d.bmi)) // 수정: 원의 크기를 d.bmi 값에 비례하게 조절합니다.
    .style("fill", "steelblue")
    .style("stroke", "black")
    .style("stroke-width", 0.5)
    .style("opacity", 0.5)
    .attr("clip-path", "url(#scatterPlotClip)")
    .on("mouseover", showTooltip)
    // .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip); // 추가: Clip path를 원에 적용합니다.

  d3.select(".y-axis")
    .selectAll(".tick line")
    .attr("stroke", "#aaa")
    .attr("stroke-dasharray", 2);

  d3.select(".x-axis")
    .selectAll(".tick line")
    .attr("stroke", "#aaa")
    .attr("stroke-dasharray", 2);

  createMosaicPlot(data);
  createViolinPlot(data);

  const ageExtent = d3.extent(data, (d) => d.age);

  const slider = d3
    .sliderBottom()
    .min(ageExtent[0])
    .max(ageExtent[1])
    .width(width)
    .default(ageExtent)
    .step(1)
    .on("onchange", (range) => {
      // 원래의 원 전부를 포함하는 데이터를 이용하여 모든 원을 생성하거나 갱신합니다.
      scatterPlot
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", (d) => xScale(d.age))
        .attr("cy", (d) => yScale(d.charges));

      const roundedRange = range.map(Math.round);

      // 주어진 범위 안에 없는 원을 필터링 후 hidden 클래스로 표시합니다.
      scatterPlot
        .selectAll("circle")
        .attr("class", (d) =>
          d.age >= roundedRange[0] && d.age <= roundedRange[1] ? "" : "hidden"
        );

      // 필터링 된 데이터에만 맞춰 xScale을 갱신합니다.
      xScale.domain(roundedRange);
      scatterPlot.select(".x-axis").call(xAxis);
      const filteredData = data.filter(
        (d) => d.age >= range[0] && d.age <= range[1]
      );
      //   console.log(filteredData);
      document.getElementById("mosaic-plot").innerHTML = "";
      createMosaicPlot(filteredData);
      document.getElementById("violin-plot").innerHTML = "";
      createViolinPlot(filteredData);
    });
  d3.select("#slider")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", 100)
    .append("g")
    .attr("transform", `translate(${margin.left},30)`)
    .call(slider);

  // Mosaic plot
  function createMosaicPlot(data) {
    const tempNestedData = d3.rollup(
      data,
      (v) => v.length,
      (d) => d.smoker,
      (d) => d.sex,
      (d) => d.bmiCategory
    );

    // console.log(tempNestedData);
    const nestedData = Array.from(tempNestedData, ([smoker, sexData]) => {
      let smokerCount = 0;
      return {
        smoker,
        values: Array.from(sexData, ([sex, bmiData]) => {
          let sexCount = 0;
          return {
            sex,
            values: Array.from(bmiData, ([bmiCategory, count]) => {
              sexCount += count;
              smokerCount += count;
              return {
                bmiCategory,
                count,
              };
            }),
            count: sexCount,
          };
        }),
        count: smokerCount,
      };
    });
    // console.log(nestedData);

    const mosaicWidth = 300;
    const mosaicHeight = mosaicWidth;

    const nestedKeys = nestedData.map(({smoker}) => smoker);
    const nestedSexKeys = Array.from(
      new Set(nestedData.flatMap(({values}) => values.map(({sex}) => sex)))
    );
    const nestedBmiKeys = Array.from(
      new Set(
        nestedData.flatMap(({values}) =>
          values.flatMap(({values}) =>
            values.map(({bmiCategory}) => bmiCategory)
          )
        )
      )
    );

    // Calculate total count for all categories (for normalization)
    const totalCount = d3.sum(nestedData, (d) =>
      d3.sum(d.values, (v) => d3.sum(v.values, (b) => b.count))
    );
    // Set up scales for each dimension of the mosaic plot
    const x0 = d3.scaleBand().domain(nestedKeys).range([0, mosaicWidth]);
    const x1 = d3.scaleBand().domain(nestedSexKeys).range([0, x0.bandwidth()]);
    const x2 = d3.scaleBand().domain(nestedBmiKeys).range([0, x1.bandwidth()]);
    const y = d3.scaleLinear().domain([0, 1]).range([mosaicHeight, 0]);

    // Create mosaic plot SVG container
    const mosaicSvg = d3
      .select("#mosaic-plot")
      .append("svg")
      .attr("width", mosaicWidth)
      .attr("height", mosaicHeight);
    // .attr("height", "100%");

    mosaicSvg
      .append("rect")
      .attr("width", mosaicWidth)
      .attr("height", mosaicHeight)
      .style("stroke", "black") // Set the stroke color for the border
      .style("fill", "none") // Make sure the inner part of the rectangle is transparent
      .style("stroke-width", 2); // Set the border width
    // Tooltip을 위한 div 요소 선택
    const mosaicTooltip = d3.select("#mosaic-tooltip");

    nestedData.forEach((smokerData) => {
      smokerData.values.forEach((sexData) => {
        let yOffset = 0;
        sexData.values.forEach((bmiData) => {
          var tempX;
          var tempY;
          var tempW;
          var tempH;
          var tempC;
          var tempB;
          var tempO;
          if (smokerData.smoker == "yes") {
            tempY = 0;
            tempH = (smokerData.count * mosaicHeight) / data.length;
          } else {
            tempY =
              ((data.length - smokerData.count) * mosaicWidth) / data.length;
            tempH = (smokerData.count * mosaicHeight) / data.length;
          }
          if (sexData.sex == "female") {
            tempX = 0;
            if (smokerData.smoker == "yes") {
              tempW = (sexData.count * mosaicWidth) / smokerData.count;
              tempC = sexData.count;
              tempB = "#D3D3D3";
            } else {
              tempW = (sexData.count * mosaicWidth) / smokerData.count;
              tempC = sexData.count;
              tempB = "#AFEEEE";
            }
          } else {
            if (smokerData.smoker == "yes") {
              tempX =
                ((smokerData.count - sexData.count) * mosaicWidth) /
                smokerData.count;
              tempW = (sexData.count * mosaicWidth) / smokerData.count;
              tempC = sexData.count;
              tempB = "steelblue";
            } else {
              tempX =
                ((smokerData.count - sexData.count) * mosaicWidth) /
                smokerData.count;
              tempW = (sexData.count * mosaicWidth) / smokerData.count;
              tempC = sexData.count;
              tempB = "#B0C4DE";
            }
          }

          if (bmiData.bmiCategory == "extreme") tempO = 0.75;
          else if (bmiData.bmiCategory == "obesity") tempO = 0.5;
          else if (bmiData.bmiCategory == "over") tempO = 0.3;
          else if (bmiData.bmiCategory == "normal") tempO = 0.2;
          else tempO = 0.05;
          const rectHeight = (tempH * bmiData.count) / tempC;

          mosaicSvg
            .append("rect")
            // .attr("x", x0(smokerData.smoker) + x1(sexData.sex))
            // .attr("y", mosaicHeight - yOffset - rectHeight)
            .attr("x", tempX)
            .attr("y", tempY + yOffset)
            // .attr("width", x0.bandwidth())
            .attr("width", tempW)
            .attr("height", rectHeight)
            // .attr("fill", "transparent")
            .attr("fill", tempB)
            // .attr("opacity", 0.5)
            .attr("opacity", tempO)
            .attr("stroke", "black")
            .style("stroke-width", 1)
            // 각 사각형에 mouseover 이벤트 추가
            .on("mouseover", (event, d) => {
              console.log("auaicn");
              console.log(mosaicTooltip);

              mosaicTooltip
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 30 + "px")
                .style("opacity", 1)
                .style("background-color", "white")
                .style("color", "black")
                // .style("border-color", "black")
                .style("border", "1px solid black")
                // .style("border-radius", "5px")
                .style("padding", "5px")
                .style("font-size", "12px")
                .style("pointer-events", "none")
                .html(
                  `BMI Level: ${bmiData.bmiCategory} <br> Smoke: ${smokerData.smoker} <br> Sex: ${sexData.sex} <br> Count: ${bmiData.count}`
                );
            })
            // 각 사각형에 mouseout 이벤트 추가
            .on("mouseout", (event, d) => {
              mosaicTooltip.style("opacity", 0);
            })
            .on("click", (event) => {
              // 클릭한 사각형에 저장된 datum 객체를 사용합니다.
              scatterPlot.selectAll("circle").style("fill", (circle) => {
                if (
                  circle.sex === sexData.sex &&
                  circle.smoker === smokerData.smoker &&
                  circle.bmiCategory === bmiData.bmiCategory
                ) {
                  return "red";
                } else {
                  return "gray";
                }
              });
            });

          yOffset += rectHeight;
        });
      });
    });

    // Adding labels (optional)
    const axisLabelsG = mosaicSvg.append("g").attr("class", "axis-labels");
  }
});
