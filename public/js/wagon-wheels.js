//let columns = 4;

let geneSortFunc = (a, b) => a.name.localeCompare(b.name);

const goTermColors = {
    "catalytic activity":               "#8dd3c7",
    "binding":                          "#bebada",
    "transporter activity":             "#fb8072",
    "molecular function regulator":     "#80b1d3",
    "transcription regulator activity": "#fdb462",
    "molecular carrier activity":       "#b3de69",
    "molecular transducer activity":    "#fccde5",
    "cargo receptor activity":          "#d9d9d9",
    "translation regulator activity":   "#bc80bd",
    "protein tag":                      "#ccebc5",
    "antioxidant activity":             "#a6cee3",
    "structural molecule activity":     "#1f78b4",
    "molecular_function":               "#b2df8a",
    "hijacked molecular function":      "#33a02c"
};

// Colour used for genes that have a GO term not in the above list
const UNKNOWN_GO_TERM_COLOUR = "#666666";

// Sizes in pixels for zooming
const DEFAULT_SIZE = 300;
const ZOOM_INCREMENT = 50;
const MIN_SIZE = 100;
const MAX_SIZE = 1000;

// The current size of each wagon wheel
let currentSize = DEFAULT_SIZE;

// The number of wagon wheel graphs currently in the display
let numGraphs = 0;

// The lists of the current clusters in the display
let currentClusters = -1;

// For hammer drag and drop of the wagon wheels
let hammerManager;
let hammerPosition = [-1, -1];
let hammerDraggedGraph = -1;

// Current search query
let highlightQuery = -1;

$(document).ready(() => {
    $("body").append(tooltip = $("<tooltip>")
        .addClass("ui segment")
        .css("position", "absolute")
        .css("z-index", 1000)
        .css("visibility", "hidden")
        .css("padding", "10px")
        .css("background-color", "rgba(255,255,255,0.75)"))

    // Moving some initial stuff to up here out of drawWagonWheels() since
    // we can potentially go to drawClusteredWagonWheels() first
    $("#graph").show();

    // Make a variable for the regulons so they are easier to access
    regulons = regulogNetwork.regulons;

    if (regulogNetwork.clusters != null) {
        drawClusteredWagonWheels(regulogNetwork.clusters);

        // Delete the temporary clusters property
        delete regulogNetwork.clusters;
    } else {
        drawWagonWheels();
    }

    $(window).resize(() => {
        //if ($("#graph #body").html()) drawWagonWheels()
        if ($("#graph #body").html() && currentClusters != - 1) {
            drawClusteredWagonWheels(currentClusters)
        }
    })

    $("#btn-zoom-out").click(() => {
        //columns++;
        if (currentSize > MIN_SIZE) currentSize = currentSize - ZOOM_INCREMENT;
        if (currentClusters != - 1) {
            drawClusteredWagonWheels(currentClusters)
        } else {
            drawWagonWheels()
        }
    })

    $("#btn-zoom-in").click(() => {
        //if (columns > 1) columns--;
        if (currentSize < MAX_SIZE) currentSize = currentSize + ZOOM_INCREMENT;
        if (currentClusters != - 1) {
            drawClusteredWagonWheels(currentClusters)
        } else {
            drawWagonWheels()
        }
    })

    $("#btn-compare-and").click(() => { compareSelected("AND") })
    $("#btn-compare-or").click(() => { compareSelected("OR") })
    $("#btn-compare-xor").click(() => { compareSelected("XOR") })

    // Set up the hammer manager
    setUpHammer();

    // Set up the highlight search elements
    setUpQueryHighlight();
})


/**
  * Converts an angle in degrees to radians
  * @param {Number} The angle in degrees to convert
  */
function toRadians(degrees) {
    return degrees / 180 * Math.PI;
}

/**
  * Creates an SVG element
  * @param {string} The tag (type) of SVG element to create
  */
function svgElem(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

/**
  * Draws a collection of wagon wheels
  * The regulons in the loaded regulonNetwork object are used for the wagon wheel data
  */
function drawWagonWheels() {

    if (regulons.indexOf(undefined) != -1) {
        alert('Warning! Undefined value in regulon list at position ' + regulons.indexOf(undefined));
    }

    numGraphs = 0;
    currentClusters = -1;
    hammerPosition[0] = -1;
    hammerPosition[1] = -1;
    hammerDraggedGraph = -1;

    //$("#graph").show();
    //svgDivMargin = 14;
    //let svgSize = ($("#graph").width() - (svgDivMargin * columns)) / columns;
    //let svgSize = currentSize;

    //regulons = regulogNetwork.regulons;

    sortGenes();

    let graph = $("#graph #body");
    graph.empty();

    for (let regulon of regulons) {
        if (!Object.keys(regulon).includes("selectable")) regulon.selectable = true;
        drawWagonWheel(regulon, currentSize, graph);
    }

    // Redraw if available width has changed after drawing
    // (usually due to scrollbar popin)
    //if ($("#graph").width() < (svgSize + svgDivMargin) * columns) {
    //    drawWagonWheels();
    //}
}

/**
 * Draw and append a single wagonwheel of the provided regulon to the given HTML
 * element.
 * @param {JSON} regulon Regulon for which to graph
 * @param {Number} size that the new wagon whell should be set at
 * @param {Element} div HTML element to append wagonwheel
 */
function drawWagonWheel(regulon, svgSize, div) {
    numGraphs++;

    //let svgDiv = $("<div>", {id: "graph" + numGraphs})
    // I've changed the id to being the regulon's index rather than just the
    // order the graphs are made so that the graph numbering and regulon order
    // correspond
    let graphName;
    if (regulons.indexOf(regulon) != -1) {
        graphName = 'graph' + regulons.indexOf(regulon)
    } else {
        graphName = graph + numGraphs;
    }
    let svgDiv = $("<div>", {id: graphName})
        .addClass("ui card")
        .addClass("wagonwheel")
        .width(svgSize)
        .data("regulon-data", regulon)

    let spokeLength = svgSize * 0.75;
    let spokeAngle = 360 / uniqueGenes.length;

    let geneNodeRadius = Math.min(spokeLength/2 * toRadians(spokeAngle) / 2, 10);
    let geneNodePositions = (() => {
        let positions = {};
        uniqueGenes.map(g => g.name).forEach((name, i) => {
            let angle = toRadians((270 + spokeAngle * i) % 360);
            positions[name] = {
                x: svgSize / 2 + Math.cos(angle) * spokeLength/2,
                y: svgSize / 2 + Math.sin(angle) * spokeLength/2
            }
        })
        return positions;
    })();

    if (regulon.selectable) {
        svgDiv
            .on("mouseover", function() { $(this).css("cursor", "pointer"); })
            .on("mouseout", function() { $(this).css("cursor", "inherit"); })
            .click(function() {
                let div = $(this);
                if (!div.hasClass("active")) {
                    div.addClass("active");
                    div.append(
                        $("<div>").addClass("ui right corner green label").append(
                            $("<i>").addClass("check icon")
                        )
                    )
                } else {
                    div.removeClass("active");
                    div.find(".label").remove();
                }
            })
    }

    if (regulon.regulonId == regulogNetwork["selected-regulon"]) {
        svgDiv.css("border", "1px solid blue");
    }

    let svg = $(svgElem("svg"))
        .attr({
            "width": svgSize,
            "height": svgSize
        })
    svgDiv.append(svg);

    let svgFooter = $("<div>")
            .addClass("ui centered small header")
            .text(regulon.genomeName)
    svgDiv.append(svgFooter);

    for (let gene of regulon.targetGenes) {
        let to = geneNodePositions[gene.name];

        let color = goTermColors[gene.term] ? goTermColors[gene.term] : UNKNOWN_GO_TERM_COLOUR;

        updateGoTermLegend(gene.term);

        let spoke = $(svgElem("line"))
            .addClass(`gene-spoke gene-${gene.name}`)
            .attr({
                "x1": svgSize / 2,
                "y1": svgSize / 2,
                "x2": to.x,
                "y2": to.y,
                "stroke-width": 2,
                "stroke": color
            })
        svg.append(spoke);

        if (!gene.sites.length) spoke.css("stroke-dasharray", "5, 5").css("opacity", 0.5);

        function highlight(color) {
            $(`svg circle.gene-node.gene-${gene.name}`).attr("fill", color);
            $(`svg line.gene-spoke.gene-${gene.name}`).css("stroke", color);
        }

        let node = $(svgElem("circle"))
            .addClass(`gene-node gene-${gene.name}`)
            .data("gene-data", gene)
            .attr({
                "cx": to.x,
                "cy": to.y,
                "r": geneNodeRadius,
                "fill": color
            })
            .on("mouseover", () => {
                highlight("blue");

                tooltip.empty();
                tooltip.append($("<table>")
                    .append($("<tr>")
                        .append($("<td>").text("Locus Tag"))
                        .append($("<td>").text(gene.locusTag || "n/a")))
                    .append($("<tr>")
                        .append($("<td>").text("Gene Name"))
                        .append($("<td>").text(gene.name)))
                    .append($("<tr>")
                        .append($("<td>").text("Function"))
                        .append($("<td>").text(gene.function || "n/a")))
                    .append($("<tr>")
                        .append($("<td>").text("Site/s"))
                        .append($("<td>").text(gene.sites.map(s => s.sequence).join(", ") || "n/a")))
                    .append(!gene.sites.length ? null : $("<tr>")
                        .append($("<td>").text("Site Position"))
                        .append($("<td>").text(gene.sites.map(s => s.position).join(", ") || "n/a")))
                    .append(!gene.sites.length ? null : $("<tr>")
                        .append($("<td>").text("Site Score"))
                        .append($("<td>").text(gene.sites.map(s => s.score).join(", ") || "n/a")))
                )
                tooltip.css("visibility", "visible")
            })
            .on("mousemove", () => { tooltip.css("top",(event.pageY-10)+"px").css("left",(event.pageX+10)+"px") })
            //.on("mouseout", () => {
            .mouseout( function () {
                
                // Added a new condition - only remove the highlight if the
                // node currently does not have the "active" class, which is
                // toggled when clicked on
                let node = $(this);
                if (!node.hasClass("active")) {
                    highlight(color);
                }
                tooltip.css("visibility", "hidden");
            })
            // When clicking on a node, toggle the "active" class as well as
            // its highlight
            .click(function (event) {
                event.stopPropagation();
                let node = $(this);
                if (!node.hasClass("active")) {
                    node.addClass("active");
                    highlight("blue");
                } else {
                    node.removeClass("active");
                    highlight(color);
                }
            })
        svg.append(node);
    }

    let centroidRadius = Math.min(svgSize * 0.05, 10);

    let centroidMargin = $(svgElem("circle"))
        .addClass("centroid-margin")
        .attr({
            "cx": svgSize / 2,
            "cy": svgSize / 2,
            "r": centroidRadius * 1.5,
            "fill": "white"
        })
    svg.append(centroidMargin);

    let centroid = $(svgElem("circle"))
        .addClass("centroid")
        .attr({
            "cx": svgSize / 2,
            "cy": svgSize / 2,
            "r": centroidRadius
        })
        .on("mouseover", () => {
            tooltip.empty();
            tooltip
                .append($("<table>")
                    .append($("<tr>")
                        .append($("<td>").text("Locus Tag"))
                        .append($("<td>").text(regulon.regulator && regulon.regulator.locusTag || "n/a")))
                    .append($("<tr>")
                        .append($("<td>").text("Regulator Family"))
                        .append($("<td>").text(regulon.regulatorFamily)))
                    .append($("<tr>")
                        .append($("<td>").text("Regulator Name"))
                        .append($("<td>").text(regulon.regulatorName)))
                    .append($("<tr>")
                        .append($("<td>").text("Regulation Type"))
                        .append($("<td>").text(regulon.regulationType)))
                    .append($("<tr>")
                        .append($("<td>").text("Function"))
                        .append($("<td>").text(regulon.regulator && regulon.regulator.function || "n/a")))
                    .append($("<tr>")
                        .append($("<td>").text("Target Genes"))
                        .append($("<td>").text(regulon.targetGenes.length)))
                )
                .css("visibility", "visible")
        })
        .on("mousemove", () => { tooltip.css("top",(event.pageY-10)+"px").css("left",(event.pageX+10)+"px") })
        .on("mouseout", () => { tooltip.css("visibility", "hidden") })
    svg.append(centroid);

    div.append(svgDiv);

    $(".gene-node, .centroid, .centroid-margin").hover(function(e) { e.stopPropagation() });
}

/**
 * Compare all selected regulon wagonwheels with the given binary method.
 * @param {string} method Binary comparison method (AND/OR/XOR)
 */
function compareSelected(method) {
    if ($(".wagonwheel.active").toArray().length < 2) return;
    let regulons = $(".wagonwheel.active").toArray().map((ww) => $(ww).data("regulon-data"));

    let binaryGeneMatrix = regulons.map((r) => r.regulonId).map((rId) => regulogNetwork.binaryGeneMatrix[rId]);

    let resultingMatrix = '0'.repeat(uniqueGenes.length).split('');

    for (let i = 0; i < resultingMatrix.length; i++) {
        let set = false;
        for (let j = 1; j < binaryGeneMatrix.length; j++) {
            switch (method) {
                case "AND":
                    if (binaryGeneMatrix[0][i] == '1' && binaryGeneMatrix[j][i] == '1') {
                        resultingMatrix[i] = '1';
                    } else {
                        resultingMatrix[i] = '0';
                        set = true;
                    }
                    break;
                case "OR":
                    if (binaryGeneMatrix[0][i] == '1' || binaryGeneMatrix[j][i] == '1') {
                        resultingMatrix[i] = '1';
                        set = true;
                    }
                    break;
                case "XOR":
                    if (binaryGeneMatrix[0][i] != binaryGeneMatrix[j][i]) {
                        resultingMatrix[i] = '1';
                        set = true;
                    }
                    break;
                default:
                    break;
            }
            if (set) break;
        }
    }

    let result = {
        genomeName: regulons.map(r => r.genomeName).join(' [' + method + '] '),
        regulatorFamily: regulons[0].regulatorFamily,
        regulatorName: regulons[0].regulatorName,
        regulatorType: regulons[0].regulationType,
        selectable: false,
        targetGenes: []
    }

    for (let i = 0; i < resultingMatrix.length; i++) {
        if (resultingMatrix[i] == '1') result.targetGenes.push(uniqueGenesByName[i]);
    }

    // If the number of graphs is one more than the number of regulons, then
    // a comparison wheel has been created previously, and to keep the true
    // number of graphs, it should be reduced by one before drawWagonWheel is
    // called
    if (numGraphs > regulons.length) {
        numGraphs = regulons.length;
    }

    $("#graph-dimmer .content").empty();
    $("#graph-dimmer").dimmer({closable: true}).dimmer("show");

    // Added a height restriction as well, so that it is not cut off at the top and bottom
    drawWagonWheel(result, Math.min(750, $(window).width() * 0.6, $(window).height() * 0.8), $("#graph-dimmer .content"));
}

/**
  * Draws a collection of wagon wheels, separated into clusters, based on a list of lists of regulon IDs
  * @param {array} An array of arrays containing regulonId strings
  */
function drawClusteredWagonWheels(clusters) {

    if (regulons.indexOf(undefined) != -1) {
        alert('Warning! Undefined value in regulon list at position ' + regulons.indexOf(undefined));
    }

    numGraphs = 0;
    if (currentClusters != clusters) {
        currentClusters = clusters;
    }
    hammerPosition[0] = -1;
    hammerPosition[1] = -1;
    hammerDraggedGraph = -1;

    sortGenes();

    let div = $("#graph #body");
    div.empty();
    for (let i = 0; i < clusters.length; i++) {
        let clusterDiv =
        $("<div>").addClass("card")
        .width(Math.max(currentSize, (($("#graph #body").width() - (clusters.length * 28)) / clusters.length)));

        clusterDiv.append(
            $("<div>").addClass("ui centered header")
                .css("margin", "10px 10px 10px 10px")
                .text(`Cluster ${i+1}`)
        );

        // Now adding a second div so that clustered wagon wheels can appear
        // side by side
        let clusterDiv2 =
        $("<div>", {id: 'cluster' + i }).addClass("ui cards centered")
        .css("clear", "both")
        .css("min-height", currentSize + "px");

        clusterDiv.append(clusterDiv2);

        div.append(clusterDiv);
        for (let rId of clusters[i]) {
            //drawWagonWheel(regulons.find(r => r.regulonId == rId), $(clusterDiv).width(), clusterDiv);
            drawWagonWheel(regulons.find(r => r.regulonId == rId), currentSize, clusterDiv2);
        }
    }
}

/**
 * Adds an entry for the given term in the GO
 * Term color legend if it does not yet exist.
 * @param {string} term Term to add
 */
function updateGoTermLegend(term) {
    let legend = $("#goterm-legend");
    if (legend.has(`[id="${term}"]`).length < 1) {
        let xBtn = $("<i>").addClass("delete icon")
            .click((e) => {
                e.stopPropagation();
                highlightTerm(term, 1);
                xBtn.detach();
            })

        let label = $("<a>").addClass("ui large label").attr("id", term)
            .append(
                $("<i>").addClass("square icon")
                    .css("color", goTermColors[term] ? goTermColors[term] : UNKNOWN_GO_TERM_COLOUR)
            )
            .append(term)
            .click(() => {
                legend.find(".delete.icon").click();

                // If there's a highlight query, clear that before proceeding
                if (highlightQuery != -1) {
                    $("#search-query_buttonSearch").click();
                }

                highlightTerm(term, "0.2");
                label.append(xBtn);
            })

        legend.append(label);
    }
}

/**
 * Highlight all nodes that belong to the given GO term. Works by setting the
 * opacity of all ~other~ nodes to the provided value.
 * @param {string} term Term to highlight
 * @param {Number} opacity Opacity of other nodes
 */
function highlightTerm(term, opacity) {
    $.each($(".gene-node"), (i, node) => {
        let gene = $(node).data("gene-data");
        if (gene.term != term) {
            $(`svg circle.gene-node.gene-${gene.name}`).css("opacity", opacity);
            $(`svg line.gene-spoke.gene-${gene.name}`).css("opacity", opacity);
        };
    })
}


/**
  * Sort all genes in the current set of regulons based on the current gene
  * sort function
  */
function sortGenes() {
    uniqueGenes = regulons
                    .map(r => r.targetGenes)
                    .reduce((a, b) => a.concat(b), [])
                    .reduce((a, b) => {
                        if (!a.find(g => g.name == b.name)) {
                            a.push(b);
                        }
                        return a;
                    }, [])
                    .sort(geneSortFunc)

    if (!window.uniqueGenesByName) {
        uniqueGenesByName = [...uniqueGenes].sort((a, b) => a.name.localeCompare(b.name));
    }
}

/**
  * Sets up the Hammer event listeners
  * Currently has events for 'tap', 'doubletap', 'panleft/panright/panup/pandown', 'panstart', 'panend' and 'pancancel'
  * Hammer manager is set for the container which wagon wheels are inserted into
  */
function setUpHammer() {
    hammerManager = new Hammer.Manager(document.getElementById('body'));

    var Pan = new Hammer.Pan();
    var Tap = new Hammer.Tap({
      taps: 1
    });
    var DoubleTap = new Hammer.Tap({
      event: 'doubletap',
      taps: 2
    });
    DoubleTap.recognizeWith([Tap]);
    Tap.requireFailure([DoubleTap]);

    hammerManager.add(Pan);
    hammerManager.add(DoubleTap);
    hammerManager.add(Tap);

    hammerManager.on('panleft panright panup pandown', function (ev) {
        hammerPan(ev);
    });
    hammerManager.on('panstart', function (ev) {
        hammerPanStart(ev);
    });
    hammerManager.on('panend', function (ev) {
        hammerPanEnd(ev);
    });
    hammerManager.on('pancancel', function (ev) {
        hammerPanCancel(ev);
    });
    hammerManager.on('tap', function (ev) {
        console.log('Hammer tap occured');
        //document.getElementById('body').style.backgroundColor = "orange";
    });
    hammerManager.set({ direction: 30, domEvents: true, enable: true });
}

/**
  * Event listener for Hammer 'panleft/panright/panup/pandown' events
  * Moves the position of a dragged wagon wheel if one is currently being dragged
  * @param {event} The parameters of the Hammer event
  */
function hammerPan (ev) {
    console.log('Hammer pan occured');
    //document.getElementById('body').style.backgroundColor = "green";

    // Only do something if a graph is already being dragged
    if (hammerDraggedGraph != -1) {

        // Place the graph in the new location, based on adding the current
        // distance panned to the stored distance. The distance is counted
        // from the initial touch position
        hammerDraggedGraph.style.left = hammerPosition[0] + ev.deltaX + "px";
        hammerDraggedGraph.style.top = hammerPosition[1] + ev.deltaY + "px";
    }
}

/**
  * Event listener for Hammer 'panstart' events
  * If the event started on a graph, set that graph as being dragged and set its attributes to allow change of position
  * @param {event} The parameters of the Hammer event
  */
function hammerPanStart (ev) {
    console.log('Hammer panstart occured');
    //document.getElementById('body').style.backgroundColor = "blue";

    // Only do something if a graph is not already being dragged
    if (hammerDraggedGraph == -1) {
        // Get the location of the event
        let x = ev.center.x;
        let y = ev.center.y;

        //console.log('Coordinates are ' + x + ', ' + y);

        // https://stackoverflow.com/questions/3464876/javascript-get-window-x-y-position-for-scroll
        let doc = document.documentElement;
        let mouseX = x + (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
        let mouseY = y + (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

        //console.log('Calculated absolute coordinates are ' + mouseX + ', ' + mouseY);
        console.log('Mouse coordinates are ' + mouseX + ', ' + mouseY);

        let currentGraphIndex = -1;
        let currentGraphPosition = -1;

        // For every graph, check if the event occurred inside their container
        //for (let i = 0; i < numGraphs; i++) {
        for (let i = 0; i < regulons.length; i++) {

            currentGraphPosition = $('#graph' + i).offset();
            let width = $('#graph' + i).width();
            let height = $('#graph' + i).height();
            console.log('Wheel ' + i + ' top left is at ' + currentGraphPosition.left + ', ' + currentGraphPosition.top + '; height and width are ' + height + ', ' + width);

            if (mouseX >= currentGraphPosition.left && mouseX <= currentGraphPosition.left + width && mouseY >= currentGraphPosition.top && mouseY <= currentGraphPosition.top + height) {
                console.log('Pan was inside graph' + i);
                currentGraphIndex = i;
                break;
            }
        }

        // Don't do anything if the pan wasn't in a graph
        if (currentGraphIndex == -1) return;

        // Get the graph's cluster as well if there are clusters
        let currentClusterIndex = -1;
        if (currentClusters != -1) {
            for (let i = 0; i < currentClusters.length; i++) {

                let currentClusterPosition = $('#cluster' + i).offset();
                let width = $('#cluster' + i).width();
                let height = $('#cluster' + i).height();
                console.log('Cluster ' + i + ' top left is at ' + currentClusterPosition.left + ', ' + currentClusterPosition.top + '; height and width are ' + height + ', ' + width);

                if (mouseX >= currentClusterPosition.left && mouseX <= currentClusterPosition.left + width && mouseY >= currentClusterPosition.top && mouseY <= currentClusterPosition.top + height) {
                    console.log('Pan was inside cluster' + i);
                    currentClusterIndex = i;
                    break;
                }
            }
        }

        // Get the graph element
        hammerDraggedGraph = document.getElementById('graph' + currentGraphIndex);

        // Init hammer positions for the graph to be dragged
        if (hammerPosition == null) {
            hammerPosition = [ -1, -1 ];
        }

        // Calculate exact top left position for the graph relative to the
        // parent element
        let parentPosition;
        if (currentClusterIndex != -1) {
            parentPosition = $('#cluster' + currentClusterIndex).offset();
        } else {
            parentPosition = $('#body').offset();
        }
        let leftPosition = currentGraphPosition.left - parentPosition.left;
        let topPosition = currentGraphPosition.top - parentPosition.top;

        // If the current location hasn't been stored yet, store the X and
        // Y position from the above, as well as applying it as attributes
        // to the graph, and making it absolute positioned
        if (hammerPosition[0] == -1) {
            hammerDraggedGraph.style.left = leftPosition + "px";
            hammerPosition[0] = leftPosition;
            hammerDraggedGraph.style.top = topPosition + "px";
            hammerPosition[1] = topPosition;
            hammerDraggedGraph.style.position = "absolute";
            hammerDraggedGraph.style.zIndex = 5;
        }
    }
}

/**
  * Event listener for Hammer 'panend' events
  * Determines where a dragged wagon wheel was dropped relative to the other wheels and then redraws the wagon wheels in the new order
  * @param {event} The parameters of the Hammer event
  */
function hammerPanEnd (ev) {
    console.log('Hammer panend occured');
    //document.getElementById('body').style.backgroundColor = "yellow";

    // Only do something if a graph is already being dragged
    if (hammerDraggedGraph != -1) {

        // Get the location of the event
        let x = ev.center.x;
        let y = ev.center.y;

        // https://stackoverflow.com/questions/3464876/javascript-get-window-x-y-position-for-scroll
        let doc = document.documentElement;
        let mouseX = x + (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
        let mouseY = y + (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        console.log('Mouse coordinates are ' + mouseX + ', ' + mouseY);

        // Check to see what the new order should be

        // To (eventually) create the order, both the graph ids to consider
        // and the regulon ids are required

        // Get the ones for the dragged graph first
        // The graph's number is extracted from the id it was given when
        // created
        let draggedGraphNumber = parseInt(hammerDraggedGraph.id.substring(5));
        let draggedGraphRegulonId = regulons[draggedGraphNumber].regulonId;
        console.log("graph " + draggedGraphNumber + "(" + regulons[draggedGraphNumber].genomeName + ") was the graph being dragged");

        // The index of the wheel is not necessarily the same as the
        // number, in the case of re-ordered clusters. In this case we find
        // the index of the correct regulonId in the correct cluster
        let draggedGraphIndex;
        if (currentClusters != -1) {
            for (let i = 0; i < currentClusters.length; i++) {
                if (currentClusters[i].indexOf(draggedGraphRegulonId) != -1) {
                    draggedGraphIndex = currentClusters[i].indexOf(draggedGraphRegulonId);
                    break;
                }
            }
        }

        // Because wheels are given a number based on the order of regulons
        // in regulonNetwork, and the wheels are recreated when the order
        // is changed either with a sort function or through this drag and
        // drop, it can be assumed that the index of the dragged wheel is
        // the same as that of the regulon that gave it its number - hence
        // the same as draggedGraphNumber
        else {
            draggedGraphIndex = draggedGraphNumber;
        }

        // The list of graphs to compare the positions against
        let graphsToCompare = [];

        // Clustered graphs need to be considered differently, so check for
        // that case first. We also need to check which cluster the graph
        // was dragged to, and which it started in
        let currentClusterIndex = -1;
        let oldClusterIndex = -1;
        if (currentClusters != -1) {

            // First, get the *max* cluster div height. The hidden div that
            // contains the graphs only "exists" directly around the graph
            // elements, so if a cluster has less graphs than another, the
            // div may not "exist" in the entire visible cluster. Using the
            // largest cluster height will ensure that if a user drags a
            // graph into a cluster, it will be put in that cluster
            let MaxClusterHeight = 0;
            for (let i = 0; i < currentClusters.length; i++) {
                if (MaxClusterHeight < $('#cluster' + i).height()) {
                    MaxClusterHeight = $('#cluster' + i).height();
                }
            }

            // For all clusters...
            for (let i = 0; i < currentClusters.length; i++) {

                if (currentClusterIndex == -1) {
                    // Get the position and dimensions of the cluster container
                    // to see if the mouse position is inside it
                    let currentClusterPosition = $('#cluster' + i).offset();
                    let width = $('#cluster' + i).width();
                    //let height = $('#cluster' + i).height();
                    let height = MaxClusterHeight;
                    //console.log('Cluster ' + i + ' top left is at ' + currentClusterPosition.left + ', ' + currentClusterPosition.top + '; height and width are ' + height + ', ' + width);
                    console.log('Cluster ' + i + ' top left is at ' + currentClusterPosition.left + ', ' + currentClusterPosition.top + '; height and width are treated as ' + height + ', ' + width);

                    // If the mouse is inside the current cluster, store the
                    // cluster's index
                    if (mouseX >= currentClusterPosition.left && mouseX <= currentClusterPosition.left + width && mouseY >= currentClusterPosition.top && mouseY <= currentClusterPosition.top + height) {
                        console.log('Pan was inside cluster' + i);
                        currentClusterIndex = i;
                    }
                }

                if (oldClusterIndex == -1) {
                    // Also check if this is original cluster for this graph (so it can be
                    // removed from it if it is a different one)
                    if (currentClusters[i].indexOf(draggedGraphRegulonId) != -1) {
                        oldClusterIndex = i;
                    }
                }
            }

            // If the mouse is not over any cluster, end the drag without
            // changing the position of anything
            if (currentClusterIndex == -1) {
                console.log("graph " + draggedGraphNumber + "(" + regulons[draggedGraphNumber].genomeName + ") was dragged outside of the clusters, so don't do anything");
                resetDraggedWheel();
                return;

            // Otherwise get the graph indexes of all the graphs in that
            // cluster (except for the dragged graph if it was in that
            // cluster as well)
            } else {
                console.log("graph " + draggedGraphNumber + "(" + regulons[draggedGraphNumber].genomeName + ") was dragged from cluster " + oldClusterIndex + " to cluster " + currentClusterIndex);

                // For every regulonId listed in the current cluster...
                for (let regulonId of currentClusters[currentClusterIndex]) {

                    // Get the corresponding regulon object and store
                    // its index in the list of regulons, which should
                    // be the same as the graph's id number
                    let regulon = regulons.find(r => r.regulonId == regulonId);
                    graphsToCompare.push(regulons.indexOf(regulon));
                }
            }

        // Otherwise just list all graphs
        } else {
            //for (let i = 0; i < numGraphs; i++) {
            for (let i = 0; i < regulons.length; i++) {
                graphsToCompare.push(i);
            }
        }

        // The current index of the graph that is closest to the mouse X
        // and Y
        let closestGraphIndex = -1;

        // The current closest distance between a non-dragged graph and the
        // mouse X and Y
        let closestDistance = Number.MAX_SAFE_INTEGER;

        //For every network in the container, check its actual distance
        //from the mouse cursor's position
        console.log("Determining the closest graph to the drop position");

        // For each graph in the list of graphs in the target group...
        for (let i = 0; i < graphsToCompare.length; i++) {

            // If it is not the dragged graph...
            if (graphsToCompare[i] != draggedGraphNumber) {

                //Calculate the centre of the current network
                let compareGraphPosition = $('#graph' + graphsToCompare[i]).offset();
                let compareGraphWidth = $('#graph' + graphsToCompare[i]).width();
                let compareGraphHeight = $('#graph' + graphsToCompare[i]).height();

                let compareGraphCenterX = compareGraphPosition.left + (compareGraphWidth / 2);
                let compareGraphCenterY = compareGraphPosition.top + (compareGraphHeight / 2);

                console.log('graph ' + graphsToCompare[i] + "(" + regulons[graphsToCompare[i]].genomeName + ", index " + i + ") centre = " + compareGraphCenterX + ", " + compareGraphCenterY);

                //Determine the distance between the current centre and the
                //touch's position using Pythagoras
                let currentDistance = Math.sqrt(Math.pow(mouseX - compareGraphCenterX, 2) + Math.pow(mouseY - compareGraphCenterY, 2));

                console.log('graph ' + graphsToCompare[i] + "(" + regulons[graphsToCompare[i]].genomeName + ", index " + i + ") centre is " + currentDistance + " away.");

                //If the calculated distance is less than the current closest,
                //this network is the new closest
                if (currentDistance < closestDistance) {
                    closestDistance = currentDistance;
                    closestGraphIndex = i;

                    console.log('graph ' + graphsToCompare[i] + "(" + regulons[graphsToCompare[i]].genomeName + ", index " + i + ") is the new closest.");
                }
            }
        }

        // If we found a closest network, determine where the dragged graph
        // will be placed. If it is horizontally to the left of the closest
        // network, place it in front of it. If it is horizontally to the
        // right, place it behind it. There is an also a special case if
        // the closest graph is below everything in the container, in which
        // case it should always appear at the end
        if (closestGraphIndex > -1) {

            let newPosition = -1;

            //If the dragged location is:
            //- Closest to the last network in the container (if the container
            //is not empty), and the drop point was to the right, or completely
            //underneath, or
            //- To the right and below the top left corner of the last
            //  network
            //      - put the dropped network last
            //- To the left and below the top left corner of the bottom
            //  left network
            //      - put the dropped network in place of that network

            // Get the X and Y coordinates of the "last" graph in the
            // container
            let lastGraphIndex = -1;

            if (graphsToCompare[graphsToCompare.length - 1] == draggedGraphNumber) {
                lastGraphIndex = graphsToCompare.length - 2;
            } else {
                lastGraphIndex = graphsToCompare.length - 1;
            }
            let lastGraphPosition = $('#graph' + graphsToCompare[lastGraphIndex]).offset();
            let lastGraphWidth = $('#graph' + graphsToCompare[lastGraphIndex]).width();
            let lastGraphHeight = $('#graph' + graphsToCompare[lastGraphIndex]).height();
            let lastGraphX = lastGraphPosition.left;
            let lastGraphY = lastGraphPosition.top;

            //Find the network that is at the bottom left
            let bottomLeftGraphIndex = -1;
            let bottomLeftGraphX = Number.MAX_SAFE_INTEGER;

            // For each graph in the list of graphs in the target group
            for (let i = 0; i < graphsToCompare.length; i++) {

                // If it is not the dragged graph...
                if (graphsToCompare[i] != draggedGraphNumber) {

                    // Get that graph's X and Y coordinates
                    let compareGraphPosition = $('#graph' + graphsToCompare[i]).offset();
                    let compareGraphX = compareGraphPosition.left;
                    let compareGraphY = compareGraphPosition.top;

                    // If this graph is on the same Y value as the last graph,
                    // and its X coordinate is less than the X coordinate of
                    // the current "bottom left" network, store it and its
                    // X coordinate
                    if (compareGraphY == lastGraphY && compareGraphX < bottomLeftGraphX) {
                        bottomLeftGraphX = compareGraphX;
                        bottomLeftGraphIndex = i;
                    }
                }
            }

            // If there is a "last" graph and the mouse X and Y is greater
            // than that graph's X and Y, put the dragged graph at the end
            // of the group
            if ((mouseX > lastGraphX + lastGraphWidth && mouseY > lastGraphY) || (mouseY > lastGraphY + lastGraphHeight && mouseX > lastGraphX)) {

                // If the wheel was moved to a new cluster, *or* was the
                // last graph originally, add one to the index
                if (oldClusterIndex != currentClusterIndex || (graphsToCompare[graphsToCompare.length - 1] == draggedGraphNumber)) {
                    newPosition = lastGraphIndex + 1;
                } else {
                    newPosition = lastGraphIndex;
                }
                console.log("The drop location is to the right and below the last graph - put the dragged graph at the end of the container");
            }

            // Else, if there is a "bottom left" graph and the mouse X is
            // less than its X coordinate, and more than its Y coordinate,
            // put the dragged graph in front of that graph
            else if ((mouseX < bottomLeftGraphX) && (mouseY > lastGraphY)) {
                newPosition = bottomLeftGraphIndex;

                // If the graph is moving to a position *after* its
                // original position, subtract one from the new index
                if (newPosition > draggedGraphIndex) {
                    newPosition -= 1;
                }
                console.log("The drop location is to the left and below the bottom left graph - put the dragged graph in front of it in the order");
            }

            // Otherwise, if it's not too far down, check if it is left or
            // right of the closest graph
            else {
                let closestGraphPosition = $('#graph' + closestGraphIndex).offset();
                let closestGraphWidth = $('#graph' + closestGraphIndex).width();
                let closestGraphCenterX = closestGraphPosition.left + (closestGraphWidth / 2);

                if (closestGraphCenterX > mouseX) {
                    console.log('The closest graph is to the right of the mouse location - put the dragged graph in front of it in the order');
                    newPosition = closestGraphIndex;

                    // If the graph is moving to a position *after* its
                    // original position, subtract one from the new index
                    if (newPosition > draggedGraphIndex) {
                        newPosition -= 1;
                    }
                } else {
                    console.log('The closest graph is to the left of the mouse location - put the dragged graph behind it in the order');
                    newPosition = closestGraphIndex + 1;

                    // If the graph is moving to a position *after* its
                    // original position, subtract one from the new index
                    if (newPosition > draggedGraphIndex) {
                        newPosition -= 1;
                    }
                }
            }

            // Cluster case
            if (currentClusters != -1) {

                // Have to do the log entry here otherwise the regulon
                // will be incorrect!
                console.log('graph ' + draggedGraphNumber + '(' + regulons[draggedGraphNumber].genomeName + ') was placed in position ' + newPosition + ' in cluster ' + currentClusterIndex);

                // If moving within the same cluster...
                if (oldClusterIndex == currentClusterIndex) {

                    // Move in the cluster object
                    array_move(currentClusters[currentClusterIndex], currentClusters[currentClusterIndex].indexOf(draggedGraphRegulonId), newPosition);

                    // Move in the regulon collection (to be in front of
                    // the one it was moved in front of)
                    /*let positionRegulon = regulons.find(r => r.regulonId == currentClusters[currentClusterIndex][newPosition]);
                    let draggedRegulon = regulons.find(r => r.regulonId == draggedGraphRegulonId);*/

                    // Uses regulogNetwork to be safe
                    //array_move(regulogNetwork.regulons, regulogNetwork.regulons.indexOf(draggedRegulon), regulogNetwork.regulons.indexOf(positionRegulon));
                }

                // If moving between clusters...
                else {

                    // Go through the original cluster's list and remove the
                    // dragged regulon id
                    for ( let i = 0; i < currentClusters[oldClusterIndex].length; i++) {
                        if (currentClusters[oldClusterIndex][i] == draggedGraphRegulonId) {
                            currentClusters[oldClusterIndex].splice(i, 1);
                            break;
                        }
                    }

                    // Put the dragged regulon id in the new cluster
                    currentClusters[currentClusterIndex].splice(newPosition, 0, draggedGraphRegulonId);

                    // Move in the regulon collection (to be in front of
                    // the one it was moved in front of)
                    /*let positionRegulon = regulons.find(r => r.regulonId == currentClusters[currentClusterIndex][newPosition]);
                    let draggedRegulon = regulons.find(r => r.regulonId == draggedGraphRegulonId)*/

                    // Uses regulogNetwork to be safe
                    //array_move(regulogNetwork.regulons, regulogNetwork.regulons.indexOf(draggedRegulon), regulogNetwork.regulons.indexOf(positionRegulon));
                }

                // Redraw the wagon wheels and end after that
                drawClusteredWagonWheels(currentClusters);
                return;

            // Regular case
            } else {

                // Have to do the log entry here otherwise the regulon
                // will be incorrect!
                console.log('graph ' + draggedGraphNumber + '(' + regulons[draggedGraphNumber].genomeName + ') was placed in position ' + newPosition)

                // Move in the regulon collection (to be in front of
                // the one it was moved in front of)
                let draggedRegulon = regulons.find(r => r.regulonId == draggedGraphRegulonId)

                // Uses regulogNetwork to be safe
                array_move(regulogNetwork.regulons, regulogNetwork.regulons.indexOf(draggedRegulon), newPosition);

                // Redraw the wagon wheels and end after that
                drawWagonWheels();
                return;
            }
        }

        //Else append it to the end of the group - this should only
        //occur if the container is empty
        else {
            console.log('No closest graph was found!');
            // If this is a clustered display and the graph moved to a new
            // cluster, put it in that (empty) cluster
            if (currentClusters != -1 && oldClusterIndex != currentClusterIndex) {

                // Go through the original cluster's list and remove the
                // dragged regulon id
                for ( let i = 0; i < currentClusters[oldClusterIndex].length; i++) {
                    if (currentClusters[oldClusterIndex][i] == draggedGraphRegulonId) {
                        currentClusters[oldClusterIndex].splice(i, 1);
                        break;
                    }
                }

                // Put the dragged regulon id in the (empty) new cluster
                currentClusters[currentClusterIndex].push(draggedGraphRegulonId)

                // Redraw the wagon wheels and end after that
                console.log('graph ' + draggedGraphNumber + '(' + regulons[draggedGraphNumber].genomeName + ') was placed in the empty cluster ' + currentClusterIndex);
                drawClusteredWagonWheels(currentClusters);
                return;
            }

            // Otherwise just reset the display since nothing should happen
            console.log('This was the only graph in its group, so do nothing');
            resetDraggedWheel();
            return;
        }
    }
}

/**
  * Event listener for Hammer 'pancancel' events
  * Cancels a drag if panning is stopped for a reason other than the user ending it
  * @param {event} The parameters of the Hammer event
  */
function hammerPanCancel (ev) {
    console.log('Hammer pancancel occured');
    //document.getElementById('body').style.backgroundColor = "purple";

    // Only do something if a graph is already being dragged
    if (hammerDraggedGraph != -1) {
        resetDraggedWheel();
    }
}

/**
 * Clears the dragging of a wagon wheel if no changes are to be made to ordering
 */
function resetDraggedWheel() {
    hammerDraggedGraph.style.left = null;
    hammerPosition[0] = -1;
    hammerDraggedGraph.style.top = null;
    hammerPosition[1] = -1;
    hammerDraggedGraph.style.position = null;
    hammerDraggedGraph.style.zIndex = null;
    hammerDraggedGraph = -1;
}

/**
 * Moves an array item from one index to another
 * Supports moving an item outside of the original array's length (by inserting
 * undefineds in the gap)
 * Does not support negative indices
 * Source: https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
 * @param {array} array to move item in
 * @param {Number} original index of the item to move
 * @param {Number} target index to move the item to
 */
function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
};

/**
  * Sets up the query highlight button event listeners
  * This allows highlighting of genes based on a query the user enters
  */
function setUpQueryHighlight() {
    
    // Trigger a query highlight if the user presses enter
    $("#search-query_text").keyup((event) => {
        if (event.which == 13 && $("#search-query_text").val() != "") {
            $("#search-query_buttonSearch").click()
        }
    });

    // Trigger a query highlight if the user clicks "Search"
    $("#search-query_buttonSearch").click(() => {

        // Clear any GO term highlighting first
        let legend = $("#goterm-legend");
        legend.find(".delete.icon").click();

        // Get the query, and set it to lower case as we do not want a case
        // sensitive search
        highlightQuery = $("#search-query_text").val().toLowerCase();

        // Highlight any gene nodes that have the query in their
        // characteristics
        // This is based on Joe's code for highilghting via term
        $.each($(".gene-node"), (i, node) => {
            let gene = $(node).data("gene-data");
            
            // Currently compares the query against the gene name, function,
            // GO term and locus tag. They are set to lower case first
            if (gene.name.toLowerCase().includes(highlightQuery) || gene.function.toLowerCase().includes(highlightQuery) || gene.term.toLowerCase().includes(highlightQuery) || gene.locusTag.toLowerCase().includes(highlightQuery)) {
                $(`svg circle.gene-node.gene-${gene.name}`).css("opacity", 1);
                $(`svg line.gene-spoke.gene-${gene.name}`).css("opacity", 1);
            } else {
                $(`svg circle.gene-node.gene-${gene.name}`).css("opacity", 0.2);
                $(`svg line.gene-spoke.gene-${gene.name}`).css("opacity", 0.2);
            }
        });
    });

    // Clear any existing query highlight if the user clicks "Clear"
    $("#search-query_buttonClear").click(() => {

        // Clear the query if it exists
        if (highlightQuery != -1) {
            highlightQuery = -1;

            // This is based on Joe's code for highilghting via term
            $.each($(".gene-node"), (i, node) => {
                let gene = $(node).data("gene-data");
                $(`svg circle.gene-node.gene-${gene.name}`).css("opacity", 1);
                $(`svg line.gene-spoke.gene-${gene.name}`).css("opacity", 1);
            });
        }
    });
}