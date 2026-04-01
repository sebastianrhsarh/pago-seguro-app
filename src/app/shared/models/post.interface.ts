export interface Post {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  estado: 'disponible' | 'vendido';
  userId: string;
  createdAt: Date;
}