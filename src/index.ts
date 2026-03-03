enum Colours {
    RED = 1,
    YELLOW,
    GREEN,
    BLUE,
}

enum CardTypes {
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
     * @param players
     * @throws error if size of players array is less than 2 or more than 10
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
     * @return an array consisting of cards in draw pile
     */
    public get drawPile() {
        return [...this._drawPile];
    }

    /**
     * @return an array consisting of cards in discard pile
     */
    public get discardPile() {
        return [...this._discardPile];
    }

    /**
     * @return current player's index in the player array
     */
    public get currPlayerIndex() {
        return this._currPlayerIndex;
    }

    /**
     * @return player object of the current player
     */
    public get currPlayer() {
        const player = this._players[this._currPlayerIndex];
        if (!player) throw new Error("Invalid current player index");
        return { ...player } as Player;
    }

    /**
     * @return index of player who should be playing next
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
     * @return an array consisting of all the players in the game
     */
    public get players() {
        return [...this._players];
    }

    /**
     * @return true if turns are played in a reverse way, else false
     */
    public get isReversed() {
        return this._isReversed;
    }

    /**
     * @return array of cards which can be played by the current player.
     * PLAYABLE CARDS:
     * if discard pile top card is NOT Draw4 or Wild:
     * - Player can discard a card which matches the top discard pile card by
     * Colour, Number, Type (applicable only to Skip, Reverse, Draw2); or play Draw4 / Wild card.
     *
     * if discard pile top card is Draw4 or Wild:
     * - Player can discard a card whose colour matches wild colour; or play Draw4 / Wild card.
     *
     * If player cannot play by one of the above method
     * - player draws 1 card from draw pile.
     */
    public get playableCards() {
        return this.currPlayer.hand.filter((card) => this.isPlayable(card));
    }

    // TODO: REMOVE DUPLICATE CODE, make docs smoler
    /**
     * if no playable cards:
     * - current player draws a card
     * else if only 1 playable card available which is not of type wild or draw4:
     * - that card is played regardless of params given
     * else if only 1 playable card available of type wild or draw4:
     * - that card is played with given wildColour param
     * else if current player is a bot:
     * - choose random card and random colour (if required) and play it
     * else if given card is one of playable card:
     * - play it
     * else throw error
     * @param card ignored if current player is bot OR if there are only 1 / 0 playable cards
     * @param wildColour ignored if current player is bot OR if card type is not draw4 / wild
     * @throws error if required params are not provided or card is not playable
     */
    public playTurn(card?: Card, wildColour?: Colours) {
        const playableCards = this.playableCards;

        if (playableCards.length === 0) {
            this.drawCard(this.currPlayer);
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
            this.discardCard(cardToDiscard);
            this._currPlayerIndex = this.nextPlayerIndex;
            return;
        }

        if (playableCards.length === 1) {
            const cardToDiscard = playableCards[0]!;
            if (
                cardToDiscard.type === CardTypes.WILD ||
                cardToDiscard.type === CardTypes.DRAW4
            ) {
                if (wildColour !== undefined)
                    this.performAction(cardToDiscard, wildColour);
            } else throw new Error("colour not provided for wild card");
            this.discardCard(cardToDiscard);
            this._currPlayerIndex = this.nextPlayerIndex;
            return;
        } else {
            if (!card) throw new Error("card not provided to play");
            if (this.playableCards.indexOf(card) === -1)
                throw new Error("given card not playable");
            const cardToDiscard = card;
            if (
                cardToDiscard.type === CardTypes.WILD ||
                cardToDiscard.type === CardTypes.DRAW4
            ) {
                if (wildColour !== undefined)
                    this.performAction(cardToDiscard, wildColour);
            } else throw new Error("colour not provided for wild card");
            this.discardCard(cardToDiscard);
            this._currPlayerIndex = this.nextPlayerIndex;
            return;
        }
    }

    //==========================private methods below this==================================

    /**
     * fills given pile with the following 108 cards:
     * - Numbers : two copies of each 1 to 9 per colour, one 0 per colour = 19 × 4 colours = 76 Number cards
     * - Skip : two per colour = 2 × 4 colours = 8 Skip cards
     * - Reverse: two per colour = 2 × 4 colours = 8 Reverse cards
     * - Draw2 : two per colour = 2 × 4 colours = 8 Draw2 cards
     * - Draw4 : 4 initially uncoloured (gets coloured when discarded) = 4 Draw4 cards
     * - Wild : 4 initially uncoloured (gets coloured when discarded) = 4 Wild cards
     * @param pile an array to push the 108 cards into
     * @private
     */
    private fill(pile: Card[]) {
        // Numbers : two copies of each 1 to 9 per colour, one 0 per colour = 19 × 4 colours = 76 Number cards
        for (let count = 0; count < 2; count++)
            for (let value = 1; value < 10; value++)
                for (let colour = Colours.RED; colour <= Colours.BLUE; colour++)
                    pile.push(new Card(CardTypes.NUMBER, colour, value));

        for (let colour = Colours.RED; colour <= Colours.BLUE; colour++)
            pile.push(new Card(CardTypes.NUMBER, colour, 0));

        // Skip : two per colour = 2 × 4 colours = 8 Skip cards
        for (let colour = Colours.RED; colour <= Colours.BLUE; colour++)
            pile.push(new Card(CardTypes.REVERSE, colour));

        // Reverse: two per colour = 2 × 4 colours = 8 Reverse cards
        for (let colour = Colours.RED; colour <= Colours.BLUE; colour++)
            pile.push(new Card(CardTypes.SKIP, colour));

        // Draw2 : two per colour = 2 × 4 colours = 8 Draw2 cards
        for (let count = 0; count < 2; count++)
            for (let colour = Colours.RED; colour <= Colours.BLUE; colour++)
                pile.push(new Card(CardTypes.DRAW2, colour));

        // Draw4 : 4 initially uncoloured (gets coloured when discarded) = 4 Draw4 cards
        for (let count = 0; count < 2; count++)
            pile.push(new Card(CardTypes.DRAW4));

        // Wild : 4 initially uncoloured (gets coloured when discarded) = 4 Wild cards
        for (let count = 0; count < 2; count++)
            pile.push(new Card(CardTypes.WILD));
    }

    /**
     * shuffle a pile with the Fisher–Yates Shuffle (Knuth Shuffle) algorithm
     * @param pile array of cards to shuffle
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
     * distribute 7 cards to each player from the draw pile,
     * put 1 card to discard pile from the draw pile
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
     * move the top card from the draw pile to the player's hand
     * @param player player object, whose hand the card is moved to
     * @private
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
        }
    }

    /**
     * moves the card from the current player's hand onto the top of discard pile
     * @param card card to move from the player's hand
     * @private
     */
    private discardCard(card: Card) {
        this._discardPile.push(card);
        this.currPlayer.hand.splice(this.currPlayer.hand.indexOf(card), 1);
    }

    /**
     * a card is playable if it follows any of the given conditions:
     * 1. is Draw4 / Wild card
     * 2. if discard pile top card is NOT Draw4 or Wild:
     * - card matches the top discard pile card by
     * Colour, Number, Type (applicable only to Skip, Reverse, Draw2)
     * 3. if discard pile top card is Draw4 or Wild:
     * - card matches the wild colour
     *
     * @param card a card to check if it is playable
     * @private
     * @return true if card is playable, false if it is not
     */
    private isPlayable(card: Card) {
        const discardPileTopCard =
            this._discardPile[this._discardPile.length - 1];
        if (!discardPileTopCard)
            throw new Error("discard pile is empty, this should never happen");
        if (card.type === CardTypes.WILD || card.type === CardTypes.DRAW4)
            return true;
        // below this line, card is never wild or draw4
        if (discardPileTopCard.type === CardTypes.NUMBER)
            return (
                card.type === CardTypes.NUMBER &&
                (card.value === discardPileTopCard.value ||
                    card.colour === discardPileTopCard.colour)
            );
        else if (discardPileTopCard.type === CardTypes.SKIP)
            return (
                card.type === CardTypes.SKIP ||
                card.colour === discardPileTopCard.colour
            );
        else if (discardPileTopCard.type === CardTypes.REVERSE)
            return (
                card.type === CardTypes.REVERSE ||
                card.colour === discardPileTopCard.colour
            );
        else if (discardPileTopCard.type === CardTypes.DRAW2)
            return (
                card.type === CardTypes.DRAW2 ||
                card.colour === discardPileTopCard.colour
            );
        // discardPileTopCard.type is wild or draw4
        else return card.colour === this._wildColour;
    }

    /** Performs the following action based upton the parameters provided
     * - Skip: Next player loses their turn.
     * - Reverse: Direction of play flips.
     * - Draw2: Next player draws 2 cards.
     * - Draw4: Acts as Wild card, then next player draws 4 cards.
     * - Wild: Current player makes a colour choice, the chosen colour is now the wild colour.
     * @param card a card based upon which the action is made
     * @param wildColour ignored if card is not of type draw4 or wild
     * @private
     */
    private performAction(card: Card, wildColour?: Colours) {
        if (card.type === CardTypes.SKIP)
            this._currPlayerIndex = this.nextPlayerIndex;
        else if (card.type === CardTypes.REVERSE)
            this._isReversed = !this._isReversed;
        else if (card.type === CardTypes.DRAW2)
            for (let i = 0; i < 2; i++)
                this.drawCard(this._players[this.nextPlayerIndex]!);
        else if (card.type === CardTypes.DRAW4) {
            if (wildColour !== undefined) this._wildColour = wildColour;
            else
                throw new Error(
                    "wild colour not provided for wild card action",
                );
            for (let i = 0; i < 4; i++)
                this.drawCard(this._players[this.nextPlayerIndex]!);
        } else if (card.type === CardTypes.WILD) {
            if (wildColour !== undefined) this._wildColour = wildColour;
            else
                throw new Error(
                    "wild colour not provided for wild card action",
                );
        }
    }
    toString() {
        let str = `==== discardPile (top to down) ====\n`;
        for (let i = this._discardPile.length - 1; i >= 0; i--)
            str += `${this._discardPile[i]!.toString()}\n`;
        str += `==== drawPile (top to down) ====\n`;
        for (let i = this._drawPile.length - 1; i >= 0; i--)
            str += `${this._drawPile[i]!.toString()}\n`;
        str += `==== Players: ====\n`;
        for (const player of this._players) str += `${player.toString()}\n`;
    }
}

class Player {
    readonly hand: Card[] = [];
    readonly name: string;
    readonly isBot: boolean;

    constructor(name: string, isBot: boolean = false) {
        this.name = name;
        this.isBot = isBot;
    }
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
     * creates a new card with given type, colour value
     * @param type
     * @param colour
     * @param value
     * @throws error if any card apart from draw4 & wild cards is not provided with colour parameter,
     * @throws error if number type card is not provided with a value
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

    toString() {
        switch (this.type) {
            case CardTypes.NUMBER:
                return `${this.value} ${Colours[this.colour!]}`;
            case CardTypes.SKIP:
                return `SKIP ${Colours[this.colour!]}`;
            case CardTypes.REVERSE:
                return `REVERSE ${Colours[this.colour!]}`;
            case CardTypes.DRAW2:
                return `DRAW2 ${Colours[this.colour!]}`;
            case CardTypes.DRAW4:
                return `DRAW4`;
            case CardTypes.WILD:
                return `WILD`;
        }
    }
}
