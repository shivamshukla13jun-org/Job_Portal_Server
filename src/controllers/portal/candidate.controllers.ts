import { Types } from "mongoose";
import { NextFunction, Request, Response } from "express";

import { AppError } from "@/middlewares/error";
import Candidate, { ICandidate } from "@/models/portal/candidate.model";
import { ICandidateFiles } from "@/types/candidate";
import { validateCandidate } from "@/validations/candidate";
import { Application } from "@/models/candidate/application.model";
import User from "@/models/admin/user.model";

/**
 @desc      Create a candidate
 @route     POST /api/v1/candidate
 @access    Public
**/
const createCandidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: ICandidate = req.body;

        payload["userId"] = new Types.ObjectId(res.locals.userId);

        const candidate = await Candidate.create(payload);
        if (!candidate) {
            throw new AppError('Failed to create candidate', 400);
        }
        await User.updateOne({_id:req.params.id,},{$set:{candidateId:candidate._id}})

        res.status(201).json({
            success: true,
            message: 'Candidate created!',
            data: candidate
        })

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Get all candidate
 @route     GET /api/v1/candidate
 @access    Admin
**/
const getCandidates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, ...queries } = req.query

        const pageOptions = {
            page: parseInt(page as string, 0) || 0,
            limit: parseInt(limit as string, 10) || 10
        }

        const matchQueries: { [key: string]: RegExp } = {};
        const createRegex = (value: string) => new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");

        for (const [key, value] of Object.entries(queries)) {
            if (typeof value === 'string' && value !== '') {
                matchQueries[key] = createRegex(value)
            }
        }

        const candidates = await Candidate.aggregate([
            {
                $match: {
                    ...matchQueries
                }
            },
            {
                $facet: {
                    data: [
                        { $skip: (pageOptions.page-1) * pageOptions.limit },
                        { $limit: pageOptions.limit }
                    ],
                    count: [
                        { $count: "total" }
                    ]
                }
            }
        ])

        res.status(200).json({
            success: true,
            message: 'Candidate fetched!',
            data: candidates[0]?.data || [],
            count: candidates[0]?.total[0]?.count || 0,
        })

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Get a candidate
 @route     GET /api/v1/candidate/:id
 @access    Private
**/
const getCandidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const candidate = await Candidate.findOne({ userId: id }).populate("employment.categories").populate({
            path:"contact.permanent_address.city",
            model:"City"
        }).populate({
            path:"contact.permanent_address.state",
            model:"State"
        }).populate({
            path:"contact.permanent_address.country",
            model:"Country"
        }).populate({
            path:"contact.current_address.city",
            model:"City"
        }).populate({
            path:"contact.current_address.state",
            model:"State"
        }).populate({
            path:"contact.current_address.country",
            model:"Country"
        })
        if (!candidate) {
            throw new AppError('Failed to find candidate', 400);
        };

        res.status(200).json({
            success: true,
            data: candidate,
            message: 'Candidate fetched'
        });

    } catch (error) {
        next(error)
    }
};

/**
 @desc      Update a candidate
 @route     PUT /api/v1/candidate/:id
 @access    Public
**/
const updateCandidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payload: ICandidate = JSON.parse(req.body.parse);
        const files = req.files as unknown as ICandidateFiles;

        // formatting the payload
        if (typeof payload.contact.permanent_address.pin_code === 'string') {
            payload.contact.permanent_address.pin_code = parseInt(payload.contact.permanent_address.pin_code);
        }
        if (payload.contact.current_address && typeof payload.contact.current_address.pin_code === 'string') {
            if (payload.contact.current_address.pin_code === '') {
                delete payload.contact.current_address;
            } else {
                payload.contact.current_address.pin_code = parseInt(payload.contact.current_address.pin_code)
            }

        }
        payload["email"] = payload?.email?.toLowerCase();
        payload["email"] = payload?.email?.toLowerCase();
        payload.cv = files?.upload_cv?.[0] || payload?.cv;
        payload.profile = files?.profile?.[0] || payload?.profile;
        
        // validate the data
        const check = await validateCandidate(payload);
        if (!check) {
            return;
        }

        const checkCandidate = await Candidate.findOne({ userId: new Types.ObjectId(req.params.id) });
        if (!checkCandidate) {
            payload["userId"] = new Types.ObjectId(res.locals.userId);
            const newCandidate = await Candidate.create(payload);
            if (!newCandidate) {
                throw new AppError('Failed to create candidate', 400);
            }
            await User.updateOne({_id:req.params.id,},{$set:{candidateId:newCandidate._id}})
            return res.status(201).json({
                success: true,
                message: 'Candidate created!',
                data: newCandidate
            });
        };

        const candidate = await Candidate.findByIdAndUpdate(checkCandidate._id, payload, { new: true, runValidators: true })
        if (!candidate) {
            throw new AppError('Failed to update candidate', 400)
        }

        res.status(200).json({
            success: true,
            message: 'Candidate updated!',
            data: candidate
        })

    } catch (error) {
        console.log(error)
        next(error)
    }
};

/**
 @desc      Delete a candidate
 @route     DELETE /api/v1/candidate/:id
 @access    Public
**/
const deleteCandidate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;

        const candidate = await Candidate.findByIdAndDelete(id);
        if (!candidate) {
            throw new AppError('Failed to find candidate', 400);
        }

        res.status(200).json({
            success: true,
            data: {},
            message: 'Candidate deleted'
        });

    } catch (error) {
        next(error)
    }
};
interface DashboardData {
    Applicationdata:object,
    user:object

}

const   candidateDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        
        const userId = res.locals.userId as Types.ObjectId
        const checkCandidate = await Candidate.findOne({ userId: userId });
        if (!checkCandidate) {
            throw new AppError(`Failed to find an Candidate Please Complete Your Profile`, 400);
        }
        const today: Date = new Date();
        const lastYear: Date = new Date(today.setFullYear(today.getFullYear() - 1));
        const monthsArray: string[] = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
    
        const baseStats: any[] = [
            {
                $match: {
                    createdAt: { $gte: lastYear }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    total: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: {
                        $arrayElemAt: [monthsArray, { $subtract: ["$_id.month", 1] }]
                    },
                    total: 1
                }
            },
        ];

   

        // Application stats with status-based filtering
        const [Applicationdata]:any[] = await Application.aggregate([
            {
                $match:{
                    candidate:checkCandidate._id
              },
            },
            {
                $facet: {
                    Application: [
                        { $group: { _id: null, total: { $sum: 1 } } },
                        { $project: { _id: 0 } }
                    ],
                    Shortlist: [
                        { $match: { status: "shortlisted" } },
                        { $group: { _id: null, total: { $sum: 1 } } },
                        { $project: { _id: 0 } }
                    ],
                    pendinglist: [
                        { $match: { status: "pending" } },
                        { $group: { _id: null, total: { $sum: 1 } } },
                        { $project: { _id: 0 } }
                    ],
                    rejectedlist: [
                        { $match: { status: "rejected" } },
                        { $group: { _id: null, total: { $sum: 1 } } },
                        { $project: { _id: 0 } }
                    ],
                    Applicationstats: baseStats,
                    Shortliststats: [
                      { $match:{ status: "shortlisted" } } ,// Filtering for accepted
                        ...baseStats,
                    ],
                    pendingstats: [
                      { $match: { status: "pending" } }, // Filtering for pending
                        ...baseStats,
                    ],
                    rejectedstats: [
                      { $match: {  status: "rejected" } }, // Filtering for rejected
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
            Applicationdata,
            user:checkCandidate
            // users: users,
        };
        res.status(200).json({ data, message: "fetch data successful" });
    } catch (error) {
        next(error);
    }
}
export {
    createCandidate, getCandidates, getCandidate, updateCandidate, deleteCandidate,candidateDashboard
}