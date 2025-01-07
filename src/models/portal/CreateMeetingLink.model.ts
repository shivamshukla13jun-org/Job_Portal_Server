import mongoose, { Document, Schema, Types } from 'mongoose';
export interface IInterviewDetails {
    message:string;
    confirm:boolean;

}
// Define the Meeting interface
export interface IMeeting extends Document {
    date: string;
    serId: Types.ObjectId
    time: string;
    timeDuration: string;
    email: string;
    phone: string;
    message: string;
    intrviewConfirmation: IInterviewDetails;
    meetingLink: string;
    createdBy:string;
}

// Define the Meeting schema
const MeetingSchema: Schema = new Schema({
    date: { type: String, required: true },
    time: { type: String, required: true },
    timeDuration: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: false },
    meetingLink: { type: String, default:"" },
    address: { type: String, default:"" },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator ID is required']
    },
    intrviewConfirmation: {
        message: {
            type: String,
            default: ""
        },
        confirm: {
            type: Boolean,
            default: false
        },
    },
}, {
    timestamps: true,
});

// Create the Meeting model
const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema);

export default Meeting;
