import mongoose, { Types } from "mongoose";
import { NextFunction, Request, Response } from "express";

import Employer, {
  IEmployer,
  IEmployerFiles,
} from "@/models/portal/employer.model";
import { AppError } from "@/middlewares/error";
import { validateEmployer } from "@/validations/employer";
import Job from "@/models/portal/job.model";
import { Application } from "@/models/candidate/application.model";
import SubEmployer from "@/models/portal/SubEmployer.model";
import Candidate from "@/models/portal/candidate.model";
import ForwardedCV, {
  ForwardCVBody,
  ForwardingResult,
  ForwardingStatus,
  IForwardedCV,
} from "@/models/portal/Forwarwardedcv.model";

/**
 @desc      Create an employer
 @route     POST /api/v1/employer
 @access    Public
**/
const createEmployer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: IEmployer = req.body;

    payload["email"] = payload.email.toLowerCase();
    payload["userId"] = new Types.ObjectId(res.locals.userId);

    const employer = await Employer.create(payload);
    if (!employer) {
      throw new AppError("Failed to create employer", 400);
    }

    res.status(201).json({
      success: true,
      message: "employer created!",
      data: employer,
    });
  } catch (error) {
    next(error);
  }
};

interface DashboardData {
  jobs: object;
  business_name: string;
  // users: any;
  Applicationdata: object;
}

const EmployerDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id;
    const checkEmployer = await Employer.findOne({ _id: userId });
    if (!checkEmployer) {
      throw new AppError(`Failed to find an employer`, 400);
    }
    const today: Date = new Date();
    const lastYear: Date = new Date(today.setFullYear(today.getFullYear() - 1));
    const monthsArray: string[] = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const baseStats: any[] = [
      {
        $match: {
          createdAt: { $gte: lastYear },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: {
            $arrayElemAt: [monthsArray, { $subtract: ["$_id.month", 1] }],
          },
          total: 1,
        },
      },
    ];
    const [totalpostedjobs]: any[] = await Job.aggregate([
      {
        $match: {
          employerId: checkEmployer._id,
        },
      },

      {
        $facet: {
          postedjobs: [
            { $group: { _id: "$employerId", total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          stats: baseStats,
        },
      },
      {
        $unwind: {
          path: "$postedjobs",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          total: { $ifNull: ["$postedjobs.total", 0] },
          stats: 1,
        },
      },
    ]);

    // Application stats with status-based filtering
    const [Applicationdata]: any[] = await Application.aggregate([
      {
        $match: {
          employer: checkEmployer._id,
        },
      },
      {
        $facet: {
          Application: [
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0 } },
          ],
          Shortlist: [
            { $match: { status: "shortlisted" } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0 } },
          ],
          pendinglist: [
            { $match: { status: "pending" } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0 } },
          ],
          rejectedlist: [
            { $match: { status: "rejected" } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0 } },
          ],
          Applicationstats: baseStats,
          Shortliststats: [
            { $match: { status: "shortlisted" } }, // Filtering for accepted
            ...baseStats,
          ],
          pendingstats: [
            { $match: { status: "pending" } }, // Filtering for pending
            ...baseStats,
          ],
          rejectedstats: [
            { $match: { status: "rejected" } }, // Filtering for rejected
            ...baseStats,
          ],
        },
      },
      {
        $unwind: {
          path: "$Application",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$Shortlist",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$pendinglist",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$rejectedlist",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          Application: { $ifNull: ["$Application.total", 0] },
          Shortlist: { $ifNull: ["$Shortlist.total", 0] },
          pendinglist: { $ifNull: ["$pendinglist.total", 0] },
          rejectedlist: { $ifNull: ["$rejectedlist.total", 0] },
          Applicationstats: 1,
          Shortliststats: 1,
          pendingstats: 1,
          rejectedstats: 1,
        },
      },
    ]);

    let data: DashboardData = {
      jobs: totalpostedjobs,
      Applicationdata,
      business_name: checkEmployer.business_name, // Added business_name

      // users: users,
    };
    res.status(200).json({ data, message: "fetch data successful" });
  } catch (error) {
    next(error);
  }
};
/**
 @desc      Get all employer
 @route     POST /api/v1/employer
 @access    Public
**/
const getEmployers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, ...queries } = req.query;

    const pageOptions = {
      page: parseInt(page as string, 0) || 0,
      limit: parseInt(limit as string, 10) || 10,
    };

    const matchQueries: { [key: string]: RegExp } = {};
    const createRegex = (value: string) =>
      new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");

    for (const [key, value] of Object.entries(queries)) {
      if (typeof value === "string" && value !== "") {
        matchQueries[key] = createRegex(value);
      }
    }

    const employers = await Employer.aggregate([
      {
        $match: {
          ...matchQueries,
        },
      },
      {
        $facet: {
          data: [
            { $skip: pageOptions.page * pageOptions.limit },
            { $limit: pageOptions.limit },
          ],
          count: [{ $count: "total" }],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "employer fetched!",
      data: employers[0]?.data || [],
      count: employers[0]?.total[0]?.count || 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc      Get an employer
 @route     POST /api/v1/employer/:id
 @access    Public
**/
const getEmployer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    const employer = await Employer.findOne({ userId: id });
    if (!employer) {
      throw new AppError("Failed to find employer", 400);
    }

    res.status(200).json({
      success: true,
      data: employer,
      message: "employer fetched",
    });
  } catch (error) {
    next(error);
  }
};
const getSubEmployers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;

    const subEmployers = await SubEmployer.find({
      parentEmployerId: userId,
    }).select("name");

    res.status(200).json({ sucesess: true, data: subEmployers });
  } catch (error) {
    next(error);
  }
};
const ForwardCV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the current user's ID from locals
    const userId = new Types.ObjectId(res.locals.userId);

    // Destructure request body
    const { candidateId, subEmployerIds, notes } = req.body as ForwardCVBody;

    // Validate candidate ID
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    // Prepare forwarding results
    const forwardingResults: Array<ForwardingResult> = [];
    if (subEmployerIds && subEmployerIds.length > 0 && candidateId) {
      for (const subEmployerId of subEmployerIds) {
        // Check if already forwarded
        const alreadyForwarded = await ForwardedCV.isAlreadyForwarded(
          candidateId,
          subEmployerId
        );
        if (!alreadyForwarded) {
          // Create new forwarding record
          await ForwardedCV.create({
            candidateId,
            fromEmployerId: userId,
            toSubEmployerId: subEmployerId,
            status: ForwardingStatus.PENDING,
            additionalNotes: notes || undefined,
          });
        }
      }
    } else {
      throw new AppError("Sub-employer IDs or candidate ID missing", 400);
    }

    // Respond with results
    res.status(200).json({
      success: true,
      data: {
        candidateId,
        forwardedTo: subEmployerIds,
        forwardingResults,
      },
      message: "CV forwarding process completed",
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc      Update an employer
 @route     PUT /api/v1/employer/:id
 @access    Public
**/
const updateEmployer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: IEmployer = JSON.parse(req.body.parse);
    const files = req.files as unknown as IEmployerFiles;

    payload["email"] = payload.email.toLowerCase();
    const checkEmailExist = await Employer.findOne({ email: payload["email"] });

    if (checkEmailExist) {
      // Check if the existing email belongs to a different user
      if (!checkEmailExist.userId.equals(req.params.id)) {
        throw new AppError(
          "Email already registered, please use a different email!",
          400
        );
      }
    }
    // formatting the payload
    payload.logo = files?.logo?.[0] || payload?.logo;
    payload.videos = files?.["video[]"]?.[0] || payload?.videos;
    payload.pictures = files?.["picture[]"]?.[0] || payload?.pictures;

    console.log({ payload });
    // validate the data
    const check = await validateEmployer(payload);
    if (!check) {
      return;
    }

    const checkEmployer = await Employer.findOne({
      userId: new Types.ObjectId(req.params.id),
    });
    if (!checkEmployer) {
      payload["userId"] = new Types.ObjectId(res.locals.userId);
      const newEmployer = await Employer.create(payload);
      if (!newEmployer) {
        throw new AppError("Failed to create employer", 400);
      }
      return res.status(201).json({
        success: true,
        message: "Employer created!",
        data: newEmployer,
      });
    }

    const employer = await Employer.findByIdAndUpdate(
      checkEmployer._id,
      { $set: payload },
      { new: true, runValidators: true }
    );
    if (!employer) {
      throw new AppError("Failed to update employer", 400);
    }

    res.status(200).json({
      success: true,
      message: "Employer updated!",
      data: employer,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 @desc      Delete an employer
 @route     DELETE /api/v1/employer/:id
 @access    Public
**/
const deleteEmployer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const employer = await Employer.findByIdAndDelete(id);
    if (!employer) {
      throw new AppError("Failed to find employer", 400);
    }

    res.status(200).json({
      success: true,
      data: {},
      message: "employer deleted",
    });
  } catch (error) {
    next(error);
  }
};

interface CandidatQuery {
  qualification?:string;
  keyword?:string;
  category?:string;
  experience_from?:number
  experience_to?:number;
  limit:number;
  page:number;
}

const CandidatesForEmployer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      qualification, 
      keyword, 
      category, 
      experience_from, 
      experience_to,
      limit = 6,
      page = 1 
    } = req.query as Partial<CandidatQuery>;

    const matchConditions: any = {};

    // Build base conditions without adding them to matchConditions yet
    const qualificationMatch = qualification ? {
      education: {
        $elemMatch: {
          "qualification": qualification
        }
      }
    } : null;

    const keywordMatch = keyword ? {
      designation: { $regex: keyword, $options: "i" }
    } : null;

    const categoryMatch = category ? {
      employment: {
        $elemMatch: {
          "categories": {
            $elemMatch: {
              "value": category
            }
          }
        }
      }
    } : null;

    const dateConditions: any = {};
    if (experience_from) {
      dateConditions["$lte"] = new Date(
        new Date().setFullYear(new Date().getFullYear() - experience_from)
      );
    }
    if (experience_to) {
      dateConditions["$gte"] = new Date(
        new Date().setFullYear(new Date().getFullYear() - experience_to)
      );
    }
    
    const experienceMatch = (experience_from || experience_to) ? {
      employment: {
        $elemMatch: {
          "from": dateConditions
        }
      }
    } : null;

    // Combine conditions for final match
    Object.assign(matchConditions, 
      qualificationMatch,
      keywordMatch ? { "$or": [keywordMatch] } : null,
      categoryMatch,
      experienceMatch
    );

    const [results] = await Candidate.aggregate([
      { $match: matchConditions },
      
      // Calculate experience and scores
      {
        $addFields: {
          experienceYears: {
            $reduce: {
              input: "$employment",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $divide: [
                      {
                        $subtract: [
                          { $ifNull: ["$$this.to", new Date()] },
                          "$$this.from"
                        ]
                      },
                      1000 * 60 * 60 * 24 * 365
                    ]
                  }
                ]
              }
            }
          },
          // Calculate matching scores
          matchScore: {
            $add: [
              // Qualification match score (25 points)
              {
                $cond: {
                  if: {
                    $and: [
                      { $ne: [qualification, null] },
                      { $ne: [qualification, undefined] },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: "$education",
                                cond: { $eq: ["$$this.qualification", qualification] }
                              }
                            }
                          },
                          0
                        ]
                      }
                    ]
                  },
                  then: 25,
                  else: 0
                }
              },
              // Keyword match score (25 points)
              {
                $cond: {
                  if: {
                    $and: [
                      { $ne: [keyword, null] },
                      { $ne: [keyword, undefined] },
                      {
                        $regexMatch: {
                          input: "$designation",
                          regex: keyword || "",
                          options: "i"
                        }
                      }
                    ]
                  },
                  then: 25,
                  else: 0
                }
              },
              // Category match score (25 points)
              {
                $cond: {
                  if: {
                    $and: [
                      { $ne: [category, null] },
                      { $ne: [category, undefined] },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: "$employment",
                                cond: {
                                  $gt: [
                                    {
                                      $size: {
                                        $filter: {
                                          input: "$$this.categories",
                                          cond: { $eq: ["$$this.value", category] }
                                        }
                                      }
                                    },
                                    0
                                  ]
                                }
                              }
                            }
                          },
                          0
                        ]
                      }
                    ]
                  },
                  then: 25,
                  else: 0
                }
              },
              // Experience match score (25 points)
              {
                $cond: {
                  if: {
                    $and: [
                      {
                        $or: [
                          { $ne: [experience_from, null] },
                          { $ne: [experience_to, null] }
                        ]
                      },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: "$employment",
                                cond: {
                                  $and: [
                                    experience_from ? {
                                      $lte: ["$$this.from", new Date(new Date().setFullYear(new Date().getFullYear() - experience_from))]
                                    } : true,
                                    experience_to ? {
                                      $gte: ["$$this.from", new Date(new Date().setFullYear(new Date().getFullYear() - experience_to))]
                                    } : true
                                  ]
                                }
                              }
                            }
                          },
                          0
                        ]
                      }
                    ]
                  },
                  then: 25,
                  else: 0
                }
              }
            ]
          }
        }
      },

      // Sort by score first, then creation date
      { $sort: { 
        "matchScore": -1,
        "createdAt": -1 
      }},
      {
        $project:{
          name:1,
          designation:1,
          "employment.categories":1,
          "profile.filename":1,
          "experienceYears":1,
          matchScore:1,
          contact:1
        }
      },

      // Pagination using facet
      {
        $facet: {
          data: [
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) }
          ],
          totalCount: [
            { $count: 'count' }
          ]
        }
      },

      // Unwind totalCount while preserving empty results
      {
        $unwind: {
          path: '$totalCount',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: results?.data || [],
      totalCount: results?.totalCount?.count || 0,
      totalPages: Math.ceil((results?.totalCount?.count || 0) / limit)
    });
  } catch (error) {
    next(error);
  }
};

export {
  createEmployer,
  getEmployers,
  getEmployer,
  CandidatesForEmployer,
  updateEmployer,
  deleteEmployer,
  EmployerDashboard,
  ForwardCV,
  getSubEmployers,
};
