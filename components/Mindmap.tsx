
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MindmapNode } from '../types';

interface MindmapProps {
  data: MindmapNode;
}

export const Mindmap: React.FC<MindmapProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const width = 800;
    const height = 500;
    const margin = { top: 20, right: 90, bottom: 20, left: 90 };

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tree = d3.tree<MindmapNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right]);
    const root = d3.hierarchy(data);
    tree(root);

    // Links
    g.selectAll(".link")
      .data(root.links())
      .enter().append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 2)
      .attr("d", d3.linkHorizontal<any, any>()
        .x(d => d.y)
        .y(d => d.x));

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
      .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
      .attr("r", 6)
      .attr("fill", d => d.children ? "#4f46e5" : "#fff")
      .attr("stroke", "#4f46e5")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", ".35em")
      .attr("x", d => d.children ? -10 : 10)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill", "#1e293b")
      .clone(true).lower()
      .attr("stroke", "white")
      .attr("stroke-width", 3);

  }, [data]);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 overflow-auto">
      <h3 className="text-lg font-bold mb-4">Interactieve Mindmap</h3>
      <div className="flex justify-center">
        <svg ref={svgRef} className="max-w-full h-auto"></svg>
      </div>
    </div>
  );
};
