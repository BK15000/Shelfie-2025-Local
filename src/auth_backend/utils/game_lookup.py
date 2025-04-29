import csv
import os
import logging
from typing import Dict, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

class GameLookup:
    """Utility class to look up board game IDs from names using the boardgames_ranks.csv file"""
    
    def __init__(self, csv_path: str = None):
        """Initialize the game lookup with the CSV file path"""
        if csv_path is None:
            # Default path relative to the project root
            csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'boardgames_ranks.csv')
        
        self.csv_path = csv_path
        self.game_map: Dict[str, str] = {}
        self._load_csv()
    
    def _load_csv(self):
        """Load the CSV file and build the name-to-id mapping"""
        try:
            with open(self.csv_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                # Skip header row
                next(reader)
                
                for row in reader:
                    if len(row) >= 2:  # Ensure we have at least id and name
                        # The first column is the ID, the second is the name (in quotes)
                        game_id = row[0].strip()
                        game_name = row[1].strip('"')  # Remove quotes
                        
                        # Store in our mapping
                        self.game_map[game_name] = game_id
                
                logger.info(f"Loaded {len(self.game_map)} games from {self.csv_path}")
        except Exception as e:
            logger.error(f"Error loading game data from {self.csv_path}: {str(e)}")
            # Initialize with empty map if file can't be loaded
            self.game_map = {}
    
    def get_game_id(self, game_name: str) -> str:
        """
        Look up a game ID by name.
        First tries an exact match, then looks for the shortest game name that contains the given name.
        Returns the ID if found, or "-1" if not found.
        """
        # First try exact match
        if game_name in self.game_map:
            return self.game_map[game_name]
        
        # If no exact match, look for the shortest game name that contains the given name
        matching_games = []
        for db_game_name in self.game_map.keys():
            if game_name.lower() in db_game_name.lower():
                matching_games.append((len(db_game_name), db_game_name))
        
        # If we found matches, return the ID of the shortest one
        if matching_games:
            # Sort by length (first element in tuple)
            matching_games.sort()
            shortest_match = matching_games[0][1]
            logger.info(f"No exact match for '{game_name}', using closest match: '{shortest_match}'")
            return self.game_map[shortest_match]
        
        # No match found
        logger.info(f"No match found for game name: '{game_name}'")
        return "-1"

# Singleton instance
_instance = None

def get_instance() -> GameLookup:
    """Get the singleton instance of GameLookup"""
    global _instance
    if _instance is None:
        _instance = GameLookup()
    return _instance
