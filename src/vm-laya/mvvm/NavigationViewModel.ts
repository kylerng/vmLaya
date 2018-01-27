/**
 * Created by Ying <me@YingDev.com> on 2017/12/3.
 **/
import {rxCmd, RxCommand, rxProp, RxProperty} from "../../rx-ex";
import {Observable} from "rxjs/Observable";
import {RcObject, ref, unref} from "../RcObject";
import {RcViewModel} from "./RcViewModel";
import {INavService} from "./interfaces";

/**
 * 可看作一个 ObservableStack
 * VM 可继承此类，从而使子类拥有导航功能，相应的 view 应继承 NavigationView
 */
export class NavigationViewModel<T> extends RcViewModel implements INavService
{
	get stack(): ReadonlyArray<T>{ return this.stack$.value }
	get top(): T{ return this.top$.value }

	stack$:RxProperty<Array<T>> = rxProp<Array<T>>([]);
	top$ = rxProp<T>(null);

	private _canPop$ = rxProp(false);

	push$: RxCommand<T> = rxCmd<T>(Observable.of(true));
	pop$: RxCommand<void> = rxCmd(this._canPop$);
	replace$: RxCommand<{oldPage:T, newPage:T}> = rxCmd<{oldPage:T, newPage:T}>(this._canPop$);
	remove$: RxCommand<T> = rxCmd<T>(this._canPop$);

	contains(vm:T){ return this.stack$.value.indexOf(vm) >= 0 }

	constructor(o$?)
	{
		super(o$);

		const {push$, pop$, replace$, remove$} = this;

		push$.takeUntilRc(this).subscribe(vm=>this.doPush(vm));
		pop$.takeUntilRc(this).subscribe(()=>this.doPop());
		replace$.takeUntilRc(this).subscribe((pair)=>this.doReplace(pair));
		remove$.takeUntilRc(this).subscribe(vm=>this.doRemove(vm));

		this.sigRc$.subscribe(_=>{
			while(this.stack$.value.length > 0)
				this.doPop();
		});
	}

	protected doPush(vm: T)
	{
		let arr = this.stack$.value;
		let index = arr.indexOf(vm);
		if(index >= 0)
			throw new Error("Page already in the nav stack at index " + index);

		if(vm instanceof RcObject)
			ref(vm);

		arr.push(vm);
		this._updateVars();
	}

	protected doPop()
	{
		let arr = this.stack$.value;
		let vm = arr.pop();
		if(vm instanceof RcObject)
			unref(vm);

		this._updateVars();
	}

	protected doReplace({oldPage, newPage})
	{
		let arr = this.stack$.value;
		if(arr.indexOf(newPage) >= 0)
			throw new Error("the newPage is already in the nav stack");

		for(let i=0; i<arr.length; i++)
		{
			if(arr[i] === oldPage)
			{
				if(newPage instanceof RcObject)
					ref(newPage);
				arr[i] = newPage;
				if(oldPage instanceof RcObject)
					unref(oldPage);
				this._updateVars();
				return;
			}
		}

		throw new Error("the old page is not in the stack!");
	}

	protected doRemove(vm)
	{
		let arr = this.stack$.value;
		let index = arr.indexOf(vm);
		if(index < 0)
			return;
			//throw new Error("the page is not in the stack!");

		arr.splice(index, 1);

		if(vm instanceof RcObject)
			unref(vm);

		this._updateVars();
	}

	private _updateVars()
	{
		let arr = this.stack$.value;
		this.top$.value = arr[arr.length - 1] || null;
		this._canPop$.value = arr.length > 0;
	}
}