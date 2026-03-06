# uno-engine-js

[![npm version](https://badge.fury.io/js/uno-engine-js.svg)](https://badge.fury.io/js/uno-engine-js)

### A headless, zero-dependency uno game logic engine written in TypeScript.

Supports both human and bot players, with full game state management, turn-based play, and standard UNO rules 
(including wild cards, draws, skips, and reverses). 

## Features

- **Full UNO Deck**: 108 cards with accurate distribution (numbers 0-9, actions, wilds, draw4s).
- **Player Management**: Supports 2-10 players, including bots with random play.
- **Turn Logic**: Handles direction reversal, skips, draws (2/4), and wild colour changes.
- **Validation**: Enforces playable card rules (colour, number, or symbol match).
- **Game State**: Track piles, current player, winner detection.
- **Extensible**: Interfaces for custom player/card extensions.

## Installation

Install via npm:

```bash
npm install uno-engine-js
```

## Quick Start

### Basic Game Setup

```typescript
import Game, { Colours, CardTypes } from 'uno-engine-js';

// Define players (strings for humans, objects for bots)
const players = [
  'Osaka',  // Human player
  'Tomo',    // Human player
  { name: 'Chiyo', isBot: true }  // Bot player
];

const game = new Game(players);

// Check initial state
console.log(game.toString());
```

### Playing a Turn

```typescript
// Get current player's playable cards
const playable = game.playableCards;
console.log('Playable cards:', playable);

// For human players with multiple options:
try {
  // Play a specific card with wild colour if needed
  const cardToPlay = playable[0];  // Assume first playable
  let wildColour: Colours | undefined;
  if (cardToPlay.type === CardTypes.WILD || cardToPlay.type === CardTypes.DRAW4) {
    wildColour = Colours.GREEN;  // Choose a colour
  }
  game.playTurn(cardToPlay, wildColour);
} catch (error) {
  console.error('Invalid play:', error);
}

// For bots or auto-play: Call without params
if (game.currPlayer.isBot) {
  game.playTurn();  // Bot plays randomly
}

// Advance turns until game over
while (!game.isOver) {
  game.playTurn();  // Handles bot/human logic internally
}

console.log('Winner:', game.winner.name);
```

### No Playable Cards

If no cards are playable, the player draws one and the turn passes automatically.

```typescript
if (game.playableCards.length === 0) {
  game.playTurn();  // Draws and advances
}
```

## API Reference

### Enums

- **`Colours`**: Card colours (RED=1, YELLOW=2, GREEN=3, BLUE=4).
- **`CardTypes`**: Card types (NUMBER=1, SKIP=2, REVERSE=3, DRAW2=4, DRAW4=5, WILD=6).

### Classes

#### `Game`

The main game controller.

**Constructor:**
```typescript
new Game(players: (string | { name: string; isBot: boolean })[])
```
- Initializes with 2-10 players.
- Deals 7 cards per player and starts the discard pile.

**Getters:**
- `isOver: boolean` - True if any player has 0 cards.
- `winner: Player` - The first player with 0 cards (throws if game not over).
- `players: readonly Player[]` - All players.
- `drawPile: readonly Card[]` - Cards to draw from.
- `discardPile: readonly Card[]` - Played cards.
- `currPlayerIndex: number` - Current turn index.
- `currPlayer: Player` - Current player (throws if invalid index).
- `nextPlayerIndex: number` - Next turn index (handles wraparound and direction).
- `isReversed: boolean` - True if play direction is backward.
- `playableCards: Card[]` - Current player's legal moves.

**Methods:**
- `playTurn(card?: Card, wildColour?: Colours): void`
  - Executes the current turn (see Quick Start for details).
  - Throws on invalid inputs for human players.
- `toString(): string` - String representation of game state (piles + players).

#### `Player`

Represents a player.

**Instead of this class, an interface extending this class is exported.**

**Constructor:**
```typescript
new Player(name: string, isBot?: boolean)
```

**Properties:**
- `hand: readonly Card[]` - Player's cards.
- `name: string` - Player name.
- `isBot: boolean` - True if bot-controlled.

**Methods:**
- `toString(): string` - String of name + hand.

#### `Card`

Represents a single card.

**Instead of this class, an interface extending this class is exported.**

**Constructor:**
```typescript
new Card(type: CardTypes, colour?: Colours, value?: number)
```
- Colour required except for WILD/DRAW4.
- Value required for NUMBER.

**Properties:**
- `type: CardTypes`
- `colour?: Colours`
- `value?: number`

**Methods:**
- `toString(): string` - Formatted string (e.g., "5 RED", "SKIP BLUE", "WILD").

### Interfaces

- `IPlayer extends Player` - For extending Player.
- `ICard extends Card` - For extending Card.

```typescript
import type {IPlayer, ICard} from "uno-engine-js";
```

## Contributing  
Feel free to contribute but please **ensure your code passes all tests** before submitting a pull request:
```bash
npm run test       # Run test suite
```

---