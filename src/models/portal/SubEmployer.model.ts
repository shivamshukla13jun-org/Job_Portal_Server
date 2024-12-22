import { Schema, Document, Types, model } from "mongoose";

// Enum for dashboard access levels
export enum AccessLevel {
    VIEW = 'view',
    CREATE = 'create', 
    UPDATE = 'update',
    DELETE = 'delete',
    REJECT = 'reject',
    ACCEPT = 'accept',
    DOWNLOAD='download'
}

// Interface for dashboard access permissions

// Sub Employer Schema
export interface ISubEmployer extends Document {
    parentEmployerId: Types.ObjectId;
    userId: Types.ObjectId;
    email: string;
    name: string;
    department: string;
    phone: string;
    dashboardPermissions: object;
    isActive: boolean;
    createdBy: Types.ObjectId;
}

const subEmployerSchema = new Schema<ISubEmployer>({
    parentEmployerId: {
        type: Schema.Types.ObjectId,
        ref: 'Employer',
        required: [true, 'Parent Employer ID is required']
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    department: {
        type: String,
        required: [true, 'department is required']
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    dashboardPermissions: {
        type:Object
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator ID is required']
    }
}, { timestamps: true });

// Create the SubEmployer model
const SubEmployer = model<ISubEmployer>("SubEmployer", subEmployerSchema);

export default SubEmployer;