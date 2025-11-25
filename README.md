# 🦃 Gobble Gobble

A Pac-Man inspired browser game where you play as a turkey collecting corn while avoiding farmers! Built with React, TypeScript, and Phaser.js.

![Game Preview](https://img.shields.io/badge/Status-Active-green) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🎮 Game Overview

**Gobble Gobble** is a fast-paced arcade game where you control a hungry turkey navigating through a maze. Your mission? Collect all the corn while dodging farmers who want to stop you. But watch out - grab a power-up and turn the tables to chase down those farmers for bonus points!

### Features

- 🌽 Classic maze-based arcade gameplay
- 👨‍🌾 Smart AI farmers that chase the player
- ⚡ Power-ups to turn farmers scared and eat them for points
- 💾 Firebase cloud integration for score tracking and leaderboards
- 🏆 Global leaderboard system
- ❤️ Lives system with respawn mechanics
- 🎨 Smooth animations and responsive controls

---

## 🎯 Rules & Objectives

### Objective
Collect all the corn pellets in the maze to win the level!

### Controls
- **Arrow Keys** - Move the turkey
  - ⬆️ Up Arrow - Move up
  - ⬇️ Down Arrow - Move down
  - ⬅️ Left Arrow - Move left
  - ➡️ Right Arrow - Move right

### Gameplay Mechanics

#### Corn 🌽
- **Value:** 1 point each
- **Goal:** Collect all corn to complete the level
- Automatically collected when touched

#### Power-ups ⚡
- **Effect:** Makes all farmers scared for 10 seconds
- **Duration:** 10 seconds
- **Bonus:** Eat scared farmers for 10 points each
- **Strategy:** Use strategically to clear dangerous areas and boost score

#### Farmers 👨‍🌾
- **Danger:** Touching a normal farmer loses 1 life
- **Behavior:** Chase the turkey using pathfinding AI
- **Scared Mode:** Turn blue when power-up is active
- **Respawn:** After being eaten, farmers respawn at the farthest corner

#### Lives ❤️
- **Starting Lives:** 3
- **Game Over:** When all lives are lost
- **Respawn:** Turkey respawns at center after losing a life

### Scoring
- Corn: **1 point**
- Scared Farmer: **10 points**
- Bonus points for completing levels quickly

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)

### Installation

Follow these steps to get Gobble Gobble running on your local machine:

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/gobble-gobble.git
cd gobble-gobble
```

#### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React
- TypeScript
- Phaser.js (game engine)
- Firebase (backend services)
- Vite (build tool)

#### 3. Run the Development Server

```bash
npm run dev
```

The game will be available at: **http://localhost:5173/**

Your browser should automatically open to this URL. If not, manually navigate to it.

---

## 🎮 How to Play

1. **Start the Game**
   - Click **"Start Game"** on the main menu
   - Use arrow keys to move your turkey

2. **Collect Corn**
   - Navigate through the maze
   - Collect all corn pellets (small yellow dots)
   - Each corn is worth **1 point**

3. **Avoid Farmers**
   - Farmers (in red) will chase you
   - Touching a farmer loses **1 life**
   - You have **3 lives** total

4. **Use Power-ups**
   - Collect power-up pills (larger, glowing items)
   - Farmers turn blue/scared for 10 seconds
   - Eat scared farmers for **10 points** each

5. **Win**
   - Collect all corn to complete the level
   - Enter your name to save your score
   - View the leaderboard to see rankings

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Project Structure

```
gobble-gobble/
├── src/
│   ├── assets/          # Game images and sprites
│   ├── components/      # React components
│   │   └── Game.tsx     # Main game component with UI
│   ├── config/          # Configuration files
│   │   └── firebase.ts  # Firebase initialization
│   ├── game/            # Phaser game logic
│   │   ├── events.ts    # Game event system
│   │   ├── objects/     # Game objects (Turkey, Farmer)
│   │   ├── scenes/      # Game scenes
│   │   │   └── MainScene.ts
│   │   ├── utils/       # Utility functions
│   │   └── phaserConfig.ts
│   ├── services/        # Backend services
│   │   ├── firebase.ts  # Score & leaderboard service
│   │   └── playerData.ts # Advanced player stats
│   └── utils/           # Helper utilities
├── .env                 # Environment variables (not in git)
├── .env.example         # Template for .env
└── package.json         # Project dependencies
```

### Technology Stack

- **Frontend:** React 19 + TypeScript
- **Game Engine:** Phaser 3.90
- **Build Tool:** Vite 7
- **Backend:** Firebase (Firestore) - Shared instance for all players
- **Styling:** CSS3

---

## 🔥 Firebase Integration

### Collections

The game uses two main Firestore collections:

#### `scores`
Stores individual game scores for the leaderboard.

```typescript
{
  name: string,      // Player name
  score: number,     // Final score
  level: number,     // Level reached
  date: Timestamp    // When played
}
```

#### `gameSessions` (Advanced - see `playerData.ts`)
Stores complete game session data for tracking.

#### `playerStats` (Advanced - see `playerData.ts`)
Aggregated player statistics over time.

---

## 🏆 Leaderboard

View top scores by clicking **"Leaderboard"** from:
- Main menu
- Game over screen

Top 10 players are displayed with:
- Rank
- Player name
- Score
- Level reached

---

## 🔒 Security Notes

### Shared Firebase Instance
- This game uses a shared Firebase backend for all players
- All scores are saved to a common leaderboard
- Firebase configuration is already included in the project
- No additional setup required!

### Security
Firestore Security Rules are configured to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{document=**} {
      allow read: if true;
      allow write: if request.resource.data.score < 100000; // Prevent cheating
    }
  }
}
```

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🐛 Troubleshooting

### Game won't start
- Ensure you ran `npm install`
- Check that Node.js is v18+
- Clear browser cache and reload

### Firebase connection issues
- Verify you have internet connection
- Check browser console for specific error messages
- Ensure Firestore is enabled in the Firebase Console

### Port already in use
```bash
# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Use different port
npm run dev -- --port 3000
```

---

## 🙏 Acknowledgments

- Game inspired by the classic Pac-Man
- Built with Phaser.js - Amazing HTML5 game framework
- Firebase for easy backend integration
- React for modern UI components

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

**Happy Gobbling! 🦃🌽**
