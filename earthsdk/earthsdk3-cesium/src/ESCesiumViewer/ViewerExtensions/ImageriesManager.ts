import { Destroyable, Event, Listener, ObjResettingWithEvent } from "xbsj-base"
import * as Cesium from 'cesium';
import { ESImageryLayer } from "earthsdk3";
import { CzmImagery } from "../../CzmObjects";

class CzmImageryLayersManager extends Destroyable {
    get viewer() { return this._viewer; }

    private _czmImageryLayerWrappers = new Set<CzmImageryLayerWrapper>();
    get czmImageryLayerWrappers() { return this._czmImageryLayerWrappers; }

    private _zIndexChangedEvent = this.dv(new Event());

    constructor(private _viewer: Cesium.Viewer) {
        super();
        this.d(this._zIndexChangedEvent.don(() => {
            const imageries = [...this.czmImageryLayerWrappers.values()];
            imageries.sort((a, b) => {
                const ai = a.czmImageryWrapper.imagery.zIndex ?? ESImageryLayer.defaults.zIndex;
                const bi = b.czmImageryWrapper.imagery.zIndex ?? ESImageryLayer.defaults.zIndex;
                return ai - bi;
            });
            for (const e of imageries) {
                this.viewer.imageryLayers.raiseToTop(e.imageryLayer);
            }
        }))
    }

    add(czmImageryLayerWrapper: CzmImageryLayerWrapper) {
        this._czmImageryLayerWrappers.add(czmImageryLayerWrapper);
        this.viewer.imageryLayers.add(czmImageryLayerWrapper.imageryLayer);
        this.zIndexChange();
    }
    delete(czmImageryLayerWrapper: CzmImageryLayerWrapper) {
        this.viewer.imageryLayers.remove(czmImageryLayerWrapper.imageryLayer, false);
        this._czmImageryLayerWrappers.delete(czmImageryLayerWrapper);
    }
    zIndexChange() {
        this._zIndexChangedEvent.emit();
    }
}

class CzmImageryLayerWrapper extends Destroyable {
    private _imageryLayer!: Cesium.ImageryLayer;
    get imageryLayer() { return this._imageryLayer; }
    get czmImageryWrapper() { return this._czmImageryWrapper; }
    constructor(private _czmImageryWrapper: CzmImageryWrapper) {
        super();
        if (!this._czmImageryWrapper.imagery.layer) {
            throw new Error(`this._czmCzmImageryWrapper.imagery.czmImagery`);
        }
        this._imageryLayer = this._czmImageryWrapper.imagery.layer;

        const { czmImageryWrapper } = this;
        const m = czmImageryWrapper.manager.czmImageriesManager;
        m.add(this);
        this.d(() => m.delete(this));
        this.d(this._czmImageryWrapper.imagery.zIndexChanged.don(() => m.zIndexChange()));
    }
}

class czmImageryWrapperWithShow extends Destroyable {
    get czmImageryWrapper() { return this._czmImageryWrapper; }

    private _objResetting: ObjResettingWithEvent<CzmImageryLayerWrapper, Listener<[boolean, boolean]>>
    get objResetting() { return this._objResetting; }
    constructor(private _czmImageryWrapper: CzmImageryWrapper) {
        super();
        this._objResetting = this.dv(new ObjResettingWithEvent(this.czmImageryWrapper.imagery.showChanged, () => {
            if (!(this.czmImageryWrapper.imagery.show ?? true)) return undefined;
            return new CzmImageryLayerWrapper(this.czmImageryWrapper);
        }))
    }
}

class CzmImageryWrapper extends Destroyable {
    get imagery() { return this._imagery; }
    get manager() { return this._manager; }

    private _czmImageryLayerWrapperObjResetting: ObjResettingWithEvent<czmImageryWrapperWithShow, Listener<[Cesium.ImageryLayer | undefined, Cesium.ImageryLayer | undefined]>>
    get czmImageryLayerWrapperObjResetting() { return this._czmImageryLayerWrapperObjResetting; }
    constructor(private _imagery: CzmImagery, private _manager: ImageriesManager) {
        super();
        this._czmImageryLayerWrapperObjResetting = this.dv(new ObjResettingWithEvent(this.imagery.layerChanged, () => {
            if (!this.imagery.layer) return undefined;
            return new czmImageryWrapperWithShow(this);
        }))
    }
}

export class ImageriesManager extends Destroyable {

    private _czmImageryWrappers = new Set<CzmImageryWrapper>();
    get czmImageryWrappers() { return this._czmImageryWrappers; }

    // private _czmImageryLayersManager = this.dv(new CzmImageryLayersManager(this.viewer))
    private _czmImageryLayersManager: CzmImageryLayersManager
    get czmImageriesManager() { return this._czmImageryLayersManager; }

    get viewer() { return this._viewer; }

    constructor(private _viewer: Cesium.Viewer) {
        super();
        this._czmImageryLayersManager = this.dv(new CzmImageryLayersManager(this.viewer));
    }

    add(imagery: CzmImagery) {
        for (let e of this.czmImageryWrappers) {
            if (e.imagery === imagery) {
                console.warn(`imageriesManager add error: has already added!`, imagery);
                return;
            }
        }
        this.czmImageryWrappers.add(new CzmImageryWrapper(imagery, this));
    }
    delete(imagery: CzmImagery) {
        for (const e of this.czmImageryWrappers) {
            if (e.imagery === imagery) {
                this.czmImageryWrappers.delete(e);
                return;
            }
        }
        console.warn(`imageriesManager delete error!`, imagery);
    }
}
