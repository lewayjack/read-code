import { ESGeoRectangle, getMinMaxCorner } from "earthsdk3";
import { CzmESGeoVector, CzmPolyline, CzmRectangle } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { CzmMaterialJsonType } from "../../../ESJTypesCzm";
import { flyWithPositions } from "../../../utils";
import { bind, createNextAnimateFrameEvent, track } from "xbsj-base";

export class CzmESGeoRectangle<T extends ESGeoRectangle = ESGeoRectangle> extends CzmESGeoVector<T> {
    static readonly type = this.register<ESGeoRectangle, ESCesiumViewer>('ESCesiumViewer', ESGeoRectangle.type, this);

    private _czmGeoESRectangle;
    get czmGeoESRectangle() { return this._czmGeoESRectangle; }
    private _geoPolyline;

    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._geoPolyline = this.disposeVar(new CzmPolyline(czmViewer, sceneObject.id));
        this._czmGeoESRectangle = this.disposeVar(new CzmRectangle(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmGeoESRectangle = this._czmGeoESRectangle;

        const geoPolyline = this._geoPolyline;
        geoPolyline.arcType = 'RHUMB'

        const update = () => {
            if (sceneObject.points && sceneObject.points.length >= 2) {
                const val = [...sceneObject.points]
                const pos0 = val[0]
                const pos1 = val[1]
                const pos = [pos0, [pos0[0], pos1[1], pos0[2]], pos1, [pos1[0], pos0[1], pos1[2]]] as [number, number, number][]
                geoPolyline.positions = [...pos, pos0]
            }
        }
        update();
        this.dispose(sceneObject.pointsChanged.disposableOn(update));

        this.dispose(track([geoPolyline, 'color'], [sceneObject, 'strokeColor']));
        this.dispose(track([geoPolyline, 'width'], [sceneObject, 'strokeWidth']));
        this.dispose(track([geoPolyline, 'ground'], [sceneObject, 'strokeGround']));
        this.dispose(track([czmGeoESRectangle, 'ground'], [sceneObject, 'fillGround']));
        this.dispose(track([czmGeoESRectangle, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(bind([czmGeoESRectangle, 'editing'], [sceneObject, 'editing']));

        {
            const updateProp = () => {
                geoPolyline.show = sceneObject.show && sceneObject.stroked;
                czmGeoESRectangle.show = sceneObject.show && sceneObject.filled;
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.strokedChanged,
                sceneObject.filledChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }


        // this.dispose(track([czmGeoESRectangle, 'height'], [sceneObject, 'czmHeight']));
        // this.dispose(track([czmGeoESRectangle, 'extrudedHeight'], [sceneObject, 'czmExtrudedHeight']));
        // this.dispose(track([czmGeoESRectangle, 'rotation'], [sceneObject, 'czmRotation']));

        // this.dispose(track([czmGeoESRectangle, 'outlineTranslucent'], [sceneObject, 'czmOutlineTranslucent']));
        // this.dispose(track([czmGeoESRectangle, 'outline'], [sceneObject, 'stroked']));
        // this.dispose(track([czmGeoESRectangle, 'outlineColor'], [sceneObject, 'strokeColor']));

        // this.dispose(sceneObject.fillStyleChanged.disposableOn(val => {
        //     const materialParams = sceneObject.fillStyle.materialParams;
        //     czmGeoESRectangle.material = materialParams as CzmMaterialJsonType;
        // }))

        {
            const updateProp = () => {
                if (sceneObject.filled) {
                    czmGeoESRectangle.material = { type: 'Color', color: sceneObject.fillColor } as CzmMaterialJsonType;
                } else {
                    czmGeoESRectangle.material = undefined
                }
            }
            updateProp();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.fillStyleChanged,
                sceneObject.filledChanged,
            ));
            this.dispose(updateEvent.disposableOn(updateProp));
        }

        {
            const update = () => {
                if (czmGeoESRectangle.rectangle) {
                    sceneObject.points = [[czmGeoESRectangle.rectangle[0], czmGeoESRectangle.rectangle[1], czmGeoESRectangle.height], [czmGeoESRectangle.rectangle[2], czmGeoESRectangle.rectangle[3], czmGeoESRectangle.height]]
                } else {
                    sceneObject.points = undefined;
                }
            }

            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                czmGeoESRectangle.rectangleChanged,
                czmGeoESRectangle.heightChanged,
            ));
            this.dispose(updateEvent.disposableOn(update));
        }
        {
            const updatePoints = () => {
                //points转换为rectangle
                const val = sceneObject.points;
                if (val && val.length >= 2) {
                    const { minPos, maxPos } = getMinMaxCorner(val);
                    czmGeoESRectangle.rectangle = [minPos[0], minPos[1], maxPos[0], maxPos[1]];
                    czmGeoESRectangle.height = minPos[2]
                    czmGeoESRectangle.extrudedHeight = maxPos[2]
                } else {
                    czmGeoESRectangle.rectangle = undefined;
                    czmGeoESRectangle.height = 0
                    czmGeoESRectangle.extrudedHeight = 0
                }
            }
            updatePoints();
            this.dispose(sceneObject.pointsChanged.disposableOn(() => updatePoints()))
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (sceneObject.points) {
                flyWithPositions(czmViewer, sceneObject, id, sceneObject.points, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmGeoESRectangle } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (sceneObject.points) {
                flyWithPositions(czmViewer, sceneObject, id, sceneObject.points, duration);
                return true;
            }
            return false;
        }
    }
}
