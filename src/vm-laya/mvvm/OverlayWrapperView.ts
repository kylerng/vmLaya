/**
 * Created by Ying <me@YingDev.com> on 2017/12/7.
 **/
import {IRequestClose, VmViewBase} from ".";
import {zeroMargins} from "../utils";

/**
 * 提供半透明背景层。
 * 如果 target.vm 支持 IRequestClose, 则在 CLICK 的时候执行关闭请求: target.vm.requestClose$.execute()。
 */
export class OverlayWrapperView extends VmViewBase<any>
{
	private _bg:Laya.Image;

	constructor(public readonly target: VmViewBase<any | IRequestClose>, private _alpha=0.5, private _texture="comp/blank_0.75.png")
	{
		super();

		zeroMargins(this);

		let lb = this._bg = new Laya.Image(_texture);
		lb.sizeGrid = "2,2,2,2";
		//lb.alpha = this._alpha;
		zeroMargins(lb);
		this.addChildren(lb, target);
	}

	protected onDisplay()
	{
		super.onDisplay();

		this._bg.alpha = 0;
		this._bg.on(Laya.Event.CLICK, this, this.onShadeClick);
		Laya.Tween.to(this._bg, {alpha:this._alpha}, 300, Laya.Ease.linearIn, undefined, 150);
	}

	protected onUnDisplay()
	{
		this._bg.off(Laya.Event.CLICK, this, this.onShadeClick);
		Laya.Tween.clearAll(this._bg);

		super.onUnDisplay();
	}

	private onShadeClick()
	{
		let {vm} = this.target;
		if(vm && vm.requestClose$ && vm.requestClose$.execute())
		{
			Laya.Tween.to(this._bg, {alpha:0}, 190, Laya.Ease.linearIn);
		}
	}

	set vm(vm){ this.target.vm = vm; }
	get vm(){ return this.target.vm; }
}