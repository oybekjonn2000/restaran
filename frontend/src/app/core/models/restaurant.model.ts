import { User } from './user.model';

export interface Restaurant {
  id: number;
  name: string;
  imageUrl?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  owner?: User;
  isActive?: boolean;
}

export interface RestaurantAdminRequest {
  name: string;
  imageUrl?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  ownerId?: number;
}
