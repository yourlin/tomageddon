// HUD（虚拟摇杆/技能按钮）与游戏场景之间共享的输入状态
export const controls = {
  joyX: 0,
  joyY: 0,
  skillPressed: false,
  pausePressed: false,
  reset(): void {
    this.joyX = 0;
    this.joyY = 0;
    this.skillPressed = false;
    this.pausePressed = false;
  },
};
