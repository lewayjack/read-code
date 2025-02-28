import { CzmPolyline } from "../../../../CzmObjects";
import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, Destroyable, track } from "xbsj-base";
import { CzmPolygonWithHeight } from ".";

export class BottomPolyline extends Destroyable {
    private _geoPolyline;
    get geoPolyline() { return this._geoPolyline }

    constructor(sceneObject: CzmPolygonWithHeight, czmViewer: ESCesiumViewer, ground: boolean) {
        super();
        this._geoPolyline = this.disposeVar(new CzmPolyline(czmViewer, sceneObject.id));
        const geoPolyline = this._geoPolyline;

        geoPolyline.arcType = 'GEODESIC';
        geoPolyline.loop = true;

        this.dispose(bind([geoPolyline, 'depthTest'], [sceneObject, 'depthTest']));
        this.dispose(bind([geoPolyline, 'ground'], [sceneObject, 'strokeGround']));

        {
            const update = () => {
                const polygonShow = (sceneObject.show);
                const polygonOutline = sceneObject.outline;
                geoPolyline.show = polygonShow && polygonOutline && sceneObject.visibleAlpha > 0; //显示多边形+不贴地才有外轮廓线
                if (geoPolyline.show && sceneObject.positions && sceneObject.positions.length > 1) {
                    const height = sceneObject.positions[0][2];
                    geoPolyline.positions = sceneObject.positions.map(e => [e[0], e[1], height]);
                } else {
                    geoPolyline.positions = undefined;
                }
                geoPolyline.color = sceneObject.outlineColor;
                geoPolyline.width = sceneObject.outlineWidth;
            };
            update();
            const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.outlineChanged,
                sceneObject.outlineColorChanged,
                sceneObject.outlineWidthChanged,
                sceneObject.colorChanged,
                sceneObject.positionsChanged,
                sceneObject.visibleAlphaChanged,
            ));
            this.dispose(updateEvent.disposableOn(update));
        }

        this.dispose(track([geoPolyline, 'allowPicking'], [sceneObject, 'allowPicking']));
    }
}
