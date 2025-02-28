import * as Cesium from 'cesium';
import { ESSceneObject } from "earthsdk3";
import { CzmMaterialJsonType } from '../../ESJTypesCzm';
import { toCartesian2, toColor } from './czmConverts';
import { getReactFuncs, react, ReactParamsType } from 'xbsj-base';

export function createMaterialFromJson(materialJson: CzmMaterialJsonType) {
    const material = Cesium.Material.fromType(materialJson.type);
    updateMaterialFromJson(material, materialJson);
    return material;
}

function getImage(imagePath: string | undefined) {
    return imagePath && ESSceneObject.context.getStrFromEnv(imagePath) || Cesium.Material.DefaultImageId;
}

function getFadeDirection(value: [boolean, boolean]) {
    return { x: value[0], y: value[1] };
}

export function updateMaterialFromJson(material: Cesium.Material, materialJson: CzmMaterialJsonType) {
    if (materialJson.type === 'Color') {
        material.uniforms.color = toColor(materialJson.color ?? [1, 1, 1, 1]);
    } else if (materialJson.type === 'PolylineArrow') {
        material.uniforms.color = toColor(materialJson.color ?? [1, 1, 1, 1]);
    } else if (materialJson.type === 'PolylineDash') {
        material.uniforms.color = toColor(materialJson.color ?? [1, 1, 1, 1]);
        material.uniforms.gapColor = toColor(materialJson.gapColor ?? [0, 0, 0, 0]);
        material.uniforms.dashLength = materialJson.dashLength ?? 16;
        material.uniforms.dashPattern = materialJson.dashPattern ?? 255;
    } else if (materialJson.type === 'PolylineGlow') {
        material.uniforms.color = toColor(materialJson.color ?? [1, 1, 1, 1]);
        material.uniforms.glowPower = materialJson.glowPower ?? 0.25;
        material.uniforms.taperPower = materialJson.taperPower ?? 1;
    } else if (materialJson.type === 'PolylineOutline') {
        material.uniforms.color = toColor(materialJson.color ?? [1, 1, 1, 1]);
        material.uniforms.outlineColor = toColor(materialJson.outlineColor ?? [1, 0, 0, 1]);
        material.uniforms.outlineWidth = materialJson.outlineWidth ?? 1;
    } else if (materialJson.type === 'Image') {
        material.uniforms.image = getImage(materialJson.image);
        material.uniforms.repeat = toCartesian2(materialJson.repeat ?? [1, 1]);
    } else if (materialJson.type === 'DiffuseMap') {
        material.uniforms.image = getImage(materialJson.image);
        material.uniforms.repeat = toCartesian2(materialJson.repeat ?? [1, 1]);
        material.uniforms.channels = materialJson.channels ?? 'rgb';
    } else if (materialJson.type === 'AlphaMap') {
        material.uniforms.image = getImage(materialJson.image);
        material.uniforms.repeat = toCartesian2(materialJson.repeat ?? [1, 1]);
        material.uniforms.channel = materialJson.channel ?? 'a'
    } else if (materialJson.type === 'SpecularMap') {
        material.uniforms.image = getImage(materialJson.image);
        material.uniforms.repeat = toCartesian2(materialJson.repeat ?? [1, 1]);
        material.uniforms.channel = materialJson.channel ?? 'r';
    } else if (materialJson.type === 'EmissionMap') {
        material.uniforms.image = getImage(materialJson.image);
        material.uniforms.repeat = toCartesian2(materialJson.repeat ?? [1, 1]);
        material.uniforms.channels = materialJson.channels ?? 'rgb';
    } else if (materialJson.type === 'BumpMap') {
        material.uniforms.image = getImage(materialJson.image);
        material.uniforms.repeat = toCartesian2(materialJson.repeat ?? [1, 1]);
        material.uniforms.channel = materialJson.channel ?? 'r';
        material.uniforms.strength = materialJson.strength ?? 0.8;
    } else if (materialJson.type === 'NormalMap') {
        material.uniforms.image = getImage(materialJson.image);
        material.uniforms.repeat = toCartesian2(materialJson.repeat ?? [1, 1]);
        material.uniforms.channels = materialJson.channels ?? 'rgb';
        material.uniforms.strength = materialJson.strength ?? 0.8;
    } else if (materialJson.type === 'Grid') {
        material.uniforms.color = toColor(materialJson.color ?? [0.0, 1.0, 0.0, 1.0]);
        material.uniforms.cellAlpha = materialJson.cellAlpha ?? 0.1;
        material.uniforms.lineCount = toCartesian2(materialJson.lineCount ?? [8, 8]);
        material.uniforms.lineThickness = toCartesian2(materialJson.lineThickness ?? [1, 1]);
        material.uniforms.lineOffset = toCartesian2(materialJson.lineOffset ?? [0, 0]);
    } else if (materialJson.type === 'Stripe') {
        material.uniforms.evenColor = toColor(materialJson.evenColor ?? [1.0, 1.0, 1.0, 0.5]);
        material.uniforms.oddColor = toColor(materialJson.oddColor ?? [0.0, 0.0, 1.0, 0.5]);
        material.uniforms.horizontal = materialJson.horizontal ?? true;
        material.uniforms.offset = materialJson.offset ?? 0;
        material.uniforms.repeat = materialJson.repeat ?? 5;
    } else if (materialJson.type === 'Checkerboard') {
        material.uniforms.lightColor = toColor(materialJson.lightColor ?? [1.0, 1.0, 1.0, 0.5]);
        material.uniforms.darkColor = toColor(materialJson.darkColor ?? [0.0, 0.0, 0.0, 0.5]);
        material.uniforms.repeat = toCartesian2(materialJson.repeat ?? [5, 5]);
    } else if (materialJson.type === 'Dot') {
        material.uniforms.lightColor = toColor(materialJson.lightColor ?? [1.0, 1.0, 0.0, 0.75]);
        material.uniforms.darkColor = toColor(materialJson.darkColor ?? [0.0, 1.0, 1.0, 0.75]);
        material.uniforms.repeat = toCartesian2(materialJson.repeat ?? [5, 5]);
    } else if (materialJson.type === 'Water') {
        material.uniforms.baseWaterColor = toColor(materialJson.baseWaterColor ?? [0.2, 0.3, 0.6, 1.0]);
        material.uniforms.blendColor = toColor(materialJson.blendColor ?? [0.0, 1.0, 0.699, 1.0]);
        material.uniforms.specularMap = getImage(materialJson.specularMap);
        material.uniforms.normalMap = getImage(materialJson.normalMap);
        material.uniforms.frequency = materialJson.frequency ?? 10.0;
        material.uniforms.animationSpeed = materialJson.animationSpeed ?? 0.01;
        material.uniforms.amplitude = materialJson.amplitude ?? 1.0;
        material.uniforms.specularIntensity = materialJson.specularIntensity ?? 0.5;
        material.uniforms.fadeFactor = materialJson.fadeFactor ?? 1.0;
    } else if (materialJson.type === 'RimLighting') {
        material.uniforms.color = toColor(materialJson.color ?? [1.0, 0.0, 0.0, 0.7]);
        material.uniforms.rimColor = toColor(materialJson.rimColor ?? [1.0, 1.0, 1.0, 0.4]);
        material.uniforms.width = materialJson.width ?? 0.3;
    } else if (materialJson.type === 'Fade') {
        material.uniforms.fadeInColor = toColor(materialJson.fadeInColor ?? [1.0, 0.0, 0.0, 1.0]);
        material.uniforms.fadeOutColor = toColor(materialJson.fadeOutColor ?? [0.0, 0.0, 0.0, 0.0]);
        material.uniforms.maximumDistance = materialJson.maximumDistance ?? 0.5;
        material.uniforms.repeat = materialJson.repeat ?? true;
        material.uniforms.fadeDirection = getFadeDirection(materialJson.fadeDirection ?? [true, true]);
        material.uniforms.time = toCartesian2(materialJson.time ?? [0.5, 0.5]);
    } else if (materialJson.type === 'ElevationContour') {
        material.uniforms.color = toColor(materialJson.color ?? [1.0, 0.0, 0.0, 1.0]);
        material.uniforms.spacing = materialJson.spacing ?? 100.0;
        material.uniforms.width = materialJson.width ?? 1.0;
    } else if (materialJson.type === 'ElevationRamp') {
        material.uniforms.image = getImage(materialJson.image);
        material.uniforms.minimumHeight = materialJson.minimumHeight ?? 0.0;
        material.uniforms.maximumHeight = materialJson.maximumHeight ?? 10000.0;
    } else if (materialJson.type === 'AspectRamp') {
        material.uniforms.image = getImage(materialJson.image);
    } else if (materialJson.type === 'ElevationBand') {
        material.uniforms.color = getImage(materialJson.colors);
        material.uniforms.heights = getImage(materialJson.heights);
    } else {
        // @ts-ignore
        console.warn(`未知材质类型，无法更新 ${materialJson.type}`);
    }
}

export function createMaterialRef(reactMaterialParams: ReactParamsType<CzmMaterialJsonType | undefined>, defaultMaterialJson?: CzmMaterialJsonType) {
    const materialRef = react<Cesium.Material | undefined>(undefined);
    let currentType = '';
    const [getMaterialJson, _, materialJsonChanged] = getReactFuncs<CzmMaterialJsonType | undefined>(reactMaterialParams);
    const updateMaterial = () => {
        try {
            // const materialJson = getMaterialJson(materialStr);
            const materialJson = getMaterialJson() ?? defaultMaterialJson;
            if (!materialJson) {
                currentType = '';
                materialRef.value = undefined;
            } else if (currentType !== materialJson.type) {
                currentType = materialJson.type;
                materialRef.value = createMaterialFromJson(materialJson);
            } else {
                materialRef.value && updateMaterialFromJson(materialRef.value, materialJson);
            }
        } catch (error) {
        }
    };
    updateMaterial();
    materialRef.dispose(materialJsonChanged.disposableOn(updateMaterial));

    return materialRef;
}
