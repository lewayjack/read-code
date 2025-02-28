import { PositionsEditingConfigType } from "../../../../../ESJTypesCzm";

export const defaultPositionsEditingConfig: PositionsEditingConfigType = {
    editor: {
        showCoordinates: true,
        showCircle: true,
        disableX: false,
        disableY: false,
        disableXY: false,
        disableZ: false,
        disableZAxis: false,
    },
    picker: {
        clickEnabled: true,
        dbClickEnabled: false,
        // clickFilterFunc: undefined,
        // dbClickFilterFunc: undefined,
    },
    noModifingAfterAdding: false,
    hideCursorInfo: false,
};
