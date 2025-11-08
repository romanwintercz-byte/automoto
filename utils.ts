import { Match, Player, TournamentSettings } from './types';

/**
 * Triggers haptic feedback (vibration) on supported devices.
 * @param pattern A number or array of numbers representing the vibration pattern in milliseconds.
 */
export const triggerHapticFeedback = (pattern: number | number[] = 50) => {
    if (window.navigator && 'vibrate' in window.navigator) {
        try {
            window.navigator.vibrate(pattern);
        } catch (error) {
            console.warn("Haptic feedback failed:", error);
        }
    }
};

/**
 * Creates a JSON blob from data and triggers a download.
 * @param data The JavaScript object to export.
 * @param filename The desired name for the downloaded file.
 */
export const exportDataToFile = (data: object, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


/**
 * Converts a data URL string to a File object.
 * @param dataurl The data URL string.
 * @param filename The desired filename for the resulting File object.
 * @returns A File object or null if conversion fails.
 */
export const dataURLtoFile = (dataurl: string, filename: string): File | null => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};


// --- TOURNAMENT GENERATION UTILS ---

type PlayerWithStats = Player & { average: number };

export const generateRoundRobinMatches = (playerIds: string[], groupId?: string): Match[] => {
    const matches: Match[] = [];
    for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
            matches.push({
                id: `match-${Date.now()}-${i}-${j}${groupId ? `-${groupId}`: ''}`,
                player1Id: playerIds[i],
                player2Id: playerIds[j],
                status: 'pending',
                groupId,
            });
        }
    }
    return matches;
};

export const generateKnockoutBracket = (playersWithStats: PlayerWithStats[], settings: TournamentSettings): Match[] => {
    let players = [...playersWithStats];

    if (settings.seeding === 'random') {
        for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }
    } else {
        players.sort((a, b) => b.average - a.average);
    }
    
    const numPlayers = players.length;
    if (numPlayers < 2) return [];

    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
    const byes = bracketSize - numPlayers;

    const rounds: Match[][] = [];
    let currentPlayers = players.map(p => ({ id: p.id, type: 'player' as 'player' | 'bye' }));

    // Add byes to the end of the list, they will be matched against top seeds
    for (let i = 0; i < byes; i++) {
        currentPlayers.push({ id: `bye-${i}`, type: 'bye' });
    }

    let roundNum = 1;
    while (currentPlayers.length > 1) {
        const roundMatches: Match[] = [];
        const nextRoundPlayerSlots: any[] = [];
        
        for (let i = 0; i < currentPlayers.length / 2; i++) {
            const p1 = currentPlayers[i];
            const p2 = currentPlayers[currentPlayers.length - 1 - i];

            const match: Match = {
                id: `match-${Date.now()}-r${roundNum}-${i}`,
                player1Id: p1.type === 'player' ? p1.id : null,
                player2Id: p2.type === 'player' ? p2.id : null,
                status: 'pending',
                round: roundNum,
            };

            if (p1.type === 'bye' || p2.type === 'bye') {
                match.status = 'completed';
                const winnerId = p1.type === 'player' ? p1.id : p2.id;
                match.result = { player1Score: 0, player2Score: 0, winnerId };
                nextRoundPlayerSlots.push({ id: winnerId, type: 'player' });
            } else {
                nextRoundPlayerSlots.push({ id: match.id, type: 'match' });
            }
            roundMatches.push(match);
        }
        rounds.push(roundMatches);
        currentPlayers = nextRoundPlayerSlots;
        roundNum++;
    }

    const allMatches = rounds.flat();

    // Link matches to their next match
    allMatches.forEach(match => {
        if (match.status === 'pending' && match.round) {
            const nextRound = rounds[match.round]; // round is 1-based, index is 0-based
            if (nextRound) {
                const nextMatch = nextRound.find(m => m.player1Id === null || m.player2Id === null);
                if (nextMatch) {
                    // This is a simplification; a full implementation needs proper slotting
                }
            }
        }
    });

    for (let r = 0; r < rounds.length - 1; r++) {
        for (let i = 0; i < rounds[r].length; i++) {
            const match = rounds[r][i];
            const nextMatchIndex = Math.floor(i / 2);
            const nextMatch = rounds[r+1][nextMatchIndex];
            if (nextMatch) {
                match.nextMatchId = nextMatch.id;
            }
        }
    }

    return allMatches;
};

export const generateCombinedTournament = (playersWithStats: PlayerWithStats[], settings: TournamentSettings): Match[] => {
    let players = [...playersWithStats];
    const { numGroups = 1, playersAdvancing = 1 } = settings;

    if (settings.seeding === 'random') {
        for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }
    } else {
        players.sort((a, b) => b.average - a.average);
    }

    const groups: string[][] = Array.from({ length: numGroups }, () => []);
    players.forEach((player, index) => {
        // Serpentine seeding for groups
        const groupIndex = index % numGroups;
        const rowIndex = Math.floor(index / numGroups);
        if(rowIndex % 2 === 0) {
            groups[groupIndex].push(player.id);
        } else {
            groups[numGroups - 1 - groupIndex].push(player.id);
        }
    });

    const groupMatches = groups.flatMap((playerIds, index) => 
        generateRoundRobinMatches(playerIds, `group-${index}`)
    );

    const numAdvancing = numGroups * playersAdvancing;
    const knockoutPlayers = Array.from({ length: numAdvancing }, () => ({ id: '', name: '', avatar: '', average: 0 }));
    const knockoutMatches = generateKnockoutBracket(knockoutPlayers, { ...settings, seeding: 'random' });

    return [...groupMatches, ...knockoutMatches];
};
