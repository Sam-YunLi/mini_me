'use client'

import { useState, useEffect } from "react";
import { CONFIG } from "./config";

export default function Home() {
  const [pos, setPos] = useState(CONFIG.INITIAL_POSITION); // 小人地图坐标
  const [target, setTarget] = useState<{x:number,y:number}|null>(null); // 鼠标右键目标
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 键盘移动
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      setPos(prev => {
        let { x, y } = prev;
        switch(e.key){
          case "w":
          case "ArrowUp": y -= CONFIG.MOVE_SPEED_KEYBOARD; break;
          case "s":
          case "ArrowDown": y += CONFIG.MOVE_SPEED_KEYBOARD; break;
          case "a":
          case "ArrowLeft": x -= CONFIG.MOVE_SPEED_KEYBOARD; break;
          case "d":
          case "ArrowRight": x += CONFIG.MOVE_SPEED_KEYBOARD; break;
        }
        // 限制小人地图坐标
        x = Math.max(CONFIG.EDGE_PADDING, Math.min(x, CONFIG.MAP_WIDTH - CONFIG.CHARACTER_SIZE - CONFIG.EDGE_PADDING));
        y = Math.max(CONFIG.EDGE_PADDING, Math.min(y, CONFIG.MAP_HEIGHT - CONFIG.CHARACTER_SIZE - CONFIG.EDGE_PADDING));
        return { x, y };
      });
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // 鼠标右键目标
  useEffect(() => {
    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      setTarget({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("contextmenu", handleRightClick);
    return () => window.removeEventListener("contextmenu", handleRightClick);
  }, []);

  // 鼠标右键平滑移动
  useEffect(() => {
    if (!target) return;
    const interval = setInterval(() => {
      setPos(prev => {
        const targetMapX = prev.x + (target.x - screenSize.width/2);
        const targetMapY = prev.y + (target.y - screenSize.height/2);
        const dx = targetMapX - prev.x;
        const dy = targetMapY - prev.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 1){
          setTarget(null);
          clearInterval(interval);
          return prev;
        }

        let x = prev.x + (dx/dist) * CONFIG.MOVE_SPEED_MOUSE;
        let y = prev.y + (dy/dist) * CONFIG.MOVE_SPEED_MOUSE;

        // 限制在地图范围
        x = Math.max(CONFIG.EDGE_PADDING, Math.min(x, CONFIG.MAP_WIDTH - CONFIG.CHARACTER_SIZE - CONFIG.EDGE_PADDING));
        y = Math.max(CONFIG.EDGE_PADDING, Math.min(y, CONFIG.MAP_HEIGHT - CONFIG.CHARACTER_SIZE - CONFIG.EDGE_PADDING));

        return { x, y };
      });
    }, 16);
    return () => clearInterval(interval);
  }, [target, screenSize]);

  // 计算显示位置和背景偏移
  const computeDisplay = () => {
    let displayX: number;
    let displayY: number;

    // X方向
    if(CONFIG.MAP_WIDTH <= screenSize.width){
      displayX = pos.x;
    } else if(pos.x < screenSize.width/2){
      displayX = pos.x;
    } else if(pos.x > CONFIG.MAP_WIDTH - screenSize.width/2){
      displayX = pos.x - (CONFIG.MAP_WIDTH - screenSize.width);
    } else {
      displayX = screenSize.width / 2;
    }

    // Y方向
    if(CONFIG.MAP_HEIGHT <= screenSize.height){
      displayY = pos.y;
    } else if(pos.y < screenSize.height/2){
      displayY = pos.y;
    } else if(pos.y > CONFIG.MAP_HEIGHT - screenSize.height/2){
      displayY = pos.y - (CONFIG.MAP_HEIGHT - screenSize.height);
    } else {
      displayY = screenSize.height / 2;
    }

    // 背景偏移
    const offsetX = screenSize.width/2 - displayX;
    const offsetY = screenSize.height/2 - displayY;

    return { displayX, displayY, offsetX, offsetY };
  };

  const { displayX, displayY, offsetX, offsetY } = computeDisplay();

  return (
    <div
      className="relative overflow-hidden bg-gray-300 w-screen h-screen"
    >
      {/* 背景网格 */}
      <div
        className="absolute transition-transform duration-50"
        style={{
          width: CONFIG.MAP_WIDTH,
          height: CONFIG.MAP_HEIGHT,
          backgroundSize: "50px 50px",
          backgroundImage: "linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)",
          transform: `translate(${offsetX}px, ${offsetY}px)`
        }}
      >
        {/* 四角标记 */}
        <div className="absolute w-10 h-10 bg-blue-500" style={{ left: 0, top: 0 }} />
        <div className="absolute w-10 h-10 bg-yellow-500" style={{ right: 0, top: 0 }} />
        <div className="absolute w-10 h-10 bg-purple-500" style={{ left: 0, bottom: 0 }} />
        <div className="absolute w-10 h-10 bg-pink-500" style={{ right: 0, bottom: 0 }} />

        {/* 小人 */}
        <div
          className="bg-red-600 rounded-full absolute transition-all duration-50"
          style={{
            width: CONFIG.CHARACTER_SIZE,
            height: CONFIG.CHARACTER_SIZE,
            left: displayX,
            top: displayY,
          }}
        />
      </div>
    </div>
  );
}
