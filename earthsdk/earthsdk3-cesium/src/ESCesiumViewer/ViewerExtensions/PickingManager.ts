import { Destroyable } from "xbsj-base";
import * as Cesium from 'cesium';
import { fromCartesian3, getPolygonPointsFromHierarchy, positionFromCartesian, toCartesian2 } from "../../utils";
import { ESEntityCluster, ESGeoJson, ESSceneObject, PickedResult, ESJPickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../index";

export class PickingManager extends Destroyable {
    private _pickPositionTasks: [[left: number, top: number], boolean, (position: [number, number, number] | undefined) => void, (error?: any) => void][] = [];
    pickPosition(windowPosition: [left: number, top: number]) {
        return new Promise<[number, number, number] | undefined>((resolve, reject) => {
            this._pickPositionTasks.push([windowPosition, true, resolve, reject]);
        });
    }

    quickPickPosition(windowPosition: [left: number, top: number]) {
        return new Promise<[number, number, number] | undefined>((resolve, reject) => {
            this._pickPositionTasks.push([windowPosition, false, resolve, reject]);
        });
    }

    private _pickTasks: [
        windowPosition: [left: number, top: number],
        windowSize: [width: number, height: number] | undefined,
        attachedInfo: any,
        resolve: (pickResult: PickedResult) => void,
        reject: (error?: any) => void
    ][] = [];

    pick(windowPosition: [left: number, top: number], windowSize?: [width: number, height: number], attachedInfo?: any) {
        return new Promise<PickedResult>((resolve, reject) => {
            this._pickTasks.push([windowPosition, windowSize, attachedInfo, resolve, reject]);
        });
    }

    pickHeightMustGreaterThanZero = true;
    objectsToExclude: any[] = [];

    constructor(czmViewer: ESCesiumViewer) {
        super();
        const viewer = czmViewer.viewer as Cesium.Viewer;
        {
            this.dispose(() => {
                if (this._pickPositionTasks.length > 0) {
                    this._pickPositionTasks.forEach(e => e[3](`CzmViewer销毁，任务不再执行！`));
                    this._pickPositionTasks.length = 0;
                }
                if (this._pickTasks.length > 0) {
                    this._pickTasks.forEach(e => e[4](`CzmViewer销毁，任务不再执行！`));
                    this._pickTasks.length = 0;
                }
            });

            const updateEveryFrame = () => {
                const pickPositionTasks = [...this._pickPositionTasks];
                this._pickPositionTasks.length = 0;
                for (let task of pickPositionTasks) {
                    const [windowPosition, mostDetailed, resolve, reject] = task;
                    try {
                        // pickFromRayMostDetailed实现高精度拾取，如果没有拾取到，那么就拾取椭球体
                        // 地形拾取是否会有问题？
                        (async () => {
                            const { scene, camera } = viewer;
                            const windowPositionCartesian = toCartesian2(windowPosition);
                            const ray = camera.getPickRay(windowPositionCartesian);

                            do {
                                if (!ray) break;
                                let result;
                                if (mostDetailed) {
                                    // @ts-ignore
                                    result = await scene.pickFromRayMostDetailed(ray, this.objectsToExclude);
                                } else {
                                    // @ts-ignore
                                    result = scene.pickFromRay(ray, this.objectsToExclude);
                                }
                                if (!result) break;
                                if (!result.object) break;
                                if (!result.position) break;

                                const pos = positionFromCartesian(result.position);
                                if (!pos) {
                                    reject(new Error('positionFromCartesian failed'));
                                    return;
                                }

                                resolve(pos);
                                return;
                            } while (false);

                            if (ray && !(scene.terrainProvider instanceof Cesium.EllipsoidTerrainProvider)) {
                                const cartesian = scene.globe.pick(ray, scene);
                                if (!cartesian) {
                                    reject(new Error('scene.globe.pick failed'));
                                    return;
                                }

                                const pos = positionFromCartesian(cartesian);
                                if (!pos) {
                                    reject(new Error('positionFromCartesian failed'));
                                    return;
                                }

                                {
                                    // 修正海拔高度，因为在太空中globe.pick以后的海拔高度会是负值！
                                    if (this.pickHeightMustGreaterThanZero && pos[2] < 0) {
                                        pos[2] = 0;
                                    }
                                }
                                resolve(pos);
                                return;
                            }

                            {
                                const ellipsoid = (scene.terrainProvider instanceof Cesium.EllipsoidTerrainProvider) ? scene.terrainProvider.tilingScheme.ellipsoid : viewer.scene.globe.ellipsoid;
                                const cartesian = viewer.camera.pickEllipsoid(toCartesian2(windowPosition), ellipsoid);
                                if (!cartesian) {
                                    reject(new Error('Pick failed'));
                                    return;
                                }
                                const pos = positionFromCartesian(cartesian);
                                if (!pos) {
                                    reject(new Error('positionFromCartesian failed'));
                                    return;
                                }
                                resolve(pos);
                            }
                        })();
                    } catch (error) {
                        reject(error);
                    }
                }

                const pickTasks = [...this._pickTasks];
                this._pickTasks.length = 0;
                for (let task of pickTasks) {
                    const [windowPosition, windowSize, attachedInfo, resolve, reject] = task;
                    czmViewer.pickCustomAttachedInfo = attachedInfo;
                    try {
                        (async () => {
                            let pickedResult = viewer.scene.pick(toCartesian2(windowPosition), windowSize && windowSize[0], windowSize && windowSize[1]);
                            if (!pickedResult && Cesium.defined(viewer.scene.globe)) {
                                pickedResult = await pickImageryLayerFeature(viewer, toCartesian2(windowPosition));
                            }

                            //Cesium3DTileFeature特殊处理，属性取值
                            let tilesetPickInfo: { [k: string]: any } | undefined = undefined
                            if (pickedResult && pickedResult instanceof Cesium.Cesium3DTileFeature) {
                                tilesetPickInfo = {};
                                try {
                                    if (pickedResult) {
                                        const ids = pickedResult.getPropertyIds() as string[];
                                        ids.forEach(key => {
                                            tilesetPickInfo && (tilesetPickInfo[key] = pickedResult.getProperty(key));
                                        })
                                    }
                                } catch (e) {
                                    console.warn(e)
                                }
                            }

                            // 1.通过 pickedResult判断拾取到对应哪个对象
                            // 2.拾取到 Cesium3DTileFeature 对象需要特殊处理，取出属性值
                            // 3.在此处判断并且触发对象的 pickedEvent 事件

                            //TODO 等待完善czm实现类
                            let id = undefined;//在此处通过pickedResult判断拾取到对应哪个对象id;
                            do {
                                if (!pickedResult) break;
                                if (pickedResult.id && pickedResult.id instanceof Cesium.Entity && pickedResult.id.ESSceneObjectID) {
                                    id = pickedResult.id.ESSceneObjectID;
                                    break;
                                }
                                if (pickedResult.primitive && pickedResult.primitive.ESSceneObjectID) {
                                    id = pickedResult.primitive.ESSceneObjectID;
                                    break;
                                }
                            } while (false);
                            const sceneObject = id ? ESSceneObject.getSceneObjectById(id) : undefined;
                            let geojsonPickInfo = {};
                            if (sceneObject && Reflect.has(sceneObject, 'allowPicking') && Reflect.has(sceneObject, 'pickedEvent')) {
                                //@ts-ignore
                                if (sceneObject.allowPicking ?? false) {
                                    do {
                                        if (sceneObject instanceof ESEntityCluster) {
                                            const time = new Cesium.JulianDate();
                                            geojsonPickInfo =
                                                pickedResult.id instanceof Cesium.Entity
                                                    ? {
                                                        "name": pickedResult.id.label.text.getValue(time),
                                                        "properties": pickedResult.id.properties?.getValue(time),
                                                        "coordinates": fromCartesian3(pickedResult.id.position.getValue(time)),
                                                    }
                                                    : pickedResult.id?.map((e: any) => {
                                                        return {
                                                            "name": e.id,
                                                            "properties": e.properties?.getValue(time),
                                                            "coordinates": fromCartesian3(e.position.getValue(time)),
                                                        }
                                                    })
                                                ;
                                            sceneObject.pickedEvent.emit(new ESJPickedInfo({ pickedResult, geojsonPickInfo, screenPosition: windowPosition }, attachedInfo));

                                            break;
                                        }
                                        if (sceneObject instanceof ESGeoJson) {
                                            const time = new Cesium.JulianDate();
                                            if (!pickedResult.id.entityCollection) return;
                                            const type = pickedResult.id.polygon ? 'Polygon' : pickedResult.id.polyline ? 'LineString' : 'Point';
                                            const properties = pickedResult.id.properties?.getValue(time) ?? {};
                                            //@ts-ignore
                                            const coordinates = type == 'Point' ?
                                                positionFromCartesian(pickedResult.id.position.getValue(time)) :
                                                type == 'LineString' ?
                                                    pickedResult.id.polyline.positions.getValue(time).map((item: Cesium.Cartesian3) => positionFromCartesian(item)) :
                                                    getPolygonPointsFromHierarchy(pickedResult.id.polygon.hierarchy.getValue(time));
                                            geojsonPickInfo = sceneObject.pickedInfoType == "FeatureCollection" ? {
                                                type: "Feature",
                                                geometry: {
                                                    type: type,
                                                    coordinates: coordinates
                                                },
                                                properties: properties
                                            } : {
                                                type: type,
                                                coordinates: coordinates,
                                                properties: properties
                                            }
                                            sceneObject.pickedEvent.emit(new ESJPickedInfo({ pickedResult, geojsonPickInfo, screenPosition: windowPosition }, attachedInfo));
                                            break;
                                        }
                                        //@ts-ignore
                                        sceneObject.pickedEvent.emit(new ESJPickedInfo({ pickedResult, screenPosition: windowPosition }, attachedInfo));
                                    } while (false);
                                }
                            }
                            // 触发dom点击事件
                            // const event = new MouseEvent('mousedown')
                            // //筛选格式固定，找到GeoCustomDivPoi绑定事件的元素
                            // //@ts-ignore
                            // document.elementFromPoint(...windowPosition).closest('div[style$="unset;"]').dispatchEvent(event);
                            // if(!pickedResult){
                            //     czmViewer.changeSceneObjectChanged.don(e=>{

                            //     })
                            // }else{
                            const result = new PickedResult(pickedResult, sceneObject, tilesetPickInfo, geojsonPickInfo, attachedInfo);
                            resolve(result);
                            // }
                            // resolve(new CzmPickedInfo(pickedResult, new AttachedPickedInfo(attachedInfo), pickedObj));
                        })()
                    } catch (error) {
                        reject(error);
                    }
                }
            };

            this.dispose(viewer.scene.preUpdate.addEventListener(updateEveryFrame));
        }
    }
}

function pickImageryLayerFeature(viewer: Cesium.Viewer, windowPosition: Cesium.Cartesian2) {
    const scene = viewer.scene;
    const pickRay = scene.camera.getPickRay(windowPosition);
    if (!pickRay) return;
    const imageryLayerFeaturePromise = scene.imageryLayers.pickImageryLayerFeatures(
        pickRay,
        scene
    );
    if (!Cesium.defined(imageryLayerFeaturePromise)) {
        return;
    }
    return imageryLayerFeaturePromise
}
