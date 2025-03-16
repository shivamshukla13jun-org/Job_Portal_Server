import { IFile } from '@/types/file';
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INewsArticle extends Document {
  title: string;
  shortDescription: string;
  longDescription: string;
  publishDate: Date;
  banner: IFile;
  category?:Schema.Types.ObjectId;
  comments: {
    message: string;
    createdBy: mongoose.Types.ObjectId; // Change from Schema.Types.ObjectId
  }[];
  createdBy: mongoose.Types.ObjectId; // Change here as well
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
    category: { 
      type: Schema.Types.ObjectId, 
      ref: 'Category', 
    },
    longDescription: { 
      type: String, 
      required: [true, 'Long description is required'] 
    },
    publishDate: { 
      type: Date, 
      required: [true, 'Publish date is required'] 
    },
    comments: [{
      message: { type: String, },
      createdBy: { 
        type: Schema.Types.ObjectId, 
        ref: "User"
      }
    }],
    
    banner: { 
      type: Object, 
      required: [true, 'Banner  is required'] 
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
    timestamps: true ,
    toJSON:{
      virtuals:true
    },
    toObject:{
      virtuals:true
    },
    versionKey:false,

  }
);
// befor send to client add new bannerUrl

const NewsArticle = mongoose.model<INewsArticle>('NewsArticle', newsArticleSchema);
export default NewsArticle;
