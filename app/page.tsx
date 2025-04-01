"use client";

import React from "react";
import { useState, useEffect } from "react";
import {
  Fish,
  Cat,
  Dog,
  Squirrel,
  Turtle,
  Bird,
  Rabbit,
  Snail,
  Rat,
  Bug,
  HelpCircle,
  Home,
  Play,
  Award,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { Toaster } from "sonner";

type MemoryCard = {
  id: number;
  icon: LucideIcon;
  isMatched: boolean;
  color: string;
  name: string;
};

type Difficulty = "easy" | "medium" | "hard";

type GameState = "start" | "playing" | "complete";

const themeColors = {
  primary: "#00ffff",
  secondary: "#ff71ce",
  accent1: "#01fbac",
  accent2: "#b967ff",
  accent3: "#ff3864",
  accent4: "#ffcc00",
  accent5: "#00c3ff",
  accent6: "#ff9c41",
  accent7: "#7cff01",
  accent8: "#ff00ff",
  accent9: "#00ff9d",
  accent10: "#ff5500",
  background: "#111827",
  cardBack: "#1a1a2e",
  cardBackDark: "#16213e",
  cardBorder: "#252525",
  textLight: "#f3f4f6",
  textDim: "#9ca3af",
};

const difficultyColors = {
  easy: themeColors.accent1,
  medium: themeColors.primary,
  hard: themeColors.accent3,
};

const animals = [
  { icon: Fish, color: themeColors.primary, name: "Fish" },
  { icon: Cat, color: themeColors.secondary, name: "Cat" },
  { icon: Dog, color: themeColors.accent1, name: "Dog" },
  { icon: Squirrel, color: themeColors.accent4, name: "Squirrel" },
  { icon: Turtle, color: themeColors.accent3, name: "Turtle" },
  { icon: Bird, color: themeColors.accent5, name: "Bird" },
  { icon: Rabbit, color: themeColors.accent2, name: "Rabbit" },
  { icon: Snail, color: themeColors.accent6, name: "Snail" },
  { icon: Rat, color: themeColors.accent7, name: "Rat" },
  { icon: Bug, color: themeColors.accent8, name: "Bug" },
];

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

const createCards = (difficulty: Difficulty) => {
  let pairsCount: number;

  switch (difficulty) {
    case "easy":
      pairsCount = 3;
      break;
    case "medium":
      pairsCount = 8;
      break;
    case "hard":
      pairsCount = 10;
      break;
    default:
      pairsCount = 8;
  }

  const selectedAnimals = animals.slice(0, pairsCount);

  const cards: MemoryCard[] = [];
  selectedAnimals.forEach(({ icon, color, name }, index) => {
    cards.push(
      { id: index * 2, icon, color, name, isMatched: false },
      { id: index * 2 + 1, icon, color, name, isMatched: false }
    );
  });

  return shuffleArray(cards);
};

const getIconSize = (difficulty: Difficulty) => {
  switch (difficulty) {
    case "easy":
      return 56;
    case "medium":
      return 44;
    case "hard":
      return 36;
    default:
      return 44;
  }
};

const isNewBestScore = (
  currentMoves: number,
  currentTime: number,
  bestMoves: number | null,
  bestTime: number | null
): boolean => {
  if (bestMoves === null || bestTime === null) return true;

  if (currentMoves < bestMoves) return true;

  if (currentMoves === bestMoves && currentTime < bestTime) return true;

  return false;
};

export default function NxMemoryGame() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [moves, setMoves] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [bestScores, setBestScores] = useState<
    Record<Difficulty, { moves: number | null; time: number | null }>
  >({
    easy: { moves: null, time: null },
    medium: { moves: null, time: null },
    hard: { moves: null, time: null },
  });
  const [mounted, setMounted] = useState(false);
  const [showBestScores, setShowBestScores] = useState(false);
  const [showDifficultySelection, setShowDifficultySelection] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);

  useEffect(() => {
    setMounted(true);

    setTimeout(() => {
      setAnimationReady(true);
    }, 100);

    const savedScores = localStorage.getItem("nmMemoryBestScores");
    if (savedScores) {
      try {
        setBestScores(JSON.parse(savedScores));
      } catch (e) {
        console.error("Failed to parse saved scores");
      }
    }
  }, []);

  useEffect(() => {
    if (gameState === "playing") {
      setCards(createCards(difficulty));
    }
  }, [difficulty, gameState]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (timerActive && gameState === "playing") {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, gameState]);

  const getTotalPairs = () => {
    return cards.length / 2;
  };

  const changeDifficulty = (newDifficulty: Difficulty) => {
    if (difficulty !== newDifficulty) {
      setDifficulty(newDifficulty);
      if (gameState === "playing") {
        resetGame(newDifficulty);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const totalPairs = getTotalPairs();
    if (matches === totalPairs && matches > 0) {
      setGameComplete(true);
      setGameState("complete");
      setTimerActive(false);

      const currentScore = { moves, time: timer };
      const currentBest = bestScores[difficulty];

      const newRecord = isNewBestScore(
        moves,
        timer,
        currentBest.moves,
        currentBest.time
      );
      setIsNewRecord(newRecord);

      if (newRecord) {
        const newBestScores = {
          ...bestScores,
          [difficulty]: currentScore,
        };
        setBestScores(newBestScores);
        localStorage.setItem(
          "nmMemoryBestScores",
          JSON.stringify(newBestScores)
        );
      }
    }
  }, [matches, bestScores, difficulty, moves, timer]);

  const startGame = () => {
    resetGame();
    setGameState("playing");
    setTimerActive(true);
  };

  const startGameWithDifficulty = () => {
    setShowDifficultySelection(false);
    resetGame();
    setGameState("playing");
    setTimerActive(true);
  };

  const handleCardClick = (clickedIndex: number) => {
    if (gameState !== "playing") return;

    if (isChecking || cards[clickedIndex].isMatched) return;
    if (flippedIndexes.includes(clickedIndex)) return;
    if (flippedIndexes.length === 2) return;

    const newFlipped = [...flippedIndexes, clickedIndex];
    setFlippedIndexes(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves((moves) => moves + 1);

      const [firstIndex, secondIndex] = newFlipped;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.name === secondCard.name) {
        setTimeout(() => {
          setCards(
            cards.map((card, index) =>
              index === firstIndex || index === secondIndex
                ? { ...card, isMatched: true }
                : card
            )
          );
          setFlippedIndexes([]);
          setMatches((m) => m + 1);
          setIsChecking(false);
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedIndexes([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const resetGame = (newDifficulty: Difficulty = difficulty) => {
    setCards(createCards(newDifficulty));
    setFlippedIndexes([]);
    setMatches(0);
    setMoves(0);
    setIsChecking(false);
    setGameComplete(false);
    setTimer(0);
    setIsNewRecord(false);
  };

  const getGridClasses = () => {
    switch (difficulty) {
      case "easy":
        return "grid-cols-3 grid-rows-2";
      case "medium":
        return "grid-cols-4 grid-rows-4";
      case "hard":
        return "grid-cols-4 grid-rows-5";
      default:
        return "grid-cols-4 grid-rows-4";
    }
  };

  if (!mounted) {
    return null;
  }

  const gameFrameStyles = {
    width: "60%",
    minWidth: "800px",
    minHeight: "90vh",
    margin: "0 auto",
  };

  if (gameState === "start") {
    return (
      <>
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap");
          @import url("https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap");

          body {
            font-family: "Rajdhani", "Orbitron", sans-serif;
            background-color: ${themeColors.background};
            color: ${themeColors.textLight};
            overflow-x: hidden;
          }

          .nm-glow {
            filter: drop-shadow(0 0 8px var(--color))
              drop-shadow(0 0 16px var(--color));
          }

          .nm-button {
            position: relative;
            transition: all 0.3s ease;
            background: rgba(17, 24, 39, 0.4);
            cursor: pointer;
            padding: 0.75rem 2rem;
            border-radius: 0.5rem;
            border: 2px solid var(--border-color, ${themeColors.primary});
            box-shadow:
              0 0 10px var(--border-color, ${themeColors.primary}),
              0 0 20px rgba(0, 255, 255, 0.5);
            letter-spacing: 1px;
          }

          .nm-button:hover {
            border-color: var(--border-color, ${themeColors.secondary});
            box-shadow:
              0 0 15px var(--border-color, ${themeColors.secondary}),
              0 0 30px rgba(255, 113, 206, 0.5);
            transform: translateY(-3px);
            background: rgba(17, 24, 39, 0.6);
          }

          .nm-button:active {
            transform: translateY(-1px);
            box-shadow:
              0 0 8px var(--border-color, ${themeColors.secondary}),
              0 0 15px rgba(255, 113, 206, 0.5);
            transition: all 0.1s ease;
          }

          .nm-button:focus-visible {
            outline: 2px solid ${themeColors.primary};
            outline-offset: 4px;
          }

          .nm-text {
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .nm-button:hover .nm-text {
            color: var(--border-color, ${themeColors.secondary});
            text-shadow: 0 0 10px var(--border-color, ${themeColors.secondary});
          }

          .difficulty-container {
            background: rgba(17, 17, 27, 0.7);
            border-radius: 0.5rem;
            padding: 0.25rem;
            border: 1px solid ${themeColors.cardBorder};
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(4px);
          }

          .difficulty-btn {
            background: rgba(26, 26, 46, 0.5);
            border: 2px solid transparent;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            padding: 0.5rem 0;
            border-radius: 0.375rem;
            margin: 0 0.125rem;
            font-weight: 600;
            letter-spacing: 0.5px;
          }

          .difficulty-btn.active {
            background: rgba(26, 26, 46, 0.8);
            border: 2px solid var(--btn-color);
            box-shadow: 0 0 10px var(--btn-color);
          }

          .difficulty-btn:hover:not(.active) {
            border-color: var(--btn-color);
            box-shadow: 0 0 10px var(--btn-color-dim);
            background: rgba(26, 26, 46, 0.7);
          }

          .difficulty-btn:focus-visible {
            outline: 2px solid var(--btn-color);
            outline-offset: 2px;
          }

          .difficulty-btn.active::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--btn-color);
            box-shadow: 0 0 10px var(--btn-color);
          }

          .nm-title {
            position: relative;
            display: inline-block;
          }

          .nm-title-text {
            position: relative;
            z-index: 2;
            background: linear-gradient(
              to right,
              ${themeColors.secondary},
              ${themeColors.accent1},
              ${themeColors.primary},
              ${themeColors.accent2}
            );
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            font-weight: bold;
            letter-spacing: 2px;
            font-family: "Orbitron", sans-serif;
            font-size: 4.5rem;
            text-transform: uppercase;
          }

          .nm-title::before {
            content: "NX Memory";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            color: transparent;
            -webkit-text-stroke: 4px rgba(255, 113, 206, 0.1);
            filter: blur(8px);
            animation: nmPulse 2s infinite alternate;
          }

          @keyframes nmPulse {
            0% {
              filter: blur(8px);
              opacity: 0.5;
            }
            100% {
              filter: blur(12px);
              opacity: 0.8;
            }
          }

          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 50;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
          }

          .modal-content {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid ${themeColors.primary};
            box-shadow: 0 0 20px ${themeColors.primary};
            border-radius: 1rem;
            padding: 2rem;
            max-width: 90%;
            width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            animation: scaleIn 0.3s ease;
          }

          .menu-icon {
            transition: all 0.3s ease;
          }

          .menu-icon:hover {
            filter: drop-shadow(0 0 5px ${themeColors.primary});
            transform: scale(1.1);
          }

          .game-frame {
            background: linear-gradient(
              135deg,
              rgba(17, 24, 39, 0.7) 0%,
              rgba(12, 17, 29, 0.8) 100%
            );
            border: 2px solid rgba(31, 41, 55, 0.8);
            box-shadow:
              0 0 30px rgba(0, 0, 0, 0.5),
              inset 0 0 40px rgba(0, 0, 0, 0.3);
            border-radius: 1rem;
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.8s ease forwards;
            backdrop-filter: blur(12px);
          }

          .new-best-score {
            background-color: rgba(255, 215, 0, 0.2);
            border: 2px solid #ffcc00;
            border-radius: 8px;
            padding: 10px;
            margin-top: 16px;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
            animation: glow 1.5s infinite alternate;
          }

          .game-description {
            font-family: "Rajdhani", sans-serif;
            font-size: 1.25rem;
            line-height: 1.5;
            max-width: 600px;
            margin: 0 auto;
            padding: 0.75rem 1.5rem;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 1rem;
            border-left: 3px solid ${themeColors.primary};
            border-right: 3px solid ${themeColors.accent2};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(4px);
            position: relative;
            overflow: hidden;
          }

          .game-description::before {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(
              to right,
              transparent,
              rgba(255, 255, 255, 0.05),
              transparent
            );
            transform: skewX(-25deg);
            animation: shine 3s infinite;
          }

          @keyframes shine {
            0% {
              left: -100%;
            }
            20% {
              left: 100%;
            }
            100% {
              left: 100%;
            }
          }

          .menu-button {
            position: relative;
            z-index: 2;
            overflow: hidden;
            transition: all 0.4s ease;
          }

          .menu-button::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 0%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            z-index: -1;
            transform: skewX(-15deg);
            transition: all 0.4s ease;
          }

          .menu-button:hover::before {
            width: 120%;
          }

          .menu-button-icon {
            transition: all 0.3s ease;
          }

          .menu-button:hover .menu-button-icon {
            transform: translateX(4px);
          }

          @keyframes glow {
            from {
              box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
            }
            to {
              box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(-50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes fadeInRight {
            from {
              opacity: 0;
              transform: translateX(50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .slide-in-left {
            opacity: 0;
            transform: translateX(-50px);
            animation: fadeInLeft 0.5s ease forwards;
          }

          .slide-in-right {
            opacity: 0;
            transform: translateX(50px);
            animation: fadeInRight 0.5s ease forwards;
          }

          .fade-in {
            opacity: 0;
            animation: fadeIn 0.5s ease forwards;
          }

          .delay-1 {
            animation-delay: 0.1s;
          }

          .delay-2 {
            animation-delay: 0.2s;
          }

          .delay-3 {
            animation-delay: 0.3s;
          }

          .delay-4 {
            animation-delay: 0.4s;
          }

          .delay-5 {
            animation-delay: 0.5s;
          }
        `}</style>

        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Toaster position="top-center" />

          <div className="game-frame" style={gameFrameStyles}>
            <div className="text-center space-y-8 w-full">
              <h1
                className={`nm-title mb-6 ${animationReady ? "fade-in" : ""}`}
                aria-label="NX Memory"
              >
                <span className="nm-title-text">NX Memory</span>
              </h1>

              <div
                className={`mb-12 ${animationReady ? "fade-in delay-1" : ""}`}
              >
                <p className="game-description text-cyan-100 mb-6 relative">
                  Match pairs of identical animals in this high-tech memory
                  challenge!
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-transparent to-purple-400"></span>
                </p>
              </div>

              <div className="flex flex-col gap-5 justify-center max-w-sm mx-auto">
                <button
                  onClick={startGame}
                  className={`nm-button menu-button flex items-center justify-center gap-3 w-full ${animationReady ? "slide-in-left delay-2" : ""}`}
                  style={
                    {
                      "--border-color": themeColors.primary,
                    } as React.CSSProperties
                  }
                  aria-label="Start game"
                >
                  <Play
                    size={22}
                    color={themeColors.primary}
                    className="menu-button-icon"
                  />
                  <span className="nm-text font-medium tracking-wide text-lg">
                    PLAY GAME
                  </span>
                </button>

                <button
                  onClick={() => setShowHowToPlay(true)}
                  className={`nm-button menu-button flex items-center justify-center gap-3 w-full ${animationReady ? "slide-in-right delay-3" : ""}`}
                  style={
                    {
                      "--border-color": themeColors.accent1,
                      boxShadow: `0 0 10px ${themeColors.accent1}, 0 0 20px rgba(1, 251, 172, 0.5)`,
                    } as React.CSSProperties
                  }
                  aria-label="How to play"
                >
                  <HelpCircle
                    size={22}
                    color={themeColors.accent1}
                    className="menu-button-icon"
                  />
                  <span className="nm-text font-medium tracking-wide text-lg">
                    HOW TO PLAY
                  </span>
                </button>

                <button
                  onClick={() => setShowBestScores(true)}
                  className={`nm-button menu-button flex items-center justify-center gap-3 w-full ${animationReady ? "slide-in-left delay-4" : ""}`}
                  style={
                    {
                      "--border-color": themeColors.accent2,
                      boxShadow: `0 0 10px ${themeColors.accent2}, 0 0 20px rgba(185, 103, 255, 0.5)`,
                    } as React.CSSProperties
                  }
                  aria-label="View best scores"
                >
                  <Award
                    size={22}
                    color={themeColors.accent2}
                    className="menu-button-icon"
                  />
                  <span className="nm-text font-medium tracking-wide text-lg">
                    BEST SCORES
                  </span>
                </button>
              </div>

              <div
                className={`mt-12 opacity-60 text-sm ${animationReady ? "fade-in delay-5" : ""}`}
              >
                <p className="text-gray-400">
                  Use mouse or keyboard to play • Press TAB to navigate
                </p>
              </div>
            </div>
          </div>
        </div>

        {showHowToPlay && (
          <div
            className="modal-backdrop"
            onClick={() => setShowHowToPlay(false)}
          >
            <div
              className="modal-content bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-2 border-cyan-400/50 rounded-2xl shadow-2xl max-w-md w-full p-6 backdrop-blur-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-100">
                  How To Play
                </h2>
                <button
                  className="h-8 w-8 rounded-full bg-gray-700/50 flex items-center justify-center transition-all hover:bg-cyan-500/30 border border-gray-600 hover:border-cyan-400"
                  onClick={() => setShowHowToPlay(false)}
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 transition-transform hover:translate-x-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center text-cyan-300 font-bold">
                    1
                  </div>
                  <p className="text-gray-200">
                    Click on any card to flip it and reveal the animal icon.
                  </p>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 transition-transform hover:translate-x-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-300 font-bold">
                    2
                  </div>
                  <p className="text-gray-200">
                    Try to find the matching pair by flipping another card.
                  </p>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 transition-transform hover:translate-x-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center text-pink-300 font-bold">
                    3
                  </div>
                  <p className="text-gray-200">
                    If the cards match, they stay face up. If not, they flip
                    back.
                  </p>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20 transition-transform hover:translate-x-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-300 font-bold">
                    4
                  </div>
                  <p className="text-gray-200">
                    Complete the game by finding all matching pairs.
                  </p>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 transition-transform hover:translate-x-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-300 font-bold">
                    5
                  </div>
                  <p className="text-gray-200">
                    Try to finish with as few moves as possible!
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium transform transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95"
                  onClick={() => setShowHowToPlay(false)}
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}

        {showBestScores && (
          <div
            className="modal-backdrop"
            onClick={() => setShowBestScores(false)}
          >
            <div
              className="modal-content bg-gradient-to-br from-gray-900/95 to-gray-800/95 border-2 border-cyan-400/50 rounded-2xl shadow-2xl max-w-md w-full p-6 backdrop-blur-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-100">
                  Best Scores
                </h2>
                <button
                  className="h-8 w-8 rounded-full bg-gray-700/50 flex items-center justify-center transition-all hover:bg-cyan-500/30 border border-gray-600 hover:border-cyan-400"
                  onClick={() => setShowBestScores(false)}
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                {/* Easy difficulty */}
                <div className="mb-4 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500/20 to-green-400/10 px-4 py-2 border-l-4 border-green-400">
                    <h3 className="text-green-300 font-bold text-lg">Easy</h3>
                  </div>
                  <div className="bg-gray-800/40 p-4 flex justify-between items-center">
                    {bestScores.easy.moves !== null ? (
                      <>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-green-300"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-white">
                              {bestScores.easy.moves} moves
                            </div>
                            <div className="text-green-300">
                              {bestScores[difficulty].time !== null
                                ? formatTime(bestScores[difficulty].time)
                                : "00:00"}
                            </div>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-400/30 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-green-300"
                          >
                            <circle cx="12" cy="8" r="7"></circle>
                            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center w-full justify-center py-2">
                        <div className="text-gray-400 italic">
                          No record yet
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medium difficulty */}
                <div className="mb-4 rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500/20 to-cyan-400/10 px-4 py-2 border-l-4 border-cyan-400">
                    <h3 className="text-cyan-300 font-bold text-lg">Medium</h3>
                  </div>
                  <div className="bg-gray-800/40 p-4 flex justify-between items-center">
                    {bestScores.medium.moves !== null ? (
                      <>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-cyan-300"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-white">
                              {bestScores.medium.moves} moves
                            </div>
                            <div className="text-cyan-300">
                              {bestScores[difficulty].time !== null
                                ? formatTime(bestScores[difficulty].time)
                                : "00:00"}
                            </div>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-cyan-300"
                          >
                            <circle cx="12" cy="8" r="7"></circle>
                            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center w-full justify-center py-2">
                        <div className="text-gray-400 italic">
                          No record yet
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hard difficulty */}
                <div className="rounded-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-pink-500/20 to-pink-400/10 px-4 py-2 border-l-4 border-pink-400">
                    <h3 className="text-pink-300 font-bold text-lg">Hard</h3>
                  </div>
                  <div className="bg-gray-800/40 p-4 flex justify-between items-center">
                    {bestScores.hard.moves !== null ? (
                      <>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-pink-300"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-white">
                              {bestScores.hard.moves} moves
                            </div>
                            <div className="text-pink-300">
                              {bestScores[difficulty].time !== null
                                ? formatTime(bestScores[difficulty].time)
                                : "00:00"}
                            </div>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-400/30 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-pink-300"
                          >
                            <circle cx="12" cy="8" r="7"></circle>
                            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center w-full justify-center py-2">
                        <div className="text-gray-400 italic">
                          No record yet
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium transform transition-all hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/30 active:scale-95"
                  onClick={() => setShowBestScores(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showDifficultySelection && (
          <div
            className="modal-backdrop"
            onClick={() => setShowDifficultySelection(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl text-cyan-300 mb-4">Select Difficulty</h2>
              <div className="space-y-6 text-gray-200">
                <div
                  className="w-full max-w-md difficulty-container mb-6"
                  role="group"
                  aria-label="Difficulty selection"
                >
                  <div className="flex flex-col gap-3">
                    <button
                      className={`difficulty-btn py-3 ${difficulty === "easy" ? "active" : ""}`}
                      style={
                        {
                          "--btn-color": difficultyColors.easy,
                          "--btn-color-dim": "rgba(1, 251, 172, 0.5)",
                        } as React.CSSProperties
                      }
                      onClick={() => changeDifficulty("easy")}
                      aria-pressed={difficulty === "easy"}
                      aria-label="Easy difficulty"
                    >
                      <span className="text-white font-medium">
                        Easy (6 cards)
                      </span>
                    </button>
                    <button
                      className={`difficulty-btn py-3 ${difficulty === "medium" ? "active" : ""}`}
                      style={
                        {
                          "--btn-color": difficultyColors.medium,
                          "--btn-color-dim": "rgba(0, 255, 255, 0.5)",
                        } as React.CSSProperties
                      }
                      onClick={() => changeDifficulty("medium")}
                      aria-pressed={difficulty === "medium"}
                      aria-label="Medium difficulty"
                    >
                      <span className="text-white font-medium">
                        Medium (16 cards)
                      </span>
                    </button>
                    <button
                      className={`difficulty-btn py-3 ${difficulty === "hard" ? "active" : ""}`}
                      style={
                        {
                          "--btn-color": difficultyColors.hard,
                          "--btn-color-dim": "rgba(255, 56, 100, 0.5)",
                        } as React.CSSProperties
                      }
                      onClick={() => changeDifficulty("hard")}
                      aria-pressed={difficulty === "hard"}
                      aria-label="Hard difficulty"
                    >
                      <span className="text-white font-medium">
                        Hard (20 cards)
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-center mt-4">
                  <button
                    className="nm-button"
                    onClick={startGameWithDifficulty}
                  >
                    <span className="nm-text font-medium tracking-wide text-lg">
                      START GAME
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (gameState === "complete") {
    return (
      <>
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap");
          @import url("https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap");

          body {
            font-family: "Rajdhani", "Orbitron", sans-serif;
            background-color: ${themeColors.background};
            color: ${themeColors.textLight};
            overflow-x: hidden;
          }

          .nm-glow {
            filter: drop-shadow(0 0 8px var(--color))
              drop-shadow(0 0 16px var(--color));
          }

          .nm-button {
            position: relative;
            transition: all 0.3s ease;
            background: rgba(17, 24, 39, 0.4);
            cursor: pointer;
            padding: 0.75rem 2rem;
            border-radius: 0.5rem;
            border: 2px solid var(--border-color, ${themeColors.primary});
            box-shadow:
              0 0 10px var(--border-color, ${themeColors.primary}),
              0 0 20px rgba(0, 255, 255, 0.5);
            letter-spacing: 1px;
          }

          .nm-button:hover {
            border-color: var(--border-color, ${themeColors.secondary});
            box-shadow:
              0 0 15px var(--border-color, ${themeColors.secondary}),
              0 0 30px rgba(255, 113, 206, 0.5);
            transform: translateY(-3px);
            background: rgba(17, 24, 39, 0.6);
          }

          .nm-button:active {
            transform: translateY(-1px);
            box-shadow:
              0 0 8px var(--border-color, ${themeColors.secondary}),
              0 0 15px rgba(255, 113, 206, 0.5);
            transition: all 0.1s ease;
          }

          .nm-text {
            color: white;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .nm-button:hover .nm-text {
            color: var(--border-color, ${themeColors.secondary});
            text-shadow: 0 0 10px var(--border-color, ${themeColors.secondary});
          }

          .confetti {
            position: fixed;
            width: 10px;
            height: 10px;
            background-color: var(--color);
            border-radius: 50%;
            animation: confetti-fall 4s linear forwards;
            box-shadow: 0 0 5px var(--color);
            z-index: 5;
            top: 0;
          }

          @keyframes confetti-fall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }

          .trophy-glow {
            animation: trophy-pulse 2s infinite alternate;
            filter: drop-shadow(0 0 15px gold);
          }

          @keyframes trophy-pulse {
            0% {
              filter: drop-shadow(0 0 15px gold)
                drop-shadow(0 0 25px rgba(255, 215, 0, 0.5));
              transform: scale(1);
            }
            100% {
              filter: drop-shadow(0 0 25px gold)
                drop-shadow(0 0 45px rgba(255, 215, 0, 0.7));
              transform: scale(1.05);
            }
          }

          .game-frame {
            background: linear-gradient(
              135deg,
              rgba(17, 24, 39, 0.7) 0%,
              rgba(12, 17, 29, 0.8) 100%
            );
            border: 2px solid rgba(31, 41, 55, 0.8);
            box-shadow:
              0 0 30px rgba(0, 0, 0, 0.5),
              inset 0 0 40px rgba(0, 0, 0, 0.3);
            border-radius: 1rem;
            padding: 2.5rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.8s ease forwards;
            backdrop-filter: blur(12px);
          }

          .stats-container {
            background: linear-gradient(
              135deg,
              rgba(26, 32, 44, 0.8) 0%,
              rgba(17, 24, 39, 0.9) 100%
            );
            border-radius: 1rem;
            padding: 1.5rem;
            box-shadow:
              0 8px 16px rgba(0, 0, 0, 0.3),
              inset 0 1px 3px rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
          }

          .stats-container::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(
              90deg,
              transparent,
              ${themeColors.primary},
              ${themeColors.secondary},
              ${themeColors.accent1},
              transparent
            );
          }

          .stat-label {
            color: #a0aec0;
            font-size: 0.875rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .stat-value {
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: 0.5px;
          }

          .difficulty-value {
            padding: 0.25rem 0.75rem;
            border-radius: 0.375rem;
            font-weight: 600;
            display: inline-block;
            text-transform: uppercase;
            font-size: 0.875rem;
            letter-spacing: 1px;
          }

          .celebration-title {
            font-family: "Orbitron", sans-serif;
            font-weight: 700;
            letter-spacing: 1px;
            background: linear-gradient(
              to right,
              ${themeColors.accent4},
              ${themeColors.accent3},
              ${themeColors.accent5}
            );
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            position: relative;
            display: inline-block;
            padding: 0 10px;
          }

          .celebration-title::before,
          .celebration-title::after {
            content: "🎮";
            position: absolute;
            top: 0;
            opacity: 0.8;
          }

          .celebration-title::before {
            left: -20px;
          }

          .celebration-title::after {
            right: -20px;
          }

          .new-best-score {
            background: linear-gradient(
              135deg,
              rgba(255, 215, 0, 0.1) 0%,
              rgba(255, 177, 0, 0.2) 100%
            );
            border: 2px solid rgba(255, 215, 0, 0.5);
            border-radius: 8px;
            padding: 0.75rem 1rem;
            margin-top: 16px;
            box-shadow: 0 0 18px rgba(255, 215, 0, 0.3);
            animation: glow 1.5s infinite alternate;
            position: relative;
            overflow: hidden;
          }

          .new-best-score::before {
            content: "";
            position: absolute;
            width: 100px;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.3),
              transparent
            );
            left: -100px;
            top: 0;
            animation: shine 3s infinite;
            transform: skewX(-20deg);
          }

          @keyframes shine {
            0% {
              left: -100px;
            }
            20%,
            100% {
              left: 100%;
            }
          }

          @keyframes glow {
            from {
              box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
            }
            to {
              box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
            }
          }

          .action-button {
            position: relative;
            overflow: hidden;
            transition: all 0.4s ease;
          }

          .action-button::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 0%;
            height: 100%;
            background: rgba(255, 255, 255, 0.1);
            z-index: -1;
            transform: skewX(-15deg);
            transition: all 0.4s ease;
          }

          .action-button:hover::before {
            width: 120%;
          }

          .action-button-icon {
            transition: all 0.3s ease;
          }

          .action-button:hover .action-button-icon {
            transform: translateX(3px);
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeInLeft {
            from {
              opacity: 0;
              transform: translateX(-50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes fadeInRight {
            from {
              opacity: 0;
              transform: translateX(50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .slide-in-left {
            opacity: 0;
            transform: translateX(-50px);
            animation: fadeInLeft 0.5s ease forwards;
          }

          .slide-in-right {
            opacity: 0;
            transform: translateX(50px);
            animation: fadeInRight 0.5s ease forwards;
          }

          .fade-in {
            opacity: 0;
            animation: fadeIn 0.5s ease forwards;
          }

          .delay-1 {
            animation-delay: 0.1s;
          }

          .delay-2 {
            animation-delay: 0.2s;
          }

          .delay-3 {
            animation-delay: 0.3s;
          }

          .delay-4 {
            animation-delay: 0.4s;
          }

          .delay-5 {
            animation-delay: 0.5s;
          }

          .nm-title {
            position: relative;
            display: inline-block;
          }

          .nm-title-text {
            position: relative;
            z-index: 2;
            background: linear-gradient(
              to right,
              ${themeColors.secondary},
              ${themeColors.accent1},
              ${themeColors.primary},
              ${themeColors.accent2}
            );
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            font-weight: bold;
            letter-spacing: 2px;
            font-family: "Orbitron", sans-serif;
          }

          .nm-title::before {
            content: "NX Memory";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
            color: transparent;
            -webkit-text-stroke: 4px rgba(255, 113, 206, 0.1);
            filter: blur(8px);
            animation: nmPulse 2s infinite alternate;
          }

          @keyframes nmPulse {
            0% {
              filter: blur(8px);
              opacity: 0.5;
            }
            100% {
              filter: blur(12px);
              opacity: 0.8;
            }
          }
        `}</style>

        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Toaster position="top-center" />

          <div
            className="game-frame relative overflow-hidden"
            style={gameFrameStyles}
          >
            {Array.from({ length: 120 }).map((_, i) => {
              const colors = [
                themeColors.primary,
                themeColors.secondary,
                themeColors.accent1,
                themeColors.accent2,
                themeColors.accent3,
                themeColors.accent4,
              ];
              const color = colors[Math.floor(Math.random() * colors.length)];
              const left = `${Math.random() * 100}%`;
              const size = `${5 + Math.random() * 10}px`;
              const animationDelay = `${Math.random() * 2}s`;
              const animationDuration = `${2 + Math.random() * 3}s`;

              return (
                <div
                  key={i}
                  className="confetti"
                  style={
                    {
                      "--color": color,
                      left,
                      width: size,
                      height: size,
                      animationDelay,
                      animationDuration,
                    } as React.CSSProperties
                  }
                />
              );
            })}

            <div className="text-center space-y-6 z-10 w-full max-w-xl mx-auto">
              <h1
                className="text-5xl nm-title mb-2 fade-in"
                aria-label="NX Memory"
              >
                <span className="nm-title-text">NX Memory</span>
              </h1>

              <div className="flex justify-center mb-2 fade-in delay-1">
                <Award size={90} color="gold" className="trophy-glow" />
              </div>

              <h2 className="text-3xl font-bold celebration-title mb-6 slide-in-left delay-2">
                You Win!
              </h2>

              <div className="stats-container max-w-md mx-auto mb-8 fade-in delay-3">
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-left">
                  <div>
                    <div className="stat-label mb-1">Difficulty</div>
                    <div
                      className="difficulty-value"
                      style={{
                        backgroundColor: `${difficultyColors[difficulty]}25`,
                        color: difficultyColors[difficulty],
                      }}
                    >
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </div>
                  </div>

                  <div>
                    <div className="stat-label mb-1">Moves</div>
                    <div className="stat-value text-cyan-300">{moves}</div>
                  </div>

                  <div>
                    <div className="stat-label mb-1">Time</div>
                    <div className="stat-value text-pink-300">
                      {formatTime(timer)}
                    </div>
                  </div>

                  <div>
                    <div className="stat-label mb-1">Best Score</div>
                    <div className="stat-value text-green-300">
                      {bestScores[difficulty].moves !== null
                        ? `${bestScores[difficulty].moves} moves (${
                            bestScores[difficulty].time !== null
                              ? formatTime(bestScores[difficulty].time)
                              : "00:00"
                          })`
                        : "New record!"}
                    </div>
                  </div>
                </div>

                {bestScores[difficulty].moves === null ||
                moves < bestScores[difficulty].moves ||
                (moves === bestScores[difficulty].moves &&
                  bestScores[difficulty].time !== null &&
                  timer < (bestScores[difficulty].time as number)) ? (
                  <div className="new-best-score mt-6 slide-in-right delay-4">
                    <p className="text-yellow-300 font-bold text-lg flex items-center justify-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="8" r="6"></circle>
                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                      </svg>
                      New Best Score!
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="8" r="6"></circle>
                        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                      </svg>
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row gap-5 justify-center fade-in delay-5">
                <button
                  onClick={() => {
                    resetGame();
                    setGameState("playing");
                    setTimerActive(true);
                  }}
                  className="nm-button action-button flex items-center justify-center gap-3"
                  style={
                    {
                      "--border-color": themeColors.primary,
                    } as React.CSSProperties
                  }
                  aria-label="Play again"
                >
                  <RotateCcw
                    size={22}
                    color={themeColors.primary}
                    className="action-button-icon"
                  />
                  <span className="nm-text font-medium tracking-wide text-lg">
                    PLAY AGAIN
                  </span>
                </button>

                <button
                  onClick={() => setGameState("start")}
                  className="nm-button action-button flex items-center justify-center gap-3"
                  style={
                    {
                      "--border-color": themeColors.accent1,
                      boxShadow: `0 0 10px ${themeColors.accent1}, 0 0 20px rgba(1, 251, 172, 0.5)`,
                    } as React.CSSProperties
                  }
                  aria-label="Return to menu"
                >
                  <Home
                    size={22}
                    color={themeColors.accent1}
                    className="action-button-icon"
                  />
                  <span className="nm-text font-medium tracking-wide text-lg">
                    MAIN MENU
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap");

        body {
          font-family: "Rajdhani", "Orbitron", sans-serif;
          background-color: ${themeColors.background};
          color: ${themeColors.textLight};
          overflow-x: hidden;
        }

        /* Button, card, and clickable elements */
        button,
        .card-container,
        .difficulty-btn,
        .nm-button,
        [role="button"],
        [aria-pressed],
        [onClick],
        .modal-backdrop {
          cursor: pointer;
        }

        /* For disabled buttons */
        button:disabled,
        .nm-button:disabled,
        [role="button"][aria-disabled="true"] {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        .transform-style-3d {
          transform-style: preserve-3d;
        }

        .backface-hidden {
          backface-visibility: hidden;
        }

        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        .nm-glow {
          filter: drop-shadow(0 0 8px var(--color))
            drop-shadow(0 0 16px var(--color));
        }

        .nm-button {
          position: relative;
          transition: all 0.3s ease;
          background: rgba(17, 24, 39, 0.4);
          padding: 0.75rem 2rem;
          border-radius: 0.5rem;
          border: 2px solid var(--border-color, ${themeColors.primary});
          box-shadow:
            0 0 10px var(--border-color, ${themeColors.primary}),
            0 0 20px rgba(0, 255, 255, 0.5);
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .nm-button:hover {
          border-color: var(--border-color, ${themeColors.secondary});
          box-shadow:
            0 0 15px var(--border-color, ${themeColors.secondary}),
            0 0 30px rgba(255, 113, 206, 0.5);
          transform: translateY(-3px);
          background: rgba(17, 24, 39, 0.6);
        }

        .nm-button:active {
          transform: translateY(-1px);
          box-shadow:
            0 0 8px var(--border-color, ${themeColors.secondary}),
            0 0 15px rgba(255, 113, 206, 0.5);
          transition: all 0.1s ease;
        }

        .nm-button:focus-visible {
          outline: 2px solid ${themeColors.primary};
          outline-offset: 4px;
        }

        .nm-text {
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .nm-button:hover .nm-text {
          color: var(--border-color, ${themeColors.secondary});
          text-shadow: 0 0 10px var(--border-color, ${themeColors.secondary});
        }

        .card-back-gradient {
          background: linear-gradient(
            135deg,
            ${themeColors.cardBack} 0%,
            ${themeColors.cardBackDark} 100%
          );
          box-shadow:
            inset 0 0 10px rgba(0, 0, 0, 0.5),
            0 4px 6px rgba(0, 0, 0, 0.2);
          border: 2px solid ${themeColors.cardBorder};
          transition: all 0.3s ease;
        }

        .card-container:hover .card-back-gradient {
          border-color: ${themeColors.primary};
          box-shadow:
            0 0 5px ${themeColors.primary},
            0 0 10px rgba(0, 255, 255, 0.5);
        }

        .card-container:focus-visible {
          outline: 2px solid ${themeColors.primary};
          outline-offset: 4px;
          border-radius: 0.5rem;
        }

        .card-front-gradient {
          background: radial-gradient(
            circle at center,
            ${themeColors.cardBack} 0%,
            #0f0f1a 100%
          );
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .nm-border {
          border: 3px solid var(--color);
          outline: 1px solid rgba(255, 255, 255, 0.3); /* Light outline for additional contrast */
          box-shadow:
            0 0 8px var(--color),
            0 0 15px var(--color);
        }

        .nm-border::after {
          content: "";
          position: absolute;
          inset: -1px;
          border: 1px solid var(--color);
          border-radius: inherit;
          opacity: 0.6;
          pointer-events: none;
        }

        .game-board {
          border: 3px solid transparent;
          border-image: linear-gradient(
              to right,
              ${themeColors.primary},
              ${themeColors.secondary},
              ${themeColors.accent1},
              ${themeColors.accent2}
            )
            1;
          box-shadow:
            0 0 15px rgba(0, 255, 255, 0.5),
            0 0 30px rgba(255, 113, 206, 0.3);
          opacity: 0;
          animation: fadeIn 0.8s ease forwards;
          animation-delay: 0.3s;
          backdrop-filter: blur(8px);
        }

        .difficulty-container {
          background: rgba(17, 17, 27, 0.7);
          border-radius: 0.5rem;
          padding: 0.25rem;
          border: 1px solid ${themeColors.cardBorder};
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
          opacity: 0;
          animation: fadeInUp 0.5s ease forwards;
          animation-delay: 0.1s;
          backdrop-filter: blur(4px);
        }

        .difficulty-btn {
          background: rgba(26, 26, 46, 0.5);
          border: 2px solid transparent;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          padding: 0.5rem 0;
          border-radius: 0.375rem;
          margin: 0 0.125rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .difficulty-btn.active {
          background: rgba(26, 26, 46, 0.8);
          border: 2px solid var(--btn-color);
          box-shadow: 0 0 10px var(--btn-color);
        }

        .difficulty-btn:hover:not(.active) {
          border-color: var(--btn-color);
          box-shadow: 0 0 10px var(--btn-color-dim);
          background: rgba(26, 26, 46, 0.7);
        }

        .difficulty-btn:focus-visible {
          outline: 2px solid var(--btn-color);
          outline-offset: 2px;
        }

        .difficulty-btn.active::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--btn-color);
          box-shadow: 0 0 10px var(--btn-color);
        }

        .nm-title {
          position: relative;
          display: inline-block;
        }

        .nm-title-text {
          position: relative;
          z-index: 2;
          background: linear-gradient(
            to right,
            ${themeColors.secondary},
            ${themeColors.accent1},
            ${themeColors.primary},
            ${themeColors.accent2}
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-weight: bold;
          letter-spacing: 2px;
          font-family: "Orbitron", sans-serif;
        }

        .nm-title::before {
          content: "NX Memory";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          color: transparent;
          -webkit-text-stroke: 4px rgba(255, 113, 206, 0.1);
          filter: blur(8px);
          animation: nmPulse 2s infinite alternate;
        }

        @keyframes nmPulse {
          0% {
            filter: blur(8px);
            opacity: 0.5;
          }
          100% {
            filter: blur(12px);
            opacity: 0.8;
          }
        }

        .game-stats {
          background: rgba(17, 17, 27, 0.7);
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: 1px solid ${themeColors.cardBorder};
          opacity: 0;
          animation: fadeInUp 0.5s ease forwards;
          backdrop-filter: blur(4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .game-stats-value {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .game-stats-label {
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.7;
        }

        .game-frame {
          background: linear-gradient(
            135deg,
            rgba(17, 24, 39, 0.7) 0%,
            rgba(12, 17, 29, 0.8) 100%
          );
          border: 2px solid rgba(31, 41, 55, 0.8);
          box-shadow:
            0 0 30px rgba(0, 0, 0, 0.5),
            inset 0 0 40px rgba(0, 0, 0, 0.3);
          border-radius: 1rem;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.8s ease forwards;
          backdrop-filter: blur(12px);
        }

        .card-container {
          opacity: 0;
          animation: scaleIn 0.5s ease forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .slide-in-left {
          opacity: 0;
          transform: translateX(-50px);
          animation: fadeInLeft 0.5s ease forwards;
        }

        .slide-in-right {
          opacity: 0;
          transform: translateX(50px);
          animation: fadeInRight 0.5s ease forwards;
        }

        .fade-in {
          opacity: 0;
          animation: fadeIn 0.5s ease forwards;
        }

        .delay-1 {
          animation-delay: 0.1s;
        }

        .delay-2 {
          animation-delay: 0.2s;
        }

        .delay-3 {
          animation-delay: 0.3s;
        }

        .delay-4 {
          animation-delay: 0.4s;
        }

        .delay-5 {
          animation-delay: 0.5s;
        }

        /* Modal styling */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 2px solid ${themeColors.primary};
          box-shadow: 0 0 20px ${themeColors.primary};
          border-radius: 1rem;
          padding: 2rem;
          max-width: 90%;
          width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          animation: scaleIn 0.3s ease;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Toaster position="top-center" />

        <div className="game-frame" style={gameFrameStyles}>
          <div className="text-center space-y-4 mb-8 w-full">
            <h1 className="text-4xl nm-title fade-in" aria-label="NX Memory">
              <span className="nm-title-text">NX Memory</span>
            </h1>

            <div
              className="flex justify-center items-center gap-4 game-stats"
              style={{ width: "400px", margin: "0 auto" }}
            >
              <div className="text-cyan-400 flex-1 text-center">
                <div className="game-stats-value">{moves}</div>
                <div className="game-stats-label">Moves</div>
              </div>
              <div className="text-pink-400 flex-1 text-center">
                <div className="game-stats-value">
                  {matches}/{getTotalPairs()}
                </div>
                <div className="game-stats-label">Matches</div>
              </div>
              <div
                className="text-yellow-400 flex-1 text-center"
                style={{ minWidth: "100px" }}
              >
                <div className="game-stats-value">{formatTime(timer)}</div>
                <div className="game-stats-label">Time</div>
              </div>
            </div>
          </div>

          <div
            className="w-full max-w-md difficulty-container mx-auto mb-10"
            role="group"
            aria-label="Difficulty selection"
          >
            <div className="flex justify-between">
              <button
                className={`difficulty-btn flex-1 ${difficulty === "easy" ? "active" : ""}`}
                style={
                  {
                    "--btn-color": difficultyColors.easy,
                    "--btn-color-dim": "rgba(1, 251, 172, 0.5)",
                  } as React.CSSProperties
                }
                onClick={() => changeDifficulty("easy")}
                aria-pressed={difficulty === "easy"}
                aria-label="Easy difficulty"
              >
                <span className="text-white font-medium">Easy</span>
              </button>
              <button
                className={`difficulty-btn flex-1 ${difficulty === "medium" ? "active" : ""}`}
                style={
                  {
                    "--btn-color": difficultyColors.medium,
                    "--btn-color-dim": "rgba(0, 255, 255, 0.5)",
                  } as React.CSSProperties
                }
                onClick={() => changeDifficulty("medium")}
                aria-pressed={difficulty === "medium"}
                aria-label="Medium difficulty"
              >
                <span className="text-white font-medium">Medium</span>
              </button>
              <button
                className={`difficulty-btn flex-1 ${difficulty === "hard" ? "active" : ""}`}
                style={
                  {
                    "--btn-color": difficultyColors.hard,
                    "--btn-color-dim": "rgba(255, 56, 100, 0.5)",
                  } as React.CSSProperties
                }
                onClick={() => changeDifficulty("hard")}
                aria-pressed={difficulty === "hard"}
                aria-label="Hard difficulty"
              >
                <span className="text-white font-medium">Hard</span>
              </button>
            </div>
          </div>

          <div
            className={`grid ${getGridClasses()} gap-2 p-6 rounded-xl bg-gray-900/50 backdrop-blur-sm game-board mx-auto`}
            style={{
              width: "600px",
              height: "600px",
            }}
            role="grid"
            aria-label="Memory game board"
          >
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="cursor-pointer card-container flex items-center justify-center w-full h-full"
                onClick={() => handleCardClick(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleCardClick(index);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={
                  card.isMatched || flippedIndexes.includes(index)
                    ? `${card.name} card, matched`
                    : "Card, face down"
                }
                aria-pressed={card.isMatched || flippedIndexes.includes(index)}
                style={{ animationDelay: `${0.05 * index}s` }}
              >
                <div
                  className={`relative w-[95%] h-[95%] rounded-lg transition-transform duration-500 ${
                    card.isMatched || flippedIndexes.includes(index)
                      ? "rotate-y-180"
                      : ""
                  } perspective-1000 transform-style-3d`}
                >
                  <div className="absolute inset-0 backface-hidden rounded-lg card-back-gradient"></div>

                  <div
                    className="absolute inset-0 backface-hidden rotate-y-180 rounded-lg card-front-gradient flex items-center justify-center nm-border"
                    style={
                      {
                        "--color": card.color,
                      } as React.CSSProperties
                    }
                  >
                    {React.createElement(card.icon, {
                      size: getIconSize(difficulty),
                      color: card.color,
                      strokeWidth: 1.5,
                      style: {
                        "--color": card.color,
                      } as React.CSSProperties,
                      className: "nm-glow",
                      "aria-hidden": "true",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-6 justify-center mt-10 fade-in delay-5">
            <button
              onClick={() => resetGame()}
              className="nm-button slide-in-left"
              style={
                { "--border-color": themeColors.primary } as React.CSSProperties
              }
              aria-label="Reset game"
            >
              <span className="nm-text font-medium tracking-wide text-lg">
                RESET
              </span>
            </button>

            <button
              onClick={() => setGameState("start")}
              className="nm-button slide-in-right"
              style={
                {
                  "--border-color": themeColors.accent1,
                  boxShadow: `0 0 10px ${themeColors.accent1}, 0 0 20px rgba(1, 251, 172, 0.5)`,
                } as React.CSSProperties
              }
              aria-label="Return to menu"
            >
              <span className="nm-text font-medium tracking-wide text-lg">
                MENU
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
