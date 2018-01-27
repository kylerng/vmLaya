/**
 * Created by Ying <me@YingDev.com> on 2017/12/7.
 **/

import {RxCommand} from "rxex/RxCommand";
import {VmViewBase} from "./VmViewBase";
import {Observable} from "rxjs/Observable";

/**
 * 当页面被遮挡变为不可见/重见时，使用何种方式隐藏/重新显示之？
 */
export enum NavPageHidingStrategy
{
	/**
	 * addChild / removeChild。这是默认值。 会使 BindableView 解除所有数据绑定，下次显示时会重新执行数据绑定。适用于某些页面的数据可能更新频繁，页面被遮挡后应当暂停更新
	 */
	AddRemove = 1,

	/**
	 * visible = true/false 数据绑定仍然工作，只是看不见。适用于某些页面可能数据绑定开销较大，而又可能频繁被遮挡，这样可能更高效。
	 */
	Visibility = 2
}

/**
 * 为 NavigationView 提供关于此页面的额外信息。
 * 当一个也vm可选地实现此此接口，意味着它作为 NavigationView 的页面时，可以提供一些额外信息。
 */
export interface INavPageVm
{
	/**
	 * 	是否半透明？如果一个页面不是半透明的，当它遮挡住下方的页面后，系统会隐藏下方的页面，以优化渲染性能。
	 * 	否则，将直接叠加在其下方的 页面上。
	 */
	canSeeThrough?() : boolean;

	/**
	 * 隐藏策略
	 * @returns {NavPageHidingStrategy}
	 */
	hidingStrategy?() : NavPageHidingStrategy;
}

export interface INavTransition
{
	/**
	 * 导航动画提供者
	 * @param {VmViewBase} cur 如果 type == push，则 cur 为当前 top（可能为null）， next 为将 push 的 view；如果 type == pop，则 cur 是将被pop的view， next 是下方将被暴露出来的 view；如果 type == replace，则 cur 是旧的 view，next 是新的 view
	 * @param {VmViewBase} next
	 * @param {"push" | "pop" | "replace"} type
	 * @param {() => void} done 动画完成时应调用 done() 通知系统已进入最终状态，系统保证重复调用 done() 只会产生一次影响。
	 * @param {Observable<any>} sigInt 中断通知。当 sigInt 被触发，则意味着应当立即进入最终状态（此时 done 已经被自动执行，不需要再调用）。 实现者应当订阅此信号，并在触发时将 view 置入动画使之应到达的最终状态。
	 */
	doTransition(cur:VmViewBase<any>, next:VmViewBase<any>, type:"push"|"pop"|"replace", done:()=>void, sigInt: Observable<any>);
}

export type ViewInfo = {id:string, view:VmViewBase<any>, vmClass}

/**
 * View 工厂。实现者应当能根据 ViewModel 实例获得一个对应的 VmViewBase 实例（ViewInfo。view)
 * 实现者通常应当提供 pooling，优化 view 创建性能。
 */
export interface IViewFactory
{
	getViewForVm(vm:any, id?:string) : ViewInfo;
	returnView?(view:ViewInfo);
}

/**
 * 如果一个 ViewModel 实现此接口，表示它 可以请求关闭自己 :)
 * 比如一个临时弹窗，点击背景自动关闭
 * 但只是请求，实际执行通常由 viewModel 的创建者来决定。
 */
export interface IRequestClose
{
	requestClose$ : RxCommand<any>;
}

/**
 * 导航功能抽象。note: NavigationViewModel 实现了此接口。
 * 某些情况下，一个子模块可能需要诸如'全屏弹窗'这样的功能，但它不应该知道实际提供这种功能的是谁，此时它可以利用获得的 INavService 来执行相应操作。
 */
export interface INavService
{
	push$: RxCommand<any>;
	pop$: RxCommand<any>;
	replace$: RxCommand<any>;
	remove$: RxCommand<any>;
}