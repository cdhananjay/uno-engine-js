interface IGame {
    players : IPlayer[]
    deck : ICard[]
}

interface ICard {
    type : CardTypes
    colour ?: Colours
    value ?: number
}

interface IPlayer {
    id : number,
    isBot: boolean,
    cards: ICard[],
    addCard: (cards: ICard) => void
    dropCard: (card : ICard) => void
}

enum Colours {
    RED, GREEN, BLUE, YELLOW
}

enum CardTypes {
    NUMBER, SKIP, REVERSE, DRAW2, DRAW4
}

class Game implements IGame{
    players : IPlayer[]
    deck : ICard[]
    constructor(players: IPlayer[]) {
        this.players = players;
        this.deck = [];
    }
    addToDeck(card: ICard) {
        this.deck.push(card)
    }
    start(){
        // fill deck
        for (let value = 0; value < 10; value++) {
            for (let colour = 0; colour < 4; colour++) {
                this.addToDeck(new Card(CardTypes.NUMBER, colour, value))
            }
        }
        for (let i = 0; i < 2; i++) {
            this.addToDeck(new Card(CardTypes.DRAW4))
            this.addToDeck(new Card(CardTypes.DRAW2))
        }

        for (let colour = 0; colour < 4; colour++) {
            this.addToDeck(new Card(CardTypes.REVERSE, colour))
            this.addToDeck(new Card(CardTypes.SKIP, colour))
        }
    }
}

class Card implements ICard {
    type : CardTypes
    colour ?: Colours
    value ?: number
    constructor(type : CardTypes, colour ?: Colours, value ?: number ) {
        this.type = type
        if (this.type === CardTypes.NUMBER) this.value = value
        if (this.type === CardTypes.NUMBER || this.type === CardTypes.REVERSE || this.type === CardTypes.SKIP) this.colour = colour
    }
}

class Player implements IPlayer {
    cards: ICard[]
    id : number
    isBot : boolean
    constructor(id: number, isBot : boolean) {
        this.id = id;
        this.isBot = isBot;
    }
    addCard(card : ICard) {
        this.cards.push(card)
    }
    dropCard(card : ICard) {
        let index = this.cards.indexOf(card)
        if (index === -1) throw Error(`player ${this.id} does not have ${card}`)
        this.cards.splice(index,1);
    }
}
