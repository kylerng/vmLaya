/**
 * Created by Ying <me@YingDev.com> on 2017/11/25.
 **/

/**
 * 组件基类 定义几个主要生命周期相关的模板方法. 由于 laya 不支持组件系统，继承 View 是更符合实际的方法。
 */
export abstract class ViewBase extends Laya.View
{
	//abstract set enabled(b:boolean);
	//abstract get enabled();

	constructor()
	{
		super();

		this.on(Laya.Event.DISPLAY, this, this.onDisplay);
		this.on(Laya.Event.UNDISPLAY, this, this.onUnDisplay);
		this.on(Laya.Event.REMOVED, this, this.onRemove);
		this.on(Laya.Event.ADDED, this, this.onAdd);
	}
	/**
	 * 	约等于 onEnable
	 */
	protected onDisplay(){}

	/**
	 * 	约等于 onDisable
	 */
	protected onUnDisplay(){}

	protected onRemove(){}

	protected onAdd() {}
}
