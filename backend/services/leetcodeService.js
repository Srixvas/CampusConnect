const fetchLeetCodeStats = async (username) => {
    const query = `
        query userProfile($username: String!) {
            matchedUser(username: $username) {
                username

                submitStats: submitStatsGlobal {
                    acSubmissionNum {
                        difficulty
                        count
                    }
                }
            }

            userContestRanking(username: $username) {
                attendedContestsCount
                rating
                globalRanking
            }
        }
    `;

    const response = await fetch(
        "https://leetcode.com/graphql",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Referer": "https://leetcode.com/",
                "User-Agent": "Mozilla/5.0"
            },
            body: JSON.stringify({
                query,
                variables: { username }
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `LeetCode returned HTTP ${response.status}`
        );
    }

    const result = await response.json();

    if (result.errors || !result.data?.matchedUser) {
        throw new Error("LeetCode profile not found or unavailable");
    }

    const user = result.data.matchedUser;
    const contest = result.data.userContestRanking;

    const counts = user.submitStats.acSubmissionNum;

    const totalSolved =
        counts.find(item => item.difficulty === "All")?.count || 0;

    return {
        username: user.username,
        problems_solved: totalSolved,
        rating: contest ? Math.round(contest.rating) : null,
        contests_participated:
            contest?.attendedContestsCount || 0,
        global_ranking: contest?.globalRanking || null,
        easy_solved:
            counts.find(item => item.difficulty === "Easy")?.count || 0,
        medium_solved:
            counts.find(item => item.difficulty === "Medium")?.count || 0,
        hard_solved:
            counts.find(item => item.difficulty === "Hard")?.count || 0
    };
};

module.exports = fetchLeetCodeStats;