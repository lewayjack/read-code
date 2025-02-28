import * as Cesium from 'cesium';
import { ESEntityCluster, ESSceneObject, isJSONString } from "earthsdk3";
import { CzmESVisualObject } from '../../base';
import { createNextAnimateFrameEvent, react, track } from 'xbsj-base';
import { ESCesiumViewer } from '../../../ESCesiumViewer';

export class CzmESEntityCluster extends CzmESVisualObject<ESEntityCluster> {
    static readonly type = this.register('ESCesiumViewer', ESEntityCluster.type, this);
    private _scaleFactor = 0.6;
    private _urlData = this.dv(react<any>(undefined));
    get urlData() { return this._urlData.value; }
    set urlData(value: any) { this._urlData.value = value; }
    get urlDataChanged() { return this._urlData.changed; }

    private _dataSource = new Cesium.CustomDataSource();
    private _clusterImages = {} as any;
    private _clusterImageAttribute = {} as { [xx: string]: any }
    private _clusterImageUrl: string = "";

    constructor(sceneObject: ESEntityCluster, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        this._clusterImageUrl = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/ESPoi2D/clusterSpirit.png');
        // 获取json数据
        (async () => {
            const clusterUrl = ESSceneObject.getStrFromEnv('${earthsdk3-assets-script-dir}/assets/img/ESPoi2D/clusterJson.json')
            await fetch(clusterUrl).then(res => res.json()).then(data => {
                this._clusterImageAttribute = data;
            }).catch(err => {
                console.error(err)
            });
            // 初始化图标数据
            for (const key in this._clusterImageAttribute) {
                if (Object.prototype.hasOwnProperty.call(this._clusterImageAttribute, key)) {
                    const item = this._clusterImageAttribute[key];
                    this._clusterImages[key] = new Cesium.BillboardGraphics({
                        image: this._clusterImageUrl,
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                        scale: 1 * this._scaleFactor,
                        width: item.imageSize[0],
                        height: item.imageSize[1],
                        pixelOffset: new Cesium.Cartesian2(-item.anchorPixelOffset[0] * this._scaleFactor, -item.anchorPixelOffset[1] * this._scaleFactor),
                        imageSubRegion: new Cesium.BoundingRectangle(...item.imagePixelOffset, ...item.imageSize),
                    })
                }
            }
            // 添加自定义数据
            const dataSource = this._dataSource;
            czmViewer.viewer?.dataSources.add(dataSource);
            this.d(() => { czmViewer.viewer?.dataSources.remove(dataSource) });

            dataSource.clustering.enabled
                = dataSource.clustering.clusterBillboards
                = dataSource.clustering.clusterLabels
                = dataSource.clustering.clusterPoints = true;

            this.d(track([dataSource.clustering, 'pixelRange'], [sceneObject, 'pixelRange']));
            this.d(track([dataSource.clustering, 'minimumClusterSize'], [sceneObject, 'minimumClusterSize']));
            this.d(track([dataSource.clustering, 'show'], [sceneObject, 'show']));
            {
                // 加载数据
                const update = () => {
                    if (!sceneObject.url) return;
                    do {
                        if (typeof sceneObject.url == 'object' && !!sceneObject.url.url) {
                            fetch(ESSceneObject.context.getStrFromEnv(sceneObject.url.url)).then(response => response.json()).then(res => {
                                this.urlData = res;
                            }).catch(err => {
                                console.warn("ESEntityCluster数据加载失败", err);
                            })
                            break;
                        }
                        if (typeof sceneObject.url == 'object') {
                            this.urlData = sceneObject.url;
                            break;
                        }
                        if (isJSONString(sceneObject.url)) {
                            this.urlData = JSON.parse(sceneObject.url);
                            break;
                        }
                        fetch(ESSceneObject.getStrFromEnv(sceneObject.url)).then(response => response.json()).then(res => {
                            this.urlData = res;
                        }).catch(err => {
                            console.warn("ESEntityCluster数据加载失败", err);
                        })
                    } while (false);
                }
                update();
                this.d(sceneObject.urlChanged.don(update));
            }
            {
                // 数据、高度模式、透视模式变化需要重新聚合
                const event = this.dv(createNextAnimateFrameEvent(
                    this.urlDataChanged,
                    sceneObject.heightReferenceChanged,
                    // sceneObject.perspectiveChanged
                ));
                const _this = this;
                this.d(event.don(() => { this.updateEntityCluster(_this) }));
            }
            {
                // 样式变化需要根据情况判断是重新聚合还是改聚合后样式
                const update = (newVal?: { [xx: string]: any }, oldVal?: { [xx: string]: any }) => {
                    if (newVal != undefined && (newVal?.nonCluster.mode != oldVal?.nonCluster.mode || newVal?.nonCluster.style != oldVal?.nonCluster.style)) {
                        this.updateEntityCluster(this);
                    } else {
                        this.updateStyle();
                    }
                }
                this.d(sceneObject.styleChanged.don((newVal, oldVal) => update(newVal, oldVal)));
            }
        })()
    }
    // 更新聚合
    private async updateEntityCluster(CzmESEntityCluster: CzmESEntityCluster) {
        const { czmViewer, _dataSource: dataSource, sceneObject } = CzmESEntityCluster;
        // 同步属性
        let scene = czmViewer.viewer?.scene;
        if (!scene) {
            return;
        }
        const entities = dataSource.entities;
        // 透视效果，直接作用在billboard上
        // const scaleByDistance = sceneObject.perspective
        const scaleByDistance = false
            ? new Cesium.NearFarScalar(1.0e2, 1.0, 1.0e7, 0.4)
            : new Cesium.NearFarScalar(1.0e2, 1.0, 1.0e3, 1.0);
        // 高程模式，直接作用于billboard上
        const heightReference = sceneObject.heightReference == "None"
            ? Cesium.HeightReference.NONE
            : sceneObject.heightReference == "CLAMP_TO_GROUND"
                ? Cesium.HeightReference.CLAMP_TO_GROUND
                : Cesium.HeightReference.CLAMP_TO_TERRAIN;
        // 移除上次数据
        entities.removeAll();

        const style = sceneObject.style ?? ESEntityCluster.defaults.style;

        this._clusterImages[style.nonCluster?.mode ?? "SquareH01"].heightReference = heightReference;
        this._clusterImages[style.nonCluster?.mode ?? "SquareH01"].scaleByDistance = scaleByDistance;
        const labelOffset = [
            -this._clusterImageAttribute[style.nonCluster?.mode ?? "SquareH01"].anchorPixelOffset[0] + this._clusterImageAttribute[style.nonCluster?.mode ?? "SquareH01"].textPixelOffset[0],
            -this._clusterImageAttribute[style.nonCluster?.mode ?? "SquareH01"].anchorPixelOffset[1] - this._clusterImageAttribute[style.nonCluster?.mode ?? "SquareH01"].textPixelOffset[1],
        ]
        // 添加数据
        if (this.urlData.type === "FeatureCollection") {
            for (let i = 0; i < this.urlData.features.length; i++) {
                const item = this.urlData.features[i];
                if (item.geometry.type == "Point") {
                    this._addEntities(entities, item.properties.name ?? (i + 1).toString(), item.geometry.coordinates, labelOffset, heightReference, scaleByDistance, style.nonCluster?.mode, item.properties);
                } else if (item.geometry.type == "MultiPoint") {
                    for (let j = 0; j < item.geometry.coordinates.length; j++) {
                        this._addEntities(entities, item.properties.name ?? (i + 1).toString(), item.geometry.coordinates[j], labelOffset, heightReference, scaleByDistance, style.nonCluster?.mode, item.properties);
                    }
                } else {
                    console.log("POI聚合只能加载Point和MultiPoint类型的数据,未加载数据类型为：", item.geometry.type);
                }
            }
        } else if (this.urlData.type == "GeometryCollection") {
            for (let i = 0; i < this.urlData.geometries.length; i++) {
                const item = this.urlData.geometries[i];
                if (item.type == "Point") {
                    this._addEntities(entities, item.name ?? (i + 1).toString(), item.coordinates, labelOffset, heightReference, scaleByDistance, style.nonCluster?.mode, item.properties);
                } else if (item.type == "MultiPoint") {
                    for (let j = 0; j < item.coordinates.length; j++) {
                        this._addEntities(entities, item.name ?? (i + 1).toString(), item.coordinates[j], labelOffset, heightReference, scaleByDistance, style.nonCluster?.mode, item.properties);
                    }
                } else {
                    console.log("POI聚合只能加载Point和MultiPoint类型的数据,未加载数据类型为：", item.type);
                }
            }
        }
        this.updateStyle(heightReference, scaleByDistance);
    }
    private async updateStyle(heightReference?: Cesium.HeightReference, scaleByDistance?: Cesium.NearFarScalar) {
        const _this = this;
        const { _dataSource: dataSource, sceneObject } = this;
        const style = sceneObject.style?.cluster ?? ESEntityCluster.defaults.style.cluster;
        dataSource.entities.values.forEach(entity => {
            //@ts-ignore
            Cesium.Entity.prototype && (entity.ESSceneObjectID = sceneObject.id);
        })
        dataSource.clustering.clusterEvent.addEventListener(async function (clusteredEntities, cluster) {
            //@ts-ignore
            cluster.label.ESSceneObjectID = cluster.billboard.ESSceneObjectID = cluster.point.ESSceneObjectID = sceneObject.id;
            cluster.label.show = true;
            cluster.label.font = "16px sans-serif";
            cluster.label.scale = 1 * _this._scaleFactor;
            cluster.label.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
            cluster.label.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
            cluster.label.eyeOffset = new Cesium.Cartesian3(0, 0, -10);
            heightReference && (cluster.label.heightReference = heightReference);
            scaleByDistance && (cluster.label.scaleByDistance = scaleByDistance);

            cluster.billboard.id = cluster.label.id;
            cluster.billboard.show = true;
            cluster.billboard.scale = 1 * _this._scaleFactor;
            cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
            cluster.billboard.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
            heightReference && (cluster.billboard.heightReference = heightReference);
            scaleByDistance && (cluster.billboard.scaleByDistance = scaleByDistance);

            if (style) {
                const currentMode = _this.getClusterStyle(style, clusteredEntities.length).mode;
                const labelOffset = [
                    -_this._clusterImageAttribute[currentMode].anchorPixelOffset[0] + _this._clusterImageAttribute[currentMode].textPixelOffset[0],
                    -_this._clusterImageAttribute[currentMode].anchorPixelOffset[1] - _this._clusterImageAttribute[currentMode].textPixelOffset[1],
                ]
                cluster.label.pixelOffset = new Cesium.Cartesian2(labelOffset[0] * _this._scaleFactor, labelOffset[1] * _this._scaleFactor);
                cluster.billboard.width = _this._clusterImageAttribute[currentMode].imageSize[0];
                cluster.billboard.height = _this._clusterImageAttribute[currentMode].imageSize[1];
                cluster.billboard.pixelOffset = new Cesium.Cartesian2(-_this._clusterImageAttribute[currentMode].anchorPixelOffset[0] * _this._scaleFactor, -_this._clusterImageAttribute[currentMode].anchorPixelOffset[1] * _this._scaleFactor);
                cluster.billboard.setImage(currentMode, _this._clusterImageUrl);
                cluster.billboard.setImageSubRegion(currentMode, new Cesium.BoundingRectangle(..._this._clusterImageAttribute[currentMode].imagePixelOffset, ..._this._clusterImageAttribute[currentMode].imageSize));
            }
        });
        {
            const update = () => {
                const pixelRange = dataSource.clustering.pixelRange;
                dataSource.clustering.pixelRange = 0;
                dataSource.clustering.pixelRange = pixelRange;
            }
            // 强制更新一次
            update();
            let moveEndListener = this.czmViewer.viewer?.camera.moveEnd.addEventListener(() => {
                update();
            })
            this.d(() => {
                moveEndListener && this.czmViewer.viewer?.camera.moveEnd.removeEventListener(moveEndListener);
            })
        }
    }
    private getClusterStyle(clusterStyle: any[], ClusterLength: number) {
        return clusterStyle.find(e => {
            if (e.value !== undefined) return e.value === ClusterLength;
            const b0 = e.minValue !== undefined ? e.minValue <= ClusterLength : true;
            const b1 = e.maxValue !== undefined ? e.maxValue >= ClusterLength : true;
            return b0 && b1;
        });
    }
    private _addEntities(entities: Cesium.EntityCollection, labelName: any, coordinates: number[], labelOffset: number[], heightReference: Cesium.HeightReference, scaleByDistance: Cesium.NearFarScalar, mode: any, properties: any) {
        // 添加数据
        const position = Cesium.Cartesian3.fromDegrees(coordinates[0], coordinates[1], coordinates[2] ?? 0);
        entities.add({
            position: position,
            label: {
                text: labelName,
                scale: 1 * this._scaleFactor,
                font: '16px sans-serif',
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                pixelOffset: new Cesium.Cartesian2(labelOffset[0] * this._scaleFactor, labelOffset[1] * this._scaleFactor),
                heightReference: heightReference,
                scaleByDistance: scaleByDistance,
                eyeOffset: new Cesium.Cartesian3(0, 0, -10),
            },
            billboard: this._clusterImages[mode ?? "SquareH01"],
            properties: properties
        });
    }
    private _getPositionLLH(position: Cesium.Cartesian3) {
        const tempPosition = Cesium.Cartographic.fromCartesian(position);
        return [
            Cesium.Math.toDegrees(tempPosition.longitude),
            Cesium.Math.toDegrees(tempPosition.latitude),
            tempPosition.height
        ]
    }
}
