import { Request } from "express";
import { postedatesCondition } from "./postedadate";
import { fromStringToJSON } from "@/libs";
import { Types } from "mongoose";

const FilterJob=(req:Request,matchQueries: Record<string, any> = {})=>{
    const { page: reqPage, limit: reqLimit,createdAt,experience_from,experience_to, ...queries } = req.query;

    const createRegex = (value: string) => new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");
     // Handle date filter
     if (createdAt) {
        let startDate=postedatesCondition(createdAt  as string )
        if (startDate) {
            matchQueries['createdAt'] = { $gte: startDate };
        }
        
    }
    for (let [key, value] of Object.entries(queries)) {
        if (typeof value === 'string' && value !== '' && !['keyword', 'sort', 'location', 'categories','jobtype','isFeatured'].includes(key)) {
            matchQueries[key] = createRegex(value)
        };
        if (typeof value === 'string' && value !== '' && key === 'keyword') {
            matchQueries["$and"] = [
              {"$or":[
                {
                    "title": createRegex(value)
                },
                {
                    "employerId.business_name": createRegex(value)
                },
                {
                    "employerId.keywords": createRegex(value)
                },
              ]}
            ]
        };

        if (typeof value === 'string' && value !== '' && key === 'location') {
            matchQueries["$or"] = [
                {
                    "location.name": createRegex(value)
                },
              
                {
                    "place.name": createRegex(value)
                },
                {
                    "address.pin_code": createRegex(value)
                },
                
            ]
        };

        if (typeof value === 'string' && value !== '' && key === 'categories') {
            const categories = value.split(",").map(id => new Types.ObjectId(id));
            matchQueries["categories._id"] = {$in:categories}
        }
        if (typeof value === 'string' && value !== '' && key === 'jobtype') {
            matchQueries["jobtype"] = {$in:value.split(",")}
        }
        if (typeof value === 'string' && value !== '' && key === 'isFeatured') {
            matchQueries["isFeatured"] =fromStringToJSON(value)
        }
       // Salary range filter
       if (key === 'candidate_requirement.salary_from' && value) {
        matchQueries['candidate_requirement.salary_from']= {$gte: parseInt(value as string)} 
    }
    if (key === 'candidate_requirement.salary_to' && value) {
        matchQueries['candidate_requirement.salary_to']= {$lte: parseInt(value as string) }
    }
    if (key === 'candidate_requirement.experience' && value) {
        matchQueries['candidate_requirement.experience']= {$lte: parseInt(value as string) }
    }
}

if (experience_to && experience_from) {
    matchQueries['candidate_requirement.experience']= {$gte: parseInt(experience_from as string),$lte: parseInt(experience_to as string) }
}
  return {matchQueries}
}
const FilterAdminJob=(req:Request,matchQueries: Record<string, any> = {})=>{
    const { page: reqPage, limit: reqLimit,createdAt,experience_from,experience_to, ...queries } = req.query;

    const createRegex = (value: string) => new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");
     // Handle date filter
     if (createdAt) {
        let startDate=postedatesCondition(createdAt  as string )
        if (startDate) {
            matchQueries['createdAt'] = { $gte: startDate };
        }
        
    }
    for (let [key, value] of Object.entries(queries)) {
        if (typeof value === 'string' && value !== '' && !['keyword', 'sort', 'location', 'categories','jobtype','isFeatured'].includes(key)) {
            matchQueries[key] = createRegex(value)
        };
        if (typeof value === 'string' && value !== '' && key === 'keyword') {
            matchQueries["$and"] = [
              {"$or":[
                {
                    "title": createRegex(value)
                },
                {
                    "employerId.business_name": createRegex(value)
                },
                {
                    "employerId.keywords": createRegex(value)
                },
              ]}
            ]
        };

        if (typeof value === 'string' && value !== '' && key === 'location') {
            const locations = value.split(",").map(id => new Types.ObjectId(id));
            matchQueries["place"] = {$in:locations}
        };

        if (typeof value === 'string' && value !== '' && key === 'categories') {
            const categories = value.split(",").map(id => new Types.ObjectId(id));
            matchQueries["categories"] = {$in:categories}
        }
        if (typeof value === 'string' && value !== '' && key === 'jobtype') {
            matchQueries["jobtype"] = {$in:value.split(",")}
        }
        if (typeof value === 'string' && value !== '' && key === 'isFeatured') {
            matchQueries["isFeatured"] =fromStringToJSON(value)
        }
        if (typeof value === 'string' && value !== '' && key === 'status') {
            matchQueries["isActive"] =fromStringToJSON(value)
            delete matchQueries["status"]
        }
       // Salary range filter
       if (key === 'candidate_requirement.salary_from' && value) {
        matchQueries['candidate_requirement.salary_from']= {$gte: parseInt(value as string)} 
    }
    if (key === 'candidate_requirement.salary_to' && value) {
        matchQueries['candidate_requirement.salary_to']= {$lte: parseInt(value as string) }
    }
    if (key === 'candidate_requirement.experience' && value) {
        matchQueries['candidate_requirement.experience']= {$lte: parseInt(value as string) }
    }
}

if (experience_to && experience_from) {
    matchQueries['candidate_requirement.experience']= {$gte: parseInt(experience_from as string),$lte: parseInt(experience_to as string) }
}
  return {matchQueries}
}
export {FilterJob,FilterAdminJob}