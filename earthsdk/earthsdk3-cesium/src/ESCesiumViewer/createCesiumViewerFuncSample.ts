export const createCesiumViewerFuncSample = `
####  示例代码1
\`\`\`
async function initCesiumViewer(container, czmViewer) {
    const viewer = await XE2.g.defaultCreateCesiumViewerFunc(container, czmViewer);

    // 若原Czm版权信息展示位置遮挡重要信息，可将以下语句解注释，在别的位置展示
    viewer._cesiumWidget._creditContainer.style.display = "none";

    return viewer;
}
\`\`\`

#### 示例代码2
\`\`\`
async function initCesiumViewer(container, czmViewer) {
    // 使用离线地图，创建viewer
    const viewer = new Cesium.Viewer(container, {
        // imageryProvider: provider,
        // imageryProvider: new Cesium.TileMapServiceImageryProvider({
        //     url: Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
        // }),
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        scene3DOnly: true,
        // @ts-ignore
        msaaSamples: czmViewer.msaaSamples,
    });

    // 不知道从哪个版本开始，Cesium默认会增加Ion影像！
    viewer.imageryLayers.removeAll();

    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date('2022-04-19T20:00:53.10067292911116965Z'));

    // 原始设置
    // scene.screenSpaceCameraController.lookEventTypes = { eventType : CameraEventType.LEFT_DRAG, modifier : KeyboardEventModifier.SHIFT };
    // scene.screenSpaceCameraController.zoomEventTypes = [CameraEventType.RIGHT_DRAG, CameraEventType.WHEEL, CameraEventType.PINCH]
    // this._originLookEventTypes = scene.screenSpaceCameraController.lookEventTypes;
    // this._originZoomEventTypes = scene.screenSpaceCameraController.zoomEventTypes;
    viewer.scene.screenSpaceCameraController.lookEventTypes = [{ eventType: Cesium.CameraEventType.RIGHT_DRAG }, { eventType: Cesium.CameraEventType.RIGHT_DRAG, modifier: Cesium.KeyboardEventModifier.SHIFT }];
    viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH]

    // 去除系统默认事件
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // 若原Czm版权信息展示位置遮挡重要信息，可将以下语句解注释，在别的位置展示
    viewer._cesiumWidget._creditContainer.style.display = "none";

    // bloom设置
    // const bloom = viewer.scene.postProcessStages.bloom;
    // bloom.enabled = true;
    // bloom.glowOnly = false;
    // bloom.contrast = 119;
    // bloom.brightness = -0.4;
    // bloom.delta = 0.9;
    // bloom.sigma = 3.78;
    // bloom.stepSize = 5;
    // bloom.isSelected = false;

    // 去掉天空环境
    // viewer.scene.skyAtmosphere.show = false;

    return viewer;
}
\`\`\`
`;