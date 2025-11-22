export interface Comment {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string; // 返信先のコメントID
  replies?: Comment[]; // 返信コメントの配列
}
