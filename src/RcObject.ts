/**
 * Created by Ying <me@YingDev.com> on 2017/12/9.
 **/
import {rxNumber, $, RxNumber} from "rxex";
import {Subscription} from "rxjs/Subscription";
import {Observable} from "rxjs/Observable";

/**
 * 引用计数的对象基类
 * 当一个对象被创建出来，它拥有引用计数 1，如果没有被 ref，那么当前loop的末尾它会被自动 unref，从而被 '销毁'
 * 子类/外部可以通过订阅 sigRc 或者使用 takeUntil(sigRc) 来观察销毁事件
 */
export abstract class RcObject
{
	static debug = false;
	//make it easier to debug
	//tag:string;

	rc$: RxNumber = rxNumber(1);
	sigRc$ = this.rc$.first(v=>v === 0);

	constructor(unrefLater=true)
	{
		unrefLater && Laya.timer.callLater(this, this.unref)
	}

	protected unref()
	{
		unref(this);
	}

	protected onRcClear(){}
}

declare module "rxjs/Observable"{
	interface Observable<T> {
		takeUntilRc: (target:RcObject) => Observable<T>;
	}
}
Observable.prototype.takeUntilRc = function(target:RcObject) : Observable<any>
{
	return this.takeUntil(target.sigRc$);
};

/**
 * 增加引用计数
 * @param {T} o
 * @returns {T}
 */
export function ref<T extends RcObject>(o:T) : T
{
	if(!o)
		return;

	if(o.rc$.value === 0)
		throw new Error(Object.getPrototypeOf(o).constructor.name + ": object has been destroyed!")
	o.rc$.value += 1;
	//debug
	if(RcObject.debug)
		printRc(o);

	return o;
}

/**
 * 减少引用计数
 * @param {RcObject} o
 */
export function unref(o:RcObject)
{
	if(!o)
		return;

	if(o.rc$.value === 0)
		throw new Error(o + ": unbalanced rc")
	o.rc$.value -= 1;

	if(RcObject.debug)
		printRc(o);

	if(o.rc$.eq(0))
		o['onRcClear']();
}

function printRc(o:RcObject)
{
	console.log( (Object.getPrototypeOf(o).constructor.name) + ": rc => " + o.rc$.value);
}