/**
 * Created by Ying <me@YingDev.com> on 13/11/2017.
 **/
import {RxCommand} from "./RxCommand";
import {RxProperty} from "./RxProperty";
import {rxBool} from "./index";

export class RxPropCommand<TArgs> extends RxCommand<TArgs>
{
	set canExe(can: boolean) { (this._canExe$ as RxProperty<boolean>).value = can;}

	get canExe() { return (this._canExe$ as RxProperty<boolean>).value }

	constructor(can = false)
	{
		super(rxBool(can));
	}
}