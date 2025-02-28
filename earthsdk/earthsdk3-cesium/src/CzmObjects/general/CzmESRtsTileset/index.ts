import * as Cesium from 'cesium';
import { EngineObject, ESRtsTileset } from "earthsdk3";
import { ESCesiumViewer } from '../../../ESCesiumViewer';
import { createNextAnimateFrameEvent } from 'xbsj-base';

export class CzmESRtsTileset<T extends ESRtsTileset = ESRtsTileset> extends EngineObject<T> {
    static readonly type = this.register<ESRtsTileset, ESCesiumViewer>('ESCesiumViewer', ESRtsTileset.type, this);
    constructor(sceneObject: T, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        // 添加轮廓线
        const stages = viewer.scene.postProcessStages;
        const silhouette = stages.add(Cesium.PostProcessStageLibrary.createSilhouetteStage());
        silhouette.uniforms.color = Cesium.Color.LIME;
        silhouette.selected = [];
        this.d(() => {
            silhouette.selected = [];
            stages.remove(silhouette);
        })

        const isFlyTo = (scene: Cesium.Scene, tileset: any) => {
            // 获取 Tileset 的根瓦片 
            var rootTile = tileset.root;
            // 获取根瓦片的包围盒，通常是 BoundingSphere 
            var boundingVolume = rootTile.boundingVolume.boundingVolume;
            // 可能是 BoundingSphere 或 BoundingBox 
            // 获取当前相机的视锥体 
            var frustum = scene.camera.frustum;
            var cullingVolume = frustum.computeCullingVolume(scene.camera.position, scene.camera.direction, scene.camera.up);
            // 使用 computeVisibility 判断包围盒的可见性
            var visibility = cullingVolume.computeVisibility(boundingVolume);
            if (visibility === Cesium.Intersect.OUTSIDE) {
                console.log("Tileset bounding box is OUTSIDE the view.");
                return true
            } else if (visibility === Cesium.Intersect.INTERSECTING) {
                console.log("Tileset bounding box is INTERSECTING with the view.");
                return true
            } else if (visibility === Cesium.Intersect.INSIDE) {
                console.log("Tileset bounding box is INSIDE the view.");
                return false
            }
        }

        // 添加高亮和移除高亮事件
        {
            this.d(sceneObject.highlightInner3DtilesetEvent.don((es3dtileset) => {
                silhouette.selected = [];
                const don = es3dtileset.d(es3dtileset.tilesetReady.donce((tileset) => {
                    tileset.allTilesLoaded.addEventListener(() => {
                        const feature = tileset?._root?._content?._model?._featureTables[0]?._features[0];
                        if (feature) {
                            silhouette.selected = [feature];
                            if (isFlyTo(viewer.scene, tileset)) {
                                es3dtileset.flyTo();
                            }
                        } else {
                            console.warn(`tileset?._root?._content?._model?._featureTables[0]?._features[0] is undefined !`, tileset);
                        }
                        don();
                    })
                }));
                const url = es3dtileset.url as string;
                const time = Date.now();
                if (url.includes('?reload=')) {
                    es3dtileset.url = url.replace(/\?reload=\d+/, `?reload=${time}`);
                } else {
                    es3dtileset.url = url + `?reload=${time}`;
                }
            }))


            this.d(sceneObject.removeHighlightInner3DtilesetEvent.don((es3dtileset) => { silhouette.selected = []; }))
        }

        //图层配置
        {
            this.d(sceneObject.es3DTileset.tilesetReady.don((tileset: Cesium.Cesium3DTileset) => {
                const styleUpdate = () => {
                    const config = sceneObject.layerConfig;
                    if (!config) {
                        tileset.style = undefined;
                        return;
                    }
                    const colorBlendMode = sceneObject.colorBlendMode;
                    const evaluateColor = (feature: Cesium.Cesium3DTileFeature, result: Cesium.Color | undefined) => {
                        try {
                            const ids = feature.getProperty('layer');
                            const newIds = ids.toString() as string;
                            if (newIds && config[newIds] && config[newIds].color) {
                                const color = config[newIds].color as string;
                                return Cesium.Color.fromCssColorString(color, result);
                            } else {
                                return Cesium.Color.clone(Cesium.Color.WHITE, result);
                            }
                        } catch (error) {
                            console.warn(error);
                            return Cesium.Color.clone(Cesium.Color.WHITE, result);
                        }
                    };
                    const evaluateShow = (feature: Cesium.Cesium3DTileFeature) => {
                        try {
                            const ids = feature.getProperty('layer');
                            const newIds = ids.toString() as string;

                            if (newIds && config[newIds] && config[newIds].visible === false) {
                                return false;
                            } else {
                                return true;
                            }
                        } catch (error) {
                            console.warn(error);
                            return true;
                        }
                    }

                    let style: Cesium.Cesium3DTileStyle;

                    if (colorBlendMode !== 'HIGHLIGHT') {
                        style = new Cesium.Cesium3DTileStyle({
                            color: {
                                evaluateColor: function (feature: Cesium.Cesium3DTileFeature, result: Cesium.Color | undefined) {
                                    return evaluateColor(feature, result);
                                },
                            },
                            show: {
                                evaluate: function (feature: Cesium.Cesium3DTileFeature) {
                                    return evaluateShow(feature);
                                },
                            },
                        });
                    } else {
                        style = new Cesium.Cesium3DTileStyle({
                            show: {
                                evaluate: function (feature: Cesium.Cesium3DTileFeature) {
                                    return evaluateShow(feature);
                                },
                            },
                        });
                    }
                    tileset.style = style;
                }
                styleUpdate();
                const styleUpdateEvent = this.dv(createNextAnimateFrameEvent(
                    sceneObject.layerConfigChanged,
                    sceneObject.colorBlendModeChanged
                ))
                this.d(styleUpdateEvent.don(() => { styleUpdate() }));
            }))

        }

    }
}
