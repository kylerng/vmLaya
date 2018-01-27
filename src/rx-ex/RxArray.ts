/**
 * Created by Ying <me@YingDev.com> on 13/11/2017.
 **/
import {Subject} from "rxjs/Subject";

export class RxArray<T> extends Subject<"push" | "pop" | "reset">
{
	readonly array = [];

	push(...items)
	{
		this.array.push(...items);
		this.next("push");
	}

	pop(): T
	{
		let val = this.array.pop();
		this.next("pop");
		return val;
	}

	clear()
	{
		this.array.length = 0;
		this.next("reset");
	}

	notifyReset() { this.next('reset') }
}