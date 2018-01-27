/**
 * Created by Ying <me@YingDev.com> on 2017/11/22.
 **/

import {Subscription} from "rxjs/Subscription";
import {Observable} from "rxjs/Observable";
import {$} from "rxex";
import {FromEventPatternObservable} from "rxjs/observable/FromEventPatternObservable";

declare module "rxjs/Subscription" {
	interface Subscription {
		addToUndisplay: (node:Laya.Node) => Subscription;
	}
}

declare module "rxjs/Observable"{
	interface Observable<T> {
		subscribeLabel:(label:Laya.Label, map?:(v)=>string) => Subscription;
		subscribeFn:(target:any) => Subscription;
		takeUntilUndisplay: (target:Laya.Node) => Observable<T>;
		filterEq: (value:T) => Observable<T>;
		mapEq:(value: any) => Observable<boolean>;
	}

}

//undisplay 的时候unsubscribe
//（如果提前结束，那么从事件列表移除）
Subscription.prototype.addToUndisplay = function(node:Laya.Node) : Subscription
{
	if(!node.displayedInStage)
	{
		throw new Error("node 必须已经 displayedInStage。（否则一个node可能永远也不会 UNDISPLAY")
	}
	this.add(()=> node.off(Laya.Event.UNDISPLAY, this, this.unsubscribe));
	node.once(Laya.Event.UNDISPLAY, this, this.unsubscribe);
	return this;
};

//undisplay 的时候complete
// 如果 !displayedInStage  则直接 停止
Observable.prototype.takeUntilUndisplay = function(node:Laya.Node) : Observable<any>
{
	if(!node.displayedInStage)
		return $.empty();

	return this.takeUntil(RxLaya.fromEvent(node, Laya.Event.UNDISPLAY));
};

Observable.prototype.filterEq = function(value:any) : Observable<any>
{
	return this.filter(v=>v === value);
};

Observable.prototype.mapEq = function(value:any) : Observable<any>
{
	return this.map(v=>v === value);
};

//hack: 原始代码在subscribe 提前关闭的情况下，会导致错误信息丢失
//fixme:  检查官方代码变更
//todo: remove this finally
(<any>FromEventPatternObservable.prototype)._callSelector = function (subscriber, args) {
	//try {
	var result = this.selector.apply(this, args);
	subscriber.next(result);
	//}
	//catch (e) {
	//    subscriber.error(e);
	//}
};


export class RxLaya
{
	static fromEvent(target, event:string, valSelcetor?:(...args)=>any) : $<any>
	{
		if(target instanceof Laya.EventDispatcher)
			return $.fromEventPattern( h=>target.on(event, null, h), h=>target.off(event,null,h), valSelcetor);
		else
			return $.fromEvent(target, event, valSelcetor);
	}

	static mouseEnter$(target) : $<any>
	{
		return RxLaya.fromEvent(target, Laya.Event.MOUSE_OVER);
	}

	static isMouseOver$(target) : $<boolean>
	{
		return $.merge(RxLaya.mouseEnter$(target).mapTo(true), RxLaya.mouseOut$(target).mapTo(false))
	}

	static mouseOut$(target) : $<any>
	{
		return RxLaya.fromEvent(target, Laya.Event.MOUSE_OUT);
	}

    static mouseMove$(target) : $<any>
    {
        return RxLaya.fromEvent(target, Laya.Event.MOUSE_MOVE);
    }

	static mouseDown$(target, valSelecotr?) : $<any>
	{
		return RxLaya.fromEvent(target, Laya.Event.MOUSE_DOWN, valSelecotr);
	}

	static mouseClick$(target) : $<any>
	{
		return RxLaya.fromEvent(target, Laya.Event.CLICK);
	}

	static timerLoop(delay:number, count=-1) : $<number>
	{
		if(count === 0)
			return $.empty();

		return $.create((o)=>
		{
			let i = 0;
			let fn = ()=>
			{
				o.next(i++);
				if(i === count)
					o.complete();
			};
			Laya.timer.loop(delay, null, fn);

			return ()=>Laya.timer.clear(null, fn);
		})
	}

	static timerOnce(delay:number) : $<number>
	{
		return this.timerLoop(delay, 1);
	}

	static frameLoop(delay=0,count=-1) : $<number>
	{
		if(count === 0)
			return $.empty();

		return $.create(o=>
		{
			let i=0;
			let fn = ()=>
			{
				o.next(i++);
				if(i === count)
					o.complete();
			};

			Laya.timer.frameLoop(delay, null, fn);
			return ()=>Laya.timer.clear(null, fn);
		});
	}

	static frameOnce(delay=0) : $<number>
	{
		return this.frameLoop(1);
	}

	static fromNewHttpRequest(reqArgs, isOk:(result)=>boolean = true_, resultSelector?:(result)=>any) : $<any>
	{
		return $.create(o=>
		{
			let req = new Laya.HttpRequest();
			RxLaya.fromEvent(req, Laya.Event.COMPLETE).first().subscribe(r=>
			{
				if(r && isOk(r))
					nextAndComplete(o, (resultSelector && resultSelector(r)) || r);
				else
					o.error(r);
			});
			RxLaya.fromEvent(req, Laya.Event.ERROR).first().subscribe(r=>o.error(r));
			req.send.apply(req, reqArgs);
		})
	}
}
function nextAndComplete(o, val) { o.next(val); o.complete(); }
function true_(a){ return true }
