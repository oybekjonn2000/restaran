import { Restaurant } from './restaurant.model';

export interface Category {
  id: number;
  name: string;
  imageUrl: string;
  restaurant?: Restaurant;
}
