import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GameState {
  isRunning: boolean;
  score: number;
  capybaraY: number;
  capybaraVelocity: number;
  obstacles: Array<{ x: number; width: number; height: number }>;
  gameOver: boolean;
  showSecretCode: boolean;
}

const GRAVITY = 0.8;
const JUMP_STRENGTH = -15;
const GROUND_HEIGHT = 150;
const CAPYBARA_WIDTH = 60;
const CAPYBARA_HEIGHT = 45;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_HEIGHT = 60;
const GAME_SPEED = 4;
const SCORE_MULTIPLIER = 100;

export default function CapybaraGame() {
  const [gameState, setGameState] = useState<GameState>({
    isRunning: false,
    score: 0,
    capybaraY: 0,
    capybaraVelocity: 0,
    obstacles: [],
    gameOver: false,
    showSecretCode: false,
  });

  const jump = useCallback(() => {
    if (!gameState.isRunning || gameState.gameOver) return;

    setGameState((prev) => {
      // Можно прыгать только с земли
      if (prev.capybaraY > 0.1) return prev;

      console.log(
        "Jump! Current Y:",
        prev.capybaraY,
        "New velocity:",
        JUMP_STRENGTH,
      );
      return {
        ...prev,
        capybaraVelocity: JUMP_STRENGTH,
      };
    });
  }, [gameState.isRunning, gameState.gameOver]);

  const startGame = () => {
    setGameState({
      isRunning: true,
      score: 0,
      capybaraY: 0,
      capybaraVelocity: 0,
      obstacles: [],
      gameOver: false,
      showSecretCode: false,
    });
  };

  const resetGame = () => {
    setGameState({
      isRunning: false,
      score: 0,
      capybaraY: 0,
      capybaraVelocity: 0,
      obstacles: [],
      gameOver: false,
      showSecretCode: false,
    });
  };

  useEffect(() => {
    if (!gameState.isRunning || gameState.gameOver) return;

    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        let newCapybaraY = prev.capybaraY + prev.capybaraVelocity;
        let newVelocity = prev.capybaraVelocity + GRAVITY;

        // Проверяем касание земли
        if (newCapybaraY <= 0) {
          newCapybaraY = 0;
          newVelocity = 0;
        }

        console.log("Game loop:", {
          capybaraY: newCapybaraY,
          velocity: newVelocity,
        });

        // Move obstacles
        const newObstacles = prev.obstacles
          .map((obs) => ({ ...obs, x: obs.x - GAME_SPEED }))
          .filter((obs) => obs.x > -OBSTACLE_WIDTH);

        // Add new obstacles
        if (
          newObstacles.length === 0 ||
          newObstacles[newObstacles.length - 1].x < 400
        ) {
          newObstacles.push({
            x: 800,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
          });
        }

        // Check collision
        const collision = newObstacles.some((obs) => {
          const capybaraLeft = 100;
          const capybaraRight = capybaraLeft + CAPYBARA_WIDTH;
          const capybaraBottom = newCapybaraY + CAPYBARA_HEIGHT;
          const capybaraTop = newCapybaraY;

          const obsLeft = obs.x;
          const obsRight = obs.x + obs.width;
          const obsTop = 0;
          const obsBottom = obs.height;

          return (
            capybaraRight > obsLeft &&
            capybaraLeft < obsRight &&
            capybaraBottom > obsTop &&
            capybaraTop < obsBottom
          );
        });

        if (collision) {
          return { ...prev, gameOver: true };
        }

        // Update score (slower)
        const newScore = Math.floor(prev.score + 0.1);
        const shouldShowCode = newScore >= 100 && !prev.showSecretCode;

        return {
          ...prev,
          capybaraY: newCapybaraY,
          capybaraVelocity: newVelocity,
          obstacles: newObstacles,
          score: newScore,
          showSecretCode: shouldShowCode || prev.showSecretCode,
        };
      });
    }, 20);

    return () => clearInterval(gameLoop);
  }, [gameState.isRunning, gameState.gameOver]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        jump();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [jump]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-4xl p-6 bg-white shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🚀 Космическая Копибара
          </h1>
          <p className="text-gray-600">Нажми пробел или кнопку для прыжка!</p>
        </div>

        <div className="relative w-full h-80 bg-gray-50 border-2 border-gray-200 rounded-lg overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-green-100"></div>

          {/* Ground */}
          <div
            className="absolute bottom-0 w-full bg-green-300 border-t-2 border-green-400"
            style={{ height: `${GROUND_HEIGHT}px` }}
          ></div>

          {/* Capybara */}
          <div
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: "100px",
              bottom: `${GROUND_HEIGHT + Math.max(0, gameState.capybaraY)}px`,
              width: `${CAPYBARA_WIDTH}px`,
              height: `${CAPYBARA_HEIGHT}px`,
            }}
          >
            <img
              src="https://cdn.poehali.dev/files/1595180a-dab8-42af-868e-71f7f6124efd.png"
              alt="Capybara"
              className="w-full h-full object-contain"
              style={{
                filter:
                  gameState.capybaraVelocity < 0
                    ? "brightness(1.2)"
                    : "brightness(1)",
                transform: "scaleX(-1)",
              }}
            />
          </div>

          {/* Obstacles */}
          {gameState.obstacles.map((obstacle, index) => (
            <div
              key={index}
              className="absolute bg-green-600 rounded-t-lg"
              style={{
                left: `${obstacle.x}px`,
                bottom: `${GROUND_HEIGHT}px`,
                width: `${obstacle.width}px`,
                height: `${obstacle.height}px`,
              }}
            >
              <div className="w-full h-4 bg-green-700 rounded-t-lg"></div>
            </div>
          ))}

          {/* Game Over Screen */}
          {gameState.gameOver && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-lg text-center">
                <h2 className="text-2xl font-bold mb-4">Игра окончена!</h2>
                <p className="text-lg mb-4">Счет: {gameState.score}</p>
                {gameState.showSecretCode && (
                  <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
                    <p className="text-sm text-yellow-800 mb-2">
                      🎉 Секретный код:
                    </p>
                    <p className="text-xl font-bold text-yellow-900">
                      КосмическаяКопибара
                    </p>
                  </div>
                )}
                <Button onClick={resetGame} className="mr-2">
                  Начать заново
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center mt-6 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              Счет: {gameState.score}
            </p>
            {gameState.showSecretCode && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 rounded">
                <p className="text-sm text-yellow-800">
                  🎉 Код: КосмическаяКопибара
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!gameState.isRunning && !gameState.gameOver && (
              <Button onClick={startGame} size="lg">
                Начать игру
              </Button>
            )}
            {gameState.isRunning && !gameState.gameOver && (
              <Button onClick={jump} size="lg">
                Прыгнуть
              </Button>
            )}
          </div>
        </div>

        <div className="text-center mt-4 text-gray-600">
          <p>Управление: Пробел или кнопка "Прыгнуть"</p>
          <p>Цель: Набери 100 очков для получения секретного кода!</p>
        </div>
      </Card>
    </div>
  );
}
