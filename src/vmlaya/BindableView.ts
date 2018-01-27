/**
 * Created by Ying <me@YingDev.com> on 2017/11/25.
 **/
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {ViewBase} from "./ViewBase";

export const AUTOBINDS_SYMBOL = "__BindableView::AUTOBINDS_SYMBOL";
export type AutoSubRecord = {src:(me)=>Observable<any>, fn : NextFn, type:'sub'|'sigReset', id?:string};
export type NextFn = ((me, v)=>void);
export type NextFnOrName = string | NextFn;

//todo: 如果没有 @createView 就在 onAdd 中执行 onViewCreated ？统一这个行为

/**
 * 支持数据绑定的组件抽象基类。负责管理数据绑定，提供数据绑定基础设施。
 * 在 UNDISPLAY / !enabled 会自动取消所有订阅，避免内存泄漏。并在 DISPLAY / enable 之后自动恢复绑定
 * 子类通过覆盖 onRefresh 方法或使用 @sub*()/@bind*() 装饰器添加数据绑定
 */
export abstract class BindableView extends ViewBase
{
	protected _sigReset = new Subject<boolean>();
	protected _needsReresh = true;

	private _curSigReset : Observable<any>; //hack

	protected get curSigReset()
	{
		if(!this._curSigReset)
			throw new Error("not doing binding");
		return this._curSigReset
	}

	/**
	 * 标记为是否需要重绑定
	 * 通常子类可能添加一些字读，当某些参与绑定的字段被修改，应该调用此方法通知系统稍后重新绑定。同一个帧时间内反复调用并不增加开销。
	 * 使用装饰器 @refreshLater 装饰字段可自动实现该功能
	 * @param {boolean} shouldRefresh
	 */
	refreshLater(shouldRefresh=true)
	{
		if(shouldRefresh && this._needsReresh)
			return;

		if(this._curSigReset) //如果正在执行绑定
		{
			this._needsReresh = shouldRefresh;
			Laya.timer.callLater(this, this._doSubDs);
			return;
		}

		this._sigReset.next();
		this._needsReresh = shouldRefresh;

		this.displayedInStage && Laya.timer.callLater(this, this._doSubDs);
	}

	/**
	 * 模板方法，发生数据绑定时执行，在组件生命周期内可能执行多次
	 * 子类通过覆盖此方法完成所有数据绑定，并且应使用 Observable.takeUntil(sigReset) 来确保组件总是可以取消前一次的订阅
	 * 通常使用 Sub*() 系列装饰器可自动实现多数绑定功能，不需要手动实现此方法
	 * @param {Observable<any>} sigReset 一次性使用的 signal for takeUntil 操作符
	 */
	protected onRefresh(sigReset:Observable<any>)
	{
	}

	resetSubs()
	{
		this.refreshLater(false);
	}

	get shouldReSubLater () { return this._needsReresh }

	protected _onAutoSub(sigReset:Observable<any>)
	{
		let arr = Object.getPrototypeOf(this)[AUTOBINDS_SYMBOL];
		if(arr)
		{
			for(let i=0; i<arr.length; i++)
			{
				let tuple:AutoSubRecord = arr[i];
				if(!tuple)
					continue;

				let {src, fn, type, id} = tuple;

				if(	type === 'sub' && src && fn )
				{
					let obs = src(this);
					!!obs && obs.takeUntil(sigReset).subscribe(v=> fn(this, v));
				}
				else if(type === 'sigReset')
					sigReset.map(v=>this).subscribe(<any>fn);
			}
		}
	}

	private _doSubDs()
	{
		if(this._needsReresh && this.displayedInStage)
		{
			this._needsReresh = false; //执行中可能导致 needsReSub = true

			let sig = this._curSigReset  = this._sigReset.first();

			this._onAutoSub(sig);
			this.onRefresh(sig);

			//如果绑定过程中又发生了 refreshLater
			if(this._needsReresh)
				this._sigReset.next();
		}
		else
			this._needsReresh = false;

		this._curSigReset = null;
	}

	protected onDisplay()
	{
		this._doSubDs()
	}

	protected onUnDisplay()
	{
		this._sigReset.next();
	}

	protected onAdd()
	{
		this.refreshLater();
	}

	protected onRemove()
	{
		this._sigReset.next();
	}

	protected createView(res)
	{
		super.createView(res);

		this.onViewCreated(res);
	}

	protected onViewCreated(res?)
	{
	}


	destroy(children?)
	{
		this._needsReresh = false;
		super.destroy(children);
	}

	static _updateAutoSubArray(proto, id, src, fn, type:'sub'|'sigReset')
	{
		if(!Object.getOwnPropertyDescriptor(proto, AUTOBINDS_SYMBOL))
			proto[AUTOBINDS_SYMBOL] = [].concat(proto[AUTOBINDS_SYMBOL] || []);

		let arr = proto[AUTOBINDS_SYMBOL];
		if(id)
		{
			for(let i=0; i<arr.length; i++)
			{
				let item = arr[i];
				if(item && item.id && item.id === id)
				{
					if(type === 'sub' && src && fn || (type === 'sigReset' && fn && !src) )
						arr[i] = {id, src, fn, type};
					else
						arr[i] = null;
					return;
				}
			}
		}

		arr.push({id, src, fn, type});
	}

	static _removeAutoSub(proto, id:string)
	{
		let arr = proto[AUTOBINDS_SYMBOL] = proto[AUTOBINDS_SYMBOL];
		if(arr)
		{
			for(let i=0; i<arr.length; i++)
			{
				if(arr[i] && arr[i].id === id)
					arr[i] = null;
			}
		}
	}

}
