
export const getApplicationStats = (statuses: string[]) => {
    const stats: Record<string, any[]> = {};
    statuses.forEach((status) => {
      stats[status] = [
        {
          $match: status === "totals" ? {} : { status }, // Match specific status or all for totals
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            total: { $ifNull: ["$total", 0] },
          },
        },
      ];
    });
    return stats;
  };
  
  export const getApplicationStatsUnwind = () => [
    { $unwind: { path: "$totals", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$rejected", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$pending", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$shortlisted", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        stats: {
          totals: { $ifNull: ["$totals.total", 0] },
          approved: { $ifNull: ["$shortlisted.total", 0] },
          pending: { $ifNull: ["$pending.total", 0] },
          rejected: { $ifNull: ["$rejected.total", 0] },
        },
      },
    },
  ];

  const statuses = ["totals", "pending","shortlisted", "rejected"]; // Define statuses for stats

const Applicationsstats = getApplicationStats(statuses);
const ApplicationsstatsUnwindPath = getApplicationStatsUnwind();
export {Applicationsstats,ApplicationsstatsUnwindPath}

  