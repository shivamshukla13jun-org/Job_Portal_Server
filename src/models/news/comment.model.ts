import mongoose, { Document, Schema } from 'mongoose';

export interface INewsComment extends Document {
  newsArticle: mongoose.Types.ObjectId;
  message: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const newsCommentSchema = new Schema<INewsComment>(
  {
    newsArticle: {
      type: Schema.Types.ObjectId,
      ref: 'NewsArticle',
      required: [true, 'News article reference is required']
    },
    message: {
      type: String,
      required: [true, 'Comment message is required']
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    },
    versionKey: false
  }
);

const NewsComment = mongoose.model<INewsComment>('NewsComment', newsCommentSchema);
export default NewsComment;
