import { IFile } from "@/types/file";
import { Schema, Document, model, Types, Date } from "mongoose";

export interface IArticleComment {
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: Date;
}

export interface IArticle extends Document {
    publisher: string;
    title: string;
    description: string;
    banner: IFile;
    isPublic: boolean;
    published_at: Date;
    news_url: string;
    comments?: IArticleComment[];
    isActive: boolean;
    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId;
}

const articleSchema = new Schema<IArticle>({
    publisher: {
        type: String,
        required: [true, 'Publisher is required']
    },
    title: {
        type: String,
        required: [true, 'Title is required']
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    isPublic: {
        type: Boolean,
        required: [true, 'Public is required']
    },
    published_at: {
        type: Date,
        required: [true, 'Published at is required']
    },
    banner: {
        type: Object,
        required: [true, 'Banner is required']
    },
    news_url: {
        type: String,
        required: [true, 'News url is required']
    },
    comments: [
        {
            name: {
                type: String,
                required: [true, 'Comment sname is required']
            },
            email: {
                type: String,
                required: [true, 'Comment semail is required']
            },
            subject: {
                type: String,
                required: [true, 'Comment ssubject is required']
            },
            message: {
                type: String,
                required: [true, 'Comment smessage is required']
            },
            createdAt: {
                type: Date,
                required: [true, 'Comment screatedAt is required']
            },
        }
    ],
    isActive: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: Schema.Types.ObjectId, ref: "User"
    },
    updatedBy: {
        type: Schema.Types.ObjectId, ref: "User"
    },
}, { timestamps: true })

const Article = model<IArticle>("Article", articleSchema);

export default Article;