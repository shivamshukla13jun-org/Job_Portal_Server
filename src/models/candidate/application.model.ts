import mongoose, { Document, Schema } from 'mongoose';

interface IApplication extends Document {
    job: mongoose.Types.ObjectId;
    candidate: mongoose.Types.ObjectId;
    employer: mongoose.Types.ObjectId;
    message?:string;
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
    message:{
        type:String,
        default:""
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
    }
    next();
});

const Application = mongoose.model<IApplication>("Application", applicationSchema);
export { Application };