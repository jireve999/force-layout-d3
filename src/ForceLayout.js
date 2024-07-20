import React, { useEffect, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { forceSimulation, forceManyBody, forceCenter, forceCollide, forceLink } from 'd3-force';
import { pack, hierarchy } from 'd3-hierarchy';
import { drag } from 'd3-drag';
import './ForceLayout.css';

const ForceLayout = () => {
  const svgRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 400;

    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const data = [
      { id: 1, label: 'A', radius: 40 },
      { id: 2, label: 'B', radius: 25 },
      { id: 3, label: 'C', radius: 60 },
      { id: 4, label: 'D', radius: 45 },
    ];

    // Create links between all pairs of nodes
    const links = data.flatMap((d, i) => 
      data.slice(i+1).map(d2 => ({source: d.id, target: d2.id}))
    );

    // Pre-compute initial positions
    const packLayout = pack()
      .size([width, height])
      .padding(5);

    const root = hierarchy({children: data})
      .sum(d => d.radius * d.radius);

    const packedData = packLayout(root).leaves();

    data.forEach((d, i) => {
      d.x = packedData[i].x;
      d.y = packedData[i].y;
    });

    // Create collision force
    const collision = forceCollide().radius(d => d.radius + 1).strength(1).iterations(4);

    const simulation = forceSimulation(data)
      // Nodes repel each other (reduced strength)
      .force("charge", forceManyBody().strength(-50))
      // Pull nodes towards the center (increased strength)
      .force("center", forceCenter(width / 2, height / 2).strength(0.1))
      // Prevent nodes from overlapping
      .force("collision", collision)
      // Add links between nodes (reduced distance)
      .force("link", forceLink(links).id(d => d.id).distance(10).strength(0.3));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);

    const nodes = svg.append("g")
      .selectAll("g")
      .data(data)
      .enter()
      .append("g");

    nodes.append("circle")
      .attr("r", d => d.radius)
      .style("fill", "lightblue")
      .style("stroke", "steelblue");

    nodes.append("text")
      .text(d => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("font-size", "12px")
      .style("font-weight", "bold");

    // Set up drag behavior
    const dragBehavior = drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

    nodes.call(dragBehavior);

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Initial position update
    updatePositions();

    // Update positions on each tick of the simulation
    simulation.on("tick", () => {
      // Apply collision detection manually
      for (let i = 0; i < 6; i++) {
        collision(data);
      }

      updatePositions();
    });

    function updatePositions() {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      nodes.attr("transform", d => `translate(${d.x},${d.y})`);
    }

    // Set loading to false after a short delay
    setTimeout(() => {
      setIsLoading(false);
      simulation.alpha(0.1).restart(); // Start with a low alpha to reduce initial movement
    }, 100);

    // Clean up function to stop the simulation when the component unmounts
    return () => {
      simulation.stop();
    };
  }, []);

  return (
    <div className="force-layout-container">
      <svg ref={svgRef} className={isLoading ? 'loading' : ''}></svg>
    </div>
  );
};

export default ForceLayout;