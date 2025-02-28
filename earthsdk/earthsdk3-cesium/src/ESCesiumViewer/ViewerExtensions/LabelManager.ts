import { GeoCanvasPoi, GeoCustomDivPoi } from "../../CzmObjects";
import { createNextAnimateFrameEvent, Destroyable } from "xbsj-base";
import * as Cesium from 'cesium';
type labelMapType = Map<GeoCustomDivPoi<{
    destroy(): undefined;
}> | GeoCanvasPoi, () => void>;
// 优化
export class LabelManager extends Destroyable {
    // 存储全部的label,销毁的时候用于清空监听
    private _labelMap = {
        div: new Map<GeoCustomDivPoi, () => void>(),
        canvas: new Map<GeoCanvasPoi, () => void>()
    } as { [xx: string]: labelMapType };

    constructor(private _viewer: Cesium.Viewer) {
        super();
        this.d(_viewer.scene.camera.changed.addEventListener(() => {
            this._updateZOrder();
        }))
    }
    add(poi: GeoCustomDivPoi | GeoCanvasPoi) {
        const currentKey = poi instanceof GeoCustomDivPoi ? 'div' : 'canvas';
        if ((<labelMapType>this._labelMap[currentKey]).has(poi)) {
            console.warn(`this._labelMap[${currentKey}].has(poi)`, poi);
            return;
        }
        const disposer = new Destroyable();
        {
            const event = disposer.dv(createNextAnimateFrameEvent(poi.zOrderChanged, poi.positionChanged))
            disposer.dispose(event.don(() => {
                this._updateZOrder();
            }))
        }
        (<labelMapType>this._labelMap[currentKey]).set(poi, () => disposer.destroy());
        this._updateZOrder();
    }
    delete(poi: GeoCustomDivPoi | GeoCanvasPoi) {
        const currentKey = poi instanceof GeoCustomDivPoi ? 'div' : 'canvas';
        if (!(<labelMapType>this._labelMap[currentKey]).has(poi)) {
            console.warn(`!this._labelMap[${currentKey}].has(poi)`, poi);
            return;
        }
        const disposeFunc = (<labelMapType>this._labelMap[currentKey]).get(poi);
        if (!disposeFunc) {
            console.error('!disposeFunc');
            return;
        }
        disposeFunc();
        (<labelMapType>this._labelMap[currentKey]).delete(poi);
        this._updateZOrder();
    }
    private _updateZOrder() {
        for (const key in this._labelMap) {
            if (Object.prototype.hasOwnProperty.call(this._labelMap, key)) {
                this._updateLabelZOrder(this._labelMap[key], key);
            }
        }
    }
    private _updateLabelZOrder(labelMap: labelMapType, type: string) {
        const zOrderMap = {} as { [xx: string]: Map<GeoCustomDivPoi | GeoCanvasPoi, number> };
        // 进行分组,同时记录深度
        for (const element of labelMap.keys()) {
            if (!zOrderMap[element.zOrder])
                zOrderMap[element.zOrder] = new Map<GeoCustomDivPoi | GeoCanvasPoi, number>();
            zOrderMap[element.zOrder].set(element,
                element instanceof GeoCustomDivPoi ?
                    element.czmDivPoi ? element.czmDivPoi.depth : 0 :
                    element.canvasObj ? element.canvasObj.czmCanvasPoi.depth : 0
            );
        }
        // 获取分组zOrder数组
        const zOrderArr = Object.keys(zOrderMap).sort((a, b) => { return (type == 'div' ? Number(b) - Number(a) : Number(a) - Number(b)) });
        let currentIndex = labelMap.size;
        // 对分组进行遍历,并按照深度进行降序
        for (let i = 0; i < zOrderArr.length; i++) {
            const sortMap = new Map([...zOrderMap[zOrderArr[i]]].sort((a, b) => { return Number(b[1]) - Number(a[1]) }));
            sortMap.forEach((value, key) => {
                if (key instanceof GeoCustomDivPoi)
                    key.czmDivPoi && (key.czmDivPoi.zOrder = currentIndex);
                if (key instanceof GeoCanvasPoi)
                    key.canvasObj && (key.canvasObj.czmCanvasPoi.zOrder = currentIndex);
                currentIndex--;
            });
        }
    }
}