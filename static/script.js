const API_BASE_URL = "https://footyguess.onrender.com"; // Use Render API URL

let secretPlayer = "";
let attempts = 0;
let history = [];

async function startGame() {
    try {
        const response = await fetch(`${API_BASE_URL}/random_player/`);
        const data = await response.json();
        secretPlayer = data.secret_player;
        attempts = 0;
        history = [];

        updateHistory();
        updateProgressBar(0);

        document.getElementById("message").innerText = "A secret player has been chosen! Start guessing.";
        document.getElementById("attempts").innerText = "Attempts: 0";

        document.getElementById("history-container").innerHTML = "<p class='no-history'>No comparisons yet</p>"; 
        document.getElementById("history-container").style.display = "none";
        document.getElementById("progress-container").style.display = "block";
        document.getElementById("attempts").style.display = "block";
        document.getElementById("reveal-button").style.display = "inline-block";
    } catch (error) {
        console.error("Error starting the game:", error);
    }
}

async function checkGuess() {
    const playerGuess = document.getElementById("player-input").value.trim();

    if (!secretPlayer) {
        alert("Start the game first!");
        return;
    }

    if (!playerGuess) {
        alert("Enter a player name!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/similarity/?player1=${encodeURIComponent(playerGuess)}&player2=${encodeURIComponent(secretPlayer)}`);
        const data = await response.json();
        attempts++;

        let matchedPlayer = data.player1; // The actual matched name from API
        let similarityText = getSimilarityText(data.similarity);

        document.getElementById("message").innerText = `${matchedPlayer}: ${data.similarity.toFixed(2)} - ${similarityText}`;
        document.getElementById("attempts").innerText = `Attempts: ${attempts}`;

        updateProgressBar(data.similarity);

        history.push({ name: matchedPlayer, similarity: data.similarity });
        updateHistory();

        if (matchedPlayer.toLowerCase() === secretPlayer.toLowerCase()) {
            document.getElementById("message").innerText = `🎉 Correct! The secret player was ${secretPlayer}! 🎉`;
        }
    } catch (error) {
        console.error("Error checking guess:", error);
    }
}
