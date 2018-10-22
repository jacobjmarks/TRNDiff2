$(document).ready(() => {    
    graph = $("#directed-graph #body");

    graph.height(Math.max(500, $(document).height() - graph.offset().top - 15));

    let nodes = [];
    
    tfNetwork.forEach(r => {
        if (nodes.find(n => n.id == r.regulonId)) return;
        nodes.push({
            id: r.regulatorName.toLowerCase(),
            label: r.regulatorName
        })
    });

    let edges = [];

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