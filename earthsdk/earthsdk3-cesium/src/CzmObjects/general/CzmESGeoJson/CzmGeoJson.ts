import { ESJResource, ESSceneObject, getDistancesFromPositions, getMinMaxCorner, PickedInfo } from "earthsdk3";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { Destroyable, Listener, Event, react, reactArrayWithUndefined, reactJsonWithUndefined, extendClassProps, ReactivePropsToNativePropsAndChanged, createProcessingFromAsyncFunc, createNextAnimateFrameEvent, SceneObjectKey } from "xbsj-base";
import * as Cesium from 'cesium';
import { getCameraPosition, positionFromCartesian } from "../../../utils";

const data = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    116.2,
                    39.56
                ]
            },
            "properties": {
                "title": "swimming",
                "marker-symbol": "swimming",
                "marker-color": "#8F1312"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    115.2,
                    38.56
                ]
            },
            "properties": {
                "title": "8",
                "marker-symbol": "8",
                "marker-color": "#46117E"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    114.2,
                    37.56
                ]
            },
            "properties": {
                "title": "6",
                "marker-symbol": "6",
                "marker-color": "#713291"
            }
        }
    ]
}

const dataMd = `\
properties是一个包含三个属性的对象，title表示标题，marker-symbol表示点位的文字内容，marker-color表示点位颜色，properties可以删除，然后使用场景对象属性设置。
\`\`\`
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    116.2,
                    39.56
                ]
            },
            "properties": {
                "title": "swimming",
                "marker-symbol": "swimming",
                "marker-color": "#8F1312"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    115.2,
                    38.56
                ],
                "properties": {
                    "title": "8",
                    "marker-symbol": "8",
                    "marker-color": "#46117E"
                }
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    114.2,
                    37.56
                ],
                "properties": {
                    "title": "6",
                    "marker-symbol": "6",
                    "marker-color": "#713291"
                }
            }
        }
    ]
}
\`\`\`
`

const defaultLoadFuncStr = `\
// dataSource
(dataSource) => {
    if (dataSource) {
        dataSource.show = true;

        const entities = dataSource.entities.values;
        const colorHash = {};
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const name = entity.name;
            let color = colorHash[name];
            if (!color) {
                color = Cesium.Color.fromRandom({
                    alpha: 1.0,
                });
                colorHash[name] = color;
            }
            if (entity.polygon) {

                entity.polygon.material = color;
                entity.polygon.outline = false;
                entity.polygon.extrudedHeight = entity.properties.Population / 50.0;
            }
        }
    }
}
`;

const url = '${xe2-assets-script-dir}/xe2-assets/scene-manager/misc/2.geojson'

const defaultLoadFuncDocStr = `\
${url}

该路径可以使用下面回调函数
\`\`\`
${defaultLoadFuncStr}
\`\`\`
`

export class CzmGeoJson extends Destroyable {
    //飞行整体
    private _flyToEvent = this.disposeVar(new Event<[number | undefined]>());
    get flyToEvent(): Listener<[number | undefined]> { return this._flyToEvent; }
    flyTo(duration?: number) { this._flyToEvent.emit(duration); }

    private _loadFuncReact = this.disposeVar(react<((dataSource: Cesium.GeoJsonDataSource) => void) | undefined>(undefined));
    get loadFun() { return this._loadFuncReact.value; }
    set loadFun(value: ((dataSource: Cesium.GeoJsonDataSource) => void) | undefined) { this._loadFuncReact.value = value; }
    get loadFunChanged() { return this._loadFuncReact.changed; }

    private _dataSource = this.disposeVar(react<Cesium.GeoJsonDataSource | undefined>(undefined));
    get dataSource() { return this._dataSource.value; }
    set dataSource(value) { this._dataSource.value = value; }

    private _data: Object | undefined;

    private _defaultHeight = {} as { [xx: string]: number }//记录面默认高度
    private _defaultBoundingSphere = new Cesium.BoundingSphere()


    constructor(czmViewer: ESCesiumViewer, id?: SceneObjectKey) {
        super();
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }

        let resetDataSource = () => {
            this.dataSource && viewer.dataSources.remove(this.dataSource, true);
            this.dataSource = undefined;
            this._data = undefined;
        }
        this.dispose(() => {
            resetDataSource();
        });
        {
            const processing = this.dv(createProcessingFromAsyncFunc(async cancelManager => {
                this.dataSource && resetDataSource();
                if (!this.url) return;
                do {
                    if (typeof this.url == 'object') {
                        this._data = this.url;
                        break;
                    }
                    if (this._isJSONString(this.url)) {
                        this._data = JSON.parse(this.url);
                        break;
                    }
                    await fetch(ESSceneObject.context.getStrFromEnv(this.url)).then(response => response.json()).then(res => {
                        this._data = res;
                    }).catch(err => {
                        console.warn("ESGeoJson数据加载失败", err);
                    })
                } while (false);
                this.dataSource = await Cesium.GeoJsonDataSource.load(this._data);
                viewer.dataSources.add(this.dataSource).then(dataSource => {
                    const tempPositions: Cesium.Cartesian3[] = [];
                    for (const entity of dataSource.entities.values) {
                        //@ts-ignore
                        Cesium.Entity.prototype && (entity.ESSceneObjectID = id);
                        this._isEntityShow(entity, czmViewer);
                        if (entity.polygon) {
                            tempPositions.push(...entity.polygon.hierarchy?.getValue(Cesium.JulianDate.now()).positions);
                        }
                        if (entity.polyline) {
                            tempPositions.push(...entity.polyline.positions?.getValue(Cesium.JulianDate.now()));
                        }
                        if (entity.position) {
                            const tempPos = entity.position.getValue(Cesium.JulianDate.now());
                            tempPos && tempPositions.push(tempPos);
                        }
                    }
                    this._defaultBoundingSphere = Cesium.BoundingSphere.fromPoints(tempPositions);
                });
            }))
            const update = () => {
                processing.isRunning && processing.cancel();
                processing.restart();
            }
            update();
            const event = this.dv(createNextAnimateFrameEvent(
                this.loadFunChanged,
                this.urlChanged
            ))
            this.dispose(event.don(update));
        }
        {
            const updateStyle = () => {
                if (this.dataSource) {
                    this.dataSource.show = this.show;
                    if (this.loadFun) {
                        try {
                            this.loadFun(this.dataSource);
                        } catch (error) {
                            console.error(error);
                        }
                    } else {
                        const entities = this.dataSource.entities.values;
                        for (let i = 0; i < entities.length; i++) {
                            const entity = entities[i];
                            if (entity.polygon) {
                                if (!this._defaultHeight[entity.id])
                                    this._defaultHeight[entity.id] = entity.polygon.height?.getValue(Cesium.JulianDate.now());
                                entity.polygon.height = this.fillGround ? undefined : new Cesium.ConstantProperty(this._defaultHeight[entity.id]);
                                entity.polygon.perPositionHeight = new Cesium.ConstantProperty(this.fillGround ? false : true);
                                entity.polygon.heightReference = new Cesium.ConstantProperty(this.heightReference.toUpperCase() == "NONE"
                                    ? Cesium.HeightReference.NONE
                                    : this.heightReference.toUpperCase() == "CLAMP_TO_GROUND"
                                        ? Cesium.HeightReference.CLAMP_TO_GROUND
                                        : Cesium.HeightReference.RELATIVE_TO_GROUND);
                                entity.polygon.show = new Cesium.ConstantProperty(this.filled ?? CzmGeoJson.defaults.filled);
                                entity.polygon.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...(this.fillColor ?? CzmGeoJson.defaults.fillColor)));
                                entity.polygon.outline = new Cesium.ConstantProperty(false);
                                // entity.polygon.outlineWidth = new Cesium.ConstantProperty(sceneObject.strokeWidth ?? CzmGeoJson.defaults.strokeWidth);
                                // entity.polygon.outlineColor = new Cesium.ConstantProperty(new Cesium.Color(...(sceneObject.strokeColor ?? CzmGeoJson.defaults.strokeColor)));

                                // polygon自带边框线无法修改宽度，使用polyline替代
                                entity.polyline = new Cesium.PolylineGraphics();
                                const positions = JSON.parse(JSON.stringify(entity.polygon.hierarchy?.getValue(Cesium.JulianDate.now()).positions));
                                if (!Cesium.Cartesian3.equals(positions[0], positions[positions.length - 1])) positions.push(positions[0]);
                                entity.polyline.positions = positions
                            }
                            if (entity.polyline) {
                                entity.polyline.show = new Cesium.ConstantProperty(this.stroked ?? CzmGeoJson.defaults.stroked);
                                entity.polyline.width = new Cesium.ConstantProperty(this.strokeWidth ?? CzmGeoJson.defaults.strokeWidth);
                                entity.polyline.material = new Cesium.ColorMaterialProperty(new Cesium.Color(...(this.strokeColor ?? CzmGeoJson.defaults.strokeColor)));
                                entity.polyline.clampToGround = new Cesium.ConstantProperty(this.strokeGround);
                            }
                            if (entity.billboard) {
                                entity.billboard.show = new Cesium.ConstantProperty(this.imageShow ?? CzmGeoJson.defaults.imageShow);
                                entity.billboard.width = new Cesium.ConstantProperty(this.imageSize ? this.imageSize[0] : CzmGeoJson.defaults.imageSize[0]);
                                entity.billboard.height = new Cesium.ConstantProperty(this.imageSize ? this.imageSize[1] : CzmGeoJson.defaults.imageSize[1]);
                                const tempUrl = this.imageUrl ? typeof this.imageUrl == "string" ? this.imageUrl : this.imageUrl.url : CzmGeoJson.defaults.imageUrl;
                                entity.billboard.image = new Cesium.ConstantProperty(ESSceneObject.context.getStrFromEnv(tempUrl));
                                entity.billboard.horizontalOrigin = new Cesium.ConstantProperty(Cesium.HorizontalOrigin.LEFT);
                                entity.billboard.verticalOrigin = new Cesium.ConstantProperty(Cesium.VerticalOrigin.TOP);
                                entity.billboard.heightReference = new Cesium.ConstantProperty(this.heightReference.toUpperCase() == "NONE"
                                    ? Cesium.HeightReference.NONE
                                    : this.heightReference.toUpperCase() == "CLAMP_TO_GROUND"
                                        ? Cesium.HeightReference.CLAMP_TO_GROUND
                                        : Cesium.HeightReference.RELATIVE_TO_GROUND);
                                const imagePixelOffset = this.imageAnchor ?? CzmGeoJson.defaults.imageAnchor;
                                const imageOffset = this.imageOffset ?? CzmGeoJson.defaults.imageOffset;
                                entity.billboard.pixelOffset = new Cesium.ConstantProperty(Cesium.Cartesian2.fromArray([
                                    -imagePixelOffset[0] * entity.billboard.width.getValue(Cesium.JulianDate.now()) + imageOffset[0],
                                    -imagePixelOffset[1] * entity.billboard.height.getValue(Cesium.JulianDate.now()) + imageOffset[1],
                                ]));
                                //GeoJson点样式默认使用图片标注进行显示，有图片标注就是点，需要创建label,使用标注显示
                                entity.label = new Cesium.LabelGraphics();
                                if (!entity.label) return;
                                entity.label.show = new Cesium.ConstantProperty(this.textShow ?? CzmGeoJson.defaults.textShow);
                                entity.label.heightReference = new Cesium.ConstantProperty(this.heightReference.toUpperCase() == "NONE"
                                    ? Cesium.HeightReference.NONE
                                    : this.heightReference.toUpperCase() == "CLAMP_TO_GROUND"
                                        ? Cesium.HeightReference.CLAMP_TO_GROUND
                                        : Cesium.HeightReference.RELATIVE_TO_GROUND);
                                entity.label.text = new Cesium.ConstantProperty(
                                    this.textProperty && this.textProperty !== "" && entity.properties && entity.properties[this.textProperty]
                                        ? entity.properties[this.textProperty].getValue()
                                        : (this.textDefaultText ?? CzmGeoJson.defaults.textDefaultText));
                                entity.label.fillColor = new Cesium.ConstantProperty(new Cesium.Color(...(this.textColor ?? CzmGeoJson.defaults.textColor)));
                                entity.label.showBackground = new Cesium.ConstantProperty(!(this.textBackgroundColor == undefined));
                                const textFontSize = this.textFontSize && this.textFontSize != 0 ? this.textFontSize : CzmGeoJson.defaults.textFontSize;
                                const textOffset = this.textOffset ?? CzmGeoJson.defaults.textOffset;
                                entity.label.backgroundColor = new Cesium.ConstantProperty(new Cesium.Color(...(this.textBackgroundColor ?? CzmGeoJson.defaults.textBackgroundColor)));
                                entity.label.font = new Cesium.ConstantProperty(`${this.textFontStyle} ${this.textFontWeight} ${textFontSize}px ${this.textFontFamily ?? CzmGeoJson.defaults.textFontFamily}`)
                                entity.label.horizontalOrigin = new Cesium.ConstantProperty(Cesium.HorizontalOrigin.LEFT);
                                entity.label.verticalOrigin = new Cesium.ConstantProperty(Cesium.VerticalOrigin.TOP);
                                entity.label.eyeOffset = new Cesium.ConstantProperty(Cesium.Cartesian3.fromArray([0, 0, -1]));
                                // entity.label.pixelOffset = new Cesium.ConstantProperty(Cesium.Cartesian2.fromArray(this.textOffset ?? CzmGeoJson.defaults.textOffset));
                                const textPixelOffset = this.textAnchor ?? CzmGeoJson.defaults.textAnchor;
                                entity.label.pixelOffset = new Cesium.ConstantProperty(Cesium.Cartesian2.fromArray([
                                    -textPixelOffset[0] * ((this.textBackgroundColor ? -14 : -textFontSize * 2) + this._countBytes(entity.label.text.getValue(Cesium.JulianDate.now())) / 2 * textFontSize) + textOffset[0],
                                    -textPixelOffset[1] * ((this.textBackgroundColor ? 10 : 0) + textFontSize) + textOffset[1],
                                ]));
                            }
                        }
                    }
                }
            }
            updateStyle();
            const event = this.dv(createNextAnimateFrameEvent(
                this._dataSource.changed,
                this.showChanged,
                this.strokedChanged,
                this.strokeWidthChanged,
                this.strokeWidthTypeChanged,
                this.strokeColorChanged,
                this.strokeMaterialChanged,
                this.strokeMaterialParamsChanged,
                this.strokeGroundChanged,
                this.filledChanged,
                this.fillColorChanged,
                this.fillMaterialChanged,
                this.fillMaterialParamsChanged,
                this.fillGroundChanged,
                this.imageShowChanged,
                this.imageUrlChanged,
                this.imageSizeChanged,
                this.imageAnchorChanged,
                this.imageOffsetChanged,
                this.textShowChanged,
                this.textPropertyChanged,
                this.textDefaultTextChanged,
                this.textColorChanged,
                this.textBackgroundColorChanged,
                this.textFontFamilyChanged,
                this.textFontSizeChanged,
                this.textFontStyleChanged,
                this.textFontWeightChanged,
                this.textAnchorChanged,
                this.textOffsetChanged,
                this.heightReferenceChanged,
            ))
            this.dispose(event.don(updateStyle))
        }
        {
            const update = () => {
                if (!this.dataSource) return;
                const entities = this.dataSource.entities.values;
                for (let i = 0; i < entities.length; i++) {
                    const entity = entities[i];
                    this._isEntityShow(entity, czmViewer);
                }
            }
            update();
            const event = this.ad(createNextAnimateFrameEvent(
                this.minFeatureVisibleDistanceChanged,
                this.maxFeatureVisibleDistanceChanged,
                czmViewer.cameraChanged,
            ));
            this.ad(event.don(update));
        }
        {
            const update = () => {
                if (this.loadFuncStr) {
                    try {
                        const func = Function(`"use strict";return (${this.loadFuncStr})`)();
                        this.loadFun = func;
                    } catch (error) {
                        console.error(error);
                        this.loadFun = undefined;
                    }
                } else {
                    this.loadFun = undefined;
                }
            };
            update();
            this.dispose(this.loadFuncStrChanged.disposableOn(update));
        }
        this.dispose(this.flyToEvent.disposableOn((duration) => {
            if (!czmViewer.actived) return;
            if (!this.dataSource) return;
            if (duration !== undefined) {
                viewer.flyTo(this.dataSource, { duration: duration / 1000 }).then(flyOver => {
                    if (!flyOver)
                        viewer.camera.flyToBoundingSphere(this._defaultBoundingSphere, { duration: duration / 1000 })
                });
            } else {
                viewer.flyTo(this.dataSource).then(flyOver => {
                    if (!flyOver)
                        viewer.camera.flyToBoundingSphere(this._defaultBoundingSphere)
                });
            }
        }));
    }
    private _isJSONString(str: string) {
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    }
    private _countBytes(str: string) {
        let totalBytes = 0;
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            if (charCode <= 0x7F) {
                totalBytes += 1;
            } else if (charCode <= 0x7FF) {
                totalBytes += 2;
            } else if (charCode <= 0xFFFF) {
                totalBytes += 3;
            } else {
                totalBytes += 4;
            }
        }
        return totalBytes;
    }
    private _isEntityShow(entity: Cesium.Entity, czmViewer: ESCesiumViewer) {
        if (this.minFeatureVisibleDistance == 0 && this.maxFeatureVisibleDistance == 0) {
            entity.show = this.show;
            return;
        };
        if (czmViewer.viewer?.camera && this.show) {
            let entityPosition = undefined;
            do {
                if (entity.polygon && entity.polygon.hierarchy) {
                    entityPosition = getMinMaxCorner(entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions.map((e: Cesium.Cartesian3) => positionFromCartesian(e))).center;
                    break;
                }
                if (entity.polyline && entity.polyline.positions) {
                    entityPosition = getMinMaxCorner(entity.polyline.positions.getValue(Cesium.JulianDate.now()).map((e: Cesium.Cartesian3) => positionFromCartesian(e))).center;
                }
                if (entity.position) {
                    const tempPos = entity.position.getValue(Cesium.JulianDate.now());
                    tempPos && (entityPosition = positionFromCartesian(tempPos));
                }
            } while (false);
            if (!entityPosition || isNaN(entityPosition[0])) return;
            const dis = getDistancesFromPositions([entityPosition, getCameraPosition(czmViewer.viewer.camera)], 'NONE')[0];
            let show = false;
            if (this.minFeatureVisibleDistance < this.maxFeatureVisibleDistance) {
                show = this.minFeatureVisibleDistance < dis && dis < this.maxFeatureVisibleDistance;
            } else if (this.maxFeatureVisibleDistance == 0) {
                show = dis > this.minFeatureVisibleDistance;
            } else if (this.minFeatureVisibleDistance == 0) {
                show = dis < this.maxFeatureVisibleDistance;
            }
            entity.show = this.show && show;
        }
    }
    static defaults = {
        show: true,
        allowPicking: true,
        url: url,
        defaultLoadFuncStr: defaultLoadFuncStr,
        defaultLoadFuncDocStr: defaultLoadFuncDocStr,
        data: data,
        dataMd: dataMd,

        // 线样式
        stroked: true,
        strokeWidth: 1,
        strokeWidthType: "world",
        strokeColor: [0.79, 0.91, 0.06, 1] as [number, number, number, number],
        strokeMaterial: "",
        strokeMaterialParams: {},
        strokeGround: false,
        // 面样式
        filled: true,
        fillColor: [0.79, 0.91, 0.06, 0.2] as [number, number, number, number],
        fillMaterial: "",
        fillMaterialParams: {},
        fillGround: false,
        // 图片样式
        imageShow: true,
        imageUrl: "${xe2-assets-script-dir}/xe2-assets/scene-manager/images/location.png",
        imageSize: [64, 64] as [number, number],
        imageAnchor: [0.5, 1] as [number, number],
        imageOffset: [0, 0] as [number, number],
        // 文本样式
        textShow: true,
        textProperty: "",
        textDefaultText: "默认标注",
        textColor: [1, 1, 1, 1] as [number, number, number, number],
        textBackgroundColor: [0.79, 0.91, 0.06, 1] as [number, number, number, number],
        textFontFamily: "Arial",
        textFontSize: 16,
        textFontWeight: 'normal',
        textFontStyle: 'normal',
        textAnchor: [0.5, 1] as [number, number],
        textOffset: [0, 0] as [number, number],
        strokeWidthTypes: [["screen", "screen"], ["world", "world"]] as [name: string, value: string][],
        minFeatureVisibleDistance: 0,
        maxFeatureVisibleDistance: 0,
        heightReferences: [['NONE', 'NONE'], ['CLAMP_TO_GROUND', 'CLAMP_TO_GROUND'], ['RELATIVE_TO_GROUND', 'RELATIVE_TO_GROUND']] as [name: string, value: string][]
    };
}

export namespace CzmGeoJson {
    export const createDefaultProps = () => ({
        show: true, // boolean} [show=true] A boolean Property specifying the visibility
        allowPicking: undefined as boolean | undefined,
        loadFuncStr: undefined as string | undefined,
        url: undefined as string | undefined | { [xx: string]: any },
        // 线样式
        stroked: undefined as boolean | undefined,
        strokeWidth: undefined as number | undefined,
        strokeWidthType: "world",
        strokeColor: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        strokeMaterial: undefined as string | undefined,
        strokeMaterialParams: reactJsonWithUndefined<any>(undefined),
        strokeGround: undefined as boolean | undefined,
        // 面样式
        filled: undefined as boolean | undefined,
        fillColor: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        fillMaterial: undefined as string | undefined,
        fillMaterialParams: reactJsonWithUndefined<any>(undefined),
        fillGround: undefined as boolean | undefined,
        // 图片样式
        imageShow: undefined as boolean | undefined,
        imageUrl: undefined as string | undefined | ESJResource,
        imageSize: reactArrayWithUndefined<[number, number]>(undefined),
        imageAnchor: reactArrayWithUndefined<[number, number]>(undefined),
        imageOffset: reactArrayWithUndefined<[number, number]>(undefined),
        // 文本样式
        textShow: undefined as boolean | undefined,
        textProperty: undefined as string | undefined,
        textDefaultText: undefined as string | undefined,
        textColor: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        textBackgroundColor: reactArrayWithUndefined<[number, number, number, number]>(undefined),
        textFontFamily: undefined as string | undefined,
        textFontSize: undefined as number | undefined,
        textFontStyle: undefined as number | undefined,
        textFontWeight: undefined as number | undefined,
        textAnchor: reactArrayWithUndefined<[number, number]>(undefined),
        textOffset: reactArrayWithUndefined<[number, number]>(undefined),
        minFeatureVisibleDistance: 0,
        maxFeatureVisibleDistance: 0,
        heightReference: "NONE",
    });
}
extendClassProps(CzmGeoJson.prototype, CzmGeoJson.createDefaultProps);
export interface CzmGeoJson extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmGeoJson.createDefaultProps>> { }
