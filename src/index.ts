export enum Colours {
    RED = 1,
    YELLOW,
    GREEN,
    BLUE,
}

export enum CardTypes {
    NUMBER = 1,
    SKIP,
    REVERSE,
    DRAW2,
    DRAW4,
    WILD,
}

export default class Game {
    private _isReversed: boolean = false;
    private readonly _players: Player[] = [];
    private readonly _drawPile: Card[] = [];
    private readonly _discardPile: Card[] = [];
    private _wildColour: Colours = Colours.RED;
    private _currPlayerIndex: number = 0;

    /**
     * Initializes a new UNO game with the specified players.
     * Validates that there are between 2 and 10 players.
     * Creates Player instances from the input.
     * Fills and shuffles the draw pile, then distributes initial cards.
     * @param players An array of player identifiers. Each can be a string (name for human player) or an object with name and isBot properties.
     * @throws {Error} If the number of players is less than 2 or more than 10.
     */
    constructor(players: (string | { name: string; isBot: boolean })[]) {
        if (players.length < 2 || players.length > 10)
            throw new Error("a game can only have 2 to 10 players");

        for (const p of players)
            if (typeof p === "string") this._players.push(new Player(p));
            else this._players.push(new Player(p.name, p.isBot));

        this.fill(this._drawPile);
        this.shuffle(this._drawPile);
        this.distribute();
    }

    /**
     * Gets whether the game is over, which occurs when any player has an empty hand.
     * @returns {boolean} True if any player has no cards, false otherwise.
     */
    public get isOver() {
        for (const player of this.players) {
            if (player.hand.length === 0) return true;
        }
        return false;
    }

    /**
     * Gets the winner, defined as the first player with an empty hand.
     * @returns {Player} The player with an empty hand.
     * @throws {Error} If the game is not over (no player has an empty hand).
     */
    public get winner() {
        if (!this.isOver) throw new Error("game is unfinished");
        for (const player of this.players) {
            if (player.hand.length === 0) return player;
        }
    }

    /**
     * Gets the list of all players in the game.
     * @returns {readonly Player[]} The array of players.
     */
    public get players() {
        return this._players;
    }

    /**
     * Gets the cards in the draw pile.
     * @returns {readonly Card[]} The draw pile array.
     */
    public get drawPile() {
        return this._drawPile;
    }

    /**
     * Gets the cards in the discard pile.
     * @returns {readonly Card[]} The discard pile array.
     */
    public get discardPile() {
        return this._discardPile;
    }

    /**
     * Gets the index of the current player in the players array.
     * @returns {number} The current player index.
     */
    public get currPlayerIndex() {
        return this._currPlayerIndex;
    }

    /**
     * Gets the current player object.
     * @returns {Player} The player at the current index.
     * @throws {Error} If the current player index is invalid (out of bounds).
     */
    public get currPlayer() {
        const player = this._players[this._currPlayerIndex];
        if (!player) throw new Error("Invalid current player index");
        return player;
    }

    /**
     * Gets the index of the next player in turn order.
     * Accounts for the current direction (reversed or not) and wraps around the players array.
     * @returns {number} The next player index.
     */
    public get nextPlayerIndex() {
        if (this._isReversed) {
            if (this._currPlayerIndex === 0) return this._players.length - 1;
            else return this._currPlayerIndex - 1;
        } else {
            if (this._currPlayerIndex === this._players.length - 1) return 0;
            else return this._currPlayerIndex + 1;
        }
    }

    /**
     * Gets whether the direction of play is currently reversed.
     * @returns {boolean} True if play proceeds backward through the players array, false if forward.
     */
    public get isReversed() {
        return this._isReversed;
    }

    /**
     * Gets the playable cards from the current player's hand.
     * A card is considered playable based on matching rules against the top discard card.
     * @returns {Card[]} An array of playable cards from the current player's hand.
     */
    public get playableCards() {
        return this.currPlayer.hand.filter((card) => this.isPlayable(card));
    }

    /**
     * Executes the current player's turn according to UNO rules.
     * - If no playable cards, draws one card for the current player and advances turn.
     * - If current player is a bot, selects a random playable card (random colour for wild/draw4) and plays it.
     * - If exactly one playable card:
     *   - If not wild/draw4, plays it automatically without parameters.
     *   - If wild/draw4, requires wildColour parameter or throws an error.
     * - If multiple playable cards and player is not bot, requires card parameter (must be playable) and wildColour if applicable, or throws.
     * Performs the card's action, discards the card, and advances the turn (may skip players based on card type).
     * @param card Optional. The specific playable card to play (ignored for bots or single non-wild card; required otherwise).
     * @param wildColour Optional. The colour to set for wild/draw4 cards (ignored for non-wild; required for wild/draw4 when player is not bot, or throws).
     * @throws {Error} If invalid/missing parameters for human players, or other validation failures.
     */
    public playTurn(card?: Card, wildColour?: Colours) {
        const playableCards = this.playableCards;
        const player = this.currPlayer;

        if (playableCards.length === 0) {
            this.drawCard(player);
            this._currPlayerIndex = this.nextPlayerIndex;
            return;
        }

        if (this.currPlayer.isBot) {
            const index = Math.floor(Math.random() * playableCards.length);
            const cardToDiscard = playableCards[index]!;
            if (
                cardToDiscard.type === CardTypes.WILD ||
                cardToDiscard.type === CardTypes.DRAW4
            ) {
                wildColour = Math.floor(Math.random() * 4 + 1);
                this.performAction(cardToDiscard, wildColour);
            } else this.performAction(cardToDiscard);
            this.discardCard(player, cardToDiscard);
            this._currPlayerIndex = this.nextPlayerIndex;
            return;
        }
        if (playableCards.length === 1) {
            const cardToDiscard = playableCards[0]!;
            if (
                cardToDiscard.type !== CardTypes.WILD &&
                cardToDiscard.type !== CardTypes.DRAW4
            ) {
                this.performAction(cardToDiscard);
            } else {
                if (wildColour === undefined) {
                    throw new Error(
                        "wildColour must be provided for single playable Wild or Draw4 card",
                    );
                }
                this.performAction(cardToDiscard, wildColour);
            }
            this.discardCard(player, cardToDiscard);
            this._currPlayerIndex = this.nextPlayerIndex;
            return;
        } else {
            if (!card) throw new Error("card not provided to play");
            if (this.playableCards.indexOf(card) === -1)
                throw new Error("given card not playable");
            const cardToDiscard = card;
            if (
                cardToDiscard.type !== CardTypes.WILD &&
                cardToDiscard.type !== CardTypes.DRAW4
            ) {
                this.performAction(cardToDiscard);
            } else {
                if (wildColour === undefined) {
                    throw new Error(
                        "wildColour must be provided for Wild or Draw4 card",
                    );
                }
                this.performAction(cardToDiscard, wildColour);
            }
            this.discardCard(player, cardToDiscard);
            this._currPlayerIndex = this.nextPlayerIndex;
            return;
        }
    }

    //==========================private methods below this==================================

    /**
     * Fills the given array with a standard UNO deck: 76 number cards (0-9 per colour), 8 each of Skip/Reverse/Draw2 per colour, 4 Wild, 4 Draw4.
     * @param pile The array to populate with cards.
     * @private
     */
    private fill(pile: Card[]) {
        // Numbers : two copies of each 1 to 9 per colour, one 0 per colour = 19 × 4 colours = 76 Number cards
        for (let count = 0; count < 2; count++)
            for (let value = 1; value <= 9; value++)
                for (let colour = Colours.RED; colour <= Colours.BLUE; colour++)
                    pile.push(new Card(CardTypes.NUMBER, colour, value));

        for (let colour = Colours.RED; colour <= Colours.BLUE; colour++)
            pile.push(new Card(CardTypes.NUMBER, colour, 0));

        // Skip : two per colour = 2 × 4 colours = 8 Skip cards
        for (let count = 0; count < 2; count++)
            for (let colour = Colours.RED; colour <= Colours.BLUE; colour++)
                pile.push(new Card(CardTypes.SKIP, colour));

        // Reverse: two per colour = 2 × 4 colours = 8 Reverse cards
        for (let count = 0; count < 2; count++)
            for (let colour = Colours.RED; colour <= Colours.BLUE; colour++)
                pile.push(new Card(CardTypes.REVERSE, colour));

        // Draw2 : two per colour = 2 × 4 colours = 8 Draw2 cards
        for (let count = 0; count < 2; count++)
            for (let colour = Colours.RED; colour <= Colours.BLUE; colour++)
                pile.push(new Card(CardTypes.DRAW2, colour));

        // Draw4 : 4 uncoloured = 4 Draw4 cards
        for (let count = 0; count < 4; count++)
            pile.push(new Card(CardTypes.DRAW4));

        // Wild : 4 uncoloured = 4 Wild cards
        for (let count = 0; count < 4; count++)
            pile.push(new Card(CardTypes.WILD));
    }

    /**
     * Shuffles the given array of cards in place using the Fisher-Yates (Knuth) algorithm.
     * @param pile The array to shuffle.
     * @private
     */
    private shuffle(pile: Card[]) {
        for (let i = pile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = pile[j]!;
            pile[j] = pile[i]!;
            pile[i] = temp!;
        }
    }

    /**
     * Deals 7 cards from the draw pile to each player, then places one card from the draw pile on the discard pile.
     * @private
     */
    private distribute() {
        const initialCardsPerPlayer = 7;
        for (let count = 0; count < initialCardsPerPlayer; count++)
            for (const player of this._players)
                player.hand.push(this._drawPile.pop()!);
        this._discardPile.push(this._drawPile.pop()!);
    }

    /**
     * Draws the top card (last element) from the draw pile and adds it to the player's hand.
     * If the draw pile is empty, reshuffles all discard pile cards except the top one into the draw pile, then draws.
     * @param player The player receiving the drawn card.
     * @private
     * @throws {Error} If both the draw and discard piles are empty.
     * @throws {Error} If the draw pile is empty immediately after refilling.
     */
    private drawCard(player: Player) {
        const drawPileTopCard = this._drawPile.pop();
        if (drawPileTopCard) player.hand.push(drawPileTopCard);
        // When the draw pile runs out, all cards from discard pile except the top card are added to draw pile
        else {
            const discardPileTopCard = this._discardPile.pop();
            if (!discardPileTopCard)
                throw new Error(
                    "how did we come soo far? both discard pile and draw pile are empty",
                );
            this.shuffle(this._discardPile);
            while (this._discardPile.length > 0) {
                this._drawPile.push(this._discardPile.pop()!);
            }
            this._discardPile.push(discardPileTopCard);
            const newDrawPileTopCard = this._drawPile.pop();
            if (newDrawPileTopCard) player.hand.push(newDrawPileTopCard);
            else throw new Error("draw empty just after it was refilled???");
        }
    }

    /**
     * Removes the specified card from the player's hand (by reference) and adds it to the top (end) of the discard pile.
     * @param player The player discarding the card.
     * @param card The card to discard (must be in the player's hand).
     * @private
     * @throws {Error} If the card is not found in the player's hand.
     */
    private discardCard(player: Player, card: Card) {
        const index = player.hand.indexOf(card);
        if (index === -1)
            throw new Error(
                `provided card ${card.toString()} was not found with current player \n${player.toString()}`,
            );
        this._discardPile.push(card);
        player.hand.splice(index, 1);
    }

    /**
     * Checks if the given card can be legally played on the current top card of the discard pile.
     * Rules:
     * - Wild or Draw4 cards are always playable.
     * - Cards matching the top card's colour are playable.
     * - Number cards matching the top Number card's value are playable.
     * - Action cards (Skip, Reverse, Draw2) matching the top action card's type are playable.
     * - If top is Wild or Draw4, non-wild cards matching the current wild colour are playable.
     * @param card The card to validate.
     * @private
     * @returns {boolean} True if the card is playable, false otherwise.
     * @throws {Error} If the discard pile is empty.
     */
    private isPlayable(card: Card) {
        const discardPileTopCard =
            this._discardPile[this._discardPile.length - 1];
        if (!discardPileTopCard)
            throw new Error("discard pile is empty, this should never happen");
        if (card.type === CardTypes.WILD || card.type === CardTypes.DRAW4)
            return true;
        if (card.colour === discardPileTopCard.colour) {
            return true;
        }
        if (
            card.type === CardTypes.NUMBER &&
            discardPileTopCard.type === CardTypes.NUMBER &&
            card.value === discardPileTopCard.value
        ) {
            return true;
        }
        if (
            card.type === discardPileTopCard.type &&
            card.type !== CardTypes.NUMBER
        ) {
            return true;
        }
        if (
            discardPileTopCard.type === CardTypes.WILD ||
            discardPileTopCard.type === CardTypes.DRAW4
        ) {
            return card.colour === this._wildColour;
        }
        return false;
    }

    /**
     * Executes the special action of the played card, if any.
     * - Skip: Advances current index to the next player (skips one turn).
     * - Reverse: Toggles the play direction.
     * - Draw2: Draws 2 cards for the next player and advances index to skip their turn.
     * - Draw4: Sets wild colour (requires parameter), draws 4 cards for next player, advances to skip their turn.
     * - Wild: Sets wild colour (requires parameter).
     * - Number: No action.
     * @param card The played card determining the action.
     * @param wildColour Optional colour to set as wild (required and used for Wild/Draw4, throws if missing).
     * @private
     * @throws {Error} If wildColour is undefined for Wild or Draw4 cards.
     */
    private performAction(card: Card, wildColour?: Colours) {
        if (card.type === CardTypes.SKIP)
            this._currPlayerIndex = this.nextPlayerIndex;
        else if (card.type === CardTypes.REVERSE)
            this._isReversed = !this._isReversed;
        else if (card.type === CardTypes.DRAW2) {
            for (let i = 0; i < 2; i++)
                this.drawCard(this._players[this.nextPlayerIndex]!);
            this._currPlayerIndex = this.nextPlayerIndex;
        } else if (card.type === CardTypes.DRAW4) {
            if (wildColour !== undefined) this._wildColour = wildColour;
            else
                throw new Error(
                    "wild colour not provided for wild card action",
                );
            for (let i = 0; i < 4; i++)
                this.drawCard(this._players[this.nextPlayerIndex]!);
            this._currPlayerIndex = this.nextPlayerIndex;
        } else if (card.type === CardTypes.WILD) {
            if (wildColour !== undefined) this._wildColour = wildColour;
            else
                throw new Error(
                    "wild colour not provided for wild card action",
                );
        }
    }

    /**
     * Generates a multi-line string representation of the game state.
     * Shows discard pile (top to bottom), draw pile (top to bottom), and each player's hand.
     * @returns {string} The formatted game state.
     */
    toString() {
        let str = `==== discardPile (top to down) ====\n`;
        for (let i = this._discardPile.length - 1; i >= 0; i--)
            str += `${this._discardPile[i]!.toString()}\n`;
        str += `==== drawPile (top to down) ====\n`;
        for (let i = this._drawPile.length - 1; i >= 0; i--)
            str += `${this._drawPile[i]!.toString()}\n`;
        str += `==== Players: ====\n`;
        for (const player of this._players) str += `${player.toString()}\n`;
        return str;
    }
}

class Player {
    readonly hand: Card[] = [];
    readonly name: string;
    readonly isBot: boolean;

    /**
     * Initializes a new player with the given name and bot status.
     * The hand starts empty.
     * @param name The player's name.
     * @param isBot Whether this player is controlled by the system (bot). Defaults to false (human).
     */
    constructor(name: string, isBot: boolean = false) {
        this.name = name;
        this.isBot = isBot;
    }

    /**
     * Generates a multi-line string representation of the player, including name (with "bot" prefix if applicable) and hand cards.
     * @returns {string} The formatted player info and cards.
     */
    toString() {
        let str = `=== ${this.isBot ? "bot" : ""} ${this.name} ===\n`;
        for (const card of this.hand) str += `${card.toString()}\n`;
        return str;
    }
}

class Card {
    readonly type: CardTypes;
    readonly colour?: Colours;
    readonly value?: number;

    /**
     * Initializes a new card with the specified type, optional colour, and optional value.
     * Colour is required for all types except Wild and Draw4.
     * Value is required for Number type.
     * @param type The type of the card.
     * @param colour Optional colour (required unless type is Wild or Draw4).
     * @param value Optional numeric value (required if type is Number).
     * @throws {Error} If colour is missing for a non-Wild/Draw4 card.
     * @throws {Error} If value is missing for a Number card.
     */
    constructor(type: CardTypes, colour?: Colours, value?: number) {
        this.type = type;
        if (type !== CardTypes.WILD && type != CardTypes.DRAW4) {
            if (colour === undefined)
                throw new Error(
                    `colour not initialized to card of type ${type}`,
                );
            else this.colour = colour;
        }
        if (type === CardTypes.NUMBER) {
            if (value === undefined)
                throw new Error(
                    `value not initialized to card of type ${type}`,
                );
            else this.value = value;
        }
    }

    /**
     * Generates a string representation of the card in a concise format.
     * Examples: "5 RED" for number cards, "SKIP BLUE" for action cards, "WILD" for wild cards.
     * @returns {string} The formatted card string.
     */
    toString(): string {
        let str = "";
        str += this.type === CardTypes.NUMBER ? this.value : "";
        str += " ";
        str +=
            this.type === CardTypes.WILD || this.type === CardTypes.DRAW4
                ? ""
                : Colours[this.colour!];
        str += " ";
        str += this.type !== CardTypes.NUMBER ? CardTypes[this.type] : "";
        return str;
    }
}

export interface IPlayer extends Player {}
export interface ICard extends Card {}
