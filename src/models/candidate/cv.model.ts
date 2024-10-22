import { Schema, Document, Types, model } from "mongoose";
import { IFile } from "@/types/file";

export interface ICV extends Document {
    candidateId: Types.ObjectId;
    cvs: IFile[];
}

export type ICVFile = {
    "cv[]": IFile[];
}

const cvSchema = new Schema<ICV>({
    candidateId: {
        type: Schema.Types.ObjectId,
        ref: 'Candidate'
    },
    cvs: [
        {
            type: Object,
            required: [true, 'CV is required']
        }
    ]
}, { timestamps: true });

const CV = model<ICV>("CV", cvSchema)

export default CV;