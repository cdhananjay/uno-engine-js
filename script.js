import {Game, Player} from './main.js'

const p1 = new Player(1,true)
const p2 = new Player(2, true)
const p3 = new Player(3,true)
const g = new Game([p1, p2, p3])

const discardPileTopCard = document.getElementById('discard-pile')
const drawPileTopCard = document.getElementById('draw-pile')
const currPlayerDiv = document.getElementById('curr-player')
const player1cards = document.getElementById('player1cards');
const player2cards = document.getElementById('player2cards');
const player3cards = document.getElementById('player3cards');
const btnNext = document.getElementById('btn-next');
const btnAuto = document.getElementById('btn-auto');
const logs = document.getElementById('logs')

btnNext.addEventListener('click', ()=>{next()})
btnAuto.addEventListener('click', ()=>{
    btnNext.disabled=true;
    btnAuto.disabled=true;
    auto();
})

function next(){
    load()
    for (let i = 0; i < g.players.length; i++) {
        if (g.players[i].cards.length === 0) {
            logs.innerText = `PLAYER ${g.players[i].id} WON`
            btnNext.disabled = true;
        }
    }
    if (g.currPlayer.isBot) {
        logs.innerText = "bot turn.."
        g.playTurn();
    } else {
        const playableCards = g.currPlayerPlayableCards ;
        if (playableCards.length === 0) {
            logs.innerText = "no playable cards for curr player.. drawing a card.."
            g.playTurn();
        }
        else if (playableCards.length === 1) {
            logs.innerText = "only single playable card.. auto playing"
            g.playTurn();
        }
        else {
            let promptMsg = ''
            for (let i = 0; i < playableCards.length; i++) promptMsg += ` ${playableCards[i].toString()},`
            const index = prompt(`playable cards: ${promptMsg}`)
            g.playTurn(playableCards[index])
            logs.innerText = 'END OF TURN'
        }
    }
    load()
    for (let i = 0; i < g.players.length; i++) {
        if (g.players[i].cards.length === 0) {
            logs.innerText = `PLAYER ${g.players[i].id} WON`
            btnNext.disabled = true;
        }
    }
}

async function auto() {
    let gameWon = false;
    while (!gameWon) {
        load()
        for (let i = 0; i < g.players.length; i++) {
            if (g.players[i].cards.length === 0) {
                logs.innerText = `PLAYER ${g.players[i].id} WON`
                btnNext.disabled = true;
                gameWon = true;
                break;
            }
        }
        if (gameWon) break;
        if (g.currPlayer.isBot) {
            logs.innerText = "bot turn.."
            g.playTurn();
        } else {
            const playableCards = g.currPlayerPlayableCards ;
            if (playableCards.length === 0) {
                logs.innerText = "no playable cards for curr player.. drawing a card.."
                g.playTurn();
            }
            else if (playableCards.length === 1) {
                logs.innerText = "only single playable card.. auto playing"
                g.playTurn();
            }
            else {
                let promptMsg = ''
                for (let i = 0; i < playableCards.length; i++) promptMsg += ` ${playableCards[i].toString()},`
                const index = prompt(`playable cards: ${promptMsg}`)
                g.playTurn(playableCards[index])
                logs.innerText = 'END OF TURN'
            }
        }
        load()
        for (let i = 0; i < g.players.length; i++) {
            if (g.players[i].cards.length === 0) {
                logs.innerText = `PLAYER ${g.players[i].id} WON`
                btnNext.disabled = true;
                gameWon = true;
                break;
            }
        }
        if (gameWon) break;
        await sleep(2000);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function load() {
    currPlayerDiv.innerText = g.players[g.currTurn].id.toString();
    discardPileTopCard.innerText = g.discardPile[g.discardPile.length-1].toString();
    drawPileTopCard.innerText = g.drawPile[g.drawPile.length-1].toString();

    fillPlayerCardDiv(player1cards, p1.cards);
    fillPlayerCardDiv(player2cards, p2.cards);
    fillPlayerCardDiv(player3cards, p3.cards);
}

function fillPlayerCardDiv(div, cards){
    div.innerHTML = `<p>===PLAYER CARDS===</p>`
    for (let i = 0; i < cards.length; i++) div.innerHTML += ` <p> ${cards[i].toString()} </p> `
}

load();