$(document).ready(() => {
    $("#directed-graph #header #hide-unregulated.checkbox").checkbox({
        onChange: function() { toggleLonelyNodes(!this.checked) }
    });
    $("#directed-graph #header #hide-self-regulated.checkbox").checkbox({
        onChange: function() { toggleSelfRegulatedNodes(!this.checked) }
    });

    graph = $("#directed-graph #body");

    graph.height(Math.max(500, $(document).height() - graph.offset().top - 15));

    nodes = [];
    
    tfNetwork.forEach(r => {
        if (nodes.find(n => n.id == r.regulatorName.toLowerCase())) return;
        nodes.push({
            id: r.regulatorName.toLowerCase(),
            label: r.regulatorName
        })
    });

    edges = [];

    tfNetwork.forEach(r => {
        r.targetRegulators.forEach(tr => {
            edges.push({
                from: r.regulatorName.toLowerCase(),
                to: tr.name.toLowerCase()
            })
        })
    })

    let data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    }

    let options = {

    }

    network = new vis.Network(graph[0], data, options);
})

function toggleSelfRegulatedNodes(isVisible) {
    let updates = [];

    for (let node of nodes) {
        let connectedEdges = network.getConnectedEdges(node.id);
        if (connectedEdges.length == 1) {
            let edge = network.body.data.edges.get(connectedEdges[0]);
            if (edge.from == edge.to) updates.push({id: node.id, hidden: !isVisible, physics: isVisible});
        }
    }

    network.body.data.nodes.update(updates);
}

function toggleLonelyNodes(isVisible) {
    let updates = [];

    for (let node of nodes) {
        if (network.getConnectedEdges(node.id).length == 0) {
            updates.push({id: node.id, hidden: !isVisible, physics: isVisible});
        }
    }

    network.body.data.nodes.update(updates);
}