/**
 * Created by Ying <me@YingDev.com> on 2017/12/4.
 **/
import {Observable} from "rxjs/Observable";
import {VmViewBase} from "./VmViewBase";
import {INavPageVm, INavTransition} from "./interfaces";

/**
 * 基本的导航页切换效果。这是框架默认的切换效果。
 */
export class SimpleNavTransition implements INavTransition
{
	durMoveIn = 250;
	durMoveOut = 195;
	easeMoveIn = Laya.Ease.cubicOut;
	easeMoveOut = Laya.Ease.linearIn;

	doTransition(cur:VmViewBase<INavPageVm>, next:VmViewBase<INavPageVm>, type:"push"|"pop"|"replace", done:()=>void, sigInt: Observable<any>)
	{
		const {durMoveIn,durMoveOut, easeMoveIn, easeMoveOut} = this;
		const {Handler, Tween} = Laya;
		let tweens = [];
		let targets = [cur && cur.parent, next && next.parent];

		switch (type)
		{
			case "push":
			{
				let holder = next.parent;
				let nav = (holder.parent as Laya.Sprite);
				tweens.push(Tween.from(holder, {y: nav.height}, durMoveIn, easeMoveIn, Handler.create(null, done )));
				break;
			}

			case "pop":
			{
				let holder = cur.parent;
				let nav = (holder.parent as Laya.Sprite);
				tweens.push(Tween.to(holder, {y: nav.height}, durMoveOut, easeMoveOut, Handler.create(null, done)));
				break;
			}

			case "replace":
			{
				//fixme...
				let w = (cur.parent as Laya.Box).width;
				let h = (cur.parent as Laya.Box).height;
				next.x = w;
				tweens.push(Tween.to(cur, {x: -w}, durMoveOut, Laya.Ease.cubicOut));
				tweens.push(Tween.to(next, {x: 0}, durMoveIn, easeMoveIn, Handler.create(null, done)));
				targets.push(next);
				targets.push(cur);
				break;
			}
		}

		sigInt.subscribe({complete:() =>
		{
			tweens.forEach(t => t.complete());
			targets.forEach(t =>
			{
				if (!t) return;
				(<any>t).y = 0;
				(<any>t).x = 0;
				(<any>t).alpha = 1;
			});

		}});
	}
}