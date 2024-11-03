import { NextFunction, Request, Response } from 'express';
import { JobportalPlan } from '@/models/portal/plan.model';
import { IJobportalPlan, IRazorPayPlan } from '@/types/plan';
import { AppError } from '@/middlewares/error';

interface PlanPayload {
    name: string;
    [key: string]: any;
}

interface QueryParams {
    page?: string;
    limit?: string;
}
const month: Record<string, number> = {
    "quarterly": 3,
    "monthly": 1,
    "yearly": 12,
};
export default {
    addPlan: async (req: Request, res: Response,next:NextFunction) => {
        try {
            let payload: IJobportalPlan = req.body;
            let planData: IJobportalPlan;
    
                payload["name"] = payload.name.charAt(0).toUpperCase() + payload.name.slice(1);
                let type = payload["type"] as keyof typeof month;
                
                // Type assertion or check for `type` in `month`
                if (type && month[type]) {
                    payload["month"] = month[type];
                    planData = await JobportalPlan.create(payload);
                } else {
                    throw new AppError("Invalid plan type",400);
                }
            
    
            if (!planData) {
                throw new AppError("Failed to add",400)
            } 
            return res.status(200).json({ status: 200, message: 'Plan Added Successfully', data: planData });
        } catch (error) {
            next(error);
        }
    },

    planList: async (req: Request, res: Response,next:NextFunction) => {
        try {
            const { page, limit }: QueryParams = req.query;
            if (page || limit) {
                const planData = await JobportalPlan.find({isActive:true})
                    .skip((Number(page) - 1) * Number(limit))
                    .limit(Number(limit));
                let count = await JobportalPlan.countDocuments();
                if (planData) {
                    return res.status(200).json({ status: 200, message: "data found", data: planData, total: count });
                } else {
                    return res.status(400).json({ status: 400, message: 'No data found' });
                }
            } else {
                const planData = await JobportalPlan.find({ status: 1 });
                if (planData) {
                    return res.status(200).json({ status: 200, message: "data found", data: planData });
                } else {
                    return res.status(400).json({ status: 400, message: 'No data found' });
                }
            }
        } catch (error) {
            next(error)
        }
    },

    getPlandetailsbyid: async (req: Request, res: Response,next:NextFunction) => {
        try {
            const { id } = req.params;
            const planData = await JobportalPlan.findById(id);
            if (planData) {
                return res.status(200).json({ status: 200, message: "data found", data: planData });
            } else {
                return res.status(400).json({ status: 400, message: 'No data found' });
            }
        } catch (error) {
            next(error)
        }
    },


    planUpdate: async (req: Request, res: Response,next:NextFunction) => {
        try {
            const { id, name, price, content, position, status }: { id: string; name?: string; price?: number; content?: string; position?: number; status?: number } = req.body;
            let update: { [key: string]: any } = {};

            if (status !== undefined) {
                update.status = status;
            }
            if (name) {
                update.name = name.charAt(0).toUpperCase() + name.slice(1);
            }
            if (price) {
                update.price = price;
            }
            if (content) {
                update.content = content;
            }
            if (position) {
                update.position = position;
            }

            const updatedPlan = await JobportalPlan.findByIdAndUpdate(
                id,
                update,
                { new: true }
            );

            if (updatedPlan) {
                return res.status(200).json({ status: 200, message: "Updated Successfully", data: updatedPlan });
            } else {
                return res.status(400).json({ status: 400, message: 'Failed to update' });
            }
        } catch (error) {
            next(error)
        }
    },
}