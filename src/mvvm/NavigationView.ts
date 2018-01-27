/**
 * Created by Ying <me@YingDev.com> on 2017/12/3.
 **/
import {Observable} from "rxjs/Observable";
import {rxSubj} from "rxex";
import {makeOneShotFun, uniMargins, zeroMargins} from "../utils/index";
import {INavPageVm, INavTransition, IViewFactory, ViewInfo, ViewFactory, NavPageHolder, vmBindNext, SimpleNavTransition, NavigationViewModel, VmViewBase} from "./index";
import {Subject} from "rxjs/Subject";

/**
 * 实现 view 上的导航细节。思维模型是一个 stack，可以 push/pop/replace 等操作。
 * 使用者/子类可以配置页面切换效果 this.transition, 页面工厂 this.pageFactory.
 */
export class NavigationView<VM extends NavigationViewModel<any>> extends VmViewBase<VM>
{
	protected _sigInterrupt:Subject<any> = rxSubj();
	protected _pages: Array<NavPageHolder> = [];
	protected _contentHolder: Laya.Box;

	transition: INavTransition = new SimpleNavTransition();
	pageFactory: IViewFactory = ViewFactory.instance;

	constructor(vm?)
	{
		super(vm);
		this.addChild(zeroMargins(this._contentHolder = new Laya.Box()));
		this._contentHolder.zOrder = 99;
		this._contentHolder.mouseThrough = true;
	}

	protected setVm(vm:VM)
	{
		if(this.vm && vm !== this.vm)
		{
			this._sigInterrupt.next();
			this._removeAll();
			this.refreshLater();
		}
		super.setVm(vm);
	}

	@vmBindNext("stack$")
	protected doReload(stack)
	{
		this._sigInterrupt.next();
		this._removeAll();
		for(let vm of stack)
			this._push(vm);
		//stack.forEach( pageVm=> this._push(pageVm) );
		this._updateSeenability();
	}

	@vmBindNext("push$")
	protected doPush(pageVm)
	{
		this._sigInterrupt.next();
		let sigInt = this._sigInterrupt.first();
		let done = makeOneShotFun(()=>
		{
			this._sigInterrupt.next();
			this._updateSeenability();
		});

		let cur = this.getTop();
		this._push(pageVm);
		let next = this.getTop().viewInfo.view;

		sigInt.subscribe(done);
		this.onDoTransition(cur && cur.viewInfo.view, next, "push", done, sigInt);
	}

	@vmBindNext("pop$")
	protected doPop()
	{
		this._sigInterrupt.next();
		let sigInt = this._sigInterrupt.first();
		let done = makeOneShotFun(()=>
		{
			this._sigInterrupt.next();
			let holder = this._pages.pop();
			this._returnHolderAndView(holder);
			this._updateSeenability();
		});

		let cur = this.getTop();
		let toReveal = this.getTop(1);
		if(toReveal)
		{
			toReveal.canBeSeen = true;
			toReveal.sync();
		}

		sigInt.subscribe(done);
		this.onDoTransition(cur.viewInfo.view, toReveal && toReveal.viewInfo.view, "pop", done, sigInt);
	}

	@vmBindNext("replace$")
	protected doReplace({oldPage, newPage})
	{
		if(oldPage === newPage)
			return;

		this._sigInterrupt.next();
		let sigInt = this._sigInterrupt.first();

		let done = makeOneShotFun(()=>
		{
			this._sigInterrupt.next();
			let oldView = holder.viewInfo;
			holder.vm = newPage;
			holder.viewInfo = newView;
			this._updateSeenability();
			this.onReturnNavView(oldView);
		});

		let holder = this._find(oldPage);
		let newView = this.onGetNavView(newPage);
		holder.addChild(newView.view);

		sigInt.subscribe(done);
		this.onDoTransition(holder.viewInfo.view, newView.view, "replace", done, sigInt );
	}

	@vmBindNext("remove$")
	protected doRemove(vm)
	{
		this._sigInterrupt.next();
		let holder = this._find(vm);
		if(!holder)
			return;
		if(holder === this.getTop())
		{
			this.doPop();
			return;
		}
		this._pages.splice(this._pages.indexOf(holder), 1);

		this._returnHolderAndView(holder);
		this._updateSeenability();
	}

	protected getTop(n=0) { return this._pages[this._pages.length -1 -n] || null; }

	protected onDoTransition(cur:VmViewBase<any>, next:VmViewBase<any>, type:"push"|"pop"|"replace", done:()=>void, sigInt: Observable<any>)
	{
		if(this.transition)
			this.transition.doTransition(cur,next,type,done,sigInt);
		else
			done();
	}

	protected onGetViewIdForVm(vm) : string
	{
		return 'default';
	}

	private _push(vm)
	{
		let holder = this._getAHolder();
		holder.vm = vm;
		holder.viewInfo = this.onGetNavView(vm);
		holder.addChild(holder.viewInfo.view);
		this._pages.push(holder);
		this._contentHolder.addChild(holder);
	}

	private _find(vm:INavPageVm) : NavPageHolder
	{
		for(let i=0; i<this._pages.length; i++)
		{
			let v = this._pages[i];
			if(v.vm === vm)
				return v;
		}
		return null;
	}

	private _removeAll()
	{
		this._contentHolder.removeChildren();
		this._pages.forEach(h=>this._returnHolderAndView(h));
		this._pages.length = 0;
	}

	private _updateSeenability()
	{
		let pages = this._pages;
		if(pages.length === 0)
			return;

		pages[pages.length-1].canBeSeen = true;

		for(let i=this._pages.length-2; i>=0; i--)
		{
			let cur = this._pages[i];
			let upper = this._pages[i + 1];

			let vm = (upper.vm as INavPageVm);
			let canSeeThru = !!(vm.canSeeThrough && vm.canSeeThrough());
			cur.canBeSeen = canSeeThru && upper.canBeSeen;
		}
		this._pages.forEach(p=>p.sync())

	}

	protected onGetNavView(vm: INavPageVm) : ViewInfo
	{
		let info= this.pageFactory.getViewForVm(vm, this.onGetViewIdForVm(vm));
		info.view.vm = vm;
		return info;
	}

	protected onReturnNavView(info:ViewInfo)
	{
		let {view} = info;
		view.removeSelf();
		view.vm = null;
		(<IViewFactory>this.pageFactory).returnView && this.pageFactory.returnView(info);
	}

	private _returnHolderAndView(h:NavPageHolder)
	{
		this.onReturnNavView(h.viewInfo);
		this._returnHolder(h);
	}

	protected _getAHolder() : NavPageHolder
	{
		//return new NavPageHolder();
		let h = Laya.Pool.getItemByClass('NavPageHolder', NavPageHolder);
		//zeroMargins(h);
		return h;
	}

	private _returnHolder(h:NavPageHolder)
	{
		//h.offAll();
		h.removeSelf();
		h.removeChildren();
		h.vm = null;
		h.canBeSeen = true;
		h.viewInfo.view.vm = null;
		h.viewInfo = null;
		Laya.Pool.recover('NavPageHolder', h);
	}
}