import { ESSceneObject } from "earthsdk3";

export type SceneSkyBoxSourcesType = {
    positiveX: string;
    negativeX: string;
    positiveY: string;
    negativeY: string;
    positiveZ: string;
    negativeZ: string;
};
export function getCzmSceneSkyBoxSources(value: SceneSkyBoxSourcesType) {
    const { positiveX, negativeX, positiveY, negativeY, positiveZ, negativeZ } = value;
    if (!positiveX || !negativeX || !positiveY || !negativeY || !positiveZ || !negativeZ) {
        console.warn(`sceneSkyBoxSources的信息不全，无法设置skybox！`);
        return undefined;
    }
    return {
        positiveX: ESSceneObject.context.getStrFromEnv(positiveX),
        negativeX: ESSceneObject.context.getStrFromEnv(negativeX),
        positiveY: ESSceneObject.context.getStrFromEnv(positiveY),
        negativeY: ESSceneObject.context.getStrFromEnv(negativeY),
        positiveZ: ESSceneObject.context.getStrFromEnv(positiveZ),
        negativeZ: ESSceneObject.context.getStrFromEnv(negativeZ),
    };
}
