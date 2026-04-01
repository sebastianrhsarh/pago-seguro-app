export interface Post {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  estado: 'disponible' | 'vendido';
  sellerId: string;
  createdAt: Date;
}