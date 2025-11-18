import React, { useState, useEffect, useMemo } from 'react';
import Graph from 'react-graph-vis';

function GraphViewer({ graphData, analysisMethod }) {
    const [network, setNetwork] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [edgeFilter, setEdgeFilter] = useState(50);
    const [minWeight, setMinWeight] = useState(0);
    const [graphStats, setGraphStats] = useState({});
    
    // START: IMPROVEMENT - Use a more professional color scheme
    const NODE_COLOR = "#007BFF"; // A vibrant blue
    const NODE_BORDER = "#0056B3"; // Darker blue for border
    const EDGE_COLOR = "#ADB5BD"; // Light gray for subtle edges
    const HIGHLIGHT_COLOR = "#FFD700"; // Gold for highlights
    // END: IMPROVEMENT

    // IMPROVEMENT: Initialize physics to false for a stable initial view
    const [showPhysics, setShowPhysics] = useState(false);

    const filteredGraphData = useMemo(() => {
        if (!graphData || !graphData.nodes || !graphData.edges) return null;

        const sortedEdges = [...graphData.edges].sort((a, b) => 
            Math.abs(b.weight) - Math.abs(a.weight)
        );

        const filtered = sortedEdges
            .filter(edge => Math.abs(edge.weight) >= minWeight)
            .slice(0, edgeFilter);

        const nodeSet = new Set();
        filtered.forEach(edge => {
            nodeSet.add(edge.source);
            nodeSet.add(edge.target);
        });

        // IMPROVEMENT: Filter nodes based on their presence in the edge list
        const filteredNodes = graphData.nodes.filter(node => nodeSet.has(node));

        return {
            nodes: filteredNodes,
            edges: filtered,
            totalNodes: graphData.nodes.length,
            totalEdges: graphData.edges.length
        };
    }, [graphData, edgeFilter, minWeight]);

    useEffect(() => {
        if (filteredGraphData) {
            const stats = {
                totalNodes: filteredGraphData.totalNodes,
                totalEdges: filteredGraphData.totalEdges,
                displayedNodes: filteredGraphData.nodes.length,
                displayedEdges: filteredGraphData.edges.length,
                avgWeight: filteredGraphData.edges.length > 0 
                    ? filteredGraphData.edges.reduce((sum, edge) => sum + Math.abs(edge.weight), 0) / filteredGraphData.edges.length 
                    : 0
            };
            setGraphStats(stats);
        }
    }, [filteredGraphData]);
    
    // IMPROVEMENT: The physics setting can be controlled entirely through the options object
    // Removing the redundant useEffect that sets physics: false on load/update.

    if (!filteredGraphData) {
        return (
            <div className="no-data">
                <div className="no-data-icon">📊</div>
                <h3>No Analysis Data</h3>
                <p>Upload a CSV file and run analysis to see the causal graph</p>
            </div>
        );
    }

    const { nodes, edges } = filteredGraphData;

    const transformedNodes = nodes.map(node => ({
        id: node,
        label: node,
        title: node
    }));

    // START: IMPROVEMENT - Use a color scheme based on weight sign
    const transformedLinks = edges.map((link, idx) => {
        const weightAbs = Math.abs(link.weight);
        
        // Dynamic color: Green for positive, Red for negative weight (Causality)
        const edgeColor = link.weight > 0 ? "#28A745" : "#DC3545"; 
    
        return {
            id: `edge-${idx}`,
            from: link.source,
            to: link.target,
            label: weightAbs.toFixed(2),
    
            // Proper vis-network syntax
            width: Math.min(1 + weightAbs * 3, 10), // Increased width scale for better visual difference
            color: edgeColor, // Set dynamic edge color
    
            font: {
                // Reduced font size for less clutter
                size: 14, 
                color: "#FFFFFF", 
                strokeWidth: 3,
                strokeColor: "#000000",
                face: "arial",
            },
    
            title: `Weight: ${link.weight.toFixed(3)}
    P-value: ${link.p_value?.toExponential(2) || "N/A"}
    Lag: ${link.lag || "N/A"}`
        };
    });
    // END: IMPROVEMENT
    
    

    const graph = {
        nodes: transformedNodes,
        edges: transformedLinks
    };
    
    // START: IMPROVEMENT - Refined Options
    const options = {
        layout: {
          hierarchical: false, // Keep non-hierarchical for flexibility
          improvedLayout: true
        },
      
        edges: {
          color: {
            // Use a neutral/default color, but the map function above overrides it based on weight sign
            color: EDGE_COLOR, 
            highlight: HIGHLIGHT_COLOR,
            hover: HIGHLIGHT_COLOR
          },
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.9 // Slightly smaller arrows for a cleaner look
            }
          },
          width: 2,
          smooth: {
            enabled: true,
            type: "continuous"
          },
          font: {
            size: 14, // Consistent font size
            color: "#FFFFFF",
            strokeWidth: 3,
            strokeColor: "#000000",
            align: "horizontal",
            face: "arial"
          }
        },
      
        nodes: {
          shape: "dot",
          size: 25, // Slightly smaller nodes for less overlap
          borderWidth: 2, // Slightly thinner border
          color: {
            background: NODE_COLOR, // New node color
            border: NODE_BORDER,
            highlight: {
              background: HIGHLIGHT_COLOR, // Gold highlight
              border: NODE_BORDER
            },
            hover: {
              background: HIGHLIGHT_COLOR,
              border: NODE_BORDER
            }
          },
          font: {
            size: 16, // Consistent font size
            color: "#FFFFFF",
            face: "arial"
          }
        },
      
        physics: {
          enabled: showPhysics, // Controlled by the 'Rearrange' button
          solver: "forceAtlas2Based",
          forceAtlas2Based: {
            gravitationalConstant: -50, // Slightly stronger repulsion
            centralGravity: 0.005, // Slightly less central gravity
            springConstant: 0.1,
            springLength: 150, // Longer spring length to spread nodes out
            avoidOverlap: 0.8
          }
        },
      
        interaction: {
          dragNodes: true,
          dragView: true,
          zoomView: true,
          hover: true,
          tooltipDelay: 100
        }
      };
      // END: IMPROVEMENT
          

    const events = {
        stabilized: () => {
            if (network && showPhysics) {
                // IMPROVEMENT: After stabilization, set physics to false
                network.setOptions({ physics: { enabled: false } });
                setShowPhysics(false);
            }
        },
        click: (params) => {
            if (params.nodes.length > 0) {
                setSelectedNode(params.nodes[0]);
            } else {
                setSelectedNode(null);
            }
        }
    };

    return (
        <div className="graph-viewer">
            <div className="graph-header">
                <div className="graph-title">
                    <h3>{analysisMethod} Analysis</h3>
                    <div className="graph-controls">
                        <button 
                            className="control-btn"
                            onClick={() => network?.fit()}
                            title="Fit to view"
                        >
                            Fit View
                        </button>
                        <button 
                            className="control-btn"
                            onClick={() => {
                                // IMPROVEMENT: Enable physics only when rearranging
                                setShowPhysics(true);
                                network?.setOptions({ physics: { enabled: true } });
                                network?.stabilize(); // Trigger physics simulation
                            }}
                            title="Rearrange"
                        >
                            Rearrange
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats and Controls */}
            <div className="graph-stats">
                <div className="stat">
                    <span className="stat-label">Total Nodes:</span>
                    <span className="stat-value">{graphStats.totalNodes}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Total Edges:</span>
                    <span className="stat-value">{graphStats.totalEdges}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Displayed Nodes:</span>
                    <span className="stat-value highlight">{graphStats.displayedNodes}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Displayed Edges:</span>
                    <span className="stat-value highlight">{graphStats.displayedEdges}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Avg Weight:</span>
                    <span className="stat-value">{graphStats.avgWeight?.toFixed(2) || 'N/A'}</span>
                </div>
            </div>

            <div className="filter-controls">
                <div className="filter-group">
                    <label>Show Top N Edges: {edgeFilter}</label>
                    <input
                        type="range"
                        min="10"
                        // Use max of total edges or a practical limit like 500
                        max={Math.min(graphStats.totalEdges || 500, 500)} 
                        value={edgeFilter}
                        onChange={(e) => setEdgeFilter(Number(e.target.value))}
                    />
                </div>
                <div className="filter-group">
                    <label>Min Weight: {minWeight.toFixed(2)}</label>
                    <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={minWeight}
                        onChange={(e) => setMinWeight(Number(e.target.value))}
                    />
                </div>
            </div>

            {graphStats.totalEdges > edgeFilter && (
                <div className="warning-banner">
                    ⚠️ Large dataset detected. Showing top **{edgeFilter}** of **{graphStats.totalEdges}** edges. 
                    Adjust filters above to see different edges.
                </div>
            )}
            
            <div className="graph-info-footer">
                <div className="legend">
                    **Legend:** Positive Weight (Green) $\rightarrow$ Negative Weight (Red)
                </div>
                {selectedNode && (
                    <div className="node-info">
                        **Selected Node:** {selectedNode}
                    </div>
                )}
            </div>

            <div className="graph-container">
                <Graph
                    // IMPROVEMENT: Added showPhysics to key to re-render when rearranging
                    key={`${edgeFilter}-${minWeight}-${showPhysics}`} 
                    graph={graph}
                    options={options}
                    events={events}
                    getNetwork={setNetwork}
                    style={{ height: "600px" }}
                />
            </div>
        </div>
    );
}

export default GraphViewer;