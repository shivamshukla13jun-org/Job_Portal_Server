import { Schema, Document, Types, model } from "mongoose";

export interface IUserType extends Document {
    name: string;
    forAdmin: boolean;
}

const userTypeSchema = new Schema<IUserType>({
    name: {
        type: String,
        required: true
    },
    forAdmin: {
        type: Boolean,
        required: true
    }
}, { timestamps: true });

export const UserType = model<IUserType>('UserType', userTypeSchema)