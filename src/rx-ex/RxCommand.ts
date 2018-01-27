/**
 * Created by Ying <me@YingDev.com> on 13/11/2017.
 **/
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

export class RxCommand<TArgs> extends Subject<TArgs>
{
	protected _canExe = false;
	protected _canExe$: Observable<boolean>;

	constructor(canExec: Observable<boolean>)
	{
		super();
		this._canExe$ = canExec;
		canExec && canExec.subscribe(c => this._canExe = c);
	}

	get canExecute(): Observable<boolean> { return this._canExe$ }

	execute(args?: TArgs): boolean
	{
		let canExe = this._canExe;
		canExe && super.next(args);
		return canExe;
	}

	next(v)
	{
		this.execute(v);
	}
}