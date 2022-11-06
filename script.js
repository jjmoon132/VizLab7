Promise.all([d3.json('airports.json'),
            d3.json('world-110m.json')])
    .then(data=>{
        let airports = data[0];
        let worldmap = data[1];

// initialization
let margin = {top:30, right:30,left:30,bottom:30};
let outHeight = 600;
let outWidth = 1500;
let width = outWidth - margin.left - margin.right,
    height = outHeight - margin.top - margin.bottom;
let pmax = d3.extent(airports.nodes, d=>d.passengers);

const svg = d3.select('.chart').append('svg')
    .attr("width", outWidth)
    .attr("height", outHeight);

const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.right})`);

let rScale = d3.scaleLinear()
    .domain(pmax)
    .range([3,10]);

let visType="force";

// set size of each node
airports.nodes.forEach(d => {
    d.r = rScale(d.passengers)    
});

const force = d3.forceSimulation(airports.nodes)
    .force("link",d3.forceLink()
        .id(d=> d.id-1)
        .links(airports.links).distance(75))
    .force("charge", d3.forceManyBody().strength(-0.5))
    .force("center",d3.forceCenter(width/2, height/2))
    .force("collide",d3.forceCollide().radius(d=>d.r+3));

    const drag = d3.drag().on("start", event => {
      if (!event.active) force.alphaTarget(3).restart();
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on("drag", event => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on("end", event => {
      force.alphaTarget(0.0);
      event.subject.fx = null;
      event.subject.fy = null;
    });
    drag.filter(event => visType === "force")

//map codes
const features = topojson.feature(worldmap,worldmap.objects.countries).features;
console.log("feautres",features);

const projection = d3
    .geoMercator()
    .fitExtent([[30,30], [width,height]], topojson.feature(worldmap,worldmap.objects.countries));

const path = d3.geoPath().projection(projection);

g.selectAll("path")
    .data(features)
    .join("path")
    .attr("d",d=>path(d))
    .attr("fill","black")
    .attr("stroke","white")
    .attr("stroke-linejoin","round");
   // .text(d=>d.properties.name);

   g.selectAll("path").attr("opacity",0);


//create links
const links = g
    .selectAll("link")
    .data(airports.links)
    .enter()
    .append("svg:line")
    .attr("class","link");

//create nodes
const nodes = g
    .selectAll("circle")
    .data(airports.nodes)
    .join("circle")
    .attr("fill", "blue")
    .attr("stroke","black")
    .attr("r", d=>d.r);

nodes.append("title").text(d=>d.name);

nodes.call(drag);

force.on("tick",()=>{
    links.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    nodes.attr("cx", d=>d.x);
    nodes.attr("cy", d=>d.y);
});

d3.selectAll("input[name=layout]").on("change", event=>{
	visType = event.target.value;// selected button
	switchLayout();
    console.log(visType);
});

function switchLayout() {
    if (visType === "map") {
          // stop the simulation
          // set the positions of links and nodes based on geo-coordinates
          // set the map opacity to 1
        airports.nodes.forEach(d => {
            d.x = projection([d.longitude, d.latitude])[0];
            d.y = projection([d.longitude, d.latitude])[1]; 
            console.log(d.x,d.y);
        });
        g.selectAll("path").attr("opacity",1);
        links
            .transition()
            .duration(1000)
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
        nodes
            .transition()
            .duration(1000)
            .attr("cx", d=>d.x)
            .attr("cy", d=>d.y);
        force.alphaTarget(1).stop();

      } else { // force layout
          // restart the simulation
          // set the map opacity to 0
          force.alphaTarget(1).restart();
        g.selectAll("path").attr("opacity",0);

      }
  };
  });
