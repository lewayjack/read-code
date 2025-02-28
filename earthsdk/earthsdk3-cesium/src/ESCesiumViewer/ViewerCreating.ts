

import * as Cesium from 'cesium';
import { createCancelablePromise, createProcessingFromAsyncFunc, Destroyable, JsonValue } from 'xbsj-base';
import { ESCesiumViewer } from './index';
import { defaultCreateCesiumViewerFunc } from './defaultCreateCesiumViewerFunc';
import { getViewerExtensions, setViewerExtensions, ViewerExtensions } from './index';
import { czmSubscribeAndEvaluate } from '../utils';
import './initCesiumViewer';

function terrainHeightsinitialized() {
    return new Promise<void>((resolve, reject) => Cesium.GroundPolylinePrimitive.initializeTerrainHeights().then(resolve));
}

export class ViewerCreating extends Destroyable {
    constructor(subContainer: HTMLDivElement, czmViewer: ESCesiumViewer, setViewerFunc: (viewer: Cesium.Viewer | undefined) => void, czmOptions?: JsonValue) {
        super();

        const resetViewer = () => {
            czmViewer.setStatus('Raw');
            const { viewer } = czmViewer;
            if (viewer) {
                setViewerFunc(undefined);
                const viewerExtensions = getViewerExtensions(viewer);
                if (viewerExtensions) {
                    viewerExtensions.destroy();
                    setViewerExtensions(viewer, undefined);
                }
                viewer.destroy();
            }
        };
        this.dispose(resetViewer);
        const createViewerProcessing = this.dv(createProcessingFromAsyncFunc<void, [container: HTMLDivElement]>(async (cancelsManager, subContainer) => {
            czmViewer.setStatus('Creating');
            czmViewer.setStatusLog('正在创建Cesium视口...');
            const createCesiumViewerFunc = defaultCreateCesiumViewerFunc;
            await cancelsManager.promise(terrainHeightsinitialized());
            const viewer = await cancelsManager.promise(createCancelablePromise(createCesiumViewerFunc(subContainer, czmOptions)));
            // @ts-ignore
            viewer.scene._xbsjOriginSkyAtmosphere = viewer.scene.skyAtmosphere;
            // @ts-ignore
            viewer.scene._xbsjOriginSkyBox = viewer.scene.skyBox;
            {
                // 同步时间
                viewer.clockViewModel.currentTime = Cesium.JulianDate.fromDate(new Date(czmViewer.currentTime));

                this.dispose(czmViewer.currentTimeChanged.disposableOn(() => {
                    if (czmViewer.currentTime === undefined) return;
                    const c = Cesium.JulianDate.fromDate(new Date(czmViewer.currentTime));
                    if (Cesium.JulianDate.equals(c, viewer.clockViewModel.currentTime)) return;
                    viewer.clockViewModel.currentTime = c;
                }));

                this.dispose(czmSubscribeAndEvaluate(viewer.clockViewModel, 'currentTime', (currentTime) => {
                    const t = Cesium.JulianDate.toDate(viewer.clockViewModel.currentTime).getTime();
                    if (t === czmViewer.currentTime) return;
                    czmViewer.currentTime = t;
                }));
            }
            {
                // 加入Cesium扩展
                const viewerExtensions = new ViewerExtensions(viewer, czmViewer);
                setViewerExtensions(viewer, viewerExtensions);
            }
            czmViewer.setStatus('Created');
            czmViewer.setStatusLog('成功创建Cesium视口!');
            setViewerFunc(viewer);
        }));
        createViewerProcessing.start(subContainer);
        createViewerProcessing.errorEvent.don(() => {
            czmViewer.setStatus('Error');
            czmViewer.setStatusLog('创建Cesium视口失败!');
        })
    }
}
