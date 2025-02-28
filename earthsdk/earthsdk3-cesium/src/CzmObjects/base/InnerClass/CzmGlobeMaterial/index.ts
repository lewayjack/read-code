import { ESCesiumViewer } from "../../../../ESCesiumViewer";
import { createNextAnimateFrameEvent, Destroyable, extendClassProps, ReactivePropsToNativePropsAndChanged } from "xbsj-base";
import * as Cesium from 'cesium';

export class CzmGlobeMaterial extends Destroyable {
    static defaults = {
        show: false,
        enableContour: false,
        contourSpacing: 150.0,
        contourWidth: 2.0,
        contourColor: [1, 0, 0, 1] as [number, number, number, number],
        shadingMode: 'none'
    }


    constructor(czmViewer: ESCesiumViewer) {
        super();

        const viewer = czmViewer.viewer;
        if (!viewer) {
            console.warn(`viewer is undefined!`);
            return
        }
        const globe = viewer.scene.globe;

        const minHeight = -414.0; // approximate dead sea elevation
        const maxHeight = 8777.0; // approximate everest elevation
        // const contourColor = Cesium.Color.RED.clone();
        let contourUniforms = {};

        const updateMaterial = () => {
            if (!viewer) {
                return;
            }

            let material: Cesium.Material | undefined;

            do {
                const selectedShading = this.shadingMode || 'none';

                if (!(this.show ?? true) || (selectedShading === 'none' && !this.enableContour)) {
                    break;
                }

                let shadingUniforms: any;
                const hasContour = this.enableContour;

                if (hasContour) {
                    if (selectedShading === "elevation") {
                        material = getElevationContourMaterial();
                        shadingUniforms =
                            material.materials.elevationRampMaterial.uniforms;
                        shadingUniforms.minimumHeight = minHeight;
                        shadingUniforms.maximumHeight = maxHeight;
                        contourUniforms = material.materials.contourMaterial.uniforms;
                    } else if (selectedShading === "slope") {
                        material = getSlopeContourMaterial();
                        shadingUniforms = material.materials.slopeRampMaterial.uniforms;
                        contourUniforms = material.materials.contourMaterial.uniforms;
                    } else if (selectedShading === "aspect") {
                        material = getAspectContourMaterial();
                        shadingUniforms = material.materials.aspectRampMaterial.uniforms;
                        contourUniforms = material.materials.contourMaterial.uniforms;
                    } else {
                        material = Cesium.Material.fromType("ElevationContour");
                        contourUniforms = material.uniforms;
                    }
                    // @ts-ignore
                    contourUniforms.width = this.contourWidth;
                    // @ts-ignore
                    contourUniforms.spacing = this.contourSpacing;
                    // @ts-ignore
                    contourUniforms.color = Cesium.Color.fromCartesian4(Cesium.Cartesian4.fromArray(this.contourColor));
                } else if (selectedShading === "elevation") {
                    material = Cesium.Material.fromType("ElevationRamp");
                    shadingUniforms = material.uniforms;
                    shadingUniforms.minimumHeight = minHeight;
                    shadingUniforms.maximumHeight = maxHeight;
                } else if (selectedShading === "slope") {
                    material = Cesium.Material.fromType("SlopeRamp");
                    shadingUniforms = material.uniforms;
                } else if (selectedShading === "aspect") {
                    material = Cesium.Material.fromType("AspectRamp");
                    shadingUniforms = material.uniforms;
                }
                if (selectedShading && selectedShading !== 'none')
                    shadingUniforms.image = getColorRamp(selectedShading);
            } while (false);

            // @ts-ignore
            globe.material = material;
        }

        updateMaterial();

        const updateMaterialEvent = this.disposeVar(createNextAnimateFrameEvent(
            this.contourColorChanged,
            this.contourSpacingChanged,
            this.contourWidthChanged,
            this.enableContourChanged,
            this.shadingModeChanged,
            this.showChanged,
        ));
        this.dispose(updateMaterialEvent.disposableOn(updateMaterial));

        // @ts-ignore
        this.dispose(() => globe.material = undefined);
    }
}

export namespace CzmGlobeMaterial {
    export const createDefaultProps = () => ({
        show: undefined as boolean | undefined,
        shadingMode: undefined as 'elevation' | 'slope' | 'aspect' | 'none' | undefined,
        enableContour: false,
        contourSpacing: 150.0,
        contourWidth: 2.0,
        contourColor: [1, 0, 0, 1] as [number, number, number, number],
    });
}
extendClassProps(CzmGlobeMaterial.prototype, CzmGlobeMaterial.createDefaultProps);
export interface CzmGlobeMaterial extends ReactivePropsToNativePropsAndChanged<ReturnType<typeof CzmGlobeMaterial.createDefaultProps>> { }
function getElevationContourMaterial() {
    // Creates a composite material with both elevation shading and contour lines
    return new Cesium.Material({
        fabric: {
            type: "ElevationColorContour",
            materials: {
                contourMaterial: {
                    type: "ElevationContour",
                },
                elevationRampMaterial: {
                    type: "ElevationRamp",
                },
            },
            components: {
                diffuse:
                    "contourMaterial.alpha == 0.0 ? elevationRampMaterial.diffuse : contourMaterial.diffuse",
                alpha:
                    "max(contourMaterial.alpha, elevationRampMaterial.alpha)",
            },
        },
        translucent: false,
    });
}

function getSlopeContourMaterial() {
    // Creates a composite material with both slope shading and contour lines
    return new Cesium.Material({
        fabric: {
            type: "SlopeColorContour",
            materials: {
                contourMaterial: {
                    type: "ElevationContour",
                },
                slopeRampMaterial: {
                    type: "SlopeRamp",
                },
            },
            components: {
                diffuse:
                    "contourMaterial.alpha == 0.0 ? slopeRampMaterial.diffuse : contourMaterial.diffuse",
                alpha: "max(contourMaterial.alpha, slopeRampMaterial.alpha)",
            },
        },
        translucent: false,
    });
}

function getAspectContourMaterial() {
    // Creates a composite material with both aspect shading and contour lines
    return new Cesium.Material({
        fabric: {
            type: "AspectColorContour",
            materials: {
                contourMaterial: {
                    type: "ElevationContour",
                },
                aspectRampMaterial: {
                    type: "AspectRamp",
                },
            },
            components: {
                diffuse:
                    "contourMaterial.alpha == 0.0 ? aspectRampMaterial.diffuse : contourMaterial.diffuse",
                alpha: "max(contourMaterial.alpha, aspectRampMaterial.alpha)",
            },
        },
        translucent: false,
    });
}
const elevationRamp = [0.0, 0.045, 0.1, 0.15, 0.37, 0.54, 1.0];
const slopeRamp = [0.0, 0.29, 0.5, Math.sqrt(2) / 2, 0.87, 0.91, 1.0];
const aspectRamp = [0.0, 0.2, 0.4, 0.6, 0.8, 0.9, 1.0];
function getColorRamp(selectedShading: 'elevation' | 'slope' | 'aspect') {
    const ramp = document.createElement("canvas");
    ramp.width = 100;
    ramp.height = 1;
    const ctx = ramp.getContext("2d") as CanvasRenderingContext2D;

    let values: number[];
    if (selectedShading === "elevation") {
        values = elevationRamp;
    } else if (selectedShading === "slope") {
        values = slopeRamp;
    } else if (selectedShading === "aspect") {
        values = aspectRamp;
    } else {
        throw new Error(`values未赋值！`);
    }

    const grd = ctx.createLinearGradient(0, 0, 100, 0);
    grd.addColorStop(values[0], "#000000"); //black
    grd.addColorStop(values[1], "#2747E0"); //blue
    grd.addColorStop(values[2], "#D33B7D"); //pink
    grd.addColorStop(values[3], "#D33038"); //red
    grd.addColorStop(values[4], "#FF9742"); //orange
    grd.addColorStop(values[5], "#ffd700"); //yellow
    grd.addColorStop(values[6], "#ffffff"); //white

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 100, 1);

    return ramp;
}