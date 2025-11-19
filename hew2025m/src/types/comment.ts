export interface Comment {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
