import Game from "./../src/index.js";

function maintainsTotalCardStrength() {
    for (let i = 0; i < 10000; i++) {
        const g = new Game([
            { name: "p1", isBot: true },
            { name: "p2", isBot: true },
            { name: "p3", isBot: true },
        ]);

        let totalCards = g.drawPile.length + g.discardPile.length;
        for (const p of g.players) totalCards += p.hand.length;

        let gameWon = false;
        while (!gameWon) {
            for (const p of g.players) {
                if (p.hand.length === 0) {
                    gameWon = true;
                    break;
                }
            }
            if (gameWon) break;

            let currTotalCards = g.drawPile.length + g.discardPile.length;
            for (const p of g.players) currTotalCards += p.hand.length;
            if (currTotalCards !== totalCards) return false;

            if (g.currPlayer.isBot) {
                g.playTurn();
            } else throw new Error("player is not a bot");

            currTotalCards = g.drawPile.length + g.discardPile.length;
            for (const p of g.players) currTotalCards += p.hand.length;
            if (currTotalCards !== totalCards) return false;

            for (const p of g.players) {
                if (p.hand.length === 0) {
                    gameWon = true;
                    break;
                }
            }
        }
    }
    return true;
}

function startsWith108InitialCards() {
    for (let i = 0; i < 10000; i++) {
        const g2 = new Game([
            { name: "p1", isBot: true },
            { name: "p2", isBot: true },
            { name: "p3", isBot: true },
        ]);

        let totalCards = g2.drawPile.length + g2.discardPile.length;
        for (const p of g2.players) totalCards += p.hand.length;
        if (totalCards !== 108) return false;
    }
    return true;
}

describe("cards are maintained through out the game", () => {
    test("game starts with 108 cards", () => {
        expect(startsWith108InitialCards()).toBe(true);
    });

    test("total card strength is maintained throughout the game", () => {
        expect(maintainsTotalCardStrength()).toBe(true);
    });
});
