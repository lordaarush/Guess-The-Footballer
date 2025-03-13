let secretPlayer = "";
let attempts = 0;
let history = [];

async function startGame() {
    try {
        const response = await fetch("http://127.0.0.1:8000/random_player/");
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
        const response = await fetch(`http://127.0.0.1:8000/similarity/?player1=${encodeURIComponent(playerGuess)}&player2=${encodeURIComponent(secretPlayer)}`);
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


function revealPlayer() {
    document.getElementById("message").innerText = `The secret player was: ${secretPlayer}`;
}

function updateHistory() {
    const historyList = document.getElementById("history-container");
    historyList.innerHTML = history.length === 0 ? "<p class='no-history'>No comparisons yet</p>" : "";

    history.forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("history-item");
        div.innerHTML = `<strong>${item.name}</strong> - Similarity: ${item.similarity.toFixed(2)}`;
        historyList.appendChild(div);
    });
}

function updateProgressBar(value) {
    const bar = document.getElementById("similarity-bar");
    bar.style.width = `${value * 100}%`;

    if (value < 0.3) {
        bar.style.backgroundColor = "red";
    } else if (value < 0.6) {
        bar.style.backgroundColor = "yellow";
    } else {
        bar.style.backgroundColor = "green";
    }
}

function getSimilarityText(similarity) {
    if (similarity < 0.3) return "Colder ❄️";
    if (similarity < 0.6) return "Getting Warmer 🔥";
    return "Very Warm! 🔥🔥";
}

function toggleHistory() {
    let historyDiv = document.getElementById("history-container");
    historyDiv.style.display = historyDiv.style.display === "none" ? "block" : "none";
}

document.getElementById("start-game").addEventListener("click", startGame);
document.getElementById("check-button").addEventListener("click", checkGuess);
document.getElementById("reveal-button").addEventListener("click", revealPlayer);
document.getElementById("toggle-history").addEventListener("click", toggleHistory);
