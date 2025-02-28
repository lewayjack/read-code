import { ReactVarProperty } from "./ReactVarProperty";


export class PositionsSetPropety extends ReactVarProperty<[number, number, number][][] | undefined> {
    override get type() { return 'PositionsSetPropety'; }
}
