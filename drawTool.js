define(["framework/viewer",
        "esri/toolbars/draw",
        "framework/map",
        "framework/layers",
        "framework/symbolManager",
        "framework/taskManager",
        "framework/manageGraphicsLayers",
        "dojo/on",
        "dojo/dom",
        "dojo/domReady!",
        "jquery"],
        function (
            viewer,
            draw,
            map,
            layers,
            symbolManager,
            taskManager,
            graphicLayer,
            on,
            dom,
            ready,
            $) {
            var drawTool,
                selectedGraphicSymbol,
                queryLayer,
                bus,
                config,
                mapLib = map();
    
    function initDrawTool(options, layerId, dtool) {
        /// <summary>
        /// initializes the draw tool for first time use.
        /// The options parameter represents the configuration of the resulting 
        /// symbol that represents query results from the operatioin of the draw tool.
        /// </summary>
        /// <param name="options"></param>
        /// <param name="layerId"></param>
        config = options;
        selectedGraphicSymbol = options.graphicSymbol;
        queryLayer = layerId;
        bus = options.messageBus;
        var mapInstance = mapLib.getMapInstance();
        drawTool = new draw(mapInstance);
        drawTool.on("draw-end", handleDrawToolGeometry);
        
        var exists = $(dtool.selector);
        if (exists.length > 0) {
            drawHandler(dtool);
        } else {
            waitForElement(dtool);
        }
    }
    
    function drawHandler(dtool, timer) {
        /// <summary>
        /// draw tool handler. 
        /// </summary>
        /// <param name="dtool">draw tool json</param>
        /// <param name="timer">reference to the timeout</param>
        var selector = $(dtool.selector).on('click', function (event) {
            mapLib.MapResize();
            var tool = event.target.id.toLowerCase();

            if (viewer.DrawToolActive()) {
                viewer.DrawTool(false);
                drawTool.deactivate();
            }
            else {
                viewer.DrawTool(true);
                drawTool.activate(tool);
            }

        });
        clearTimeout(timer);
    }

    function waitForElement(dtool) {
        /// <summary>
        /// timeout to wait for ui to be ready
        /// </summary>
        /// <param name="dtool"></param>
        setTimeout(function() {
            drawHandler(dtool, drawHandler);
        }, 1000);
    }

    function createMapGraphic(result) {
        /// <summary>
        /// Creatres the graphics from the parameter
        /// result
        /// </summary>
        /// <param name="result">Identify parameters</param>
        /// <returns type=""></returns>
    

        var options = selectedGraphicSymbol;
        result.geometry.spatialReference.wkid = options.spatialReference;
        var symbol = symbolManager.SimpleFillsymbol(options);
        var graphic = symbolManager.Graphic(result.geometry, symbol);
        graphic.attributes = result.attributes;
        return graphic;
    }

    function queryCallback(idResults) {
        /// <summary>
        /// Handles the identify results for the identify operation
        /// and renders the graphocs sumbols on the map.
        /// </summary>
        /// <param name="idResults"></param>
        var results = idResults ? idResults : [], features = [];

        if (results.length == 0)
            return;

        $(results).each(function () {
            features.push(this.feature);
        });
        $(features).each(function () {
            var graphic = createMapGraphic(this);
            graphicLayer.AddGraphic(graphic);
        });

        bus.publish('drawTool/ResultsRetrieved',results);
    }
    function errorCallback(results) {
        //handles the error from the identify task
        var html = "";
    }
    function setIdentifyLayer(layerId) {
        /// <summary>
        /// sets the identify layer for the
        /// drasw tool to run an identify task against.
        /// </summary>
        /// <param name="layerId">Number</param>
        queryLayer = layerId;
    }
    function handleDrawToolGeometry(event) {
        /// <summary>
        /// Handles the geometry of the draw tool operation.
        /// Kicks off an identify task to identify the drawn 
        /// area.
        /// </summary>
        /// <param name="event"></param>
        var mapinstance = mapLib.getMapInstance(), symbol, mapserverUrl;
        //mapinstance.enableMapNavigation();
        //drawTool.deactivate();//deactivate the drawtool
        //clearGraphicsLayer();
        //viewer.DrawTool(false);//tell the viewer the draw tool is done
        mapserverUrl = viewer.CountyLayer();//get the map server url trhat we will be ruinning tasks against
        var mExtent = mapLib.currentExtent();//get the current map extent
        var idTask = { url: mapserverUrl.countyMapServer, params: { layerIds: [queryLayer], geometry: event.geometry, returnGeometry: true, mapExtent: mExtent, tolerance: 1 }, callback: queryCallback, errorCallback: errorCallback };
        taskManager.IdentifyTask(idTask);//execute the identify task
    }

    return {
        init: function (options, layerId, id) {
            /// <summary>
            /// Initializes the draw tool. Also
            /// sets the symbol used to represent any graphics 
            /// drawn onm the map.
            /// </summary>
            /// <param name="options"></param>
            /// <param name="layerId"></param>
            initDrawTool(options, layerId, id);
        },
        IdentifyLayer: function (layerId) {
            /// <summary>
            /// Set the identify task layer at run time.
            /// </summary>
            /// <param name="layerId"></param>
            setIdentifyLayer(layerId);
        }
    };
});