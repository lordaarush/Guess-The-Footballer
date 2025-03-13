from fastapi import FastAPI
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import process
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

# Load filtered dataset
df_filtered = pd.read_csv("filtered_players.csv")

# Encode categorical variables
def encode_category(df, column):
    encoder = LabelEncoder()
    return encoder.fit_transform(df[column])

df_filtered["Nation_enc"] = encode_category(df_filtered, "Nation")
df_filtered["Squad_enc"] = encode_category(df_filtered, "Squad")
df_filtered["Comp_enc"] = encode_category(df_filtered, "Comp")

# Create player embeddings (only position now)
def get_position_vector(row):
    return np.array([row["FW"], row["MF"], row["DF"], row["GK"]]) * 0.25

player_positions = {row["Player"]: get_position_vector(row) for _, row in df_filtered.iterrows()}
player_clubs = {row["Player"]: row["Squad"] for _, row in df_filtered.iterrows()}
player_nations = {row["Player"]: row["Nation"] for _, row in df_filtered.iterrows()}
player_leagues = {row["Player"]: row["Comp"] for _, row in df_filtered.iterrows()}

# Predefined list of well-known players (top 200 from top clubs)
top_players = df_filtered[df_filtered["Squad"].str.contains("Real Madrid|Barcelona|Liverpool|Chelsea|Manchester|Bayern|Juventus|PSG|Arsenal", case=False, na=False)]["Player"].tolist()
top_players = random.sample(top_players, min(200, len(top_players)))  # Select up to 200

# Bonus score mapping
bonus_scores = {
    "same_club_same_nation": 0.8,
    "same_nation_same_league": 0.65,
    "same_club_diff_nation": 0.55,
    "same_nation_diff_league": 0.5,
    "same_league_only": 0.3,
    "nothing_same": 0.15
}

def get_best_match(player_name):
    matches = process.extractOne(player_name, df_filtered["Player"].tolist())
    return matches[0] if matches else None

def get_similarity(player1, player2):
    if player1 not in player_positions or player2 not in player_positions:
        return None

    # If it's the exact same player, return 1.0
    if player1 == player2:
        return 1.0
    
    # Position similarity (weighted 0-0.25)
    pos_sim = cosine_similarity(player_positions[player1].reshape(1, -1), 
                                player_positions[player2].reshape(1, -1))[0][0] * 0.25
    
    # Get player attributes
    club1, club2 = player_clubs[player1], player_clubs[player2]
    nation1, nation2 = player_nations[player1], player_nations[player2]
    league1, league2 = player_leagues[player1], player_leagues[player2]

    # Apply bonus scores
    if club1 == club2 and nation1 == nation2:
        base_similarity = bonus_scores["same_club_same_nation"]
    elif nation1 == nation2 and league1 == league2:
        base_similarity = bonus_scores["same_nation_same_league"]
    elif club1 == club2:
        base_similarity = bonus_scores["same_club_diff_nation"]
    elif nation1 == nation2:
        base_similarity = bonus_scores["same_nation_diff_league"]
    elif league1 == league2:
        base_similarity = bonus_scores["same_league_only"]
    else:
        base_similarity = bonus_scores["nothing_same"]

    # Total similarity score
    total_similarity = min(1.0, base_similarity + pos_sim)

    # If it's very high (0.99+), but not the same player, cap at 0.99
    if total_similarity >= 1.0:
        total_similarity = 0.99

    return round(total_similarity, 3)

@app.get("/random_player/")
def random_player():
    """ Returns a random famous player to be guessed """
    return {"secret_player": random.choice(top_players)}

@app.get("/similarity/")
def similarity(player1: str, player2: str):
    player1 = get_best_match(player1)
    player2 = get_best_match(player2)
    if not player1 or not player2:
        return {"error": "Player not found"}
    similarity_score = get_similarity(player1, player2)
    return {"player1": player1, "player2": player2, "similarity": similarity_score}
