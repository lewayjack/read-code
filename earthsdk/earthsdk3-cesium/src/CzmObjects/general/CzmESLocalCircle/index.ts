import { ESLocalCircle, geoRhumbDestination, getDistancesFromPositions } from "earthsdk3";
import { CzmCircle, CzmCircleOutlinePrimitive, CzmESObjectWithLocation, CzmPolyline } from "../../../CzmObjects";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { computeCzmModelMatrix, flyWithPosition, getCameraPosition, winPosAndDepthEqual } from "../../../utils";
import { bind, createNextAnimateFrameEvent, reactArrayWithUndefined, track, Vector } from "xbsj-base";
import * as  Cesium from 'cesium';

export class CzmESLocalCircle extends CzmESObjectWithLocation<ESLocalCircle> {
    static readonly type = this.register('ESCesiumViewer', ESLocalCircle.type, this);
    private _czmGeoCircle;
    get czmGeoCircle() { return this._czmGeoCircle; }

    private _geoPolyline;
    get geoPolyline() { return this._geoPolyline; }

    private _innerPositionReact = this.disposeVar(reactArrayWithUndefined<[number, number, number]>(undefined));

    constructor(sceneObject: ESLocalCircle, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);

        this._czmGeoCircle = this.disposeVar(new CzmCircle(czmViewer, sceneObject.id));
        this._geoPolyline = this.dv(new CzmPolyline(czmViewer, sceneObject.id));
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        // 为了使编辑生效，需要监听sceneObject的position和_innerPositionReact,
        // 如果是在[0,0,0]点的话，就把_innerPositionReact设置为undefined,就能编辑了
        {
            // 禁用基类
            this.sPrsEditing.enabled = false;
            const updated = () => {
                if (Vector.equals(sceneObject.position, [0, 0, 0])) {
                    this._innerPositionReact.value = undefined;
                } else {
                    this._innerPositionReact.value = sceneObject.position;
                }
            }
            updated();
            this.dispose(this.sceneObject.positionChanged.disposableOn(updated));
        }
        {
            const updated = () => {
                if (this._innerPositionReact.value == undefined) {
                    sceneObject.position = [0, 0, 0];
                }
                else {
                    sceneObject.position = this._innerPositionReact.value;
                }
            }
            this.dispose(this._innerPositionReact.changed.disposableOn(updated));
        }

        const czmGeoCircle = this._czmGeoCircle;

        const geoPolyline = this._geoPolyline;
        {
            const update = () => {
                geoPolyline.positions = getCirclePositions(sceneObject.position, sceneObject.rotation, sceneObject.radius);
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.positionChanged,
                sceneObject.rotationChanged,
                sceneObject.radiusChanged,
            ))
            this.dispose(event.don(update));
        }
        {
            const update = () => {
                czmGeoCircle.show = sceneObject.show && sceneObject.filled;
                geoPolyline.show = sceneObject.show && sceneObject.stroked;
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(
                sceneObject.showChanged,
                sceneObject.filledChanged,
                sceneObject.strokedChanged,
                sceneObject.strokeGroundChanged
            ))
            this.dispose(event.don(update));
        }
        {
            geoPolyline.loop = true;
            this.d(track([geoPolyline, 'ground'], [sceneObject, 'strokeGround']));
            this.d(track([geoPolyline, 'color'], [sceneObject, 'strokeColor']));
            this.d(bind([geoPolyline, 'width'], [sceneObject, 'strokeWidth']));
        }
        {
            czmGeoCircle.outline = false;
            this.dispose(track([czmGeoCircle, 'rotation'], [sceneObject, 'rotation']));
            this.dispose(track([czmGeoCircle, 'outlineColor'], [sceneObject, 'strokeColor']));
            this.dispose(bind([czmGeoCircle, 'radius'], [sceneObject, 'radius']));
            this.dispose(bind([czmGeoCircle, 'position'], this._innerPositionReact));
            this.dispose(bind([czmGeoCircle, 'editing'], [sceneObject, 'editing']));
            this.dispose(bind([czmGeoCircle, 'allowPicking'], [sceneObject, 'allowPicking']));
            this.dispose(bind([czmGeoCircle, 'ground'], [sceneObject, 'fillGround']))

            {
                const updateProp = () => {
                    if (sceneObject.filled) {
                        czmGeoCircle.material = { type: 'Color', color: sceneObject.fillColor };
                    } else {
                        czmGeoCircle.material = { type: 'Color', color: ESLocalCircle.defaults.fillStyle.color }
                    }
                }
                updateProp();
                const updateEvent = this.disposeVar(createNextAnimateFrameEvent(
                    sceneObject.fillStyleChanged,
                    sceneObject.filledChanged,
                ));
                this.dispose(updateEvent.disposableOn(updateProp));
            }
        }
    }
    override visibleDistance(sceneObject: ESLocalCircle, czmViewer: ESCesiumViewer): void {
        if (czmViewer.viewer?.camera && sceneObject.show) {
            const dis = getDistancesFromPositions([sceneObject.position, getCameraPosition(czmViewer.viewer.camera)], 'NONE')[0];
            let show = false;
            if (sceneObject.minVisibleDistance < sceneObject.maxVisibleDistance) {
                show = sceneObject.minVisibleDistance < dis && dis < sceneObject.maxVisibleDistance;
            } else if (sceneObject.maxVisibleDistance == 0) {
                show = dis > sceneObject.minVisibleDistance;
            }
            this._czmGeoCircle.show = sceneObject.show && sceneObject.filled && show;
            this._geoPolyline.show = sceneObject.show && sceneObject.stroked && show;
        }
    }
    override flyTo(duration: number | undefined, id: number): boolean {
        const { sceneObject, czmViewer, czmGeoCircle } = this;
        if (!czmViewer.actived) return false;
        if (sceneObject.flyToParam || sceneObject.flyInParam) {
            return super.flyTo(duration, id);
        } else {
            if (sceneObject.position) {
                flyWithPosition(czmViewer, sceneObject, id, sceneObject.position, sceneObject.radius, duration, true);
                return true;
            }
            return false;
        }
    }
}
function getCirclePositions(position: [number, number, number], rotation: [number, number, number], radius: number): [number, number, number][] {
    const sides = 36;
    const AngleDelta = 2.0 * Math.PI / sides;
    const positions: [number, number, number][] = [];
    // 获取A点对应的世界坐标
    let start = Cesium.Cartesian3.fromDegrees(...position);
    let Cartesian3_to_WGS84 = function (point: Cesium.Cartesian3): [number, number, number] {
        let cartesian33 = new Cesium.Cartesian3(point.x, point.y, point.z);
        let cartographic = Cesium.Cartographic.fromCartesian(cartesian33);
        let lat = Cesium.Math.toDegrees(cartographic.latitude);
        let lng = Cesium.Math.toDegrees(cartographic.longitude);
        let alt = cartographic.height;
        return [lng, lat, alt];
    }
    // 本地坐标到世界坐标的变换矩阵
    const localToWorldMatrix = computeCzmModelMatrix({
        initialRotation: 'yForwardzUp',
        rotation: [rotation[0], rotation[2], -rotation[1]],
        position: position,
    })
    if (!localToWorldMatrix) { return positions; }
    for (let i = 0; i < sides; i++) {
        let localPosB = new Cesium.Cartesian3(radius * Math.cos(AngleDelta * i), radius * Math.sin(AngleDelta * i), 0.0);
        // 将B点本地坐标（A为原点的本地坐标系）转世界坐标
        let worldPointB = Cesium.Matrix4.multiplyByPoint(
            localToWorldMatrix,
            localPosB,
            new Cesium.Cartesian3()
        );
        positions.push(Cartesian3_to_WGS84(worldPointB));
    }
    return positions;
}