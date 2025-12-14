import mongoose, { Schema, Model } from 'mongoose';

export interface IMediaFile {
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  uniqueId: string;
  order: number;
  uploadedAt: Date;
}

// 位置情報（座標）の型定義
export interface ILocation {
  lat: number;
  lng: number;
}

export interface IPost {
  title: string;
  content: string;
  category: string;
  media: IMediaFile[];
  authorId: string;
  authorName: string;
  tags: string[];
  address?: string; // 住所（任意）
  location?: ILocation; // 座標情報（緯度経度）
  likes: number;
  comments: Array<{
    userId: string;
    userName: string;
    content: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 50 },
    content: { type: String, required: true, trim: true, maxlength: 140 },
    category: { type: String, required: true },
    media: {
      type: [
        {
          url: { type: String, required: true },
          originalName: { type: String, required: true },
          mimeType: { type: String, required: true },
          size: { type: Number, required: true },
          uniqueId: { type: String, required: true },
          order: { type: Number, required: true, min: 1 },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    authorId: {
      type: String,
      required: [true, '投稿者IDは必須です'],
    },
    authorName: {
      type: String,
      required: [true, '投稿者名は必須です'],
    },
    tags: {
      type: [String],
      default: [],
    },
    address: {
      type: String,
      required: false,
    },
    location: {
      type: {
        lat: {
          type: Number,
          required: true,
        },
        lng: {
          type: Number,
          required: true,
        },
      },
      required: false,
    },
    likes: { type: Number, default: 0, min: 0 },
    comments: [
      {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        content: { type: String, required: true, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
PostSchema.index({ authorId: 1 });
PostSchema.index({ category: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ 'media.uniqueId': 1 });

const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
