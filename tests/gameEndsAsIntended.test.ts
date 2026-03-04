import Game from "../src/index.js";

function gameEndsAsIntended(playerCount: number) {
    for (let i = 0; i < 10000; i++) {
        const players = [];
        for (let i = 0; i < playerCount; i++)
            players.push({ name: `${i}`, isBot: true });
        const g = new Game(players);

        while (!g.isOver) {
            if (g.currPlayer.isBot) {
                g.playTurn();
            } else throw new Error("player is not a bot");
        }
        let playersWithEmptyHand = 0;
        for (const p of g.players)
            if (p.hand.length === 0)
                if (playersWithEmptyHand === 1) return false;
                else playersWithEmptyHand++;
    }
    return true;
}

describe("game ends when there is only 1 player with an empty hand", () => {
    for (let i = 2; i <= 10; i++) {
        test(`game ends as intended with ${i} players`, () => {
            expect(gameEndsAsIntended(i)).toBe(true);
        });
    }
});
