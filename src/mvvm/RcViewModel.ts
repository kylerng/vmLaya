/**
 * Created by Ying <me@YingDev.com> on 2017/12/9.
 **/
import {RcObject, ref, unref} from "../RcObject";
import {Observable} from "rxjs/Observable";

/**
 * 引用计数的 ViewModel
 * 通常我们的 ViewModel 可能订阅一些全局/单例/静态对象上的事件，如果不在合适的时候取消，将会造成内存泄漏或者奇怪的 bug。
 * 我们不应该将 VM 的生命周期关联到具体的 View 上面，这会带来'谁负责 dispose 这个 vm' 的问题。
 * 通过引用计数，我们可以确定一个 vm 何时不再被用到，从而决定取消全局事件订阅；同时不必关心睡应该负责销毁这个 vm
 */
export abstract class RcViewModel extends RcObject
{
	constructor(unrefWhen$?:Observable<any> | RcObject)
	{
		super(!unrefWhen$);

		let $ = (unrefWhen$ instanceof RcObject) ? unrefWhen$.sigRc$ : unrefWhen$;
		$ && $.takeUntil(this.sigRc$).subscribe(_=>unref(this));
	}
}