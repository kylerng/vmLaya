/**
 * Created by Ying <me@YingDev.com> on 2017/12/10.
 **/
import {OverlayWrapperView, ViewClass, VmViewBase} from "../mvvm/index";
import {createView} from "../decorators";

/**
 * 派生一个 OverlayWrapperView 子类，使 new V() 成为其 target。
 * 也就是，我们得到一个拥有半透明背景，并可以通过点击该背景来'请求关闭'的 view 类型。
 * @param target view class
 * @returns 匿名子类
 */
export function makeOverlayWrapped(target: ViewClass) : new()=>OverlayWrapperView
{
	let NAME = target.name + "@makeOverlayWrapped";
	return class extends OverlayWrapperView
	{
		static get ["nam"+"e"]() { return NAME }
		constructor()
		{
			super(new target());
			//centered && (this.target.centerX = this.target.centerY = 0);
		}
	}
}

/**
 * 派生一个 拥有 @createView() 的子类，它的 path 将是 @viewFor({id}) 的id
 * @param {ViewClass} target
 * @param id
 * @returns {ViewClass}
 */
export function makeCreateViewById(target: ViewClass, id) : ViewClass
{
	let NAME = target.name + "@makeCreateViewById("+id+")";
	@createView(id)
	class createViewById_impl extends target
	{
		static get ["nam"+"e"]() { return NAME }
	}
	return createViewById_impl;
}


export function getEnumKeys(E)
{
	const K = "_%keys";
	let arr = E[K];
	if(arr)
		return arr;

	arr = [];
	for(let k in E)
	{
		if(typeof E[k] === 'number')
			arr.push({key:k, value:E[k]});
	}

	arr.sort((a,b)=>a.value - b.value);

	return E[K] = arr.map(kv=>kv.key);
}

export function getEnumVals(E)
{
	const K = "_%vals";
	let vals = E[K]
	if(!vals)
		vals = Object.keys(E).filter(key => !isNaN(Number(E[key]))).map(k=>E[k]);
	return E[K] = vals;
}