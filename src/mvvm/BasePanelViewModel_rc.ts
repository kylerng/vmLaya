/**
 * Created by Ying <me@YingDev.com> on 2017/12/11.
 **/
import {IRequestClose, RcViewModel, navPage} from "./index";
import {rxPropCmd, RxPropCommand} from "rxex";

@navPage({seeThru: true})
export abstract class BasePanelViewModel_rc extends RcViewModel implements IRequestClose
{
	requestClose$:RxPropCommand<any> = rxPropCmd(true);
}