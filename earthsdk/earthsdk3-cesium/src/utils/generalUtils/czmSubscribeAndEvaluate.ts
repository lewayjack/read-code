import * as Cesium from 'cesium';
export function czmSubscribeAndEvaluate<PropType = any, T extends { [k: string]: any } = any>(owner: T, observablePropertyName: keyof T, callback: (value: PropType, oldValue: PropType) => void, target?: Object, event?: string) {
    // @ts-ignore
    const disposeFunc = Cesium.subscribeAndEvaluate(owner, observablePropertyName, callback, target, event);
    return () => disposeFunc.dispose();
}
