// Learn TypeScript:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/typescript/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

const {ccclass, property} = cc._decorator;
let talefun = (<any>cc).talefun;

import MyPhysicsCollider = require("./MyPhysicsCollider")

@ccclass
export default class physicsNodeLogic extends cc.Component {

    touchStartHandler: () => void;
    touchMoveHandler: () => void;
    touchEndHandler: () => void;
    touchCancelHandler: () => void;

    path: cc.Graphics = null;

    dashedPath: cc.Graphics = null;

    points: cc.Vec2[] = [];

    physicsLine = null;

    rigibodyLogic: cc.RigidBody = null;

    // LIFE-CYCLE CALLBACKS:    
    onLoad () {
        this.path = this.addComponent(cc.Graphics);
        this.path.strokeColor = cc.color(255, 0, 0);
        this.path.lineWidth = 4;

        let visualNode = new cc.Node();
        this.node.addChild(visualNode);
        this.dashedPath = visualNode.addComponent(cc.Graphics);
        this.dashedPath.strokeColor = cc.color(255, 0, 0, 100);
        this.dashedPath.lineWidth = 4;

        this.touchStartHandler = this.touchStart.bind(this);
        this.touchMoveHandler = this.touchMove.bind(this);
        this.touchEndHandler = this.touchEnd.bind(this);
        this.touchCancelHandler = this.touchCancel.bind(this);

        this.addTouch();
    }

    onDestroy() {
        this.removeTouch();
    }

    addTouch() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStartHandler);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMoveHandler);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEndHandler);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchCancelHandler);
    }

    removeTouch() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchStartHandler);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.touchMoveHandler);
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEndHandler);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.touchCancelHandler);
    }

    touchStart(event : cc.Event.EventTouch) {
        let touchLoc = event.getLocation();
        touchLoc = this.node.parent.convertToNodeSpaceAR(touchLoc);

        this.points.push(cc.p(touchLoc.x, touchLoc.y));
        this.path.moveTo(touchLoc.x, touchLoc.y);
        return true;
    }

    touchMove(event : cc.Event.EventTouch) {
        let touchLoc = event.getLocation();
        touchLoc = this.node.parent.convertToNodeSpaceAR(touchLoc);
        let lastTouchLoc = this.points[this.points.length - 1];
        if (this.checkIsCanDraw(lastTouchLoc, touchLoc)) {
            // 射线检测
            let result = cc.director.getPhysicsManager().rayCast(lastTouchLoc, touchLoc, cc.RayCastType.All);
            if (result.length <= 0) {
                this.points.push(cc.p(touchLoc.x, touchLoc.y));
                this.path.lineTo(touchLoc.x, touchLoc.y);
                // this.path.moveTo(touchLoc.x, touchLoc.y);
                this.path.stroke();
            } else {
                this.dashedPath.clear();
                this.dashedPath.moveTo(lastTouchLoc.x, lastTouchLoc.y);
                this.dashedPath.lineTo(touchLoc.x, touchLoc.y);
                this.dashedPath.stroke();
            }
            
        }
    }

    touchEnd(event : cc.Event.EventTouch) {
        // let touchLoc = event.getLocation();
        // touchLoc = this.node.parent.convertToNodeSpaceAR(touchLoc);
        // this.path.lineTo(touchLoc.x, touchLoc.y);
        // this.path.stroke();
        // this.points.push(touchLoc);
        this.dashedPath.clear();
        this.createRigibody();
    }

    touchCancel(event : cc.Event.EventTouch) {
        this.createRigibody();
    }

    checkIsCanDraw(lastPoint: cc.Vec2, nowPoint: cc.Vec2) {
        return cc.pDistance(lastPoint, nowPoint) >= 20;
    }

    parsePathString(pathStr) {
        var pathList = pathStr.split(" ");
        let bezieConfig = {
            beginPos: cc.p(0, 0),
            control1: cc.p(0, 0),
            control2: cc.p(0, 0),
            endPos: cc.p(0, 0),
        };

        for (let i = 0, len = pathList.length; i < len; i++) {
            if (pathList[i] === "C") {
                bezieConfig.beginPos.x = parseFloat(pathList[i - 2]);
                bezieConfig.beginPos.y = parseFloat(pathList[i - 1]);
                bezieConfig.control1.x = parseFloat(pathList[i + 1]);
                bezieConfig.control1.y = parseFloat(pathList[i + 2]);
                bezieConfig.control2.x = parseFloat(pathList[i + 3]);
                bezieConfig.control2.y = parseFloat(pathList[i + 4]);
                bezieConfig.endPos.x = parseFloat(pathList[i + 5]);
                bezieConfig.endPos.y = parseFloat(pathList[i + 6]);

            }
        }
        cc.log("zhangyakun" + JSON.stringify(pathList));
    }

    createRigibody() {
        this.rigibodyLogic = this.addComponent(cc.RigidBody);
        this.physicsLine = this.addComponent("MyPhysicsCollider");
        // let posArr = [];
        // for (let i = 0; i < this.points.length - 1; i++) {
        //     let beginPos = this.points[i];
        //     let endPos = this.points[i + 1];
        //     let posGroup = this.getSegmenPos(beginPos, endPos);

        //     if (i === 0) {
        //         posArr.splice(0, 0, posGroup.beginPosArr[0]);
        //         posArr.push(posGroup.endPosArr[0]);
        //     }

        //     posArr.splice(0, 0, posGroup.beginPosArr[1]);
        //     posArr.push(posGroup.endPosArr[1]);
        // }
        // this.path.lineWidth = 2;
        // this.path.strokeColor = cc.color(0, 255, 0);
        // this.path.moveTo(this.points[0]);
        // for (let i in this.points) {
        //     this.path.lineTo(this.points[i].x, this.points[i].y);
        // }
        // this.path.stroke();
        this.physicsLine.lineWidth = this.path.lineWidth;
        this.physicsLine.points = this.points;
        this.physicsLine.apply();
    }

    getSegmenPos(beginPos: cc.Vec2, endPos: cc.Vec2) {
        let k = (endPos.y - beginPos.y) / (endPos.x - beginPos.x);
        let offX = 0;
        let offY = 0;
        if (k === 0) {
            offY = this.path.lineWidth / 2;
            offX = 0;

            if (endPos.x < beginPos.x) {
                offX = -offX;
                offY = -offY;
            }
        }
        else if (!isFinite(k)) {
            offX = this.path.lineWidth / 2;
            offY = 0;
        } else {
            let k1 = -1 / k;

            let angle = Math.atan(k1);
            let sin = Math.sin(angle);
            let cos = Math.cos(angle);
            cc.log("angle" + angle);

            offX = this.path.lineWidth / 2 * cos;
            offY = this.path.lineWidth / 2 * sin;
        }

        if (endPos.y > beginPos.y) {
            offX = -offX;
            offY = -offY;
        }

        let beingPosArr = [cc.p(beginPos.x - offX, beginPos.y - offY), cc.p(endPos.x - offX, endPos.y - offY)];
        let endPosArr = [cc.p(beginPos.x + offX, beginPos.y + offY), cc.p(endPos.x + offX, endPos.y + offY)];

        return {
            beginPosArr : beingPosArr,
            endPosArr : endPosArr
        };
    }
}
