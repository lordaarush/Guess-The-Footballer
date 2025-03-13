const API_BASE_URL = "https://footyguess.onrender.com"; // Your API base URL

let secretPlayer = "";
let attempts = 0;
let history = [];

document.addEventListener("DOMContentLoaded", () => {
    //console.log("✅ Script loaded successfully!");

    // Get elements
    const startButton = document.getElementById("start-game");
    const checkButton = document.getElementById("check-button");
    const revealButton = document.getElementById("reveal-button");
    const toggleHistoryButton = document.getElementById("toggle-history");

    // Attach event listeners
    if (startButton) startButton.addEventListener("click", startGame);
    if (checkButton) checkButton.addEventListener("click", checkGuess);
    if (revealButton) revealButton.addEventListener("click", revealPlayer);
    if (toggleHistoryButton) toggleHistoryButton.addEventListener("click", toggleHistory);

    //console.log("✅ Event listeners attached!");
});

async function startGame() {
    //console.log("🟢 Starting new game...");
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

        //console.log("🟢 Secret player chosen:", secretPlayer);
    } catch (error) {
        console.error("❌ Error starting the game:", error);
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

        let matchedPlayer = data.player1;
        let similarityText = getSimilarityText(data.similarity);

        // Ensure metadata exists before accessing
        let metadata = data.metadata || { club: "Unknown", nation: "Unknown", position: "Unknown" };
        let { club, nation, position } = metadata;

        // Update message with similarity and metadata
        document.getElementById("message").innerHTML = `
            <strong>${matchedPlayer}</strong> - Similarity: ${data.similarity.toFixed(2)} <br>
            ${similarityText}
        `;

        // Update metadata display
        document.getElementById("player-metadata").innerHTML = `
            <strong>Club:</strong> ${club} | <strong>Nation:</strong> ${nation} | <strong>Position:</strong> ${position}
        `;

        document.getElementById("attempts").innerText = `Attempts: ${attempts}`;

        updateProgressBar(data.similarity);

        history.push({ name: matchedPlayer, similarity: data.similarity, club, nation, position });
        updateHistory();

        if (matchedPlayer.toLowerCase() === secretPlayer.toLowerCase()) {
            document.getElementById("message").innerText = `🎉 Correct! The secret player was ${secretPlayer}! 🎉`;
        }
    } catch (error) {
        console.error("Error checking guess:", error);
    }
}

function revealPlayer() {
    if (!secretPlayer) {
        alert("Start the game first!");
        return;
    }
    document.getElementById("message").innerText = `The secret player was: ${secretPlayer}`;
    console.log("👀 Revealed secret player:", secretPlayer);
}

function toggleHistory() {
    const historyContainer = document.getElementById("history-container");
    historyContainer.style.display = historyContainer.style.display === "none" ? "block" : "none";
}

function updateHistory() {
    const historyContainer = document.getElementById("history-container");
    historyContainer.innerHTML = history.length === 0
        ? "<p class='no-history'>No comparisons yet</p>"
        : history.map(entry => `<p>${entry.name}: ${entry.similarity.toFixed(2)}</p>`).join("");
}

function updateProgressBar(value) {
    const bar = document.getElementById("similarity-bar");
    bar.style.width = `${value * 100}%`;
    bar.style.backgroundColor = `rgb(${255 - value * 255}, ${value * 255}, 0)`;
}

function getSimilarityText(score) {
    if (score >= 0.8) return "🔥 Very Close!";
    if (score >= 0.5) return "👍 Getting Warm!";
    if (score >= 0.3) return "🤔 Somewhat Similar.";
    return "❄️ Not even close!";
}
