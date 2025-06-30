import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Graph from 'react-graph-vis';

const analyzeCausality = async (file, method, lags, window) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("method", method);
    formData.append("lags", String(lags));
    formData.append("window", String(window));

    const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Server error");
    }

    return response.json();
};

const GraphViewer = ({ graphData }) => {
    if (!graphData || !graphData.nodes || !graphData.edges) {
        return null; 
    }

    const [network, setNetwork] = useState(null);

    useEffect(() => {
        if (network) {
            network.setOptions({ physics: true });
        }
    }, [graphData, network]);

    const { nodes, edges } = graphData;

    const transformedNodes = nodes.map(node => ({
        id: node,
        label: node
    }));

    const transformedLinks = edges.map(link => ({
        from: link.source,
        to: link.target,
        label: `W: ${link.weight.toFixed(2)}, L: ${link.lag}`
    }));

    const graph = {
        nodes: transformedNodes,
        edges: transformedLinks
    };

    const options = {
        layout: {
            hierarchical: false
        },
        edges: {
            color: "#FFFFFF",
            arrows: {
                to: {
                    enabled: true,
                    scaleFactor: 1
                }
            }
        },
        nodes: {
            shape: 'ellipse',
            size: 25,
            font: {
                color: '#ffffff'
            }
        },
        physics: {
            forceAtlas2Based: {
                gravitationalConstant: -100,
                centralGravity: 0.01,
                springConstant: 0.08,
                springLength: 200,
                damping: 0.4,
                avoidOverlap: 1
            },
            minVelocity: 0.75,
            solver: 'forceAtlas2Based',
        },
        interaction: {
            dragNodes: true,
            dragView: true,
            zoomView: true
        }
    };

    const events = {
        stabilized: () => {
            if (network) {
                network.setOptions({ physics: false });
            }
        }
    };

    return (
        <Graph
            graph={graph}
            options={options}
            events={events}
            getNetwork={setNetwork}
            style={{ height: "800px", backgroundColor: "#242424" }}
        />
    );
};

function App() {
    const [graphData, setGraphData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const file = formData.get("file");
        const method = formData.get("method");
        const lags = Number(formData.get("lags"));
        const windowVal = Number(formData.get("window")); 

        if (file) {
            try {
                const result = await analyzeCausality(file, method, lags, windowVal);
                setGraphData(result);
            } catch (error) {
                console.error("Analysis failed", error);
            }
        }
    };

    return (
        <div className="app">
            <h1>Causal Graph Analyzer</h1>
            <form onSubmit={handleSubmit}>
                <input type="file" name="file" required />
                <input type="text" name="method" placeholder="method" required />
                <input type="number" name="lags" placeholder="lags" required />
                <input type="number" name="window" placeholder="window" required />
                <button type="submit">Analyze</button>
            </form>

            {graphData && (
                <GraphViewer graphData={graphData} />
            )}
        </div>
    );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />); 