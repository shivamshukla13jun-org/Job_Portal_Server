import mongoose, { Document, Schema } from 'mongoose';
export interface IInterviewDetails {
    message:string;
    confirm:boolean;

}
interface IApplication extends Document {
    job: mongoose.Types.ObjectId;
    candidate: mongoose.Types.ObjectId;
    employer: mongoose.Types.ObjectId;
    intrviewConfirmation:IInterviewDetails
    status: 'pending' | 'shortlisted' | 'rejected';
}

const applicationSchema: Schema<IApplication> = new Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer',
        required: true
    },
    intrviewConfirmation:{
        message:{
            type:String,
            default:""
        },
        confirm:{
            type:Boolean,
            default:false
        },
    },
    status: {
        type: String,
        enum: ['pending', 'shortlisted', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

applicationSchema.pre<IApplication>('save', function (next) {
    if (this.isModified('status')) {
        this.status = this.status?.toLowerCase() as 'pending' | 'shortlisted' | 'rejected';
        const data=this
        console.log("data",data)

    }
    next();
});

const Application = mongoose.model<IApplication>("Application", applicationSchema);
export { Application };