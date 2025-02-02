import { Schema, Document, Types, model } from "mongoose";


// Interface for dashboard access permissions

// Sub Employer Schema
export interface IEmailTemplate extends Document {
    name: string;
    body: string;
    subject: string;
    isActive: boolean;
    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Create the EmailTemplate model
const EmailTemplate = model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);

export default EmailTemplate;