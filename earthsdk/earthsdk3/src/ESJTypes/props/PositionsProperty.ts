import { ReactVarProperty } from "./ReactVarProperty";


export class PositionsProperty extends ReactVarProperty<[number, number, number][] | undefined> {
    override get type() { return 'PositionsProperty'; }
}
