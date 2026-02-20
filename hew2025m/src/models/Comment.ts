import mongoose, { Schema, Model } from 'mongoose';

// コメントの型定義
export interface IComment {
  productId: string;
  itemType: 'product' | 'post';
  itemOwnerId?: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  parentId?: string; // 返信先のコメントID
  createdAt: Date;
  updatedAt: Date;
}

// Mongooseスキーマ定義
const CommentSchema = new Schema<IComment>(
  {
    productId: {
      type: String,
      required: [true, '商品IDは必須です'],
      index: true,
    },
    itemType: {
      type: String,
      enum: ['product', 'post'],
      required: [true, 'アイテム種別は必須です'],
      index: true,
    },
    itemOwnerId: {
      type: String,
      required: false,
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
    content: {
      type: String,
      required: [true, 'コメント内容は必須です'],
      trim: true,
      maxlength: [140, 'コメントは140文字以内で入力してください'],
    },
    parentId: {
      type: String,
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// インデックス設定
CommentSchema.index({ itemType: 1, productId: 1, createdAt: -1 });
CommentSchema.index({ productId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ itemOwnerId: 1 });

// モデルのエクスポート
const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
