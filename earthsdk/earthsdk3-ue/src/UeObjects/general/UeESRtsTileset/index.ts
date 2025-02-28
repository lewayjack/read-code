import { ESRtsTileset, FeatureColorJsonType, FeatureVisableJsonType } from "earthsdk3";
import { ESUeViewer } from "../../../ESUeViewer";
import { UeESSceneObject } from "../../../UeObjects/base";
import { createNextAnimateFrameEvent } from "xbsj-base";
export class UeESRtsTileset<T extends ESRtsTileset = ESRtsTileset> extends UeESSceneObject<T> {
    static readonly type = this.register<ESRtsTileset, ESUeViewer>('ESUeViewer', ESRtsTileset.type, this);
    static override combinationClass = true;
    constructor(sceneObject: T, ueViewer: ESUeViewer) {
        super(sceneObject, ueViewer);
        const viewer = ueViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return;
        }


        // 添加高亮和移除高亮事件
        {
            this.d(sceneObject.highlightInner3DtilesetEvent.don((es3dtileset) => {
                sceneObject.getEditing().forEach(e => {
                    if (es3dtileset.id === e.id) {
                        e.dsFeature.inner3DTileset.highlight = true;
                    } else {
                        e.dsFeature.inner3DTileset.highlight = false;
                    }
                });
                // es3dtileset.flyTo();
            }));

            this.d(sceneObject.removeHighlightInner3DtilesetEvent.don((es3dtileset) => { es3dtileset.highlight = false; }));
        }

        //图层配置
        {

            const colorToRGBA = (color: string) => {
                color = color.toLocaleLowerCase();
                let rgba = [255, 255, 255, 1];
                // 十六进制颜色值转换为RGBA
                if (color.startsWith('#')) {
                    if (color.length === 4) {
                        // #rgb
                        let r = parseInt(color[1] + color[1], 16);
                        let g = parseInt(color[2] + color[2], 16);
                        let b = parseInt(color[3] + color[3], 16);
                        rgba = [r, g, b, 1];
                    } else if (color.length === 7) {
                        // #rrggbb
                        let r = parseInt(color.substring(1, 3), 16);
                        let g = parseInt(color.substring(3, 5), 16);
                        let b = parseInt(color.substring(5, 7), 16);
                        rgba = [r, g, b, 1];
                    }
                }
                // RGBA颜色值转换为RGBA
                else if (color.startsWith('rgba')) {
                    let match = color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
                    if (match) {
                        let r = parseInt(match[1]);
                        let g = parseInt(match[2]);
                        let b = parseInt(match[3]);
                        let a = parseFloat(match[4]);
                        rgba = [r, g, b, a];
                    }
                }
                // RGB颜色值转换为RGBA
                else if (color.startsWith('rgb')) {
                    let match = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
                    if (match) {
                        let r = parseInt(match[1]);
                        let g = parseInt(match[2]);
                        let b = parseInt(match[3]);
                        rgba = [r, g, b, 1];
                    }
                } else {
                    console.error('color类型只能为#rrggbb、#rgb、rgba(r,g,b,a)、rgb(r,g,b)')
                }
                return [rgba[0] / 255, rgba[1] / 255, rgba[2] / 255, rgba[3]] as [number, number, number, number];
            }

            const styleUpdate = () => {
                // sceneObject.resetFeatureStyle();
                const layerConfig = sceneObject.layerConfig;
                if (!layerConfig) return;
                // const czmColorBlendMode = sceneObject.colorBlendMode;

                const conditions: FeatureVisableJsonType[] = [];
                const colors: FeatureColorJsonType[] = [];
                function isNumeric(value: string) {
                    return !isNaN(parseFloat(value));
                }
                //遍历layerConfig
                for (const key in layerConfig) {
                    if (!isNumeric(key)) continue;
                    conditions.push({ value: parseFloat(key), visable: layerConfig[key].visible });
                    // const color = (czmColorBlendMode === "HIGHLIGHT") ? colorToRGBA('rgb(255,255,255)') : colorToRGBA(layerConfig[key].color ?? 'rgb(255,255,255)');
                    const color = colorToRGBA(layerConfig[key].color ?? 'rgb(255,255,255)');
                    colors.push({ value: parseFloat(key), rgba: color });
                }

                sceneObject.setFeatureVisable('layer', conditions);
                sceneObject.setFeatureColor('layer', colors);
            }
            styleUpdate();
            const styleUpdateEvent = this.dv(createNextAnimateFrameEvent(
                sceneObject.layerConfigChanged,
                // sceneObject.colorBlendModeChanged
            ))
            this.d(styleUpdateEvent.don(() => { styleUpdate() }));
        }
    }
}
