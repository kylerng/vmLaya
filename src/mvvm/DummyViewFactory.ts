/**
 * Created by Ying <me@YingDev.com> on 2017/12/10.
 **/
import {VmViewBase} from "./VmViewBase";
import {IViewFactory} from "./interfaces";

/**
 * 帮助调试的 ViewFactory, 每个返回的页面有不同的颜色和文字。便于观察页面切换的情况。
 * eg: NavagationView.pageFactory = new DummyNavPageFactory()
 */
export class DummyNavPageFactory implements IViewFactory
{
	getViewForVm(vm) { return {view: createDummyPage(), id:'dummy_page', vmClass: Object.getPrototypeOf(vm).constructor }; }
}

const DUMMY_COLORS = ["red", "blue", "white", "yellow", "green", "gray"];
let _i = 0;
function createDummyPage()
{
	let dummyPage = new VmViewBase<any>();
	dummyPage.left = dummyPage.right = dummyPage.top = dummyPage.bottom = 0;
	let style = new Laya.CSSStyle(dummyPage);
	style.backgroundColor = DUMMY_COLORS[_i++ % DUMMY_COLORS.length];
	style.border = "10px solid cyan";
	let label = new Laya.Label();
	label.text = "Dummy " + _i.toString();
	label.fontSize = 64;
	label.centerX = label.centerY = 0;
	dummyPage.addChild(label);
	dummyPage.setStyle(style);

	return dummyPage;
}