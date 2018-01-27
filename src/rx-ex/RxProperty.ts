/**
 * Created by Ying <me@YingDev.com> on 13/11/2017.
 **/
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Subscriber} from "rxjs/Subscriber";
import {Subscription} from "rxjs/Subscription";
import {Subject} from "rxjs/Subject";

export class RxProperty<T> extends BehaviorSubject<T>
{
	constructor(value?: T, public hasValue = true)
	{
		super(value);
	}

	set value(v: T)
	{
		this.next(v);
	}

	get value() { return this.getValue() }

	eq(v: T) { return this.value === v }

	neq(v: T) { return !this.eq(v) }

	next(v: T)
	{
		this.hasValue = true;
		if (v != this.value)
			super.next(v);
	}

	protected _subscribe(subscriber: Subscriber<T>): Subscription
	{
		if (this.hasValue)
			return super._subscribe(subscriber);
		else
			Subject.prototype['_subscribe'].call(this, subscriber);
	}
}

export class RxNumber extends RxProperty<number>
{
	gt(v:number) { return this.value > v}
	lt(v:number) { return this.value < v}
	gte(v:number) { return this.value >= v}
	lte(v:number) { return this.value <= v}
}
