import * as Cesium from 'cesium';
import * as turf from '@turf/turf';
import { ESJVector3DArray, ESJVector4D, getMinMaxCorner } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { bind, createNextAnimateFrameEvent, createProcessingFromAsyncFunc, Destroyable, Event, extendClassProps, react, reactJson, reactPositions, SceneObjectKey, track, UniteChanged } from "xbsj-base";
import { CzmESGeoPolygonImpl, CzmPolygon, CzmPolylinesPrimitive, PointEditing, PositionsCenter, PositionsEditing } from "../../../CzmObjects";
import { updateArea } from '../CzmESAreaMeasurement/utils';
export class GeoVolumeMeasurement extends Destroyable {

    private _flyToEvent = this.dv(new Event<[number | undefined]>());
    get flyToEvent() { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _enableEvent = this.dv(new Event());
    get enableEvent() { return this._enableEvent; }
    enableEmit() { this._enableEvent.emit(); }

    private _clearEvent = this.dv(new Event());
    get clearEvent() { return this._clearEvent; }
    clearEmit() { this._clearEvent.emit(); }

    private _gridPoints = this.dv(reactJson<ESJVector3DArray>([]));
    get gridPoints() { return this._gridPoints.value; }
    set gridPoints(value: ESJVector3DArray) { this._gridPoints.value = value; }
    get gridPointsChanged() { return this._gridPoints.changed; }

    excavationPolylines;
    fillPolylines;
    sPositionsEditing;
    // sPointEditing;
    // positionsCenter;

    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this.sPositionsEditing = this.dv(new PositionsEditing([this, 'positions'], true, [this, 'editing'], czmViewer));
        // this.positionsCenter = this.dv(new PositionsCenter([this, 'positions']));
        // this.sPointEditing = this.dv(new PointEditing([this, 'positions'], [this, 'pointEditing'], czmViewer));

        const excavationPolylines = this.dv(new CzmPolylinesPrimitive(czmViewer, id));
        const fillPolylines = this.dv(new CzmPolylinesPrimitive(czmViewer, id));
        this.excavationPolylines = excavationPolylines;
        this.fillPolylines = fillPolylines;

        const els = excavationPolylines;
        els.color = [1, 1, 0, 1]
        this.d(track([els, 'show'], [this, 'show']));
        els.show = false;
        els.depthTest = true

        const fls = fillPolylines;
        fls.color = [0, 0, 1, 1]
        this.d(track([fls, 'show'], [this, 'show']));
        fls.show = false;

        //多边形
        {
            const geoPolygon = this.ad(new CzmESGeoPolygonImpl(czmViewer, id));

            this.d(track([geoPolygon, 'show'], [this, 'show']));
            this.d(bind([geoPolygon, 'allowPicking'], [this, 'allowPicking']));
            this.d(bind([geoPolygon, 'editing'], [this, 'editing']));
            this.d(bind([geoPolygon, 'positions'], [this, 'positions']));
            this.d(bind([geoPolygon, 'depthTest'], [this, 'depthTest']));
            this.d(bind([geoPolygon, 'outlineWidth'], [this, 'outlineWidth']));
            this.d(bind([geoPolygon, 'outlineColor'], [this, 'outlineColor']));
            this.d(bind([geoPolygon, 'outline'], [this, 'outline']));
            this.d(bind([geoPolygon, 'color'], [this, 'fillColor']));
            this.d(bind([geoPolygon, 'fill'], [this, 'filled']));
            this.d(bind([geoPolygon, 'strokeGround'], [this, 'strokeGround']));
            this.d(bind([geoPolygon, 'ground'], [this, 'fillGround']));

            this.d(this.flyToEvent.don(duration => { geoPolygon.flyTo(duration); }));

            const updatePolygon = () => {
                geoPolygon.positions = this.positions;
            };
            updatePolygon();
            const updateEvent = this.dv(createNextAnimateFrameEvent(this.positionsChanged));
            this.d(updateEvent.don(updatePolygon));
        }

        // 获得turf网格点
        const getRadianGrid = () => {
            if (!this.positions || !this.positions.length) return;

            // 找到最小和最大的经度和纬度 getMinMaxCorner
            // const minLng = Math.min(...this.positions.map(coord => coord[0]));
            // const minLat = Math.min(...this.positions.map(coord => coord[1]));
            // const maxLng = Math.max(...this.positions.map(coord => coord[0]));
            // const maxLat = Math.max(...this.positions.map(coord => coord[1]));
            const { minPos, maxPos } = getMinMaxCorner(this.positions)

            const minLng = minPos[0]
            const minLat = minPos[1]
            const maxLng = maxPos[0]
            const maxLat = maxPos[1]
            // console.log("222", minPos, maxPos);

            const turfPoints = this.positions.map(e => {
                return [e[0], e[1]]
            })
            const turfPolygon = {
                "type": "Polygon",
                "coordinates": [
                    [
                        ...turfPoints
                    ]
                ]
            };

            // // 构建边界框 
            const extent = [minLng, minLat, maxLng, maxLat] as ESJVector4D;
            // 采样间距
            const cellSide = this.gridWidth;
            const options = { units: 'meters', mask: turfPolygon };
            //@ts-ignore
            const grid = turf.pointGrid(extent, cellSide, options);

            const radian = grid.features.map(feature => {
                const c = feature.geometry.coordinates;
                return c
            });

            // 角度转弧度
            const tr = Cesium.Math.toRadians

            const positions = radian.map(p => {
                return new Cesium.Cartographic(tr(p[0]), tr(p[1]));
            });
            return positions
        }

        // 初始化
        const init = () => {
            els.positions = []
            fls.positions = []
            this.area = 0
            this.cutVolume = 0
            this.fillVolume = 0
            this.cutAndFillVolume = 0
            els.depthTest = true
        }

        // 点位分批处理
        const updateVolumeProcessing = this.dv(createProcessingFromAsyncFunc(async cancelsManager => {
            const points = getRadianGrid() as Cesium.Cartographic[]
            // 第几次
            let time = 0
            // 每次多少个
            let count = 300
            // 商（向上取整）
            const con = Math.ceil(points.length / count)

            const gridPoints: any = []
            do {
                let subsection: Cesium.Cartographic[] = []
                // 最后一批
                if (time === con - 1) {
                    subsection = points.slice(time * count)
                } else {
                    subsection = points.slice(time * count, (time + 1) * count)
                }
                const promise = viewer.scene.sampleHeightMostDetailed(subsection);
                const res = await cancelsManager.promise(promise);

                // 最后一批
                if (time === con - 1) {
                    this.progress = Math.round(this.progress + (100 / con))
                } else {
                    this.progress += 100 / con
                }

                if (res && res.length) {
                    // 弧度转角度
                    const td = Cesium.Math.toDegrees
                    const angle = res.map(p => {
                        return [td(p.longitude), td(p.latitude), p.height] as [number, number, number]
                    });
                    gridPoints.push(...angle)

                }
                time++
            } while (time < con)

            if (!gridPoints || !gridPoints.length) return;
            this.gridPoints = gridPoints
        }));

        // 挖填方 面积、线
        let timer: any = null
        {
            const update = () => {
                if (!this.positions || !this.positions.length) return;
                if (!this.gridPoints) return;

                // console.log(this.gridPoints);

                // 挖方面积
                let cutVolume = 0
                const excavationPolylines: any[] = []

                // 填方面积
                let fillVolume = 0
                const fillPolylines: any[] = []

                this.gridPoints.forEach(e => {
                    const positions = this.positions as [number, number, number][]
                    // 点位高于基准面（挖方）
                    if (e[2] > positions[0][2]) {
                        cutVolume += this.gridWidth * this.gridWidth * (e[2] - positions[0][2])
                        excavationPolylines.push([e, [e[0], e[1], positions[0][2]]])
                    } else {
                        fillVolume += this.gridWidth * this.gridWidth * (positions[0][2] - e[2])
                        fillPolylines.push([e, [e[0], e[1], positions[0][2]]])
                    }
                })
                // console.log("挖方面积:", cutVolume);
                // console.log("填方面积:", fillVolume);

                // 挖方 填方线
                els.positions = excavationPolylines
                fls.positions = fillPolylines
                els.show = true;
                fls.show = true;

                // 总面积
                this.area = updateArea(this.positions)

                // 挖方 填方面积
                this.cutVolume = cutVolume
                this.fillVolume = fillVolume
                this.cutAndFillVolume = fillVolume - cutVolume

                if (timer) {
                    clearTimeout(timer)
                }
                timer = setTimeout(() => { els.depthTest = false }, 200)

            }
            update()
            this.d(this.gridPointsChanged.don(update))
            this.d(() => clearTimeout(timer))
        }

        // positions
        {
            const update = () => {
                if (!this.positions || !this.positions.length) {
                    this.planeHeight = undefined
                    return;
                }
                this.planeHeight = this.positions[0][2]

            }
            update()
            this.d(this.positionsChanged.don(update))
        }

        // 基准面高程
        {
            const update = () => {
                if (!this.planeHeight) return;
                if (!this.positions || !this.positions.length) return;

                const points = JSON.parse(JSON.stringify(this.positions.slice(1)))
                points.unshift([this.positions[0][0], this.positions[0][1], this.planeHeight])
                this.positions = points
            }
            update()
            this.d(this.planeHeightChanged.don(update))
        }

        // 开始分析
        this.d(this.enableEvent.don(() => {
            init()
            this.gridPoints = []
            this.progress = 0
            updateVolumeProcessing.restart()
        }));

        // 清空分析结果
        this.d(this.clearEvent.don(() => {
            init()
        }));



    }
}
export namespace GeoVolumeMeasurement {
    export const createDefaultProps = () => ({
        show: true,
        allowPicking: false,
        positions: reactPositions(undefined),
        editing: false,
        planeHeight: react<number | undefined>(undefined),
        gridWidth: 1,
        area: 0,
        cutVolume: 0,
        fillVolume: 0,
        cutAndFillVolume: 0,
        progress: 0,
        depthTest: false, //深度检测
        outlineWidth: 2,
        outlineColor: [1, 1, 1, 1],
        outline: true,
        filled: false,
        fillColor: [1, 1, 1, 1],
        fillGround: false,
        strokeGround: false,
    });
}
extendClassProps(GeoVolumeMeasurement.prototype, GeoVolumeMeasurement.createDefaultProps);
export interface GeoVolumeMeasurement extends UniteChanged<ReturnType<typeof GeoVolumeMeasurement.createDefaultProps>> { }
