# vmLaya
MVVM for LayaAir. Based on rxjs. http://www.yingdev.com

## ⚠注意
️这只是一个 UI 库，不适合用来实现游戏逻辑。

# 工具链要求
- Typescript + es6 输出
- Webpack

# 安装
```bash
npm install vmlaya --save
```
# 示例
https://github.com/yingDev/vmlaya-example

```typescript
import {$} from "rxex";
import {vmBindLabel, VmViewBase} from "vmlaya/mvvm";
import {assignIts, bindIts, createView} from "vmlaya/decorators";

const TEST_PAGE = 'TestPage.json';

//我们的 ViewModel
class HelloViewModel
{
    hello$ = $.timer(0, 500);
}

//一个 View
@createView(TEST_PAGE)
class HelloView extends VmViewBase<HelloViewModel>
{
    //绑定 viewModel 的 hello$ 的值到 lbHello.text
    @vmBindLabel('hello$')
    lbHello: Laya.Label;
}

//另一个 View
class WorldView extends VmViewBase<HelloViewModel>
{
    //可以对数据进行格式化后显示
    @vmBindLabel('hello$', s=>`hello ${s} world!`)
    //我们几乎可以绑定任意数据源 => 任意字段
    @bindIts('color', m=>m.vm.hello$.map(n=> n%2 ? 'red':'blue'))
    //也可以简单地执行一次性赋值操作
    @assignIts('fontSize', m=>32)
    lbWorld = this.addChild(new Laya.Label());
}
```

todo...
