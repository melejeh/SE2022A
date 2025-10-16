let nextPlayer = 'X'; // takes a value of either 'X' or 'O' according to the game turns

// Initialize the game by setting the value inside next-lbl to nextPlayer
document.getElementById('next-lbl').innerText = nextPlayer;

// This call will create the buttons needed for the gameboard.
createGameBoard();

function createGameBoard()
{
    // Programatically add a button with square brackets enclosing an empty space to each cell in the gameboard
    for (let i = 1; i <= 9; i++) {
        let cell = document.getElementById('c' + i);
        let button = document.createElement('button');
        button.innerText = '[ ]';
        cell.appendChild(button);
    }

    // Programatically add 'takeCell' as an event listener to all the buttons on the board
    let btns = document.querySelectorAll('button');

    for (let i = 0; i < btns.length; i++)
    {
        // Assign an event listener to each button
        btns[i].addEventListener('click', takeCell);
    }
}

// This function will be used to respond to a click event on any of the board buttons.
function takeCell(event)
{
    // Replace [ ] with current player's mark (X or O)
    event.target.innerText = '[' + nextPlayer + ']';

    // Make sure the button is clickable only once
    event.target.disabled = true;

    // Switch players
    nextPlayer = (nextPlayer === 'X') ? 'O' : 'X';
    document.getElementById('next-lbl').innerText = nextPlayer;

    // Check if the game is over
    if (isGameOver())
    {
        // Let the label with the id 'game-over-lbl' display 'Game Over' inside <h1> element
        document.getElementById('game-over-lbl').innerHTML = '<h1>Game Over</h1>';
    }
}

// Returns true if all buttons are disabled, false otherwise
function isGameOver()
{
    let btns = document.querySelectorAll('button');
    for (let i = 0; i < btns.length; i++) {
        if (!btns[i].disabled) {
            return false;
        }
    }
    return true;
}
