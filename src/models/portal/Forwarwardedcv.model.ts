import { Schema, Document, Types, model, Model } from "mongoose";

// Enum for forwarding status
export enum ForwardingStatus {
    PENDING = 'pending',
    VIEWED = 'viewed',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected'
}
// Update interface to use string representation of ObjectId
export interface ForwardCVBody {
    applicationid: Types.ObjectId;
    subEmployerIds?: Types.ObjectId[];
    notes?: string;
}

// Define a type for forwarding results
export interface ForwardingResult {
    toSubEmployerId: Types.ObjectId;
    fromEmployerId: Types.ObjectId;
    applicationid: Types.ObjectId;
    status: string;
    additionalNotes?: string;
    message: string;
}

// Interface for ForwardedCV document
export interface IForwardedCV extends Document {
    applicationid: Types.ObjectId;
    fromEmployerId: Types.ObjectId;
    toSubEmployerId: Types.ObjectId;
    status: ForwardingStatus;
    forwardedAt: Date;
    viewedAt?: Date;
    actionTakenAt?: Date;
    additionalNotes?: string;
    isActive: boolean;
    indexes:any
}

const forwardedCVSchema = new Schema<IForwardedCV>({
    applicationid: {
        type: Schema.Types.ObjectId,
        ref: 'Candidate',
        required: [true, 'Candidate ID is required']
    },
    fromEmployerId: {
        type: Schema.Types.ObjectId,
        ref: 'Employer',
        required: [true, 'Source Employer ID is required']
    },
    toSubEmployerId: {
        type: Schema.Types.ObjectId,
        ref: 'SubEmployer',
        // required: [true, 'Destination Sub-Employer ID is required']
    },
    status: {
        type: String,
        enum: Object.values(ForwardingStatus),
        default: ForwardingStatus.PENDING
    },
    forwardedAt: {
        type: Date,
        default: Date.now
    },
    viewedAt: {
        type: Date
    },
    actionTakenAt: {
        type: Date
    },
    additionalNotes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
});
// Create indexes after schema definition

forwardedCVSchema.index({ fromEmployerId: 1 });
forwardedCVSchema.index({ toSubEmployerId: 1 });
forwardedCVSchema.index({ status: 1 });

// Static method to check if a candidate has already been forwarded to a sub-employer
forwardedCVSchema.statics.isAlreadyForwarded = async function(
    applicationid: Types.ObjectId, 
    toSubEmployerId: Types.ObjectId
): Promise<boolean> {
    const existingForwarding = await this.findOne({
        applicationid,
        toSubEmployerId,
    });
    return !!existingForwarding;
};

// Method to update forwarding status
forwardedCVSchema.methods.updateStatus = function(
    newStatus: ForwardingStatus, 
    notes?: string
): void {
    this.status = newStatus;
    this.actionTakenAt = new Date();
    
    if (notes) {
        this.additionalNotes = notes;
    }

    // Special handling for viewed status
    if (newStatus === ForwardingStatus.VIEWED && !this.viewedAt) {
        this.viewedAt = new Date();
    }
};

// Extend the schema with a type-safe static method
interface ForwardedCVModel extends Model<IForwardedCV> {
    isAlreadyForwarded(
        applicationid: Types.ObjectId, 
        toSubEmployerId: Types.ObjectId
    ): Promise<boolean>;
}

// Create the ForwardedCV model
const ForwardedCV = model<IForwardedCV, ForwardedCVModel>("ForwardedCV", forwardedCVSchema);

export default ForwardedCV;