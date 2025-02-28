import { ESGeoJson, getDistancesFromPositions, getMinMaxCorner } from "earthsdk3";
import { CzmESVisualObject } from "../../base";
import { ESCesiumViewer } from "../../../ESCesiumViewer";
import { flyTo, flyWithPosition } from "../../../utils";
import { track } from "xbsj-base";
import { CzmGeoJson } from "./CzmGeoJson";

export class CzmESGeoJson extends CzmESVisualObject<ESGeoJson> {
    static readonly type = this.register("ESCesiumViewer", ESGeoJson.type, this);
    constructor(sceneObject: ESGeoJson, czmViewer: ESCesiumViewer) {
        super(sceneObject, czmViewer);
        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }
        const czmGeoJson = this.disposeVar(new CzmGeoJson(czmViewer, sceneObject.id));

        this.dispose(track([czmGeoJson, 'show'], [sceneObject, 'show']));
        this.dispose(track([czmGeoJson, 'allowPicking'], [sceneObject, 'allowPicking']));
        this.dispose(track([czmGeoJson, 'loadFuncStr'], [sceneObject, 'loadFuncStr']));
        this.dispose(track([czmGeoJson, 'url'], [sceneObject, 'features']));

        this.dispose(track([czmGeoJson, 'stroked'], [sceneObject, 'stroked']));
        this.dispose(track([czmGeoJson, 'strokeWidth'], [sceneObject, 'strokeWidth']));
        this.dispose(track([czmGeoJson, 'strokeWidthType'], [sceneObject, 'strokeWidthType']));
        this.dispose(track([czmGeoJson, 'strokeColor'], [sceneObject, 'strokeColor']));
        this.dispose(track([czmGeoJson, 'strokeMaterial'], [sceneObject, 'strokeMaterial']));
        this.dispose(track([czmGeoJson, 'strokeMaterialParams'], [sceneObject, 'strokeMaterialParams']));
        this.dispose(track([czmGeoJson, 'strokeGround'], [sceneObject, 'strokeGround']));

        this.dispose(track([czmGeoJson, 'filled'], [sceneObject, 'filled']));
        this.dispose(track([czmGeoJson, 'fillColor'], [sceneObject, 'fillColor']));
        this.dispose(track([czmGeoJson, 'fillMaterial'], [sceneObject, 'fillMaterial']));
        this.dispose(track([czmGeoJson, 'fillMaterialParams'], [sceneObject, 'fillMaterialParams']));
        this.dispose(track([czmGeoJson, 'fillGround'], [sceneObject, 'fillGround']));

        this.dispose(track([czmGeoJson, 'imageShow'], [sceneObject, 'imageShow']));
        this.dispose(track([czmGeoJson, 'imageUrl'], [sceneObject, 'imageUrl']));
        this.dispose(track([czmGeoJson, 'imageSize'], [sceneObject, 'imageSize']));
        this.dispose(track([czmGeoJson, 'imageAnchor'], [sceneObject, 'imageAnchor']));
        this.dispose(track([czmGeoJson, 'imageOffset'], [sceneObject, 'imageOffset']));

        this.dispose(track([czmGeoJson, 'textShow'], [sceneObject, 'textShow']));
        this.dispose(track([czmGeoJson, 'textProperty'], [sceneObject, 'textProperty']));
        this.dispose(track([czmGeoJson, 'textDefaultText'], [sceneObject, 'textDefaultText']));
        this.dispose(track([czmGeoJson, 'textColor'], [sceneObject, 'textColor']));
        this.dispose(track([czmGeoJson, 'textBackgroundColor'], [sceneObject, 'textBackgroundColor']));
        this.dispose(track([czmGeoJson, 'textFontFamily'], [sceneObject, 'textFontFamily']));
        this.dispose(track([czmGeoJson, 'textFontSize'], [sceneObject, 'textFontSize']));
        this.dispose(track([czmGeoJson, 'textFontStyle'], [sceneObject, 'textFontStyle']));
        this.dispose(track([czmGeoJson, 'textFontWeight'], [sceneObject, 'textFontWeight']));
        this.dispose(track([czmGeoJson, 'textAnchor'], [sceneObject, 'textAnchor']));
        this.dispose(track([czmGeoJson, 'textOffset'], [sceneObject, 'textOffset']));

        this.dispose(track([czmGeoJson, 'minFeatureVisibleDistance'], [sceneObject, 'minFeatureVisibleDistance']));
        this.dispose(track([czmGeoJson, 'maxFeatureVisibleDistance'], [sceneObject, 'maxFeatureVisibleDistance']));
        this.dispose(track([czmGeoJson, 'heightReference'], [sceneObject, 'heightReference']));

        this.dispose(sceneObject.flyToEvent.disposableOn(duration => {
            if (!czmViewer.actived) return;
            if (sceneObject.flyInParam) {
                const { position, rotation, flyDuration } = sceneObject.flyInParam;
                flyTo(czmViewer.viewer, position, undefined, rotation, flyDuration);
                return true;
            }
            czmGeoJson.flyTo(duration && duration * 1000);
        }));
        {
            const innerFlyTo = (keyOrIndex: string | number, value: any, duration: number | undefined) => {
                if (!czmViewer.actived) return;
                const info = JSON.parse(JSON.stringify(this._getFeatureByIndexOrProperties(keyOrIndex, value)));
                if (!info || !info?.positions) return;
                if (info.type == 'Point' || info.type == 'MultiPoint') {
                    flyWithPosition(czmViewer, sceneObject, this.id, this._calculateFeatureHeight(info.type == 'MultiPoint' ? info.positions.flat() : info.positions, sceneObject.heightReference, czmViewer), 1000, duration);
                } else {
                    const isFlat = info.type == 'Polygon' || info.type == 'MultiPolygon' || info.type == 'MultiLineString';
                    let temp: any[] = [];
                    if (isFlat) {
                        temp = info.positions.flat(info.type == 'MultiPolygon' ? 2 : 1).map((e: any) => {
                            return this._calculateFeatureHeight(e, sceneObject.fillGround ? "CLAMP_TO_GROUND" : "NONE", czmViewer);
                        })
                    } else {
                        temp = info.positions.map((e: any) => {
                            return this._calculateFeatureHeight(e, sceneObject.strokeGround ? "CLAMP_TO_GROUND" : "NONE", czmViewer);
                        })
                    }
                    const { minPos, maxPos, center } = getMinMaxCorner(temp);
                    flyWithPosition(czmViewer, sceneObject, this.id, center, getDistancesFromPositions([minPos, maxPos], 'NONE')[0], duration);
                }
            }
            this.d(sceneObject.flyToFeatureEvent.don((key, value, duration) => innerFlyTo(key, value, duration)))
            this.d(sceneObject.flyToFeatureIndexEvent.don((index, duration) => innerFlyTo(index, undefined, duration)));
        }
    }
    public _getFeatureByIndexOrProperties(keyOrIndex: string | number, value?: any) {
        const { sceneObject } = this;
        const data = sceneObject.features;
        if (!data) return;
        const entity = Reflect.get(data, "features") || Reflect.get(data, "geometries");
        if (!entity) return;
        if (value) {
            let targetEntity = entity.find((e: any) => e?.properties[keyOrIndex] == value);
            return {
                type: targetEntity?.coordinates ? targetEntity.type : targetEntity?.geometry?.type,
                positions: targetEntity?.coordinates || targetEntity?.geometry?.coordinates
            };
        } else if (typeof keyOrIndex == 'number') {
            // keyOrIndex--;
            return {
                type: entity[keyOrIndex]?.coordinates ? entity[keyOrIndex].type : entity[keyOrIndex]?.geometry?.type,
                positions: entity[keyOrIndex]?.coordinates || entity[keyOrIndex]?.geometry?.coordinates
            };
        }
    }
    private _calculateFeatureHeight(position: any, mode: "NONE" | "CLAMP_TO_GROUND" | "RELATIVE_TO_GROUND", czmViewer: ESCesiumViewer) {
        const { sceneObject } = this;
        const tempPos = [...position] as [number, number, number];
        do {
            if (mode == "NONE") {
                tempPos[2] = tempPos[2] ?? 0;
                break;
            }
            if (mode == "CLAMP_TO_GROUND" || !tempPos[2]) {
                tempPos[2] = (czmViewer.getTerrainHeight(tempPos) ?? 0);
                break;
            }
            tempPos[2] += (czmViewer.getTerrainHeight(tempPos) ?? 0);
        } while (false);
        return tempPos;
    }
}
