# uno engine
A headless, zero-dependency uno game logic engine written in TypeScript.

### Key features:
[//]: # "- Multiplayer Ready: Designed with a serializable state, making it easy to sync across WebSockets for real-time play."
- Fully Type-Safe: Built with TypeScript for excellent IDE autocompletion
- Well Documented: Clean API with JSDoc comments and comprehensive guide
- Headless & Lightweight: No UI attached
- Real uno rules: Engine follows all the major undisputed uno game rules

### Example:
https://github.com/cdhananjay/uno

### Terms used across the code and documentation
- player's hand : the set of cards with a player
- to draw a card : to pick a card, moving the top card from the draw pile to the player's hand
- to discard a card : to drop a card, moving the card from the player's hand onto the top of discard pile
- discard pile : stack of card where the discarded cards go
- draw pile : stack of card from where players draw a card
- current player : the player whose turn is going on
- playable card : a card is playable if it follows any of the given conditions:
1. is Draw4 / Wild card
2. if discard pile top card is NOT Draw4 or Wild: card matches the top discard pile card by Colour, Number, Type (applicable only to Skip, Reverse, Draw2)
3. if discard pile top card is Draw4 or Wild: card matches the wild colour

## Implemented Uno Rules:
**Anything apart from the below given information has not been implemented in the game engine**, even if it is part of some version of Uno.

### Card Colours:
Red, Yellow, Green, Blue

### Total Cards: 108
- Numbers : two copies of each 1 to 9 per colour, one 0 per colour = 19 × 4 colours = 76 Number cards
- Skip : two per colour = 2 × 4 colours = 8 Skip cards
- Reverse: two per colour = 2 × 4 colours = 8 Reverse cards
- Draw2 : two per colour = 2 × 4 colours = 8 Draw2 cards
- Draw4 : 4 uncoloured = 4 Draw4 cards
- Wild : 4 uncoloured = 4 Wild cards

### Game Initialization:
- Game can be started with 2 to 10 players.
- Each player gets 7 cards.
- Discard Pile starts with a single card.
- Remaining cards are the discard pile.
- When the draw pile runs out, all cards from discard pile except the top card are added to draw pile.
- Play proceeds clockwise.

### During a turn:
if discard pile top card is NOT Draw4 or Wild:
- Player can discard a card which matches the top discard pile card by Colour, Number, Type (applicable only to Skip, Reverse, Draw2); or play Draw4 / Wild card.

if discard pile top card is Draw4 or Wild:
- Player can discard a card whose colour matches wild colour; or play Draw4 / Wild card.

If player cannot play by one of the above method
- player draws 1 card from draw pile.

### Card Actions
- Skip: Next player loses their turn.
- Reverse: Direction of play flips.
- Draw2: Next player draws 2 cards.
- Draw4: Acts as Wild card, then next player draws 4 cards.
- Wild: Current player makes a colour choice, the chosen colour is now the wild colour.

### Ending the game (for a player):
- When player runs out of cards, the player's turn is skipped.
