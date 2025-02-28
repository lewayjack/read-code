import * as Cesium from 'cesium';
export async function defaultCreateCesiumViewerFunc(container: HTMLDivElement, option: any) {
    const opt = {
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
        ...(option ?? {})
    };

    const viewer = new Cesium.Viewer(container, opt);

    // 不知道从哪个版本开始，Cesium默认会增加Ion影像！
    viewer.imageryLayers.removeAll();

    //调试面板
    viewer.extend(Cesium.viewerCesiumInspectorMixin);
    //@ts-ignore
    viewer.cesiumInspector.container.style.display = 'none';

    // 3dt调试面板
    viewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);
    //@ts-ignore
    viewer.cesium3DTilesInspector.container.style.display = 'none';
    //@ts-ignore
    viewer.cesium3DTilesInspector.viewModel.picking = false;

    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date('2022-04-19T20:00:53.10067292911116965Z'));

    // 原始设置
    // viewer.scene.screenSpaceCameraController.lookEventTypes = [{ eventType: Cesium.CameraEventType.RIGHT_DRAG }];
    viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH, { eventType: Cesium.CameraEventType.RIGHT_DRAG, modifier: Cesium.KeyboardEventModifier.SHIFT }];
    viewer.scene.screenSpaceCameraController.tiltEventTypes = [
        Cesium.CameraEventType.RIGHT_DRAG,
        Cesium.CameraEventType.MIDDLE_DRAG, Cesium.CameraEventType.PINCH,
        { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL },
        { eventType: Cesium.CameraEventType.RIGHT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL }
    ]

    // 去除系统默认事件
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    // viewer.screenSpaceEventHandler.setInputAction()


    // 若原Czm版权信息展示位置遮挡重要信息，可将以下语句解注释，在别的位置展示
    //@ts-ignore
    viewer._cesiumWidget._creditContainer.style.display = "none";

    return viewer;
}

