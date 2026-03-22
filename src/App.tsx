/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Trophy, Music, Gamepad2, RefreshCcw, Move, Keyboard, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Point {
  x: number;
  y: number;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Point = { x: 0, y: -1 };
const GAME_SPEED = 90;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "Cybernetic Echo",
    artist: "AI Synthwave",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/cyber/400/400"
  },
  {
    id: 2,
    title: "Neon Pulse",
    artist: "Digital Dreamer",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon/400/400"
  },
  {
    id: 3,
    title: "Glitch Horizon",
    artist: "Neural Network",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/glitch/400/400"
  }
];

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [moveSnake]);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-black crt-flicker selection:bg-neon-magenta selection:text-black font-sans">
      {/* SCANLINE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-12 screen-tear"
      >
        <h1 className="text-6xl md:text-8xl font-pixel text-neon-cyan glitch-text mb-4 tracking-tighter">
          NEON_SNAKE.exe
        </h1>
        <div className="flex items-center justify-center gap-4 text-neon-magenta font-mono text-lg tracking-[0.5em] uppercase">
          <span className="animate-pulse">[</span>
          <span>SYSTEM_STATUS: ACTIVE</span>
          <span className="animate-pulse">]</span>
        </div>
      </motion.div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">
        {/* Left Panel: Data Stream */}
        <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
          <motion.div 
            whileHover={{ x: 5 }}
            className="neon-border-cyan bg-black/80 p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-cyan animate-pulse" />
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="text-neon-cyan w-5 h-5" />
              <h2 className="text-xl font-pixel text-neon-cyan uppercase tracking-tighter">DATA_LOG</h2>
            </div>
            
            <div className="space-y-8 font-mono">
              <div className="group">
                <p className="text-xs text-neon-cyan/40 uppercase tracking-[0.3em] mb-3">CURRENT_SCORE_STREAM</p>
                <div className="p-4 border-2 border-neon-cyan/30 bg-black/40 group-hover:border-neon-cyan transition-colors">
                  <p className="text-4xl font-pixel text-neon-cyan glitch-text">{score.toString().padStart(4, '0')}</p>
                </div>
              </div>
              
              <div className="group">
                <p className="text-xs text-neon-magenta/40 uppercase tracking-[0.3em] mb-3">PEAK_PERFORMANCE_VAL</p>
                <div className="p-4 border-2 border-neon-magenta/30 bg-black/40 group-hover:border-neon-magenta transition-colors">
                  <p className="text-4xl font-pixel text-neon-magenta glitch-text">{highScore.toString().padStart(4, '0')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="neon-border-magenta bg-black/80 p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-6 h-6 text-neon-magenta" />
              <span className="font-pixel text-neon-magenta uppercase text-xs">INPUT_CMD</span>
            </div>
            <div className="space-y-4 font-mono text-sm text-neon-magenta/80">
              <div className="flex items-center gap-4 p-2 border border-neon-magenta/20 hover:bg-neon-magenta/10 transition-colors">
                <Move className="w-4 h-4" />
                <p>DIR_VECTORS: ARROWS</p>
              </div>
              <div className="flex items-center gap-4 p-2 border border-neon-magenta/20 hover:bg-neon-magenta/10 transition-colors">
                <Keyboard className="w-4 h-4" />
                <p>HALT_PROCESS: SPACE</p>
              </div>
              <div className="flex items-center gap-4 p-2 border border-neon-magenta/20 hover:bg-neon-magenta/10 transition-colors">
                <Zap className="w-4 h-4" />
                <p>DATA_ABSORB: GROW</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel: Execution Grid */}
        <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
          <div className="relative">
            {/* GLITCH DECORATION */}
            <div className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-neon-cyan" />
            <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-neon-magenta" />
            
            <div className="relative bg-black p-2 border-4 border-neon-cyan/50 shadow-[0_0_30px_rgba(0,243,255,0.2)]">
              <div 
                className="grid bg-black/90 relative"
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                  width: 'min(85vw, 500px)',
                  height: 'min(85vw, 500px)',
                  backgroundImage: 'radial-gradient(circle, rgba(0,243,255,0.05) 1px, transparent 1px)',
                  backgroundSize: '25px 25px'
                }}
              >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  const snakeIndex = snake.findIndex(s => s.x === x && s.y === y);
                  const isSnakeHead = snakeIndex === 0;
                  const isSnakeBody = snakeIndex > 0;
                  const isFood = food.x === x && food.y === y;

                  const opacity = isSnakeHead ? 1 : Math.max(0.1, 0.8 - (snakeIndex / snake.length));
                  const glowSize = isSnakeHead ? 20 : Math.max(0, 15 - (snakeIndex / 2));

                  return (
                    <div 
                      key={i} 
                      className="relative w-full h-full"
                      style={{
                        backgroundColor: isSnakeHead ? '#00f3ff' : 
                                       isSnakeBody ? `rgba(0, 243, 255, ${opacity})` : 
                                       isFood ? '#ff00ff' : 'transparent',
                        boxShadow: (isSnakeHead || isSnakeBody) ? `0 0 ${glowSize}px #00f3ff` : 
                                   isFood ? '0 0 25px #ff00ff' : 'none',
                        clipPath: isSnakeHead ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : 'none',
                        transform: isFood ? 'scale(0.8) rotate(45deg)' : 'scale(1)',
                      }}
                    >
                      {isSnakeHead && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 bg-black rotate-45" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Game Over Overlay */}
              <AnimatePresence>
                {(isGameOver || isPaused) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-10 border-4 border-neon-magenta/50"
                  >
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://media.giphy.com/media/oEI9uWUAbjg3u/giphy.gif')] bg-cover" />
                    
                    {isGameOver ? (
                      <div className="text-center screen-tear">
                        <h3 className="text-5xl font-pixel text-neon-magenta mb-8 glitch-text tracking-tighter">FATAL_ERROR</h3>
                        <p className="text-neon-cyan mb-12 font-mono text-xl tracking-widest">SCORE_RECOVERED: {score}</p>
                        <button 
                          onClick={resetGame}
                          className="group relative px-12 py-6 bg-transparent border-4 border-neon-cyan text-neon-cyan font-pixel text-lg hover:bg-neon-cyan hover:text-black transition-all duration-300"
                        >
                          <span className="relative z-10">REBOOT_SYSTEM</span>
                          <div className="absolute inset-0 bg-neon-cyan opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <h3 className="text-6xl font-pixel text-neon-cyan mb-16 glitch-text tracking-tighter">PROCESS_HALTED</h3>
                        <button 
                          onClick={() => setIsPaused(false)}
                          className="group relative px-16 py-8 bg-transparent border-4 border-neon-magenta text-neon-magenta font-pixel text-xl hover:bg-neon-magenta hover:text-black transition-all duration-300"
                        >
                          <span className="relative z-10">RESUME_THREAD</span>
                          <div className="absolute inset-0 bg-neon-magenta opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Panel: Audio Processor */}
        <div className="lg:col-span-3 order-3">
          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="neon-border-magenta bg-black/90 overflow-hidden"
          >
            <div className="p-4 bg-neon-magenta/20 border-b-2 border-neon-magenta/40 flex items-center gap-3">
              <Music className="w-5 h-5 text-neon-magenta animate-pulse" />
              <span className="text-xs font-pixel text-neon-magenta uppercase tracking-widest">AUDIO_PROC</span>
            </div>
            
            <div className="p-8 flex flex-col items-center text-center">
              <motion.div 
                key={currentTrack.id}
                className="relative w-full aspect-square mb-8 border-2 border-neon-magenta/30 group"
              >
                <img 
                  src={currentTrack.cover} 
                  alt={currentTrack.title}
                  className={`w-full h-full object-cover grayscale contrast-150 brightness-75 transition-all duration-700 ${isPlaying ? 'scale-105 hue-rotate-90' : 'scale-100'}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-neon-magenta/10 mix-blend-overlay" />
                
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-full border-4 border-neon-magenta animate-ping opacity-20" />
                  </div>
                )}
              </motion.div>

              <div className="mb-10 w-full">
                <h3 className="text-2xl font-pixel text-white mb-2 truncate uppercase tracking-tighter">{currentTrack.title}</h3>
                <p className="text-lg text-neon-cyan font-mono tracking-widest">SOURCE: {currentTrack.artist}</p>
              </div>

              <div className="flex items-center gap-8">
                <button onClick={prevTrack} className="text-neon-magenta/60 hover:text-neon-magenta transition-transform hover:scale-125">
                  <SkipBack className="w-8 h-8" />
                </button>
                
                <button 
                  onClick={togglePlay}
                  className="w-20 h-20 flex items-center justify-center border-4 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                >
                  {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
                </button>

                <button onClick={nextTrack} className="text-neon-magenta/60 hover:text-neon-magenta transition-transform hover:scale-125">
                  <SkipForward className="w-8 h-8" />
                </button>
              </div>
            </div>

            <audio ref={audioRef} src={currentTrack.url} onEnded={nextTrack} />
          </motion.div>

          <div className="mt-8 p-6 border-2 border-neon-cyan/20 bg-black/60 font-mono">
            <p className="text-xs text-neon-cyan/40 uppercase tracking-widest mb-4">QUEUE_BUFFER</p>
            <div className="space-y-3">
              {TRACKS.map((track, i) => (
                <div 
                  key={track.id}
                  className={`flex items-center gap-4 p-3 border ${i === currentTrackIndex ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                >
                  <span className="text-xs font-pixel">[{i.toString().padStart(2, '0')}]</span>
                  <p className="text-sm truncate uppercase tracking-tighter">{track.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-neon-cyan/20 text-xs font-mono tracking-[0.5em] uppercase text-center">
        <p>TERMINAL_ID: AIS_DEV_439780910363</p>
        <p className="mt-2">PROTOCOL: RETRO_FUTURIST_GLITCH_V1.0</p>
      </footer>
    </div>
  );
}
