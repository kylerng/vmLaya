/**
 * Created by Ying <me@YingDev.com> on 2017/12/7.
 **/
import {zeroMargins} from "../utils";
import {VmViewBase} from "./VmViewBase";
import {INavPageVm, NavPageHidingStrategy, ViewInfo} from "./interfaces";

type NavPageView = VmViewBase<any>;

/**
 * NavigationView 的导航页面 wrapper。暂未提供继承定制功能。
 */
export class NavPageHolder extends Laya.Box
{
	canBeSeen = true;
	vm : INavPageVm;
	viewInfo: ViewInfo;

	constructor()
	{
		super();
		zeroMargins(this);
		this.mouseEnabled = true;
		this.mouseThrough = false;
	}

	sync()
	{
		let {view} = this.viewInfo;

		if(!this.canBeSeen)
		{
			this._showHideView(false);
		}
		else
		{
			if(view.parent !== this)
				this._showHideView(true);
			view.vm = this.vm;
		}
	}

	private _showHideView(isShow:boolean)
	{
		let {view} = this.viewInfo;

		let strategy = (this.vm.hidingStrategy && this.vm.hidingStrategy()) || NavPageHidingStrategy.AddRemove;
		switch (strategy)
		{
			case NavPageHidingStrategy.AddRemove:
				isShow ? this.addChild(view) : view.removeSelf();
				break;
			case NavPageHidingStrategy.Visibility:
				if(view.parent !== this)
					this.addChild(view);
				view.visible = isShow;
				break;
		}
	}
}
