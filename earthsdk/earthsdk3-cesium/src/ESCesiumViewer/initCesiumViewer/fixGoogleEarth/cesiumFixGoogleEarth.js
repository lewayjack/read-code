export function cesiumFixGoogleEarth(Cesium) {
    // Cesium 1.92之后的版本是有问题的，需要修复
    // 真正出问题的提交ID是：07bea7fabd84b7c08aa4b91f21e6bcffd932c0f3
    // 但是这个提交是在1.92之后的，所以我们需要在1.92之前的版本上打补丁

    const BoundingSphere = Cesium.BoundingSphere;
    const Cartesian2 = Cesium.Cartesian2;
    const Cartesian3 = Cesium.Cartesian3;
    const Check = Cesium.Check;
    const defaultValue = Cesium.defaultValue;
    const defined = Cesium.defined;
    const DeveloperError = Cesium.DeveloperError;
    const IndexDatatype = Cesium.IndexDatatype;
    const Intersections2D = Cesium.Intersections2D;
    const CesiumMath = Cesium.CesiumMath;
    const OrientedBoundingBox = Cesium.OrientedBoundingBox;
    const QuantizedMeshTerrainData = Cesium.QuantizedMeshTerrainData;
    const Rectangle = Cesium.Rectangle;
    const TaskProcessor = Cesium.TaskProcessor;
    const TerrainData = Cesium.TerrainData;
    const TerrainEncoding = Cesium.TerrainEncoding;
    const TerrainMesh = Cesium.TerrainMesh;

    const GoogleEarthEnterpriseTerrainData = Cesium.GoogleEarthEnterpriseTerrainData;

    const createMeshTaskName = "createVerticesFromGoogleEarthEnterpriseBuffer";
    const createMeshTaskProcessorNoThrottle = new TaskProcessor(createMeshTaskName);
    const createMeshTaskProcessorThrottle = new TaskProcessor(
        createMeshTaskName,
        TerrainData.maximumAsynchronousTasks
    );

    const nativeRectangleScratch = new Rectangle();
    const rectangleScratch = new Rectangle();

    GoogleEarthEnterpriseTerrainData.prototype.createMesh = function (options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        //>>includeStart('debug', pragmas.debug);
        // Check.typeOf.object("options.tilingScheme", options.tilingScheme);
        // Check.typeOf.number("options.x", options.x);
        // Check.typeOf.number("options.y", options.y);
        // Check.typeOf.number("options.level", options.level);
        //>>includeEnd('debug');

        const tilingScheme = options.tilingScheme;
        const x = options.x;
        const y = options.y;
        const level = options.level;
        const exaggeration = defaultValue(options.exaggeration, 1.0);
        const exaggerationRelativeHeight = defaultValue(
            options.exaggerationRelativeHeight,
            0.0
        );
        const throttle = defaultValue(options.throttle, true);

        const ellipsoid = tilingScheme.ellipsoid;
        tilingScheme.tileXYToNativeRectangle(x, y, level, nativeRectangleScratch);
        tilingScheme.tileXYToRectangle(x, y, level, rectangleScratch);

        // Compute the center of the tile for RTC rendering.
        const center = ellipsoid.cartographicToCartesian(
            Rectangle.center(rectangleScratch)
        );

        const levelZeroMaxError = 40075.16; // From Google's Doc
        const thisLevelMaxError = levelZeroMaxError / (1 << level);
        // this._skirtHeight = Math.min(thisLevelMaxError * 8.0, 6378137.0);
        this._skirtHeight = 6378137.0 * 0.3;

        const createMeshTaskProcessor = throttle
            ? createMeshTaskProcessorThrottle
            : createMeshTaskProcessorNoThrottle;

        const verticesPromise = createMeshTaskProcessor.scheduleTask({
            buffer: this._buffer,
            nativeRectangle: nativeRectangleScratch,
            rectangle: Rectangle.clone(rectangleScratch), // vtxf 20230804
            relativeToCenter: center,
            ellipsoid: ellipsoid,
            skirtHeight: this._skirtHeight,
            exaggeration: exaggeration,
            exaggerationRelativeHeight: exaggerationRelativeHeight,
            includeWebMercatorT: true,
            negativeAltitudeExponentBias: this._negativeAltitudeExponentBias,
            negativeElevationThreshold: this._negativeElevationThreshold,
        });

        if (!defined(verticesPromise)) {
            // Postponed
            return undefined;
        }

        const that = this;
        return verticesPromise.then(function (result) {
            // Clone complex result objects because the transfer from the web worker
            // has stripped them down to JSON-style objects.
            that._mesh = new TerrainMesh(
                center,
                new Float32Array(result.vertices),
                new Uint16Array(result.indices),
                result.indexCountWithoutSkirts,
                result.vertexCountWithoutSkirts,
                result.minimumHeight,
                result.maximumHeight,
                BoundingSphere.clone(result.boundingSphere3D),
                Cartesian3.clone(result.occludeePointInScaledSpace),
                result.numberOfAttributes,
                OrientedBoundingBox.clone(result.orientedBoundingBox),
                TerrainEncoding.clone(result.encoding),
                result.westIndicesSouthToNorth,
                result.southIndicesEastToWest,
                result.eastIndicesNorthToSouth,
                result.northIndicesWestToEast
            );

            that._minimumHeight = result.minimumHeight;
            that._maximumHeight = result.maximumHeight;

            // Free memory received from server after mesh is created.
            that._buffer = undefined;
            return that._mesh;
        });
    };
}
