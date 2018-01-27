/**
 * Created by Ying <me@YingDev.com> on 2017/12/6.
 **/

import {
	assignIt, assignIts,
	bind, bindComplete, bindIts, bindLabel, bindNext, sub, subChange, subClick, subInput, subSelectedIndex,
	subTextChange,
	subValueChange
} from "../decorators";
import {RxCommand} from "rxex/RxCommand";
import {NavPageHidingStrategy} from "./interfaces";
import {Observable} from "rxjs/Observable";
import {RxProperty} from "rxex/RxProperty";


export function vmBindText(name:string) : any
{
	return bindText(m=>m.vm && m.vm[name]);
}

export function vmBindLabel(propName:string, mapper?:(v)=>string)
{
	if(mapper)
		return bindLabel(m=> m.vm && propName in m.vm &&  m.vm[propName].map(mapper));

	return bindLabel(m=>m.vm && m.vm[propName]);
}

export function bindCommand(src:(it,thiz)=>RxCommand<any>, onCanExec:(thiz,v)=>void) : any
{
	return sub((it,thiz)=>
	{
		let cmd = src(it,thiz);
		return cmd && cmd.canExecute
	}, onCanExec)
}

export function vmBindNext(name:string) : any
{
	return bindNext(m=>m.vm && m.vm[name]);
}

export function vmBindComplete(name:string) : any
{
	return bindComplete(m=>m.vm && m.vm[name]);
}

//export function vmBindComplete(name:string) : any
//{
//	return bindNext(m=> m.vm && m.vm[name].materialize().first(n=>n.kind === 'complete'));
//}

export function vmBindCommand(name:string, onCanExec:(thiz,v)=>void) : any
{
	return bindCommand((it,thiz)=>thiz.vm && thiz.vm[name], onCanExec);
}

export function vmBindCommandClick(name:string, args?:string) : any
{
	return (target, prop, desc)=>
	{
		//bind disabled
		let result = vmBindCommand(name, (thiz,v)=> {
			let it = thiz[prop];
			if(!it)
				return;
			(it as Laya.Component).disabled = !v
		})(target, prop, desc);
		//sub click
		return subClick((m,v)=>m.vm && (m.vm[name] as RxCommand<any>).execute(args))(target, prop, result);
	}
}

export const vmBindCmdClick = vmBindCommandClick;

export function vmSubSelectedIndex(vmSubjName)
{
	return subSelectedIndex((m, v)=>m.vm && m.vm[vmSubjName].next(v))
}

export function bindText(to: (m)=>RxProperty<string>) : any
{
	return (target, prop, desc)=>
	{
		let result = sub((it,thiz)=>to(thiz), (m,v)=>m[prop].text = v)(target, prop, desc);
		return subTextChange((m,v)=>to(m).value = v)(target, prop, result);
	}
}

export function vmBind(name:string)
{
	return bind(m=>m.vm && m.vm[name]);
}

export function vmBindIts(name:string, toVms:string)
{
	return bindIts(name, m=>m.vm && m.vm[toVms]);
}

export function vmBindValue(rxPropName:string) : any
{
	return (target, prop, desc)=>{
		let binded = vmBindIts('value', rxPropName)(target, prop, desc);
		return subValueChange((m,v)=>m.vm && m.vm[rxPropName].next(v))(target, prop, binded);
	}
}

export function vmBindSelected(rxPropName: string) : any
{
	return (target, prop, desc)=>{
		let binded = vmBindIts('selected', rxPropName)(target, prop, desc);
		return subChange((m,v)=>m.vm && m.vm.noComm$.next(v), (m,it)=>it.selected)(target, prop, binded);
	}
}

// export function vmBindTab(rxPropName: string, labels:(vm)=>string) : any
// {
// 	return (target, prop, desc)=>{
// 		let binded = assignIts('labels', (m)=>m.vm && labels(m.vm))(target, prop, desc);
// 		binded = vmBindIts('selectedIndex', rxPropName)(target, prop, binded);
// 		return subSelectedIndex((m,v)=>m.vm && m.vm[rxPropName].next(v))(target, prop, binded);
// 	}
// }

export function vmBindTab(rxPropName: string, labels$: (vm)=>Observable<string>) : any
{
	return (target, prop, desc)=>{
		let binded = bindIts('labels', (m)=>m.vm && labels$(m.vm))(target, prop, desc);
		binded = vmBindIts('selectedIndex', rxPropName)(target, prop, binded);
		return subSelectedIndex((m,v)=>m.vm && m.vm[rxPropName].next(v))(target, prop, binded);
	}
}

export function vmBindCombo(rxPropName: string, vmPropName) : any
{
	return (target, prop, desc)=>{
		let binded = vmBindIts('array', vmPropName)(target, prop, desc);
		binded = vmBindIts('selectedIndex', rxPropName)(target, prop, binded);
		return subSelectedIndex((m,v)=>m.vm && m.vm[rxPropName].next(v))(target, prop, binded);
	}
}

export function navPage({seeThru = true, hiding = NavPageHidingStrategy.AddRemove}) : any
{
	return (target)=>
	{
		target.prototype.hidingStrategy = function(){ return hiding };
		target.prototype.canSeeThrough = function(){ return seeThru };
	}
}