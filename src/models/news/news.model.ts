import mongoose, { Document, Schema } from 'mongoose';

export interface INewsArticle extends Document {
  title: string;
  shortDescription: string;
  longDescription: string;
  publishDate: Date;
  newsUrl: string;
  image: string;
  video?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
}

const newsArticleSchema = new Schema<INewsArticle>(
  {
    title: { 
      type: String, 
      required: [true, 'Title is required'] 
    },
    shortDescription: { 
      type: String, 
      required: [true, 'Short description is required'] 
    },
    longDescription: { 
      type: String, 
      required: [true, 'Long description is required'] 
    },
    publishDate: { 
      type: Date, 
      required: [true, 'Publish date is required'] 
    },
    newsUrl: { 
      type: String, 
      required: [true, 'News URL is required'] 
    },
    image: { 
      type: String, 
      required: [true, 'Image URL is required'] 
    },
    video: { 
      type: String 
    },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'Admin', 
      required: true 
    },
    updatedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'Admin'
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { 
    timestamps: true 
  }
);

const NewsArticle = mongoose.model<INewsArticle>('NewsArticle', newsArticleSchema);
export default NewsArticle;
