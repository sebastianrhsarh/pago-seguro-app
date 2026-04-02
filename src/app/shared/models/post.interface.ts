export interface Post {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  estado: 'disponible' | 'reservado' | 'vendido';
  sellerId: string;
  imageUrl?: string;
  createdAt: Date;
}