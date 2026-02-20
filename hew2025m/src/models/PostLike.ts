import mongoose, { Schema, Model } from 'mongoose';

// 投稿へのいいねの型定義
export interface IPostLike {
  postId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  createdAt: Date;
}

const PostLikeSchema = new Schema<IPostLike>(
  {
    postId: {
      type: String,
      required: [true, '投稿IDは必須です'],
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'ユーザーIDは必須です'],
    },
    userName: {
      type: String,
      required: [true, 'ユーザー名は必須です'],
    },
    userPhotoURL: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// 複合インデックス: 1つの投稿に対して1ユーザーが1いいねのみ
PostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

// インデックス設定
PostLikeSchema.index({ postId: 1, createdAt: -1 });
PostLikeSchema.index({ userId: 1 });

const PostLike: Model<IPostLike> =
  mongoose.models.PostLike || mongoose.model<IPostLike>('PostLike', PostLikeSchema);

export default PostLike;
