import { ESTreeParam, ToCutDownScaleType, ToScaleType } from "./index";

export type TreesFuncsType = {
    AddTrees: {
        params: {
            id: string,
            TreeParams: ESTreeParam[]
        },
        result: {
            error: string | undefined;
        }
    },

    RemoveAllTrees: {
        params: {
            id: string,
        },
        result: {
            error: string | undefined;
        }
    },
    UpdateTreeParams: {
        params: {
            id: string,
            TreeParams: ESTreeParam[]
        },
        result: {
            error: string | undefined;
        }
    },
    CutDownTrees: {
        params: {
            id: string,
            TreeIds: ToCutDownScaleType[],
            TimeLength: number
        },
        result: {
            error: string | undefined;
        }
    },
    GrowthSimulation: {
        params: {
            id: string,
            ToParams: ToScaleType[],
            TimeLength: number,
            SwitchTime: number
        },
        result: {
            error: string | undefined;
        }
    }

}

const addTreesCallFunc = async (ueViewer: any, id: string, trees: ESTreeParam[]) => {
    const { viewer } = ueViewer;
    if (!viewer) {
        console.error(`AddTrees: ueViewer.viewer is undefined`);
        return undefined;
    }
    const res = await viewer.callUeFunc({
        f: 'AddTrees',
        p: { id, TreeParams: trees }
    }) as TreesFuncsType['AddTrees']['result']
    if (res.error) console.error(`AddTrees:`, res.error);
    return res;
}
const removeAllTreesCallFunc = async (ueViewer: any, id: string) => {
    const { viewer } = ueViewer;
    if (!viewer) {
        console.error(`RemoveAllTrees: ueViewer.viewer is undefined`);
        return undefined;
    }
    const res = await viewer.callUeFunc({
        f: 'RemoveAllTrees',
        p: { id }
    }) as TreesFuncsType['RemoveAllTrees']['result']
    if (res.error) console.error(`RemoveAllTrees:`, res.error);
    return res;
}
const updateTreeParamsCallFunc = async (ueViewer: any, id: string, trees: ESTreeParam[]) => {
    const { viewer } = ueViewer;
    if (!viewer) {
        console.error(`UpdateTreeParams: ueViewer.viewer is undefined`);
        return undefined;
    }
    const res = await viewer.callUeFunc({
        f: 'UpdateTreeParams',
        p: { id, TreeParams: trees }
    }) as TreesFuncsType['UpdateTreeParams']['result']
    if (res.error) console.error(`UpdateTreeParams:`, res.error);
    return res;
}
const cutDownTreesCallFunc = async (ueViewer: any, id: string, TreeIds: ToCutDownScaleType[], TimeLength: number) => {
    const { viewer } = ueViewer;
    if (!viewer) {
        console.error(`CutDownTrees: ueViewer.viewer is undefined`);
        return undefined;
    }
    const res = await viewer.callUeFunc({
        f: 'CutDownTrees',
        p: { id, TreeIds, TimeLength }
    }) as TreesFuncsType['CutDownTrees']['result']
    if (res.error) console.error(`CutDownTrees:`, res.error);
    return res;
}
const growthSimulationCallFunc = async (ueViewer: any, id: string, ToParams: ToScaleType[], TimeLength: number, SwitchTime: number) => {
    const { viewer } = ueViewer;
    if (!viewer) {
        console.error(`GrowthSimulation: ueViewer.viewer is undefined`);
        return undefined;
    }
    const res = await viewer.callUeFunc({
        f: 'GrowthSimulation',
        p: { id, ToParams, SwitchTime, TimeLength }
    }) as TreesFuncsType['GrowthSimulation']['result']
    if (res.error) console.error(`GrowthSimulation:`, res.error);
    return res;
}

export {
    addTreesCallFunc,
    removeAllTreesCallFunc,
    updateTreeParamsCallFunc,
    cutDownTreesCallFunc,
    growthSimulationCallFunc
}
