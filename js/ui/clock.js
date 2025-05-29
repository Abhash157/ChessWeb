/**
 * clock.js - Chess clock functionality
 */

import { CLOCK, PLAYER, gameState } from '../gameState.js';

// DOM elements for clock
let whiteTimeDisplay;
let blackTimeDisplay;
let whiteClockElement;
let blackClockElement;

/**
 * Initialize clock elements
 */
export function initClock() {
  whiteTimeDisplay = document.getElementById("white-time");
  blackTimeDisplay = document.getElementById("black-time");
  whiteClockElement = document.querySelector(".white-clock");
  blackClockElement = document.querySelector(".black-clock");
  updateClockDisplay();
}

/**
 * Formats time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (MM:SS)
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Updates the chess clock displays
 */
export function updateClockDisplay() {
  whiteTimeDisplay.textContent = formatTime(CLOCK.whiteTime);
  blackTimeDisplay.textContent = formatTime(CLOCK.blackTime);
  
  // Add visual indicators
  whiteTimeDisplay.classList.toggle('low-time', CLOCK.whiteTime <= CLOCK.lowTimeThreshold);
  blackTimeDisplay.classList.toggle('low-time', CLOCK.blackTime <= CLOCK.lowTimeThreshold);
  
  // Highlight active clock
  whiteClockElement.classList.toggle('active-clock', CLOCK.activePlayer === PLAYER.WHITE);
  blackClockElement.classList.toggle('active-clock', CLOCK.activePlayer === PLAYER.BLACK);
}

/**
 * Starts the chess clock
 */
export function startClock() {
  if (CLOCK.isRunning) return;
  
  CLOCK.timerInterval = setInterval(() => {
    if (CLOCK.activePlayer === PLAYER.WHITE) {
      CLOCK.whiteTime--;
      if (CLOCK.whiteTime <= 0) {
        handleTimeOut(PLAYER.WHITE);
      }
    } else {
      CLOCK.blackTime--;
      if (CLOCK.blackTime <= 0) {
        handleTimeOut(PLAYER.BLACK);
      }
    }
    updateClockDisplay();
  }, 1000);
  
  CLOCK.isRunning = true;
}

/**
 * Stops the chess clock
 */
export function stopClock() {
  if (CLOCK.timerInterval) {
    clearInterval(CLOCK.timerInterval);
    CLOCK.timerInterval = null;
    CLOCK.isRunning = false;
  }
}

/**
 * Switches the active player on the clock
 */
export function switchClock() {
  CLOCK.activePlayer = CLOCK.activePlayer === PLAYER.WHITE ? PLAYER.BLACK : PLAYER.WHITE;
  updateClockDisplay();
  
  // Ensure the clock is running when switching players during a game
  if (!CLOCK.isRunning && !gameState.gameOver && gameState.moveHistory.length > 0) {
    startClock();
  }
}

/**
 * Handles the case when a player runs out of time
 * @param {number} player - The player who ran out of time (PLAYER.WHITE or PLAYER.BLACK)
 */
export function handleTimeOut(player) {
  stopClock();
  gameState.gameOver = true;
  
  const winner = player === PLAYER.WHITE ? "Black" : "White";
  const gameStatus = document.getElementById("game-status");
  gameStatus.textContent = `Time's up! ${winner} wins by timeout!`;
}

/**
 * Resets the chess clock to initial state
 */
export function resetClock() {
  stopClock();
  CLOCK.whiteTime = CLOCK.initialTime;
  CLOCK.blackTime = CLOCK.initialTime;
  CLOCK.activePlayer = PLAYER.WHITE;
  updateClockDisplay();
} 