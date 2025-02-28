import { ESPolygonWithHole } from "earthsdk3";
import { CzmESGeoPolygon } from "../CzmESGeoPolygon";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, track } from "xbsj-base";
import { PolygonHierarchyType } from "../../../ESJTypesCzm";
import { flyWithPositions } from "../../../utils";
import { CzmPolygonPrimitiveWithHeight, CzmPolylines, PositionsEditing } from "../../../CzmObjects";

export class CzmESPolygonWithHole extends CzmESGeoPolygon<ESPolygonWithHole> {
    static override readonly type = this.register("ESCesiumViewer", ESPolygonWithHole.type, this);
    private _czmPolygonPrimitive;
    get czmPolygonPrimitive() { return this._czmPolygonPrimitive; }

    private _geoPolylines;

    private _sPositionsEditing;
    get sPositionsEditing() { return this._sPositionsEditing; }

    constructor(sceneObject: ESPolygonWithHole, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        this._czmPolygonPrimitive = this.disposeVar(new CzmPolygonPrimitiveWithHeight(czmViewer, sceneObject.id));
        console.log(this.czmPolygonPrimitive);

        this._geoPolylines = this.disposeVar(new CzmPolylines(czmViewer, sceneObject.id));
        this._sPositionsEditing = this.disposeVar(new PositionsEditing([this.sceneObject, 'points'], true, [this.sceneObject, 'editing'], this.czmViewer));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        {
            const update = () => {
                if (this.geoPolygon)
                    this.geoPolygon.show = false;
            }
            update();
            this.ad(this.sceneObject.showChanged.don(update))
        }

        const geoPolylines = this._geoPolylines;
        geoPolylines.arcType = 'RHUMB'

        const czmPolygonPrimitive = this._czmPolygonPrimitive;

        this.dispose(track([czmPolygonPrimitive, 'allowPicking'], [sceneObject, 'allowPicking']));

        this.dispose(track([geoPolylines, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(track([geoPolylines, 'color'], [sceneObject, 'strokeColor']));
        this.dispose(track([geoPolylines, 'width'], [sceneObject, 'strokeWidth']));

        {
            czmPolygonPrimitive.perPositionHeight = true;

            const updateProp = () => {
                geoPolylines.show = sceneObject.show && sceneObject.stroked;
                czmPolygonPrimitive.show = sceneObject.show && sceneObject.filled;
                czmPolygonPrimitive.material = {
                    type: 'Color',
                    color: sceneObject.fillColor
                };
            }
            updateProp()
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.strokedChanged,
                sceneObject.filledChanged,
                sceneObject.fillColorChanged,
            ));
            this.dispose(updateEvent.don(updateProp));
        }
        {
            const update = () => {
                const polygonHierarchy = {
                    positions: [] as [number, number, number][],
                    holes: [] as PolygonHierarchyType[]
                }
                if (sceneObject.points && sceneObject.points.length >= 3) {
                    geoPolylines.positions = [[...sceneObject.points, sceneObject.points[0]]]
                    polygonHierarchy.positions = sceneObject.points;
                    if (sceneObject.innerRings && sceneObject.innerRings.length > 0) {
                        for (let i = 0; i < sceneObject.innerRings.length; i++) {
                            const item = sceneObject.innerRings[i];
                            polygonHierarchy.holes.push({ positions: item });
                            geoPolylines.positions.push([...item, item[0]])
                        }
                    }
                    czmPolygonPrimitive.polygonHierarchy = polygonHierarchy;
                } else {
                    czmPolygonPrimitive.polygonHierarchy = polygonHierarchy
                }
            }
            update()
            const event = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.pointsChanged,
                sceneObject.innerRingsChanged));
            this.dispose(event.disposableOn(() => update()));
        }

    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmPolygonPrimitive } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (czmPolygonPrimitive.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmPolygonPrimitive.positions, duration);
                return true;
            }
            return false;
        }
    }
    override flyIn(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmPolygonPrimitive } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyInParam) {
            return super.flyIn(duration, id);
        } else {
            if (czmPolygonPrimitive.positions) {
                flyWithPositions(czmViewer, sceneObject, id, czmPolygonPrimitive.positions, duration);
                return true;
            }
            return false;
        }
    }
}
