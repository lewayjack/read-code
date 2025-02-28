import { ESSceneObject } from "../index";
import { getReactFuncs, react, ReactParamsType } from "xbsj-base";

export function createEnvEvalStrReact(reactVar: ReactParamsType<string | undefined>, defaultValue?: string) {
    const [getValue, setValue, valueChanged] = getReactFuncs<string | undefined>(reactVar);
    const envStrReact = react<string | undefined>(undefined);
    const updateFinalStr = () => {
        const v = getValue() ?? defaultValue;
        envStrReact.value = v && ESSceneObject.context.getStrFromEnv(v);
    };
    updateFinalStr();
    valueChanged && envStrReact.d(valueChanged.don(updateFinalStr));
    envStrReact.d(ESSceneObject.context.environmentVariablesChanged.don(updateFinalStr));
    return envStrReact;
}
