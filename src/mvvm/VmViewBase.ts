/**
 * Created by Ying <me@YingDev.com> on 2017/11/30.
 **/
import {BindableView} from "../BindableView";
import {RcObject, ref, unref} from "../RcObject";

/**
 * 支持绑定到 ViewMode 的 View 基类
 */
export class VmViewBase<VM extends (any|RcObject)> extends BindableView
{
	protected _vm: VM = null;

	get vm() : VM
	{
		return this._vm
	}

	set vm(vm:VM)
	{
		this.setVm(vm);
	}

	protected setVm(vm:VM)
	{
		if(vm !== this._vm)
		{
			if(vm instanceof RcObject)
				ref(vm);
			if(this._vm instanceof RcObject)
				unref(this._vm);

			this._vm = vm;
			this.refreshLater();
		}
	}

	constructor(vm?:VM)
	{
		super();
		if(vm)
			this.vm = vm;
	}

	protected onUnDisplay()
	{
		super.onUnDisplay();
		this.refreshLater();
	}

	destroy(children?)
	{
		this.vm = null;
		super.destroy(children);
	}
}