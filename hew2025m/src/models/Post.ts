import mongoose, { Schema, Model } from 'mongoose';

// メディアファイルの型定義
export interface IMediaFile {
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  uniqueId: string;
  order: number; // 表示順序（1から始まる）
  uploadedAt: Date;
}

// 位置情報の型定義
export interface ILocationData {
  lat: number;
  lng: number;
  address: string;
}

// 投稿の型定義
export interface IPost {
  title: string;
  content: string;
  category: string;
  media: IMediaFile[]; // メディア情報（順番、メタデータ含む）
  authorId: string;
  authorName: string;
  tags: string[];
  location: string; // 住所または位置の文字列表現（後方互換性）
  locationData?: ILocationData; // 詳細な位置情報（緯度経度含む）
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

// Mongooseスキーマ定義
const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'タイトルは必須です'],
      trim: true,
      maxlength: [50, 'タイトルは50文字以内で入力してください'],
    },
    content: {
      type: String,
      required: [true, '投稿内容は必須です'],
      trim: true,
      maxlength: [140, '投稿内容は140文字以内で入力してください'],
    },
    category: {
      type: String,
      required: [true, 'カテゴリーは必須です'],
    },
    media: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
          originalName: {
            type: String,
            required: true,
          },
          mimeType: {
            type: String,
            required: true,
          },
          size: {
            type: Number,
            required: true,
          },
          uniqueId: {
            type: String,
            required: true,
            unique: true,
          },
          order: {
            type: Number,
            required: true,
            min: 1,
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
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
    location: {
      type: String,
      default: '',
    },
    locationData: {
      type: {
        lat: {
          type: Number,
          required: true,
        },
        lng: {
          type: Number,
          required: true,
        },
        address: {
          type: String,
          required: true,
        },
      },
      required: false,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: [
      {
        userId: {
          type: String,
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
          maxlength: [500, 'コメントは500文字以内で入力してください'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// インデックス設定
PostSchema.index({ authorId: 1 });
PostSchema.index({ category: 1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ 'media.uniqueId': 1 });

// モデルのエクスポート（既存のモデルがあればそれを使用）
const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
