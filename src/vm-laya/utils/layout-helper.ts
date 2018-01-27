/**
 * Created by Ying <me@YingDev.com> on 2017/12/7.
 **/

export function zeroMargins<T extends Laya.Component>(target:T) : T
{
	return uniMargins(target);
}

export function uniMargins<T extends Laya.Component>(target: T, margin = 0) : T
{
	target.left = target.right = target.top = target.bottom = margin;
	return target;
}

export function replaceChildren(target: Laya.Node, newChilds: Array<Laya.Node>, destroy=true)
{
	if(destroy)
		target.destroyChildren();
	else
		target.removeChildren();
	target.addChildren(...newChilds);
}