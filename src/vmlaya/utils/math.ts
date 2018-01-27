/**
 * Created by Ying <me@YingDev.com> on 2017/12/14.
 **/
export function clamp(v, min, max) { return (v = (v < min ? min : v)) > max ? max : v; }