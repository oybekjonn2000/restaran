import { Category } from './category.model';
import { Restaurant } from './restaurant.model';

export interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  category: Category;
  restaurant?: Restaurant;
}

export interface CartItem {
  food: Food;
  quantity: number;
}
