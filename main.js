var Colours;
(function (Colours) {
    Colours[Colours["RED"] = 0] = "RED";
    Colours[Colours["GREEN"] = 1] = "GREEN";
    Colours[Colours["BLUE"] = 2] = "BLUE";
    Colours[Colours["YELLOW"] = 3] = "YELLOW";
})(Colours || (Colours = {}));
var CardTypes;
(function (CardTypes) {
    CardTypes[CardTypes["NUMBER"] = 0] = "NUMBER";
    CardTypes[CardTypes["SKIP"] = 1] = "SKIP";
    CardTypes[CardTypes["REVERSE"] = 2] = "REVERSE";
    CardTypes[CardTypes["DRAW2"] = 3] = "DRAW2";
    CardTypes[CardTypes["DRAW4"] = 4] = "DRAW4";
})(CardTypes || (CardTypes = {}));
export class Game {
    reversed = false;
    players;
    deck = [];
    drawPile = [];
    discardPile = [];
    currTurn = 0;
    constructor(players) {
        if (players.length < 2 || players.length >= 5)
            throw new Error("too few / many players");
        this.players = players;
        this.fillDeck();
        this.shuffleCards(this.deck);
        this.distributeCards();
    }
    get currPlayer() {
        return this.players[this.currTurn];
    }
    playTurn(card) {
        if (this.currPlayerPlayableCards.length === 0) {
            this.drawCard(this.currPlayer);
            this.currTurn = this.nextPlayerIndex;
            return;
        }
        let cardToDiscard;
        if (this.currPlayerPlayableCards.length === 1)
            cardToDiscard = this.currPlayerPlayableCards[0];
        else if (this.currPlayer.isBot) {
            const index = Math.floor(Math.random() * this.currPlayerPlayableCards.length);
            cardToDiscard = this.currPlayerPlayableCards[index];
        }
        else if (this.currPlayerPlayableCards.indexOf(card) === -1)
            throw new Error("invalid discard card choice");
        else if (this.currPlayerPlayableCards.indexOf(card) !== -1)
            cardToDiscard = card;
        this.discardCard(this.currPlayer, this.currPlayer.cards.indexOf(cardToDiscard));
        this.performCardAction(cardToDiscard);
        this.currTurn = this.nextPlayerIndex;
    }
    performCardAction(card) {
        if (card.type === CardTypes.REVERSE)
            this.reversed = !this.reversed;
        else if (card.type === CardTypes.SKIP)
            this.currTurn = this.nextPlayerIndex;
        else if (card.type === CardTypes.DRAW2)
            for (let i = 0; i < 2; i++)
                this.drawCard(this.players[this.nextPlayerIndex]);
        else if (card.type === CardTypes.DRAW4)
            for (let i = 0; i < 4; i++)
                this.drawCard(this.players[this.nextPlayerIndex]);
    }
    fillDeck() {
        // NUMBER : two copies of each 1 to 9 for each colour
        for (let i = 0; i < 2; i++) {
            for (let value = 1; value < 10; value++) {
                for (let colour = 0; colour < 4; colour++) {
                    this.deck.push(new Card(CardTypes.NUMBER, colour, value));
                }
            }
        }
        // NUMBER : one 0 for each colour
        for (let colour = 0; colour < 4; colour++) {
            this.deck.push(new Card(CardTypes.NUMBER, colour, 0));
        }
        // REVERSE and SKIP : two for each colour
        for (let colour = 0; colour < 4; colour++) {
            this.deck.push(new Card(CardTypes.REVERSE, colour));
            this.deck.push(new Card(CardTypes.SKIP, colour));
        }
        // DRAW2 and DRAW4 : two uncoloured
        for (let i = 0; i < 2; i++) {
            this.deck.push(new Card(CardTypes.DRAW4));
            this.deck.push(new Card(CardTypes.DRAW2));
        }
    }
    shuffleCards(cards) {
        for (let i = 0; i < 100000; i++) {
            const j = Math.floor(Math.random() * cards.length);
            const k = Math.floor(Math.random() * cards.length);
            const temp = cards[j];
            cards[j] = cards[k];
            cards[k] = temp;
        }
    }
    distributeCards() {
        const initialCardsPerPlayer = 7;
        for (let j = 0; j < initialCardsPerPlayer; j++) {
            for (let i = 0; i < this.players.length; i++) {
                this.players[i].cards.push(this.deck.pop());
            }
        }
        while (this.deck.length !== 1) {
            this.drawPile.push(this.deck.pop());
        }
        this.discardPile.push(this.deck.pop());
    }
    get nextPlayerIndex() {
        if (this.reversed) {
            if (this.currTurn === 0)
                return this.players.length - 1;
            else
                return this.currTurn - 1;
        }
        else {
            if (this.currTurn === this.players.length - 1)
                return 0;
            else
                return this.currTurn + 1;
        }
    }
    get currPlayerPlayableCards() {
        return this.currPlayer.cards.filter(card => this.isValidDiscard(card));
    }
    drawCard(player) {
        if (this.drawPile.length > 0)
            player.cards.push(this.drawPile.pop());
        // When the draw pile runs out, shuffle the discard pile (except the top card). That becomes the new draw pile.
        else {
            const topCardOfDiscardPile = this.discardPile.pop();
            this.shuffleCards(this.discardPile);
            while (this.discardPile.length > 0) {
                this.drawPile.push(this.discardPile.pop());
            }
            this.discardPile.push(topCardOfDiscardPile);
        }
    }
    discardCard(player, index) {
        if (!this.isValidDiscard(player.cards[index]))
            return false;
        this.discardPile.push(player.cards[index]);
        player.cards.splice(index, 1);
        return true;
    }
    isValidDiscard(card) {
        const discardPileTopCard = this.discardPile[this.discardPile.length - 1];
        // drop anything on draw card
        if (discardPileTopCard.type === CardTypes.DRAW2 || discardPileTopCard.type === CardTypes.DRAW4)
            return true;
        // drop draw card on anything
        if (card.type === CardTypes.DRAW2 || card.type === CardTypes.DRAW4)
            return true;
        // drop any colour reverse on any colour reverse
        if (card.type === CardTypes.REVERSE && discardPileTopCard.type === CardTypes.REVERSE)
            return true;
        // drop any colour skip on any colour skip
        if (card.type === CardTypes.SKIP && discardPileTopCard.type === CardTypes.SKIP)
            return true;
        // drop same colour reverse on number/skip
        if (card.type === CardTypes.REVERSE && (discardPileTopCard.type === CardTypes.NUMBER || discardPileTopCard.type === CardTypes.SKIP) && card.colour === discardPileTopCard.colour)
            return true;
        // drop same colour skip on number/reverse
        if (card.type === CardTypes.SKIP && (discardPileTopCard.type === CardTypes.NUMBER || discardPileTopCard.type === CardTypes.REVERSE) && card.colour === discardPileTopCard.colour)
            return true;
        // drop same colour number on reverse/skip
        if (card.type === CardTypes.NUMBER && (discardPileTopCard.type === CardTypes.REVERSE || discardPileTopCard.type === CardTypes.SKIP) && card.colour === discardPileTopCard.colour)
            return true;
        // drop same colour or value number on number
        if (card.type === CardTypes.NUMBER && discardPileTopCard.type === CardTypes.NUMBER && (card.colour === discardPileTopCard.colour || card.value === discardPileTopCard.value))
            return true;
        // everything else is not valid
        return false;
    }
}
export class Player {
    cards = [];
    id;
    isBot;
    constructor(id, isBot = false) {
        this.id = id;
        this.isBot = isBot;
    }
}
class Card {
    type;
    colour;
    value;
    constructor(type, colour, value) {
        this.type = type;
        if (this.type === CardTypes.NUMBER || this.type === CardTypes.REVERSE || this.type === CardTypes.SKIP)
            this.colour = colour;
        if (this.type === CardTypes.NUMBER)
            this.value = value;
    }
    toString() {
        switch (this.type) {
            case CardTypes.DRAW4:
                return "DRAW4";
            case CardTypes.DRAW2:
                return "DRAW2";
            case CardTypes.NUMBER:
                return `${this.value} ${Colours[this.colour]}`;
            default:
                return `${CardTypes[this.type]} ${Colours[this.colour]}`;
        }
    }
}
