/**
 * Created by Ying <me@YingDev.com> on 2017/11/29.
 **/

import {BindableView, NextFn, NextFnOrName} from "./BindableView";
import {Observable} from "rxjs/Observable";
import {rxBindByPropName} from "rxex";
import {RxLaya} from "./RxLaya";

export
{
	subIt,
	subIts,
	subEvent,
	bind,
	bindNext,
	bindComplete,
	bindEvent,
	bindClick,
	bindIts,
	assign,
	assignIt,
	assignIts,
	subClick,
	subChange,
	subInput,
	sub,
	subMethodsPattern,
	extractIt,
	extractIts,
	extractProps,
	refreshLater,
	removeSub,
	createView,
	createViewDelayed,
	bindLabel,
	subTextChange,
	loadView,
	subSelectedIndex,
	subValueChange,
	autoClearIt,
	autoClearIts,
	onSigReset,
	onUnDisplay,
	onChange
};

/**
 * 订阅被装饰字段（observable）到目标字段/函数
 * @param {string | NextFn} to 字段名/函数
 * @param {string} id
 * @returns {any} decorator
 */
function subIt(to:string | NextFn, id?:string) : any
{
	if(typeof to === 'string')
		return _subByName(null, to, id);
	return sub(null, to, id);
}

/**
 * 订阅 '它的propName' 到另一个字段或函数。被装饰 target['propName'] 应当是一个Observable
 * @param {string} observableProp 源字段名，若 !propName 则为被修饰字段本身
 * @param {NextFnOrName} to observer 或者 字段/setter 名字。note: 即使该名字对应的字段是 方法/函数，也会直接写入值而不是调用
 * @param {string} id
 * @returns {any} decorator
 */
function subIts(observableProp:string, to?: NextFnOrName, id?:string ) : any
{
	return _subByName(observableProp, to, id);
}

/**
 * 订阅被装饰字段上的一个事件, 支持 Laya.EventDispatcher / EventEmitter
 * @param {string} name 事件名
 * @param {NextFnOrName} fn
 * @param valSelcetor
 * @param validate
 * @param {string} id
 * @returns {any} decorator
 */
function subEvent(name:string, fn:NextFnOrName, valSelcetor?:(thiz,sender, ...args)=>any, validate?:(m,v)=>boolean, id?:string) : any
{
	return (target, prop, desc)=>
	{
		let src;
		src = m=>
		{
			if(!m)
				return null;
			let selector = !!valSelcetor && ((...args)=>valSelcetor(m,m,...args));
			return RxLaya.fromEvent(m, name, selector)
		};

		if(validate)
		{
			if(typeof fn === 'string')
				return sub(src, (m,v)=> validate(m,v) && (m[fn] = v), id)(target, prop, desc);
			else
				return sub(src, (m,v)=> validate(m,v) && fn(m,v), id)(target, prop, desc);
		}
		else
		{
			if(typeof fn === 'string')
				return sub(src, (m,v)=> m[fn] = v, id)(target, prop, desc);
			else
				return sub(src, fn, id)(target, prop, desc);
		}

	}
}


function bind(src:(thiz)=>Observable<any>, id?:string) : any
{
	return (target, prop, desc) =>
	{
		return sub((it, thiz)=>src(thiz), ((m,v)=>m[prop]=v), id, false)(target, prop, desc);
	}
}

function bindNext(src:(thiz)=>Observable<any>, id?:string) : any
{
	return (target, prop, desc) =>
	{
		return sub((it, thiz)=>src(thiz), ((m,v)=> {
			let p = m[prop];
			if(typeof p === 'function')
				p.call(m, v);
			else if(p && 'next' in p)
				p.next(v);
			else if((prop in m)) //setter
				m[prop] = v;
		}), id, false)(target, prop, desc);
	}
}

function bindComplete(src:(thiz)=>Observable<any>, id?:string):any
{
	return bindNext(m=>
	{
		let s = src(m);
		return	s && s.materialize().first(n=>n.kind === 'C');
	}, id);
}

function bindEvent(emitterSelector:string | ((thiz)=>any), event:string, valSelcetor?:(thiz,sender, ...args)=>any, id?:string) : any
{
	return (target, prop, desc) =>
	{
		let proto = prop ? target : target.prototype;

		if(desc.value || desc.set) //function
		{
			let src = m=>
			{
				let selector = !!valSelcetor && ((...args)=>valSelcetor(m,m,...args));
				let emitter;

				if(typeof emitterSelector === 'string')
					emitter = m[emitterSelector];
				else
					emitter = emitterSelector(m);

				return !!emitter && RxLaya.fromEvent(emitter, event, selector);
			};
			BindableView._updateAutoSubArray(proto, id,  src, (m, v)=>desc.value.call(m,v), 'sub');
			return desc;
		}else
			throw new Error("only supports function/setter");
	}
}

function bindClick(emitterSelector:string | ((thiz)=>any), valSelcetor?:(thiz,sender, ...args)=>any, id?:string): any
{
	return bindEvent(emitterSelector, Laya.Event.CLICK, valSelcetor, id);
}

function bindIts(propName:string, src:(m)=>Observable<any>, id?:string) : any
{
	return (target, prop, desc) =>
	{
		return sub((it, thiz)=>src(thiz), ((m,v)=>
		{
			let obj = m[prop];
			if(!obj)
				return null;
			obj[propName]=v
		}), id, false)(target, prop, desc);
	}
}

function assign(valSelector: (string | ((m)=>any) ), to:NextFn, id?:string)
{
	return (target, prop, desc)=>
	{
		if(typeof valSelector === 'string')
			return sub(m=> Observable.of(m[valSelector]), to,  id)(target, prop, desc);
		else
			return sub(m => Observable.of(valSelector(m)), to, id)(target, prop, desc);
	}
}

function assignIt(valSelector:string | ((m)=>any), id?:string) : any
{
	return (target, prop, desc)=>
	{
		if(typeof valSelector === 'string')
			return bind(m=> Observable.of(m[valSelector]),  id)(target, prop, desc);
		else
			return bind(m => Observable.of(valSelector(m)), id)(target, prop, desc);
	}
}

function assignIts(propName:string, valSelector:string | ((m)=>any), autoClear=true, id?:string) : any
{
	return (target, prop, desc)=>
	{
		if(autoClear)
			autoClearIts(propName)(target, prop, desc);

		if(typeof valSelector === 'string')
			return bindIts(propName,m=>Observable.of(m[valSelector]),  id)(target, prop, desc);
		else
			return bindIts( propName,m => Observable.of(valSelector(m)), id)(target, prop, desc);

	}
}

function onSigReset(cb:(m)=>void, id?:string) : any
{
	return function(target,prop,desc)
	{
		let proto = prop ? target : target.prototype;
		BindableView._updateAutoSubArray(proto, id, null, cb, 'sigReset');
	};
}

function onUnDisplay(cb: NextFn, id?:string) : any
{
	return sub((it, m)=>RxLaya.fromEvent(m, Laya.Event.UNDISPLAY).first(), cb, id, false);
}

function autoClearIt(toVal=null) : any
{
	return (target, prop, desc)=>
	{
		return onSigReset(m=>m[prop] = toVal)(target, prop, desc);
	}
}

function autoClearIts(propName:string, toVal=null) : any
{
	return (target, prop, desc)=>
	{
		return onSigReset(m=>
		{
			let it = m[prop];
			it && (it[propName] = toVal);
		})(target, prop, desc);
	}
}

//todo: move out
function subClick(fn:NextFnOrName, valSelcetor?:(thiz,sender, ...args)=>any, validate?:(m,v)=>boolean, id?:string) : any
{
	return subEvent(Laya.Event.CLICK, fn, valSelcetor, validate, id);
}

function subChange(fn:NextFnOrName, valSelcetor?:(thiz,sender, ...args)=>any, validate?:(m,v)=>boolean, id?:string) : any
{
	return subEvent(Laya.Event.CHANGE, fn, valSelcetor, validate, id);
}

function subValueChange(fn:NextFnOrName, validate?:(m,v)=>boolean) : any
{
	return subChange(fn, (m,s)=>s.value, validate);
}

function subInput(fn:NextFnOrName, valSelector?:(thiz,sender,...args)=>any, validate?:(m,v)=>boolean) : any
{
	valSelector = valSelector || ((thiz, sender, ...args)=> {
		return sender instanceof Laya.TextInput ? sender.text : sender;
	});
	return subEvent(Laya.Event.INPUT, fn, valSelector);
}

function subSelectedIndex(fn:NextFnOrName) : any
{
	return subChange(fn, (m,it)=>it.selectedIndex);
}

/**
 * 为目标 字段/类 创建一个 Subing
 * @param {(me) => Observable<any>} src 源Observable选择器，若修饰class，则 me 为 this，否则 为修饰字段的实例
 * @param {NextFn} fn observer function
 * @param {string} id 唯一标识，子类使用相同 id 可以覆盖父类的对应的 Subing
 * @param addRefreshLater 是否自动添加 @addRefreshLater ?
 * @returns {any} decorator
 */
function sub(src:(it, thiz)=>Observable<any>, fn: NextFn, id?:string, addRefreshLater=true) : any
{
	return function(target,prop,desc)
	{
		let proto = prop ? target : target.prototype;
		if(prop)
		{
			let s = src;
			if(!src)
				src = m=> m[prop];
			else
				src = m=> s(m[prop], m);

			if(addRefreshLater)
				desc = refreshLater()(target, prop, desc);
		}
		BindableView._updateAutoSubArray(proto, id, src, fn, 'sub');

		if(prop && addRefreshLater)
			return desc;
	};
}

function _subByName(propName:string, fn?:NextFnOrName, id?:string) : any
{
	if(!propName && !fn)
		throw new Error("either propName/fn or both should be provided.");

	return function(target,prop,desc)
	{
		if(arguments.length === 1 && !fn) //class
			throw new Error("when applied to class, fn must have a value");

		let proto = prop ? target : target.prototype;
		let src;
		if(!fn)
			fn = ((me,v) => me[propName] = v);
		else
		if(typeof fn === 'string')
		{
			let myName = fn as string;
			fn = ((me,v) => me[myName] = v);
		}
		//console.log(prop + '.' + propName);
		if(prop)
		{
			//如果没有提供 propName 则字段本身是需要的observable
			if(!propName)
				src = m=> { return (m && m[prop]) };
			else
				src = m=> m[prop] && m[prop][propName];
			desc = refreshLater()(target, prop, desc);
		}
		BindableView._updateAutoSubArray(proto, id, src, fn, 'sub');

		if(prop)
			return desc;
	};
}

function subMethodsPattern(prefix?:string, id?:string) : any
{
	return (target,prop,desc)=>{
		let src = m=>{
			return Observable.create(o=>
			{
				o.next(m);
				o.complete();
			});
		};
		let fn = (m, propObj)=> rxBindByPropName(propObj, m, m._curSigReset, prefix || ("on_"+prop+"_") );

		if(prop)
		{
			let s = src;
			src = m=>s(m[prop]);
			desc = refreshLater()(target, prop, desc);
		}

		let proto = target;
		BindableView._updateAutoSubArray(proto, id, src, fn, 'sub');

		if(prop)
			return desc;
	}
}

function extractIt(to:NextFnOrName, id?:string) : any
{
	return (target, prop, desc)=>
	{
		if(!prop || (desc && !desc.get))
			throw new Error('only applies to property / getter');
		return extractIts(m=>m, to, id)(target, prop, desc);
	}
}

//不会自动添加 reSubLater
function extractIts(selector:((m)=>any) | string, to:NextFnOrName, id?:string) : any
{
	let src;
	if(typeof selector === 'string')
		src = m=> m && Observable.of(m[selector]);
	else
		src = m=> m && Observable.of(selector(m));

	if(typeof to === 'string')
		return sub(src, (m, v)=> m && (m[to] = v), id, false);
	else
		return sub(src, to, id, false);
}

function extractProps(props:string[], to?:NextFnOrName, id?:string) : any
{
	if(typeof to === 'string')
	{
		return sub(m=>Observable.of(m), (m, from)=>{
			for(let k of props)
				m[to][k] = from[k];
		}, id, false);
	}
	else if(!to) //to this
	{
		return sub(m=>Observable.of(m), (m, from)=>{
			for(let k of props)
				m[k] = from[k];
		}, id, false);
	}

	return sub(from=>Observable.of({from, props}), to, id,false)
}

//todo: 与绑定无关的提取出来？
function onChange(didChange:NextFn, willChange?:(m,old,newVal)=>any) : any
{
	return (target, propertyKey, descriptor) : any =>
	{
		let descName = '_@onChanged_'+propertyKey;

		if(descriptor)
		{
			if(descriptor['_name'] === descName)
			{
				return descriptor;
			}

			let {get,set} = descriptor;
			return set && {
				_name:descName,
				get: get,
				set: function(value)
				{
					let old;
					if(!get || ((old = get.call(this)) !== value) )
					{
						let newVal = willChange ? willChange(this,old, value) : value;
						set.call(this,newVal);
						didChange(this,value);
					}
				},
				configurable: true,
				enumerable: true
			}
		}
		else
		{
			return {
				_name:descName,
				get(){ return this[descName]; },
				set(value){
					let old = this[descName];

					if(value !== this[descName])
					{
						this[descName] = willChange ? willChange(this,old, value) : value;;
						didChange(this,value);
					}
				},
				configurable: true,
				enumerable: true
			}
		}

	}
}

function refreshLater() : any
{
	return (target, propertyKey, descriptor) : any =>
	{
		let descName = '_@refreshLater_'+propertyKey;

		if(descriptor)
		{
			if(descriptor['_name'] === descName)
			{
				return descriptor;
			}

			let {get,set} = descriptor;
			return set && {
				_name:descName,
				get: get,
				set: function(value)
				{
					if(!get || (get.call(this) !== value))
					{
						set.call(this,value);
						this.refreshLater();
					}
				},
				configurable: true,
				enumerable: true
			}
		}
		else
		{
			return {
				_name:descName,
				get(){ return this[descName]; },
				set(value){
					if(value !== this[descName])
					{
						this[descName] = value;
						this.refreshLater();
					}
				},
				configurable: true,
				enumerable: true
			}
		}

	}

}

function removeSub(id:string) : any
{
	return (ctor, prop)=>
	{
		if(prop)
			throw new Error("only applies to class");
		BindableView._removeAutoSub(ctor.prototype, id)
	}
}

function createView(path: string | ((me)=>any)) : any
{
	const fnName = '_@createView_impl';
	return (ctor: new(...args)=>BindableView, prop)=>
	{
		if(!!prop)
			throw new Error("only applies to class");

		const NAME_FIELD = "name";
		const NAME = ctor.name + "@createView(" + (typeof path === 'string' ? `'${path}'` : '(function)') +")";

		let fn = function()
		{
			//允许子类 @createView(null) 来取消继承的方法
			if(!path)
				return;

			if(typeof path === 'string')
				this.createView(Laya.loader.getRes(path));
			else
				path(this);
		};

		let newCtor;
		if(ctor.prototype[fnName])
		{
			newCtor = class extends ctor
			{
				//hack: override constructor.name
				static get [NAME_FIELD](){return NAME }
			};
		}
		else
		{
			newCtor = class extends ctor
			{
				static get [NAME_FIELD](){return NAME }
				constructor(...args)
				{
					super(...args);
					this[fnName]();
				}
			};
		}

		newCtor.prototype[fnName] = fn;
		return newCtor;
	}
}

function createViewDelayed(path: string, delay=500) : any
{
	return createView((m)=>{
		Laya.timer.once(delay, null, ()=>{
			m.createView(Laya.loader.getRes(path));
			m.refreshLater();
		})
	})
}

function loadView(path: string, clearOnUndisplay=false) : any
{
	return createView(m=>{
		Laya.loader.load(path, Laya.Handler.create(m, (res)=> {
			m.createView(res);
			if (clearOnUndisplay)
				m.once(Laya.Event.UNDISPLAY, null, ()=>
				{
					m.destroy();
					Laya.loader.clearRes(path);
				} )
		}));
	})
}

function bindLabel(src:(m)=>Observable<any>)
{
	return bindIts('text', src);
}


function subTextChange(fn: NextFnOrName, validate?:(m,v)=>boolean) : any
{
	return subInput(fn, (m,s:Laya.TextInput)=>s.text);
}

