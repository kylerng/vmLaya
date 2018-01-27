/**
 * Created by Ying <me@YingDev.com> on 13/11/2017.
 **/
import "tslib";

import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {Observer} from "rxjs/Observer";
import {Subscription} from "rxjs/Subscription";
import {RxNumber, RxProperty} from "./RxProperty";
import {RxCommand} from "./RxCommand";
import {RxPropCommand} from "./RxPropCommand";
import 'rxjs/add/operator/merge'
import 'rxjs/add/operator/distinct'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/first'
import 'rxjs/add/operator/takeUntil'
import 'rxjs/add/operator/toArray'
import 'rxjs/add/operator/filter'
import 'rxjs/add/operator/pluck'
import 'rxjs/add/operator/mapTo'
import 'rxjs/add/operator/materialize'
import 'rxjs/add/operator/take'
import 'rxjs/add/observable/empty'
import 'rxjs/add/observable/fromEvent'
import 'rxjs/add/observable/fromEventPattern'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/from'
import 'rxjs/add/observable/combineLatest'
import 'rxjs/add/observable/merge'
import 'rxjs/add/observable/timer'
import 'rxjs/add/observable/interval'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/throttleTime'
import 'rxjs/add/operator/debounceTime'
import "rxjs/add/operator/withLatestFrom"
import "rxjs/add/observable/range"
import "rxjs/add/operator/distinctUntilChanged";

import 'flv.js'

export * from './RxProperty'
export * from './RxCommand'
export * from './RxArray'
export * from './RxPropCommand'
export * from './RxDictionary'

export {Observable as $} from "rxjs/Observable"

export function rxBool(val=false):RxProperty<boolean>{ return rxProp(val) }
export function rxString(val=""):RxProperty<string>{ return rxProp(val) }
export function rxNumber(val = 0):RxNumber{ return new RxNumber(val)}

export function rxProp<T>(val:T=null):RxProperty<T>{ return new RxProperty<T>(val)}
export function rxSubj<T>():Subject<T>{ return new Subject<T>()}
export function rxCmd<T>(canExec:Observable<boolean>) : RxCommand<T> { return new RxCommand<T>(canExec) }
export function rxPropCmd<T>(canExec= true) : RxPropCommand<T> { return new RxPropCommand<T>(canExec) }

declare module "rxjs/Observable" {
	interface Observable<T> {
		filterMsg: (id:number) => Observable<T>;
		collect:()=>T[];
	}
}

Observable.prototype.filterMsg = function(id:number) : Observable<any>
{
	return this.filter(p=>p.id === id).pluck('msg');
};

Observable.prototype.collect = function() : any[]
{
	let arr;
	this.toArray().subscribe(v=>arr = v);
	return arr;
};

export function rxBatchSub(src:any, observer:any,
						   srcPropSelector:(k)=>boolean,
						   observerFnSelector:(srcKey)=> (v)=>void|Observer<any>,
						   operate?:(o:Observable<any>)=>Observable<any>,
						   handleSubscription?:(srcKey:string, observer, s:Subscription)=>void)
{
	for(let k in src)
	{
		if(srcPropSelector(k))
		{

			let observable = src[k] as Observable<any>;
			let observer = observerFnSelector(k);

			if(!observer)
				continue;

			if(operate)
				observable = operate(observable);
			let sub = observable.subscribe(observer);

			handleSubscription && handleSubscription(k, observer, sub);
		}
	}
}

export function rxBindByPropName(src, dest, sigReset:Observable<any>, prefix="on_")
{
	let src$Selector = k=>!k.startsWith('_') && k.endsWith('$');
	let nextFnSelector = k=>
	{
		let fn = dest[prefix+k.slice(0,-1)];
		return fn && fn.bind(dest);
	};
	let operate = o=>o.takeUntil(sigReset);
	rxBatchSub(src, dest, src$Selector, nextFnSelector, operate);
}