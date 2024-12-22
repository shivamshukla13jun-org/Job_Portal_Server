export const EmployerDashBoardGraph= [
   // Step 2: Lookup candidates
{
    $lookup: {
        from: 'candidates', // Collection name for candidates
        let: {
            jobCategories: {
                $ifNull: ['$categories', []], // Ensure jobCategories is an array
            },
            jobExperience: '$candidate_requirement.experience',
        },
        pipeline: [
            // Unwind employment array to process each job
            { $unwind: { path: '$employment', preserveNullAndEmptyArrays: true } },

            // Match candidates based on job criteria
            {
                $match: {
                    $expr: {
                        $and: [
                            // Match categories (job sector)
                            {
                                $in: [
                                    {
                                        $ifNull: [
                                            { $arrayElemAt: ['$employment.categories.value', 0] },
                                            null,
                                        ],
                                    },
                                    '$$jobCategories.value',
                                ],
                            },

                            // Calculate candidate's experience in years
                            {
                                $gte: [
                                    {
                                        $divide: [
                                            {
                                                $subtract: [
                                                    new Date(),
                                                    { $ifNull: ['$employment.from', new Date(0)] },
                                                ],
                                            },
                                            1000 * 60 * 60 * 24 * 365, // Convert ms to years
                                        ],
                                    },
                                    '$$jobExperience',
                                ],
                            },
                        ],
                    },
                },
            },

            // Calculate total experience for each employment entry
            {
                $addFields: {
                    experienceYears: {
                        $divide: [
                            {
                                $subtract: [
                                    { $ifNull: ['$employment.to', new Date()] }, // Use 'to' or current date
                                    { $ifNull: ['$employment.from', new Date(0)] }, // Use 'from' or epoch
                                ],
                            },
                            1000 * 60 * 60 * 24 * 365, // Convert ms to years
                        ],
                    },
                },
            },

            // Calculate matchScore based on experience and category match
            {
                $addFields: {
                    matchScore: {
                        $sum: [
                            // Add points for category match
                            {
                                $cond: [
                                    {
                                        $in: [
                                            {
                                                $ifNull: [
                                                    { $arrayElemAt: ['$employment.categories.value', 0] },
                                                    null,
                                                ],
                                            },
                                            '$$jobCategories.value',
                                        ],
                                    },
                                    50, // Points for category match
                                    0,  // No points if no match
                                ],
                            },
                            // Add points for experience match
                            {
                                $cond: [
                                    {
                                        $gte: [
                                            {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            new Date(),
                                                            { $ifNull: ['$employment.from', new Date(0)] },
                                                        ],
                                                    },
                                                    1000 * 60 * 60 * 24 * 365, // Convert ms to years
                                                ],
                                            },
                                            '$$jobExperience',
                                        ],
                                    },
                                    50, // Points for experience match
                                    0,  // No points if no match
                                ],
                            },
                        ],
                    },
                },
            },
          {  $project:{
                matchScore:1
            }}

        ],
        as: 'matchedCandidates',
    },
},

// Step 3: Filter jobs with no matching candidates
{
    $match: {
        matchedCandidates: { $ne: [] }, // Ensure matchedCandidates is not empty
    },
},
{
    $project:{
        matchedCandidates:1
    }
}



]