/**
 * Team Balancing Algorithm - TypeScript Version
 * 
 * Distributes players into balanced teams using Smart Positional Balancing.
 * Converted from friday-league-pro/lib/balancer.js
 * 
 * Key Changes from Original:
 * - Converted to TypeScript with strict typing
 * - Removed GK (Goalkeeper) position support (only DEF, MID, ATT)
 * - Added comprehensive JSDoc comments
 * - Improved error handling
 * - Added input validation
 * 
 * Algorithm Logic:
 * 1. Initialize Teams with Captains (if provided). Captains count towards position totals.
 * 2. Iterate through Positions (DEF, MID, ATT).
 * 3. For each player in a position group, assign to the team that:
 *    a) Has available space
 *    b) Has the FEWEST players of that position currently
 *    c) Tie-breaker: Lower Team ID
 * 4. Overflow: Any players not fitting in main teams form new teams.
 * 
 * Example:
 * - If Team 1 has a Captain (ATT), Team 2 (no ATT) gets the first ATT from the pool.
 * - This ensures balanced position distribution across all teams.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Valid playing positions (Outfield only - No Goalkeeper)
 */
export type Position = 'DEF' | 'MID' | 'ATT';

/**
 * Player object with required fields for team balancing
 */
export interface Player {
    id: string;
    name: string;
    preferred_position: Position;
    isCaptain?: boolean;
}

/**
 * Generated team with player assignments and metadata
 */
export interface Team {
    id: number;
    name: string;
    players: Player[];
    isOverflow: boolean;
    positionCounts: {
        DEF: number;
        MID: number;
        ATT: number;
    };
}

/**
 * Configuration options for team generation
 */
export interface TeamGenerationOptions {
    /** Target number of players per team (default: 5) */
    playersPerTeam?: number;
    /** Array of captain player IDs in priority order */
    captainIds?: string[];
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generates balanced teams from a list of players
 * 
 * @param players - Array of player objects with id, name, and preferred_position
 * @param options - Configuration options for team generation
 * @returns Array of generated teams with balanced position distribution
 * 
 * @throws {Error} If players array is invalid or positions are not supported
 * 
 * @example
 * ```ts
 * const players = [
 *   { id: '1', name: 'John', preferred_position: 'DEF' },
 *   { id: '2', name: 'Jane', preferred_position: 'MID' },
 *   { id: '3', name: 'Bob', preferred_position: 'ATT' },
 * ];
 * 
 * const teams = generateBalancedTeams(players, {
 *   playersPerTeam: 5,
 *   captainIds: ['1', '3']
 * });
 * ```
 */
export function generateBalancedTeams(
    players: Player[],
    options: TeamGenerationOptions = {}
): Team[] {
    const { playersPerTeam = 5, captainIds = [] } = options;

    // -------------------------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------------------------
    if (!players || players.length === 0) {
        return [];
    }

    // Validate positions
    const validPositions: Position[] = ['DEF', 'MID', 'ATT'];
    const invalidPlayers = players.filter(
        p => !validPositions.includes(p.preferred_position)
    );

    if (invalidPlayers.length > 0) {
        throw new Error(
            `Invalid positions found: ${invalidPlayers.map(p => p.name).join(', ')}. ` +
            `Only DEF, MID, ATT are supported (no GK).`
        );
    }

    // -------------------------------------------------------------------------
    // EXTRACT CAPTAINS
    // -------------------------------------------------------------------------
    const captains: Player[] = [];
    let remainingPlayers = [...players];

    if (captainIds.length > 0) {
        captainIds.forEach(id => {
            const player = remainingPlayers.find(p => p.id === id);
            if (player) {
                captains.push({ ...player, isCaptain: true });
                remainingPlayers = remainingPlayers.filter(p => p.id !== id);
            }
        });
    }

    // -------------------------------------------------------------------------
    // SETUP MAIN TEAMS
    // -------------------------------------------------------------------------
    let mainTeams: Team[] = [];

    if (captains.length > 0) {
        // Captain Mode: Create one team per captain
        captains.forEach((captain, index) => {
            mainTeams.push({
                id: index + 1,
                name: `Team ${captain.name}`,
                players: [captain],
                isOverflow: false,
                positionCounts: {
                    DEF: captain.preferred_position === 'DEF' ? 1 : 0,
                    MID: captain.preferred_position === 'MID' ? 1 : 0,
                    ATT: captain.preferred_position === 'ATT' ? 1 : 0,
                },
            });
        });
    } else {
        // Auto Mode: Calculate number of teams based on total players
        let numTeams = Math.floor(players.length / playersPerTeam);
        if (numTeams < 2 && players.length >= 2) numTeams = 2;
        if (numTeams === 0) numTeams = 1;

        mainTeams = Array.from({ length: numTeams }, (_, index) => ({
            id: index + 1,
            name: `Team ${index + 1}`,
            players: [],
            isOverflow: false,
            positionCounts: { DEF: 0, MID: 0, ATT: 0 },
        }));
    }

    // -------------------------------------------------------------------------
    // DISTRIBUTE PLAYERS BY POSITION (SMART BALANCE)
    // -------------------------------------------------------------------------
    const positions: Position[] = ['DEF', 'MID', 'ATT'];
    const overflowPlayers: Player[] = [];

    positions.forEach(position => {
        // Get all players of this position
        let positionPool = remainingPlayers.filter(
            p => p.preferred_position === position
        );

        // SHUFFLE the players to ensure random order
        positionPool = shuffle(positionPool);

        positionPool.forEach(player => {
            // Find teams with available space
            const eligibleTeams = mainTeams.filter(
                team => team.players.length < playersPerTeam
            );

            if (eligibleTeams.length === 0) {
                // All main teams are full - add to overflow
                overflowPlayers.push(player);
            } else {
                // Find team with LEAST count of this position
                // Sort by: position count (ascending)
                eligibleTeams.sort((a, b) => {
                    return a.positionCounts[position] - b.positionCounts[position];
                });

                // Get all teams tied for the best spot (lowest position count)
                const bestCount = eligibleTeams[0].positionCounts[position];
                const bestTeams = eligibleTeams.filter(
                    t => t.positionCounts[position] === bestCount
                );

                // Pick a RANDOM team from the best options
                const targetTeam = bestTeams[Math.floor(Math.random() * bestTeams.length)];

                targetTeam.players.push(player);
                targetTeam.positionCounts[position]++;
            }
        });
    });

    // -------------------------------------------------------------------------
    // HANDLE OVERFLOW PLAYERS
    // -------------------------------------------------------------------------
    let allTeams = [...mainTeams];

    if (overflowPlayers.length > 0) {
        let currentOverflowTeam: Team | null = null;

        overflowPlayers.forEach(player => {
            // Create new overflow team if needed
            if (
                !currentOverflowTeam ||
                currentOverflowTeam.players.length >= playersPerTeam
            ) {
                const newTeamId = allTeams.length + 1;
                const captainPlayer = { ...player, isCaptain: true };

                currentOverflowTeam = {
                    id: newTeamId,
                    name: `Team ${player.name}`,
                    players: [captainPlayer],
                    isOverflow: true,
                    positionCounts: {
                        DEF: player.preferred_position === 'DEF' ? 1 : 0,
                        MID: player.preferred_position === 'MID' ? 1 : 0,
                        ATT: player.preferred_position === 'ATT' ? 1 : 0,
                    },
                };

                allTeams.push(currentOverflowTeam);
            } else {
                // Add to existing overflow team
                currentOverflowTeam.players.push(player);
                currentOverflowTeam.positionCounts[player.preferred_position]++;
            }
        });
    }

    // -------------------------------------------------------------------------
    // ASSIGN FALLBACK CAPTAINS
    // -------------------------------------------------------------------------
    allTeams.forEach(team => {
        const hasCaptain = team.players.some(p => p.isCaptain);

        if (!hasCaptain && team.players.length > 0) {
            // Pick a RANDOM player to be captain
            const randomPlayerIndex = Math.floor(Math.random() * team.players.length);
            const captainPlayer = team.players[randomPlayerIndex];
            captainPlayer.isCaptain = true;

            // Update team name if it's generic
            if (team.name.startsWith('Team ') && !team.name.includes(captainPlayer.name)) {
                team.name = `Team ${captainPlayer.name}`;
            }
        }
    });

    return allTeams;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Fisher-Yates shuffle algorithm for randomizing player order
 * Used for fair distribution within position groups
 * 
 * @param array - Array to shuffle (mutates in place)
 * @returns The shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Get summary statistics for a team
 * Useful for displaying team composition in UI
 * 
 * @param team - Team object
 * @returns Summary with total players and position breakdown
 */
export function getTeamSummary(team: Team) {
    return {
        teamName: team.name,
        totalPlayers: team.players.length,
        defenders: team.positionCounts.DEF,
        midfielders: team.positionCounts.MID,
        attackers: team.positionCounts.ATT,
        isBalanced: isTeamBalanced(team),
    };
}

/**
 * Check if a team has balanced position distribution
 * A team is considered balanced if no position has 0 players
 * 
 * @param team - Team object
 * @returns True if team has at least one player per position
 */
export function isTeamBalanced(team: Team): boolean {
    const { DEF, MID, ATT } = team.positionCounts;
    return DEF > 0 && MID > 0 && ATT > 0;
}

/**
 * Validate player list before team generation
 * Checks for duplicates and invalid data
 * 
 * @param players - Array of players to validate
 * @returns Validation result with any errors
 */
export function validatePlayers(players: Player[]): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check for duplicates
    const ids = players.map(p => p.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    if (duplicateIds.length > 0) {
        errors.push(`Duplicate player IDs found: ${duplicateIds.join(', ')}`);
    }

    // Check for missing required fields
    players.forEach((player, index) => {
        if (!player.id) errors.push(`Player at index ${index} missing ID`);
        if (!player.name) errors.push(`Player at index ${index} missing name`);
        if (!player.preferred_position) {
            errors.push(`Player ${player.name || index} missing position`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
    };
}
